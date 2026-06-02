import fs from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { builtInExcludes, loadIgnoreMatcher } from '../config/loadConfig.js';
import { detectSecrets } from './detectSecrets.js';
import { languageForFile } from '../utils/language.js';
import { estimateTokens } from '../utils/tokens.js';
import type { PackOptions, RepoFile, ScanResult } from '../types.js';

function normalize(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function looksBinary(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8000));
  return sample.includes(0);
}

export async function scanRepository(options: PackOptions): Promise<ScanResult> {
  const rootDir = path.resolve(options.rootDir);
  const ignoreMatcher = await loadIgnoreMatcher(rootDir);
  const patterns = options.include?.length ? options.include : ['**/*'];
  const skipped: ScanResult['skipped'] = [];

  const entries = await fg(patterns, {
    cwd: rootDir,
    dot: true,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: [...builtInExcludes, ...(options.exclude ?? [])]
  });

  const files: RepoFile[] = [];

  for (const entry of entries.sort()) {
    const relativePath = normalize(entry);
    if (ignoreMatcher.ignores(relativePath)) {
      skipped.push({ relativePath, reason: 'ignored by .gitignore/.repotopromptignore' });
      continue;
    }
    if (normalize(options.outputPath).endsWith(relativePath)) {
      skipped.push({ relativePath, reason: 'output file' });
      continue;
    }

    const absolutePath = path.join(rootDir, relativePath);
    const stat = await fs.stat(absolutePath);
    if (stat.size > options.maxFileBytes) {
      skipped.push({ relativePath, reason: `larger than ${Math.round(options.maxFileBytes / 1024)} KB` });
      continue;
    }

    const buffer = await fs.readFile(absolutePath);
    if (looksBinary(buffer)) {
      skipped.push({ relativePath, reason: 'binary file' });
      continue;
    }

    const content = buffer.toString('utf8');
    const secretFindings = detectSecrets(content);
    const hasSecret = secretFindings.length > 0 || /(^|\/)\.env(\.|$)/.test(relativePath);

    if (hasSecret) {
      skipped.push({ relativePath, reason: 'possible secret or env file' });
      if (options.failOnSecret) {
        throw new Error(`Possible secret detected in ${relativePath}. Re-run without --fail-on-secret to skip it automatically.`);
      }
      continue;
    }

    files.push({
      relativePath,
      absolutePath,
      sizeBytes: stat.size,
      language: languageForFile(relativePath),
      content,
      estimatedTokens: estimateTokens(content),
      score: 0,
      reasons: [],
      hasSecret,
      secretFindings
    });
  }

  return { files, skipped };
}
