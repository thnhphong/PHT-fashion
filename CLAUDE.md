# CLAUDE.md

Token-efficient guide for Claude Code and compatible agents working in PHT-Fashion.

## Session Start Protocol

Load these first, then stop and wait for the task:

1. `.claude/COMMON_MISTAKES.md`
2. `.claude/QUICK_START.md`
3. `.claude/ARCHITECTURE_MAP.md`
4. `docs/INDEX.md` only when choosing task-specific docs

Do not auto-load `.claude/completions/**`, `.claude/sessions/**`, `docs/archive/**`, build outputs, or generated Code Review Graph data. `.claudeignore` documents the intended context boundary.

## Project Overview

PHT-Fashion is a pnpm workspace MERN e-commerce app.

- Backend: Express 5, TypeScript, MongoDB/Mongoose, Redis, Socket.IO, port 5000.
- Frontend: React 19, Vite 7, TypeScript, TailwindCSS v4, React Router v7, port 5173.
- Package manager: pnpm workspaces with `backend/` and `frontend/`.

## Essential Commands

```bash
pnpm dev
pnpm --filter backend run dev
pnpm --filter frontend run dev
pnpm --filter backend run build
pnpm --filter frontend run build
pnpm --filter frontend run lint
```

No test runner is configured. Validate changes with focused builds/lint and manual checks where needed.

## Architecture Quick Reference

Backend path: `backend/src/`

- Request flow: route -> middleware -> controller -> service -> model.
- Validation: Zod schemas in `validations/`, applied through `validateRequest`.
- Auth: JWT access + refresh tokens, `auth.middleware.ts`, `role.middleware.ts`.
- Chat: REST routes plus Socket.IO under `socket/`.

Frontend path: `frontend/src/`

- Pages live in `pages/`.
- Shared UI lives in `components/`.
- Global state lives in `context/`.
- API helpers live in `utils/`.
- `@/` maps to `frontend/src/`.

For details, load `.claude/ARCHITECTURE_MAP.md` or task-specific files from `docs/learnings/`.

## Token-Efficient Workflow

- Prefer `rg`, symbol search, and Code Review Graph before reading large files.
- For code review or impact analysis, use Code Review Graph first when installed:
  - `/code-review-graph:build-graph`
  - `/code-review-graph:review-delta`
  - `/code-review-graph:review-pr`
- Read only the files returned by graph/context queries, then expand if evidence requires it.
- Summarize long terminal output instead of pasting it back.

## Caveman Workflow

Use Caveman Mode when asked for low-token replies.

- Toggle: `/caveman [lite|full|ultra]` or "talk like caveman".
- Style: terse, no filler, technical accuracy preserved.
- Auto-clarity: normal prose for security warnings, destructive actions, and ambiguous instructions.

## Documentation Navigation

- `.claude/QUICK_START.md`: commands and setup.
- `.claude/ARCHITECTURE_MAP.md`: where code lives.
- `.claude/COMMON_MISTAKES.md`: high-cost mistakes to avoid.
- `.claude/CODE_REVIEW_GRAPH.md`: local setup for Claude, Cursor, Antigravity.
- `docs/INDEX.md`: task-to-doc routing with token estimates.
- `docs/TOKENS.md`: caveman/token policy.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
