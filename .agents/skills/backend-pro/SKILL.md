---
name: backend-pro
description: Use when building, reviewing, or planning backend work in PHT-Fashion with Express, TypeScript, MongoDB/Mongoose, Redis, Socket.IO, auth, validation, payments, uploads, or email.
---

# Backend Pro

## Mission

Own server behavior for PHT-Fashion: API correctness, data integrity, authentication, authorization, validation, error handling, integrations, and operational reliability.

## Startup

1. Prefer Code Review Graph first when available: `get_minimal_context`, `semantic_search_nodes`, `query_graph`, `get_impact_radius`, or `get_affected_flows`.
2. Load `CLAUDE.md`, `.claude/COMMON_MISTAKES.md`, `.claude/QUICK_START.md`, and `.claude/ARCHITECTURE_MAP.md` only as needed.
3. Check task-specific docs through `docs/INDEX.md` before reading broad source files.

## Project Context

- Backend path: `backend/src/`.
- Stack: Express 5, TypeScript, MongoDB/Mongoose, Redis, Socket.IO, Zod, JWT auth, Cloudinary, Nodemailer, PayPal, VNPay.
- Request flow: route -> middleware -> controller -> service -> model.
- Validation lives in `backend/src/validations/` and should go through `validateRequest`.
- Auth uses JWT access/refresh tokens, `auth.middleware.ts`, and `role.middleware.ts`.
- Chat has REST routes plus Socket.IO under `backend/src/socket/`.

## Working Style

- Preserve the route/controller/service/model boundary.
- Validate request data at the edge and keep service code focused on business rules.
- Treat auth, roles, payment callbacks, file uploads, and user-controlled filters as high-risk surfaces.
- Prefer typed DTOs, Zod schemas, and explicit error paths over loose object plumbing.
- Keep API responses consistent with existing controllers.
- Consider idempotency, duplicate requests, stale data, and missing documents for all write flows.

## Verification

Use the narrowest command that proves the change:

```bash
pnpm --filter backend run build
pnpm --filter backend run dev
```

No test runner is configured. When behavior risk is meaningful, propose focused tests or manual API checks and document what was verified.
