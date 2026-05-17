# Quick Start

Essential commands for PHT-Fashion.

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev
pnpm --filter backend run dev
pnpm --filter frontend run dev
```

## Validation

```bash
pnpm --filter backend run build
pnpm --filter frontend run build
pnpm --filter frontend run lint
```

## Code Review Graph

Install once per machine:

```bash
pipx install code-review-graph
code-review-graph install --platform claude-code
code-review-graph install --platform cursor
code-review-graph install --platform antigravity
code-review-graph build
```

If `pipx` is unavailable, use the upstream supported install path from `code-review-graph` docs. After install, restart Claude Code, Cursor, or Antigravity.

## Common Workflow

1. Load `CLAUDE.md`, `.claude/COMMON_MISTAKES.md`, `.claude/QUICK_START.md`, `.claude/ARCHITECTURE_MAP.md`.
2. Use `docs/INDEX.md` to pick task docs.
3. Use Code Review Graph for impact/context before opening large files.
4. Validate with the narrowest reliable command.
