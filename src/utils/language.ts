import path from 'node:path';

const extensionToLanguage: Record<string, string> = {
  '.js': 'javascript', '.jsx': 'jsx', '.ts': 'typescript', '.tsx': 'tsx',
  '.mjs': 'javascript', '.cjs': 'javascript', '.json': 'json', '.md': 'markdown',
  '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less', '.html': 'html',
  '.py': 'python', '.rb': 'ruby', '.go': 'go', '.rs': 'rust', '.java': 'java',
  '.kt': 'kotlin', '.php': 'php', '.c': 'c', '.h': 'c', '.cpp': 'cpp', '.hpp': 'cpp',
  '.cs': 'csharp', '.sh': 'bash', '.ps1': 'powershell', '.yml': 'yaml', '.yaml': 'yaml',
  '.toml': 'toml', '.xml': 'xml', '.sql': 'sql', '.env': 'dotenv', '.vue': 'vue',
  '.svelte': 'svelte', '.astro': 'astro', '.prisma': 'prisma', '.graphql': 'graphql'
};

export function languageForFile(filePath: string): string {
  const base = path.basename(filePath).toLowerCase();
  if (base === 'dockerfile') return 'dockerfile';
  if (base === '.gitignore' || base === '.repotopromptignore') return 'gitignore';
  if (base.startsWith('.env')) return 'dotenv';
  return extensionToLanguage[path.extname(filePath).toLowerCase()] ?? '';
}
