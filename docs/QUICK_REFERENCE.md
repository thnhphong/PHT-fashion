# Quick Reference

## Commands

```bash
pnpm dev
pnpm --filter backend run build
pnpm --filter frontend run build
pnpm --filter frontend run lint
```

## Backend Pattern

1. Validation schema in `backend/src/validations/`.
2. Service in `backend/src/services/`.
3. Controller in `backend/src/controllers/`.
4. Route in `backend/src/routes/`.
5. Mount in `backend/src/index.ts` or route index.

## Frontend Pattern

1. API helper through `frontend/src/utils/api.ts` or existing service helper.
2. Shared state in `frontend/src/context/` only when cross-page state is needed.
3. Reusable UI in `frontend/src/components/`.
4. Page-level logic in `frontend/src/pages/`.

## Code Review Graph

```bash
code-review-graph build
code-review-graph status
code-review-graph update
```
