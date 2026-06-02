#!/usr/bin/env node
import path from 'node:path';
import { program } from 'commander';
import { packRepository } from './engine/packRepository.js';
import type { CliOptions, Mode, Target } from './types.js';

const modes: Mode[] = ['full', 'focused', 'minimal', 'debug', 'review'];
const targets: Target[] = ['markdown', 'chatgpt', 'claude', 'cursor', 'gemini', 'json'];

function list(value: string): string[] {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function parsePositiveNumber(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`${name} must be a positive number.`);
  return parsed;
}

program
  .name('repotoprompt')
  .description('Task-aware repo context packs for AI coding assistants.')
  .argument('[repo]', 'Path to the repository folder', '.')
  .option('-o, --output <file>', 'Output file', 'repotoprompt-output.md')
  .option('-i, --include <patterns>', 'Comma-separated glob patterns to include')
  .option('-x, --exclude <patterns>', 'Comma-separated glob patterns to exclude')
  .option('--max-file-kb <kb>', 'Skip files larger than this size', '256')
  .option('-g, --goal <text>', 'Coding goal/task to optimize context for')
  .option('-m, --mode <mode>', `Context mode: ${modes.join('|')}`, 'focused')
  .option('-t, --target <target>', `Output target: ${targets.join('|')}`, 'chatgpt')
  .option('-b, --budget <tokens>', 'Approximate max token budget')
  .option('--diff', 'Include changed-file context using git')
  .option('--since <ref>', 'Use git diff against a ref/branch, e.g. main')
  .option('--dry-run', 'Preview what would be packed without writing the output file')
  .option('--stats', 'Print detailed stats')
  .option('--copy', 'Copy generated context to clipboard')
  .option('--open', 'Open generated output after writing')
  .option('--open-with <command>', 'Open generated output with a specific command, e.g. code')
  .option('--fail-on-secret', 'Fail instead of skipping when possible secrets are detected')
  .version('1.0.0')
  .action(async (repo: string, options: CliOptions) => {
    try {
      if (!modes.includes(options.mode)) throw new Error(`Invalid --mode. Expected one of: ${modes.join(', ')}`);
      if (!targets.includes(options.target)) throw new Error(`Invalid --target. Expected one of: ${targets.join(', ')}`);
      const maxFileKb = parsePositiveNumber(options.maxFileKb, '--max-file-kb')!;
      const budgetTokens = parsePositiveNumber(options.budget, '--budget');

      const rootDir = path.resolve(repo);
      const outputPath = path.resolve(options.output);
      const result = await packRepository({
        rootDir,
        outputPath,
        include: options.include ? list(options.include) : undefined,
        exclude: options.exclude ? list(options.exclude) : undefined,
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
        failOnSecret: Boolean(options.failOnSecret)
      });

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
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parseAsync();
