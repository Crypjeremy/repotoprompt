export function estimateTokens(text: string): number {
  // Practical cross-model estimate: code/markdown often averages 3.5-4.5 chars/token.
  return Math.ceil(text.length / 4);
}

export function formatTokenCount(tokens: number): string {
  return tokens.toLocaleString();
}
