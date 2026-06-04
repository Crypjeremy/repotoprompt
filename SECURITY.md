# Security Policy

RepoToPrompt processes local source code and creates context packs for AI coding tools. Please review generated output before sharing it externally.

## Reporting a vulnerability

Open a private security advisory on GitHub or contact the maintainer through the repository profile.

## Secret handling

RepoToPrompt skips `.env*` files and common secret patterns by default, but no scanner is perfect.

Use:

```bash
repotoprompt . --security-report
repotoprompt . --fail-on-secret
```
