import fs from 'node:fs/promises';
import path from 'node:path';
import ignore from 'ignore';

export const builtInExcludes = [
  '.git/**', 'node_modules/**', 'dist/**', 'build/**', 'coverage/**', '.next/**', '.nuxt/**',
  '.svelte-kit/**', '.turbo/**', '.cache/**', '.parcel-cache/**', '.vite/**', '.vercel/**',
  'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb', 'Cargo.lock', 'poetry.lock',
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
  const repoToPromptIgnore = await readOptional(path.join(rootDir, '.repotopromptignore'));
  if (gitIgnore) ig.add(gitIgnore);
  if (repoToPromptIgnore) ig.add(repoToPromptIgnore);
  return ig;
}
