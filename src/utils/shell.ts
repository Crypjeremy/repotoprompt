import { spawn } from 'node:child_process';

export function runCommand(command: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd, shell: process.platform === 'win32' });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += String(chunk); });
    child.stderr.on('data', chunk => { stderr += String(chunk); });
    child.on('error', error => resolve({ code: 1, stdout, stderr: error.message }));
    child.on('close', code => resolve({ code: code ?? 0, stdout, stderr }));
  });
}
