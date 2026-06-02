import { formatMarkdown } from './markdownFormatter.js';
import { formatJson } from './jsonFormatter.js';
import type { FrameworkInfo, RepoFile, SkippedFile, Target } from '../types.js';

export function formatContext(input: {
  files: RepoFile[];
  skipped: SkippedFile[];
  goal?: string;
  mode: string;
  target: Target;
  framework: FrameworkInfo;
  warnings: string[];
  diffSummary?: string;
}) {
  if (input.target === 'json') return formatJson(input);
  return formatMarkdown(input);
}
