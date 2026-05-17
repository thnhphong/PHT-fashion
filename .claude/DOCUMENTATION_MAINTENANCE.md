# Documentation Maintenance

Keep startup docs small. Move detail into task-specific docs.

## Update Startup Docs When

- A command changes.
- A critical repeated mistake is discovered.
- A major directory or architecture boundary changes.

## Add Learning Docs When

- A feature has reusable patterns.
- A debugging lesson will likely recur.
- A workflow is too long for `CLAUDE.md`.

## Archive When

- A doc is historical, superseded, or only useful for past decisions.
- Move it to `docs/archive/` and link it from `docs/INDEX.md` only if still useful.

## Completion Notes

Task completion notes belong in `.claude/completions/` and should not be auto-loaded.
