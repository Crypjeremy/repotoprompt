import type { PackResult, RepoFile, SkippedFile, FrameworkInfo } from '../types.js';
import { estimateTokens } from '../utils/tokens.js';

export function formatJson(input: {
  files: RepoFile[];
  skipped: SkippedFile[];
  goal?: string;
  mode: string;
  target: string;
  framework: FrameworkInfo;
  warnings: string[];
  diffSummary?: string;
}): PackResult {
  const payload = {
    generatedBy: 'RepoToPrompt',
    goal: input.goal,
    mode: input.mode,
    target: input.target,
    framework: input.framework,
    warnings: input.warnings,
    diffSummary: input.diffSummary,
    files: input.files.map(file => ({
      path: file.relativePath,
      language: file.language,
      sizeBytes: file.sizeBytes,
      estimatedTokens: file.estimatedTokens,
      score: file.score,
      reasons: file.reasons,
      content: file.content
    })),
    skipped: input.skipped
  };
  const markdown = JSON.stringify(payload, null, 2);
  return {
    markdown,
    files: input.files,
    skipped: input.skipped,
    totalBytes: input.files.reduce((sum, file) => sum + file.sizeBytes, 0),
    estimatedTokens: estimateTokens(markdown),
    framework: input.framework,
    warnings: input.warnings,
    diffSummary: input.diffSummary
  };
}
