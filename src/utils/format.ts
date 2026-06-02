export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function fenceFor(content: string): string {
  const longestFence = content.match(/`{3,}/g)?.sort((a, b) => b.length - a.length)[0];
  return longestFence ? '`'.repeat(longestFence.length + 1) : '```';
}
