import { buildTree } from '../utils/tree.js';
import { estimateTokens, formatTokenCount } from '../utils/tokens.js';
import { fenceFor, formatBytes } from '../utils/format.js';
import type { PackResult, RepoFile, SkippedFile, FrameworkInfo, Target } from '../types.js';

type FormatInput = {
  files: RepoFile[];
  skipped: SkippedFile[];
  goal?: string;
  mode: string;
  target: Target;
  framework: FrameworkInfo;
  warnings: string[];
  diffSummary?: string;
};

function targetInstruction(target: Target): string {
  switch (target) {
    case 'chatgpt': return 'Use this as ChatGPT coding context. Prioritize the user goal and respect the file relevance scores.';
    case 'claude': return 'Use this as Claude coding context. The pack is structured for long-context review with file boundaries.';
    case 'cursor': return 'Use this as Cursor/Windsurf coding context. File paths are stable and ready for edits.';
    case 'gemini': return 'Use this as Gemini coding context. Focus on the user goal and repository structure.';
    default: return 'Use this as LLM coding context.';
  }
}

export function formatMarkdown(input: FormatInput): PackResult {
  const totalBytes = input.files.reduce((sum, file) => sum + file.sizeBytes, 0);
  const parts: string[] = [];

  parts.push('# RepoToPrompt Context Pack');
  parts.push('');
  parts.push(targetInstruction(input.target));
  parts.push('');

  if (input.goal) {
    parts.push('## User Goal');
    parts.push('');
    parts.push(input.goal);
    parts.push('');
  }

  parts.push('## Context Strategy');
  parts.push('');
  parts.push(`- Mode: ${input.mode}`);
  parts.push(`- Target: ${input.target}`);
  parts.push(`- Files included: ${input.files.length}`);
  parts.push(`- Total included size: ${formatBytes(totalBytes)}`);
  parts.push('- Estimated tokens: calculated after render');
  parts.push('');

  parts.push('## Repository Intelligence');
  parts.push('');
  parts.push(`- Detected language: ${input.framework.language}`);
  parts.push(`- Detected framework/type: ${input.framework.framework}`);
  if (input.framework.packageManager) parts.push(`- Package manager: ${input.framework.packageManager}`);
  if (input.framework.entrypoints.length) parts.push(`- Entrypoints: ${input.framework.entrypoints.join(', ')}`);
  if (input.framework.configFiles.length) parts.push(`- Important config: ${input.framework.configFiles.join(', ')}`);
  parts.push('');

  if (input.diffSummary) {
    parts.push('## Git Diff Summary');
    parts.push('');
    parts.push('```text');
    parts.push(input.diffSummary);
    parts.push('```');
    parts.push('');
  }

  if (input.warnings.length) {
    parts.push('## Warnings');
    parts.push('');
    for (const warning of input.warnings) parts.push(`- ${warning}`);
    parts.push('');
  }

  parts.push('## Included File Tree');
  parts.push('');
  parts.push('```text');
  parts.push(buildTree(input.files.map(file => file.relativePath).sort()));
  parts.push('```');
  parts.push('');

  parts.push('## File Relevance');
  parts.push('');
  parts.push('| File | Score | Reason |');
  parts.push('|---|---:|---|');
  for (const file of input.files) {
    parts.push(`| \`${file.relativePath}\` | ${file.score} | ${file.reasons.join('; ') || 'included'} |`);
  }
  parts.push('');

  if (input.skipped.length) {
    parts.push('## Skipped Files Summary');
    parts.push('');
    const grouped = new Map<string, number>();
    for (const skipped of input.skipped) grouped.set(skipped.reason, (grouped.get(skipped.reason) ?? 0) + 1);
    for (const [reason, count] of grouped) parts.push(`- ${reason}: ${count}`);
    parts.push('');
  }

  parts.push('## Files');
  parts.push('');

  for (const file of input.files) {
    const fence = fenceFor(file.content);
    parts.push(`### ${file.relativePath}`);
    parts.push('');
    parts.push(`Metadata: ${formatBytes(file.sizeBytes)} · ~${formatTokenCount(file.estimatedTokens)} tokens · score ${file.score}`);
    if (file.reasons.length) parts.push(`Why included: ${file.reasons.join('; ')}`);
    parts.push('');
    parts.push(`${fence}${file.language}`);
    parts.push(file.content.trimEnd());
    parts.push(fence);
    parts.push('');
  }

  let markdown = parts.join('\n');
  const estimatedTokens = estimateTokens(markdown);
  markdown = markdown.replace('Estimated tokens: calculated after render', `Estimated tokens: ~${formatTokenCount(estimatedTokens)}`);

  return { markdown, files: input.files, skipped: input.skipped, totalBytes, estimatedTokens, framework: input.framework, warnings: input.warnings, diffSummary: input.diffSummary };
}
