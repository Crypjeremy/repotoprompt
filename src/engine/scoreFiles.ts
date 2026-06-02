import path from 'node:path';
import type { FrameworkInfo, Mode, RepoFile } from '../types.js';

const alwaysImportant = [
  'package.json', 'README.md', 'tsconfig.json', 'vite.config.', 'next.config.', 'tailwind.config.',
  'src/cli.', 'src/main.', 'src/index.', 'src/app.', 'app/page.', 'pages/index.'
];

function tokenizeGoal(goal?: string): string[] {
  return (goal ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .slice(0, 40);
}

function pathContains(relativePath: string, token: string): boolean {
  return relativePath.toLowerCase().includes(token.toLowerCase());
}

function contentContains(content: string, token: string): boolean {
  return content.toLowerCase().includes(token.toLowerCase());
}

export function scoreFiles(files: RepoFile[], options: { goal?: string; mode: Mode; changedFiles: string[]; framework: FrameworkInfo }): RepoFile[] {
  const goalTokens = tokenizeGoal(options.goal);
  const changed = new Set(options.changedFiles.map(file => file.replace(/\\/g, '/')));

  return files.map(file => {
    let score = 10;
    const reasons: string[] = [];
    const base = path.basename(file.relativePath);

    if (alwaysImportant.some(marker => file.relativePath.includes(marker) || base.includes(marker))) {
      score += 25;
      reasons.push('important project/config file');
    }

    if (options.framework.entrypoints.includes(file.relativePath)) {
      score += 30;
      reasons.push('detected entrypoint');
    }

    if (options.framework.configFiles.includes(file.relativePath)) {
      score += 20;
      reasons.push('framework/config file');
    }

    if (changed.has(file.relativePath)) {
      score += 45;
      reasons.push('changed file');
      file.changed = true;
    }

    for (const token of goalTokens) {
      if (pathContains(file.relativePath, token)) {
        score += 16;
        reasons.push(`path matches goal: ${token}`);
      } else if (contentContains(file.content, token)) {
        score += 5;
        reasons.push(`content matches goal: ${token}`);
      }
    }

    if (/test|spec|mock|fixture/i.test(file.relativePath)) {
      score += options.mode === 'debug' || options.mode === 'review' ? 10 : -10;
      reasons.push(options.mode === 'debug' || options.mode === 'review' ? 'test context useful for this mode' : 'test-like file deprioritized');
    }

    if (/README|docs|CHANGELOG|LICENSE/i.test(file.relativePath)) {
      score += options.mode === 'minimal' ? -15 : 2;
      reasons.push('documentation/supporting context');
    }

    if (options.mode === 'full') score += 5;
    if (options.mode === 'minimal' && score < 40) score -= 10;
    if (options.mode === 'review' && file.changed) score += 30;
    if (options.mode === 'debug' && /error|log|debug|test|spec|handler|route/i.test(file.relativePath + file.content.slice(0, 500))) score += 15;

    file.score = Math.max(0, Math.min(100, score));
    file.reasons = [...new Set(reasons)].slice(0, 6);
    return file;
  }).sort((a, b) => b.score - a.score || a.relativePath.localeCompare(b.relativePath));
}
