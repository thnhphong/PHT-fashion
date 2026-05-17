# Token-Efficient Development

Load for AI-agent workflow, reviews, and context management.

## Default Context Strategy

1. Read startup docs only.
2. Use `docs/INDEX.md` to pick one task doc.
3. Use `rg` or Code Review Graph before opening large files.
4. Summarize terminal output; avoid pasting long logs.
5. Move historical details to `docs/archive/` or `.claude/completions/`.

## Code Review Graph Workflow

Install locally once, then run from repo root:

```bash
code-review-graph build
code-review-graph status
code-review-graph update
```

Use graph tools for:

- Change impact analysis.
- Pull request review.
- Finding related callers/dependencies.
- Avoiding full-file or full-repo reads.

## Claude Token Optimizer Workflow

Keep `CLAUDE.md` short. Put commands and architecture maps in `.claude/`. Put detailed task knowledge in `docs/learnings/`. Keep old sessions and completion notes ignored by `.claudeignore`.
