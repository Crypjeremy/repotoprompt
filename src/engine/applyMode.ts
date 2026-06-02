import type { Mode, RepoFile } from '../types.js';

export function applyMode(files: RepoFile[], mode: Mode): RepoFile[] {
  if (mode === 'full') return files;
  if (mode === 'minimal') return files.filter(file => file.score >= 45).slice(0, 30);
  if (mode === 'focused') return files.filter(file => file.score >= 25).slice(0, 80);
  if (mode === 'debug') return files.filter(file => file.score >= 22 || /test|spec|error|route|handler/i.test(file.relativePath)).slice(0, 90);
  if (mode === 'review') return files.filter(file => file.changed || file.score >= 35).slice(0, 90);
  return files;
}
