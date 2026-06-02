import { runCommand } from '../utils/shell.js';

export async function getDiff(rootDir: string, since?: string): Promise<string | undefined> {
  const args = since ? ['diff', '--stat', since] : ['diff', '--stat'];
  const result = await runCommand('git', args, rootDir);
  if (result.code !== 0 || !result.stdout.trim()) return undefined;
  return result.stdout.trim();
}
