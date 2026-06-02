import fs from 'node:fs/promises';
import path from 'node:path';
import type { FrameworkInfo, RepoFile } from '../types.js';

function has(files: RepoFile[], name: string): boolean {
  return files.some(file => file.relativePath === name || file.relativePath.endsWith(`/${name}`));
}

function findEntrypoints(files: RepoFile[]): string[] {
  const candidates = [
    'src/main.ts', 'src/main.tsx', 'src/index.ts', 'src/index.tsx', 'src/App.tsx', 'src/app/page.tsx',
    'app/page.tsx', 'pages/index.tsx', 'server.ts', 'src/server.ts', 'src/cli.ts', 'main.py', 'app.py'
  ];
  const found = candidates.filter(candidate => files.some(file => file.relativePath === candidate));
  return found.slice(0, 8);
}

export async function detectFramework(rootDir: string, files: RepoFile[]): Promise<FrameworkInfo> {
  let packageJson: any = undefined;
  try {
    packageJson = JSON.parse(await fs.readFile(path.join(rootDir, 'package.json'), 'utf8'));
  } catch {
    // Not a Node project.
  }

  const deps = { ...(packageJson?.dependencies ?? {}), ...(packageJson?.devDependencies ?? {}) };
  let framework = 'Unknown';
  let language = 'Unknown';

  if (packageJson) language = deps.typescript ? 'TypeScript/JavaScript' : 'JavaScript';
  if (deps.next) framework = 'Next.js';
  else if (deps.react) framework = 'React';
  else if (deps.vue) framework = 'Vue';
  else if (deps.svelte || has(files, 'svelte.config.js')) framework = 'Svelte/SvelteKit';
  else if (deps.astro) framework = 'Astro';
  else if (deps.express || deps.fastify || deps.hono) framework = 'Node API';
  else if (packageJson?.bin) framework = 'Node CLI';
  else if (has(files, 'pyproject.toml') || has(files, 'requirements.txt')) {
    language = 'Python';
    framework = has(files, 'manage.py') ? 'Django' : 'Python';
  }
  else if (has(files, 'Cargo.toml')) {
    language = 'Rust';
    framework = 'Rust';
  }

  const packageManager = has(files, 'pnpm-lock.yaml') ? 'pnpm'
    : has(files, 'yarn.lock') ? 'yarn'
    : has(files, 'bun.lockb') ? 'bun'
    : has(files, 'package-lock.json') ? 'npm'
    : undefined;

  const configFiles = files
    .map(file => file.relativePath)
    .filter(file => /(^|\/)(package\.json|tsconfig\.json|vite\.config\.|next\.config\.|tailwind\.config\.|eslint\.config\.|\.env\.example|docker-compose|Dockerfile|pyproject\.toml|Cargo\.toml)/.test(file))
    .slice(0, 20);

  return { language, framework, packageManager, entrypoints: findEntrypoints(files), configFiles };
}
