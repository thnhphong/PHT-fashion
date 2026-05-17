# Documentation Index

Use this file to choose the smallest useful context.

## Session Start

Load:

- `CLAUDE.md` (~650 tokens)
- `.claude/COMMON_MISTAKES.md` (~300 tokens)
- `.claude/QUICK_START.md` (~250 tokens)
- `.claude/ARCHITECTURE_MAP.md` (~650 tokens)

Approx startup context: 1,850 tokens plus current task.

## Task Routing

| Task | Load |
| --- | --- |
| New backend endpoint | `docs/learnings/api-design.md` |
| Frontend page/component | `docs/learnings/frontend-patterns.md` |
| Auth, checkout, payment | `docs/learnings/auth-and-payments.md` |
| Chat feature | `docs/learnings/chat-system.md` |
| Code review, impact analysis, token saving | `docs/learnings/token-efficient-development.md`, `.claude/CODE_REVIEW_GRAPH.md` |
| Cart/favorites behavior | `docs/CART_FAV_STORING.md` only if needed |
| Race condition/stock/payment history | `docs/RACE_CONDITION_STATUS.md` or `docs/RACE_CONDITION_BEST_PRACTICES.md` only if needed |

## Existing Long Docs

Load only on demand:

- `README.md`: broad architecture overview.
- `docs/CHAT_FEATURE.md`: full chat spec.
- `docs/CHAT_IMPLEMENTATION_SUMMARY.md`: implementation history.
- `docs/TOKENS.md`: caveman token policy.

## Token Rule

Start narrow. Use Code Review Graph or `rg` before opening large files. Do not load generated outputs or full docs unless the task requires them.
