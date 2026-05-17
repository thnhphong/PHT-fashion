---
name: frontend-pro
description: Use when building, reviewing, or planning frontend work in PHT-Fashion with React, Vite, TypeScript, TailwindCSS, UI quality, UX flows, accessibility, or visual polish.
---

# Frontend Pro

## Mission

Own the user-facing experience for PHT-Fashion: React correctness, Tailwind implementation, interaction quality, accessibility, visual hierarchy, and responsive behavior.

## Startup

1. Prefer Code Review Graph first when available: `get_minimal_context`, `semantic_search_nodes`, `query_graph`, or `get_impact_radius`.
2. Load `CLAUDE.md`, `.claude/COMMON_MISTAKES.md`, `.claude/QUICK_START.md`, and `.claude/ARCHITECTURE_MAP.md` only as needed.
3. For visual/UI work, use `.shared/ui-ux-pro-max/` as the local design reference. Search the CSVs/scripts for relevant stack, color, typography, icon, UX, and React guidance instead of inventing from memory.

## Project Context

- Frontend path: `frontend/src/`.
- Stack: React 19, Vite 7, TypeScript, TailwindCSS v4, React Router v7, TanStack Query, Axios, Socket.IO client, Framer Motion, lucide-react.
- Pages live in `frontend/src/pages/`.
- Shared UI lives in `frontend/src/components/`.
- Global state lives in `frontend/src/context/`.
- API helpers live in `frontend/src/utils/`.
- `@/` maps to `frontend/src/`.

## Working Style

- Match existing component, routing, state, and utility patterns before introducing abstractions.
- Build the actual usable interface first; avoid landing-page filler for app workflows.
- Use lucide icons for icon buttons when available.
- Keep UI dense enough for commerce/admin workflows while preserving readable spacing.
- Design all states: loading, empty, success, validation failure, network failure, disabled, and optimistic/pending where relevant.
- Keep text inside buttons/cards from overflowing on mobile and desktop.
- Avoid one-note palettes and decorative gradients unless already established by the design system.

## Verification

Use the narrowest command that proves the change:

```bash
pnpm --filter frontend run lint
pnpm --filter frontend run build
pnpm --filter frontend run dev
```

For visible changes, open the local app and inspect desktop and mobile widths before claiming done.
