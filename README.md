# RepoToPrompt

**Give AI the right files, not every file.**

RepoToPrompt is an open-source CLI that turns a local repository into a task-aware, token-budgeted context pack for AI coding assistants like ChatGPT, Claude, Cursor, Windsurf, and Gemini.

Instead of dumping your whole codebase blindly, RepoToPrompt scans your project, respects ignore files, skips secrets, scores files by relevance, applies a mode and token budget, then writes a clean markdown or JSON context file.

## Why this exists

AI coding gets better when the model has the right context. Manually copying files is slow, messy, and easy to get wrong. Whole-repo dumps waste tokens and often include irrelevant files.

RepoToPrompt helps you package context around the task you are trying to solve:

```bash
repotoprompt . --goal "Add dark mode to the dashboard" --mode focused --budget 30000 --target chatgpt
```

## Features

- Task-aware `--goal` context packing
- Modes: `full`, `focused`, `minimal`, `debug`, `review`
- Token budgeting with `--budget`
- Git diff/review mode with `--diff` and `--since main`
- `.gitignore` and `.repotopromptignore` support
- Built-in binary, build-output, dependency, image, and lockfile exclusions
- Secret/env file skipping by default
- Framework and entrypoint detection
- File relevance scoring with reasons
- Output targets: `chatgpt`, `claude`, `cursor`, `gemini`, `markdown`, `json`
- `--dry-run`, `--stats`, `--copy`, and `--open`
- Cross-platform Node CLI

## Install

### Run without installing

```bash
npx repotoprompt .
```

### Install globally

```bash
npm install -g repotoprompt
repotoprompt .
```

### Local development

```bash
git clone https://github.com/crypjeremy/repotoprompt.git
cd repotoprompt
npm install
npm run build
npm link
repotoprompt --help
```

## Usage

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
4. CLI `--exclude` patterns

Create `.repotopromptignore` for context-specific exclusions:

```gitignore
.env*
private/**
large-fixtures/**
```

## Secret safety

RepoToPrompt skips `.env*` files and common secret patterns by default. Use:

```bash
repotoprompt . --fail-on-secret
```

when you want the command to fail instead of silently skipping suspicious files.

No secret scanner is perfect. Always review generated context before pasting it into external tools.

## Development

```bash
npm install
npm run check
npm run build
npm test
```

Run locally:

```bash
npm run dev -- . --goal "Explain this repo" --dry-run --stats
```

## Roadmap after v1

- Better import/dependency tracing
- Interactive file picker
- Desktop drag-and-drop app
- Tokenizer-specific model estimates
- MCP/server mode
- GitHub Action for PR context packs

## License

MIT
