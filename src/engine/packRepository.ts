import fs from 'node:fs/promises';
import path from 'node:path';
import { scanRepository } from './scanRepository.js';
import { detectFramework } from './detectFramework.js';
import { scoreFiles } from './scoreFiles.js';
import { applyMode } from './applyMode.js';
import { applyBudget } from './applyBudget.js';
import { getChangedFiles } from '../git/getChangedFiles.js';
import { getDiff } from '../git/getDiff.js';
import { formatContext } from '../formatters/index.js';
import { spawn } from 'node:child_process';
import { runCommand } from '../utils/shell.js';
import type { PackOptions, PackResult } from '../types.js';

async function copyToClipboard(text: string): Promise<boolean> {
  const command = process.platform === 'win32' ? 'powershell'
    : process.platform === 'darwin' ? 'pbcopy'
    : 'xclip';
  const args = process.platform === 'win32' ? ['-NoProfile', '-Command', 'Set-Clipboard']
    : process.platform === 'darwin' ? []
    : ['-selection', 'clipboard'];

  return new Promise(resolve => {
    const child = spawn(command, args, { shell: process.platform === 'win32' });
    child.on('error', () => resolve(false));
    child.on('close', code => resolve(code === 0));
    child.stdin.write(text);
    child.stdin.end();
  });
}

async function openOutput(outputPath: string, openWith?: string): Promise<void> {
  const cwd = path.dirname(outputPath);
  const file = path.basename(outputPath);
  if (openWith) {
    await runCommand(openWith, [outputPath], cwd);
    return;
  }
  if (process.platform === 'win32') await runCommand('cmd', ['/c', 'start', '', file], cwd);
  else if (process.platform === 'darwin') await runCommand('open', [file], cwd);
  else await runCommand('xdg-open', [file], cwd);
}

export async function packRepository(options: PackOptions): Promise<PackResult> {
  const rootDir = path.resolve(options.rootDir);
  const outputPath = path.resolve(options.outputPath);
  const warnings: string[] = [];

  const changedFiles = options.diff || options.mode === 'review' ? await getChangedFiles(rootDir, options.since) : [];
  const diffSummary = options.diff || options.mode === 'review' ? await getDiff(rootDir, options.since) : undefined;

  const scan = await scanRepository({ ...options, rootDir, outputPath });
  let framework = await detectFramework(rootDir, scan.files);
  let files = scoreFiles(scan.files, { goal: options.goal, mode: options.mode, changedFiles, framework });
  files = applyMode(files, options.mode);
  files = applyBudget(files, options.budgetTokens);

  if (options.mode === 'review' && changedFiles.length === 0) {
    warnings.push('Review mode did not find changed git files. The pack falls back to high-relevance files.');
  }
  if (scan.skipped.some(file => file.reason.includes('secret'))) {
    warnings.push('Possible secret/env files were skipped automatically. Review skipped files before sharing context externally.');
  }
  if (options.budgetTokens && files.reduce((sum, file) => sum + file.estimatedTokens, 0) > options.budgetTokens) {
    warnings.push('Token budget is approximate. Final rendered output may vary slightly by model tokenizer.');
  }

  framework = await detectFramework(rootDir, files.length ? files : scan.files);
  const result = formatContext({
    files,
    skipped: scan.skipped,
    goal: options.goal,
    mode: options.mode,
    target: options.target,
    framework,
    warnings,
    diffSummary
  });

  if (options.print) {
    process.stdout.write(result.markdown);
    if (!result.markdown.endsWith('\n')) process.stdout.write('\n');
  }

  if (!options.dryRun && !options.print) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, result.markdown, 'utf8');
    if (options.copy) {
      const ok = await copyToClipboard(result.markdown);
      if (!ok) warnings.push('Could not copy to clipboard on this system.');
    }
    if (options.open) await openOutput(outputPath, options.openWith);
  }

  return { ...result, warnings };
}
