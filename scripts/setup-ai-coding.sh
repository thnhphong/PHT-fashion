#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

python_ok() {
  "$1" - <<'PY'
import sys
raise SystemExit(0 if sys.version_info >= (3, 10) else 1)
PY
}

pick_python() {
  for py in python3.12 python3.11 python3.10 python3; do
    if command -v "$py" >/dev/null 2>&1 && python_ok "$py"; then
      echo "$py"
      return 0
    fi
  done

  echo "Code Review Graph requires Python 3.10+." >&2
  echo "Install Python 3.10+ first, then rerun: pnpm ai:setup" >&2
  echo "macOS options: official Python installer, pyenv, mise, uv, or Homebrew." >&2
  return 1
}

install_code_review_graph() {
  if command -v code-review-graph >/dev/null 2>&1; then
    echo "code-review-graph already installed: $(command -v code-review-graph)"
    return 0
  fi

  if [ -x "$HOME/.local/bin/code-review-graph" ]; then
    echo "code-review-graph already installed: $HOME/.local/bin/code-review-graph"
    return 0
  fi

  local py="$1"

  if command -v pipx >/dev/null 2>&1; then
    pipx install code-review-graph
  else
    "$py" -m pip install --user code-review-graph
  fi
}

find_code_review_graph() {
  if command -v code-review-graph >/dev/null 2>&1; then
    command -v code-review-graph
    return 0
  fi

  if [ -x "$HOME/.local/bin/code-review-graph" ]; then
    echo "$HOME/.local/bin/code-review-graph"
    return 0
  fi

  echo "code-review-graph installed, but executable was not found on PATH or in ~/.local/bin." >&2
  echo "Add ~/.local/bin to PATH, restart shell, then rerun this script." >&2
  return 1
}

configure_platforms() {
  local crg="$1"
  "$crg" install --platform claude-code
  "$crg" install --platform cursor
  "$crg" install --platform antigravity
}

main() {
  local py
  py="$(pick_python)"

  install_code_review_graph "$py"
  local crg
  crg="$(find_code_review_graph)"
  configure_platforms "$crg"
  "$crg" build
  "$crg" status

  echo
  echo "AI coding setup ready."
  echo "Restart Claude Code, Cursor, and Antigravity so they reload MCP/rules."
}

main "$@"
