import type { RepoFile } from '../types.js';

export function applyBudget(files: RepoFile[], budgetTokens?: number): RepoFile[] {
  if (!budgetTokens || budgetTokens <= 0) return files;

  const selected: RepoFile[] = [];
  let used = 1200; // reserve for headers/metadata

  for (const file of files) {
    const cost = file.estimatedTokens + 80;
    if (used + cost > budgetTokens) continue;
    selected.push(file);
    used += cost;
  }

  return selected;
}
