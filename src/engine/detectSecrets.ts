import type { SecretFinding } from '../types.js';

const secretPatterns: Array<{ type: string; regex: RegExp }> = [
  { type: 'OpenAI API key', regex: /sk-[A-Za-z0-9_-]{20,}/ },
  { type: 'GitHub token', regex: /gh[pousr]_[A-Za-z0-9_]{20,}/ },
  { type: 'AWS access key', regex: /AKIA[0-9A-Z]{16}/ },
  { type: 'Private key block', regex: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { type: 'Generic secret assignment', regex: /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{12,}["']/i }
];

function redact(line: string): string {
  return line.replace(/([:=]\s*["']?)[^"'\s]{6,}/g, '$1***');
}

export function detectSecrets(content: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const lines = content.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    for (const pattern of secretPatterns) {
      if (pattern.regex.test(line)) {
        findings.push({ type: pattern.type, line: index + 1, preview: redact(line.trim()).slice(0, 140) });
      }
    }
  }

  return findings;
}
