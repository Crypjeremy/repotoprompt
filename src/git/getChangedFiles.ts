import { runCommand } from '../utils/shell.js';

export async function getChangedFiles(rootDir: string, since?: string): Promise<string[]> {
  const args = since ? ['diff', '--name-only', since] : ['status', '--short'];
  const result = await runCommand('git', args, rootDir);
  if (result.code !== 0) return [];

  if (since) {
    return result.stdout.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  }

  return result.stdout
    .split(/\r?\n/)
    .map(line => line.slice(3).trim())
    .filter(Boolean)
    .map(line => line.replace(/^"|"$/g, ''));
}
