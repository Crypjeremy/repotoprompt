#!/usr/bin/env node
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { program } from 'commander';
import { packRepository } from './engine/packRepository.js';
import { loadConfig, writeInitialConfig } from './config/loadConfig.js';
import type { CliOptions, Mode, RepoToPromptConfig, Target } from './types.js';

const modes: Mode[] = ['full', 'focused', 'minimal', 'debug', 'review'];
const targets: Target[] = ['markdown', 'chatgpt', 'claude', 'cursor', 'gemini', 'json'];

function list(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const items = value.split(',').map(item => item.trim()).filter(Boolean);
  return items.length ? items : undefined;
}

function parsePositiveNumber(value: string | number | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${name} must be a positive number.`);
  return parsed;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'context';
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

function resolveOutputPath(options: CliOptions, config: RepoToPromptConfig): string {
  const explicitOutput = options.output !== 'repotoprompt-output.md';
  const outputName = explicitOutput ? options.output : config.defaultOutput ?? options.output;
  const outputDir = options.outputDir ?? config.outputDir;
  if (!outputDir) return path.resolve(outputName);

  const ext = options.target === 'json' ? 'json' : 'md';
  const base = options.goal ? slugify(options.goal) : 'context';
  return path.resolve(outputDir, `${timestamp()}-${base}.${ext}`);
}

async function askInteractive(repo: string, options: CliOptions, config: RepoToPromptConfig): Promise<{ repo: string; options: CliOptions }> {
  const rl = createInterface({ input, output });
  try {
    const askedRepo = (await rl.question(`Repository path (${repo}): `)).trim() || repo;
    const goal = (await rl.question(`Goal${options.goal ? ` (${options.goal})` : ''}: `)).trim() || options.goal;
    const modeAnswer = (await rl.question(`Mode ${modes.join('/')} (${options.mode ?? config.mode ?? 'focused'}): `)).trim() as Mode;
    const targetAnswer = (await rl.question(`Target ${targets.join('/')} (${options.target ?? config.target ?? 'chatgpt'}): `)).trim() as Target;
    const budgetDefault = String(options.budget ?? config.budget ?? '30000');
    const budget = (await rl.question(`Token budget (${budgetDefault}, blank for none): `)).trim() || budgetDefault;
    const outputDefault = options.outputDir ?? config.outputDir ?? options.output;
    const out = (await rl.question(`Output file or directory (${outputDefault}): `)).trim();
    const copyAnswer = (await rl.question('Copy to clipboard? y/N: ')).trim().toLowerCase();
    const openAnswer = (await rl.question('Open after writing? y/N: ')).trim().toLowerCase();

    const nextOptions: CliOptions = {
      ...options,
      goal,
      mode: modeAnswer || options.mode,
      target: targetAnswer || options.target,
      budget,
      copy: copyAnswer === 'y' || copyAnswer === 'yes' || options.copy,
      open: openAnswer === 'y' || openAnswer === 'yes' || options.open
    };

    if (out) {
      if (out.endsWith('/') || out.endsWith('\\')) nextOptions.outputDir = out;
      else nextOptions.output = out;
    }

    return { repo: askedRepo, options: nextOptions };
  } finally {
    rl.close();
  }
}

function mergeConfig(options: CliOptions, config: RepoToPromptConfig): CliOptions {
  return {
    ...options,
    output: options.output === 'repotoprompt-output.md' ? config.defaultOutput ?? options.output : options.output,
    outputDir: options.outputDir ?? config.outputDir,
    maxFileKb: options.maxFileKb === '256' ? String(config.maxFileKb ?? options.maxFileKb) : options.maxFileKb,
    mode: options.mode === 'focused' ? config.mode ?? options.mode : options.mode,
    target: options.target === 'chatgpt' ? config.target ?? options.target : options.target,
    budget: options.budget ?? (config.budget ? String(config.budget) : undefined),
    copy: options.copy ?? config.copy,
    open: options.open ?? config.open,
    openWith: options.openWith ?? config.openWith,
    failOnSecret: options.failOnSecret ?? config.failOnSecret
  };
}

function mergePatterns(cliPatterns: string[] | undefined, configPatterns: string[] | undefined): string[] | undefined {
  const merged = [...(configPatterns ?? []), ...(cliPatterns ?? [])];
  return merged.length ? merged : undefined;
}

function printSecurityReport(result: Awaited<ReturnType<typeof packRepository>>): void {
  const secretSkipped = result.skipped.filter(file => file.reason.includes('secret'));
  console.log('Security report:');
  if (!secretSkipped.length) {
    console.log('- No possible secret/env files were skipped.');
    return;
  }
  for (const file of secretSkipped) console.log(`- Skipped ${file.relativePath}: ${file.reason}`);
}

function printExplain(result: Awaited<ReturnType<typeof packRepository>>): void {
  console.log('Context explanation:');
  console.log('Included files:');
  for (const file of result.files) console.log(`- ${file.relativePath} (${file.score}): ${file.reasons.join('; ') || 'included'}`);
  if (result.skipped.length) {
    console.log('Skipped files:');
    for (const skipped of result.skipped.slice(0, 50)) console.log(`- ${skipped.relativePath}: ${skipped.reason}`);
    if (result.skipped.length > 50) console.log(`- ...and ${result.skipped.length - 50} more skipped files`);
  }
}

program
  .name('repotoprompt')
  .description('Task-aware repo context packs for AI coding assistants.')
  .version('1.1.0');

program
  .command('init')
  .description('Create .repotopromptrc.json and .repotopromptignore')
  .argument('[repo]', 'Path to the repository folder', '.')
  .option('--force', 'Overwrite existing config files')
  .action(async (repo: string, options: { force?: boolean }) => {
    try {
      const rootDir = path.resolve(repo);
      const created = await writeInitialConfig(rootDir, Boolean(options.force));
      if (!created.length) {
        console.log('RepoToPrompt config already exists. Use --force to overwrite.');
        return;
      }
      console.log('RepoToPrompt config initialized:');
      for (const file of created) console.log(`- ${file}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .argument('[repo]', 'Path to the repository folder', '.')
  .option('-o, --output <file>', 'Output file', 'repotoprompt-output.md')
  .option('--output-dir <dir>', 'Write a timestamped output file into a directory')
  .option('-i, --include <patterns>', 'Comma-separated glob patterns to include')
  .option('-x, --exclude <patterns>', 'Comma-separated glob patterns to exclude')
  .option('--max-file-kb <kb>', 'Skip files larger than this size', '256')
  .option('-g, --goal <text>', 'Coding goal/task to optimize context for')
  .option('-m, --mode <mode>', `Context mode: ${modes.join('|')}`, 'focused')
  .option('-t, --target <target>', `Output target: ${targets.join('|')}`, 'chatgpt')
  .option('-b, --budget <tokens>', 'Approximate max token budget')
  .option('-I, --interactive', 'Prompt for repo, goal, mode, target, budget, and output')
  .option('--diff', 'Include changed-file context using git')
  .option('--since <ref>', 'Use git diff against a ref/branch, e.g. main')
  .option('--dry-run', 'Preview what would be packed without writing the output file')
  .option('--stats', 'Print detailed stats')
  .option('--copy', 'Copy generated context to clipboard')
  .option('--open', 'Open generated output after writing')
  .option('--open-with <command>', 'Open generated output with a specific command, e.g. code')
  .option('--print', 'Print the generated context to stdout instead of writing a file')
  .option('--security-report', 'Print a security report for skipped secret/env files')
  .option('--explain', 'Explain why files were included or skipped')
  .option('--fail-on-secret', 'Fail instead of skipping when possible secrets are detected')
  .action(async (repo: string, rawOptions: CliOptions) => {
    try {
      let rootDir = path.resolve(repo);
      let config = await loadConfig(rootDir);
      let options = mergeConfig(rawOptions, config);

      if (options.interactive) {
        const interactive = await askInteractive(repo, options, config);
        repo = interactive.repo;
        rootDir = path.resolve(repo);
        config = await loadConfig(rootDir);
        options = mergeConfig(interactive.options, config);
      }

      if (!modes.includes(options.mode)) throw new Error(`Invalid --mode. Expected one of: ${modes.join(', ')}`);
      if (!targets.includes(options.target)) throw new Error(`Invalid --target. Expected one of: ${targets.join(', ')}`);
      const maxFileKb = parsePositiveNumber(options.maxFileKb, '--max-file-kb')!;
      const budgetTokens = parsePositiveNumber(options.budget, '--budget');
      const outputPath = resolveOutputPath(options, config);

      const result = await packRepository({
        rootDir,
        outputPath,
        include: mergePatterns(list(options.include), config.alwaysInclude),
        exclude: mergePatterns(list(options.exclude), config.alwaysExclude),
        maxFileBytes: maxFileKb * 1024,
        goal: options.goal,
        mode: options.mode,
        target: options.target,
        budgetTokens,
        dryRun: Boolean(options.dryRun),
        diff: Boolean(options.diff),
        since: options.since,
        stats: Boolean(options.stats),
        copy: Boolean(options.copy),
        open: Boolean(options.open),
        openWith: options.openWith,
        failOnSecret: Boolean(options.failOnSecret),
        print: Boolean(options.print)
      });

      if (!options.print) {
        console.log(options.dryRun ? 'RepoToPrompt dry run complete.' : 'RepoToPrompt packed successfully.');
        if (!options.dryRun) console.log(`Output: ${outputPath}`);
        console.log(`Mode: ${options.mode}`);
        console.log(`Target: ${options.target}`);
        console.log(`Files: ${result.files.length}`);
        console.log(`Estimated tokens: ~${result.estimatedTokens.toLocaleString()}`);
        if (result.warnings.length) {
          console.log('Warnings:');
          for (const warning of result.warnings) console.log(`- ${warning}`);
        }
        if (options.stats) {
          console.log(`Skipped files: ${result.skipped.length}`);
          console.log(`Detected: ${result.framework.language} / ${result.framework.framework}`);
        }
      }

      if (options.securityReport) printSecurityReport(result);
      if (options.explain) printExplain(result);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parseAsync();
