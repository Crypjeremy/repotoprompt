import fs from 'node:fs/promises';
import path from 'node:path';
import ignore from 'ignore';
import type { RepoToPromptConfig } from '../types.js';

export const configFileName = '.repotopromptrc.json';
export const ignoreFileName = '.repotopromptignore';

export const builtInExcludes = [
  '.git/**', 'node_modules/**', 'dist/**', 'build/**', 'coverage/**', '.next/**', '.nuxt/**',
  '.svelte-kit/**', '.turbo/**', '.cache/**', '.parcel-cache/**', '.vite/**', '.vercel/**',
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'Cargo.lock', 'poetry.lock',
  'repotoprompt-output.md', 'context.md', 'context.json', 'self-context.md', 'minimal-context.md',
  '*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.ico', '*.svg', '*.pdf', '*.zip', '*.tar',
  '*.gz', '*.7z', '*.mp4', '*.mov', '*.mp3', '*.wav', '*.woff', '*.woff2', '*.ttf', '*.otf',
  '*.exe', '*.dll', '*.so', '*.dylib', '*.class', '*.jar', '*.db', '*.sqlite', '*.sqlite3'
];

async function readOptional(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

export async function loadIgnoreMatcher(rootDir: string) {
  const ig = ignore();
  const gitIgnore = await readOptional(path.join(rootDir, '.gitignore'));
  const repoToPromptIgnore = await readOptional(path.join(rootDir, ignoreFileName));
  if (gitIgnore) ig.add(gitIgnore);
  if (repoToPromptIgnore) ig.add(repoToPromptIgnore);
  return ig;
}

export async function loadConfig(rootDir: string): Promise<RepoToPromptConfig> {
  const configText = await readOptional(path.join(rootDir, configFileName));
  if (!configText.trim()) return {};

  try {
    return JSON.parse(configText) as RepoToPromptConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not parse ${configFileName}: ${message}`);
  }
}

export function defaultConfig(): Required<Pick<RepoToPromptConfig, 'mode' | 'target' | 'budget' | 'maxFileKb' | 'defaultOutput'>> & RepoToPromptConfig {
  return {
    mode: 'focused',
    target: 'chatgpt',
    budget: 30000,
    maxFileKb: 256,
    defaultOutput: 'repotoprompt-output.md',
    alwaysInclude: ['README.md', 'package.json'],
    alwaysExclude: ['.env*', 'private/**', 'node_modules/**', 'dist/**']
  };
}

export async function writeInitialConfig(rootDir: string, force = false): Promise<string[]> {
  const created: string[] = [];
  const configPath = path.join(rootDir, configFileName);
  const ignorePath = path.join(rootDir, ignoreFileName);

  const template = `${JSON.stringify(defaultConfig(), null, 2)}\n`;
  const ignoreTemplate = [
    '# RepoToPrompt-specific ignores',
    '.env*',
    'private/**',
    'large-fixtures/**',
    'repotoprompt-output.md',
    'context.md',
    'context.json',
    ''
  ].join('\n');

  async function writeIfAllowed(filePath: string, content: string): Promise<void> {
    try {
      await fs.access(filePath);
      if (!force) return;
    } catch {
      // file does not exist
    }
    await fs.writeFile(filePath, content, 'utf8');
    created.push(path.basename(filePath));
  }

  await writeIfAllowed(configPath, template);
  await writeIfAllowed(ignorePath, ignoreTemplate);
  return created;
}
