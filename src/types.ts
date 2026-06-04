export type Mode = 'full' | 'focused' | 'minimal' | 'debug' | 'review';
export type Target = 'markdown' | 'chatgpt' | 'claude' | 'cursor' | 'gemini' | 'json';

export type CliOptions = {
  output: string;
  outputDir?: string;
  include?: string;
  exclude?: string;
  maxFileKb: string;
  goal?: string;
  mode: Mode;
  target: Target;
  budget?: string;
  dryRun?: boolean;
  diff?: boolean;
  since?: string;
  stats?: boolean;
  copy?: boolean;
  open?: boolean;
  openWith?: string;
  failOnSecret?: boolean;
  interactive?: boolean;
  print?: boolean;
  securityReport?: boolean;
  explain?: boolean;
};

export type RepoToPromptConfig = {
  mode?: Mode;
  target?: Target;
  budget?: number;
  maxFileKb?: number;
  defaultOutput?: string;
  outputDir?: string;
  alwaysInclude?: string[];
  alwaysExclude?: string[];
  copy?: boolean;
  open?: boolean;
  openWith?: string;
  failOnSecret?: boolean;
};

export type PackOptions = {
  rootDir: string;
  outputPath: string;
  include?: string[];
  exclude?: string[];
  maxFileBytes: number;
  goal?: string;
  mode: Mode;
  target: Target;
  budgetTokens?: number;
  dryRun: boolean;
  diff: boolean;
  since?: string;
  stats: boolean;
  copy: boolean;
  open: boolean;
  openWith?: string;
  failOnSecret: boolean;
  print: boolean;
};

export type RepoFile = {
  relativePath: string;
  absolutePath: string;
  sizeBytes: number;
  language: string;
  content: string;
  estimatedTokens: number;
  score: number;
  reasons: string[];
  changed?: boolean;
  hasSecret?: boolean;
  secretFindings?: SecretFinding[];
};

export type SkippedFile = {
  relativePath: string;
  reason: string;
};

export type SecretFinding = {
  type: string;
  line: number;
  preview: string;
};

export type FrameworkInfo = {
  language: string;
  framework: string;
  packageManager?: string;
  entrypoints: string[];
  configFiles: string[];
};

export type ScanResult = {
  files: RepoFile[];
  skipped: SkippedFile[];
};

export type PackResult = {
  markdown: string;
  files: RepoFile[];
  skipped: SkippedFile[];
  totalBytes: number;
  estimatedTokens: number;
  framework: FrameworkInfo;
  warnings: string[];
  diffSummary?: string;
};
