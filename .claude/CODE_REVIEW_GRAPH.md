# Code Review Graph

Shared guidance for using Code Review Graph with this repo. The repository stores instructions and MCP templates; each developer installs the CLI locally.

## Install Once Per Machine

```bash
pipx install code-review-graph
```

If `pipx` is not installed, use the upstream-supported `pip install code-review-graph` or `uvx` flow.

## Configure Tools

Run from the project root:

```bash
code-review-graph install --platform claude-code
code-review-graph install --platform cursor
code-review-graph install --platform antigravity
```

Restart each editor/agent after install.

## Build And Update

```bash
code-review-graph build
code-review-graph status
code-review-graph update
```

For background updates:

```bash
crg-daemon add . --alias pht-fashion
crg-daemon start
crg-daemon status
```

## Agent Usage

Use graph tools before reading broad file sets:

- Build graph: `/code-review-graph:build-graph`
- Review current changes: `/code-review-graph:review-delta`
- Review PR: `/code-review-graph:review-pr`

When MCP tool names are visible, prefer:

- `get_review_context_tool`
- `detect_changes_tool`
- `query_graph_tool`
- `semantic_search_nodes_tool`

## Token Rule

Ask the graph for impact/context first, read only the returned files, and expand manually only when the graph misses evidence needed for the task.
