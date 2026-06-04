import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildTree } from '../src/utils/tree.js';
import { detectSecrets } from '../src/engine/detectSecrets.js';
import { applyBudget } from '../src/engine/applyBudget.js';
import { loadConfig, writeInitialConfig } from '../src/config/loadConfig.js';
import type { RepoFile } from '../src/types.js';

function file(path: string, tokens: number, score: number): RepoFile {
  return {
    relativePath: path,
    absolutePath: path,
    sizeBytes: tokens * 4,
    language: 'typescript',
    content: 'x'.repeat(tokens * 4),
    estimatedTokens: tokens,
    score,
    reasons: []
  };
}

describe('tree', () => {
  it('renders nested paths', () => {
    expect(buildTree(['src/cli.ts', 'src/utils/tree.ts', 'README.md'])).toContain('src');
    expect(buildTree(['src/cli.ts', 'src/utils/tree.ts', 'README.md'])).toContain('cli.ts');
  });
});

describe('secret detection', () => {
  it('detects common token assignments', () => {
    const findings = detectSecrets('API_' + 'KEY="abcdefghijklmnopqrstuvwxyz"');
    expect(findings.length).toBeGreaterThan(0);
  });
});

describe('budgeting', () => {
  it('keeps files within budget', () => {
    const selected = applyBudget([file('a.ts', 1000, 90), file('b.ts', 1000, 80), file('c.ts', 1000, 70)], 2500);
    expect(selected.length).toBe(1);
  });
});

describe('config init', () => {
  it('writes and loads default config', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'repotoprompt-'));
    const created = await writeInitialConfig(dir);
    expect(created).toContain('.repotopromptrc.json');
    expect(created).toContain('.repotopromptignore');
    const config = await loadConfig(dir);
    expect(config.mode).toBe('focused');
    expect(config.target).toBe('chatgpt');
  });
});
