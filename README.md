# RepoToPrompt

[![npm version](https://img.shields.io/npm/v/repotoprompt.svg)](https://www.npmjs.com/package/repotoprompt)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/Crypjeremy/repotoprompt.svg?style=social)](https://github.com/Crypjeremy/repotoprompt)

**Give AI the right files, not every file.**

RepoToPrompt is an open-source CLI that turns a local repository into a task-aware, token-budgeted context pack for AI coding assistants like ChatGPT, Claude, Cursor, Windsurf, and Gemini.

Instead of dumping your whole codebase blindly, RepoToPrompt scans your project, respects ignore files, skips secrets, scores files by relevance, applies a mode and token budget, then writes a clean markdown or JSON context file.

## Install

Run without installing:

```bash
npx repotoprompt .
```

Install globally:

```bash
npm install -g repotoprompt
repotoprompt .
```

## Quick start

```bash
repotoprompt . --goal "Add dark mode to the dashboard" --mode focused --budget 30000 --target chatgpt
```

Open the result in VS Code:

```bash
repotoprompt . --goal "Explain this project" --open-with code --open
```

## What's new in v1.1

- Interactive mode with `--interactive` / `-I`
- `repotoprompt init` for project config
- `.repotopromptrc.json` support
- `--security-report` for skipped secret/env files
- `--explain` for inclusion/exclusion reasoning
- `--print` for stdout/piping workflows
- `--output-dir` for timestamped context packs
- npm/GitHub metadata polish

## Features

- Task-aware `--goal` context packing
- Modes: `full`, `focused`, `minimal`, `debug`, `review`
- Token budgeting with `--budget`
- Git diff/review mode with `--diff` and `--since main`
- `.gitignore` and `.repotopromptignore` support
- `.repotopromptrc.json` project defaults
- Built-in binary, build-output, dependency, image, and lockfile exclusions
- Secret/env file skipping by default
- Security reporting with `--security-report`
- File relevance scoring with reasons
- Framework and entrypoint detection
- Output targets: `chatgpt`, `claude`, `cursor`, `gemini`, `markdown`, `json`
- `--dry-run`, `--stats`, `--copy`, `--open`, `--print`, and `--explain`
- Cross-platform Node CLI

## Commands

### Interactive mode

```bash
repotoprompt --interactive
```

or:

```bash
repotoprompt -I
```

The CLI asks for repo path, goal, mode, target, token budget, output, clipboard, and open behavior.

### Initialize project config

```bash
repotoprompt init
```

Creates:

```text
.repotopromptrc.json
.repotopromptignore
```

Example config:

```json
{
  "mode": "focused",
  "target": "chatgpt",
  "budget": 30000,
  "maxFileKb": 256,
  "defaultOutput": "repotoprompt-output.md",
  "alwaysInclude": ["README.md", "package.json"],
  "alwaysExclude": [".env*", "private/**", "node_modules/**", "dist/**"]
}
```

Overwrite existing config:

```bash
repotoprompt init --force
```

### Basic context pack

```bash
repotoprompt .
```

Creates:

```text
repotoprompt-output.md
```

### Add a coding goal

```bash
repotoprompt . --goal "Fix login redirect bug"
```

The goal is used to score and prioritize relevant files.

### Focus the context

```bash
repotoprompt . --mode focused --goal "Add OAuth login"
```

### Minimal context

```bash
repotoprompt . --mode minimal --goal "Update navbar styling"
```

### Debug mode

```bash
repotoprompt . --mode debug --goal "Fix API 500 error"
```

### Review changed files

```bash
repotoprompt . --mode review --diff
```

Compare against a branch:

```bash
repotoprompt . --mode review --since main
```

### Set a token budget

```bash
repotoprompt . --goal "Add dark mode" --budget 30000
```

### Target an AI assistant

```bash
repotoprompt . --target chatgpt
repotoprompt . --target claude
repotoprompt . --target cursor
repotoprompt . --target gemini
```

### Preview without writing

```bash
repotoprompt . --dry-run --stats
```

### Explain what happened

```bash
repotoprompt . --goal "Update README" --explain --stats
```

This prints included files, relevance scores, reasons, and skipped files.

### Security report

```bash
repotoprompt . --security-report
```

This reports possible secret/env files skipped before output generation.

Fail instead of skipping:

```bash
repotoprompt . --fail-on-secret
```

### Print to stdout

```bash
repotoprompt . --goal "Explain this repo" --print
```

Pipe to clipboard on Windows:

```powershell
repotoprompt . --goal "Explain this repo" --print | clip
```

### Timestamped outputs

```bash
repotoprompt . --output-dir .repotoprompt/outputs
```

Creates files like:

```text
.repotoprompt/outputs/2026-06-02_15-30-12-explain-this-project.md
```

### Copy and open output

```bash
repotoprompt . --copy
repotoprompt . --open
repotoprompt . --open-with code
```

### Include or exclude files

```bash
repotoprompt . --include "src/**/*,package.json,README.md"
repotoprompt . --exclude "**/*.test.ts,docs/**"
```

### JSON output

```bash
repotoprompt . --target json --output context.json
```

## Modes

| Mode | Use it for | Behavior |
|---|---|---|
| `full` | Whole repo understanding | Includes all safe scannable files |
| `focused` | Most normal coding tasks | Prioritizes goal/config/entrypoint files |
| `minimal` | Small prompts | Keeps only high-scoring files |
| `debug` | Bug fixing | Prioritizes tests, handlers, routes, error-related files |
| `review` | Pre-PR review | Prioritizes changed files and nearby context |

## Output structure

Markdown packs include:

- user goal
- context strategy
- detected framework/language
- entrypoints and config files
- security notes
- warnings
- included file tree
- file relevance table
- skipped file summary
- source files with code fences

## Ignore rules

RepoToPrompt merges:

1. Built-in safe defaults
2. `.gitignore`
3. `.repotopromptignore`
4. `.repotopromptrc.json` `alwaysExclude`
5. CLI `--exclude` patterns

Create `.repotopromptignore` for context-specific exclusions:

```gitignore
.env*
private/**
large-fixtures/**
```

## Secret safety

RepoToPrompt skips `.env*` files and common secret patterns by default.

No secret scanner is perfect. Always review generated context before pasting it into external tools.

## Development

```bash
git clone https://github.com/Crypjeremy/repotoprompt.git
cd repotoprompt
npm install
npm run check
npm run build
npm test
npm link
repotoprompt --help
```

Run locally:

```bash
npm run dev -- . --goal "Explain this repo" --dry-run --stats
```

## Roadmap

- Better import/dependency tracing
- Interactive file picker
- Desktop drag-and-drop app
- Tokenizer-specific model estimates
- MCP/server mode
- GitHub Action for PR context packs

## Maintainer

Created and maintained by [crypjeremy](https://github.com/Crypjeremy). Contributions are welcome.

## License

MIT
