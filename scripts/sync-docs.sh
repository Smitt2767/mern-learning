#!/usr/bin/env bash
# =============================================================================
# sync-docs.sh — Analyze git changes and update ARCHITECTURE.md + CLAUDE.md
# =============================================================================
# Usage:
#   bash scripts/sync-docs.sh                  # analyzes last commit
#   bash scripts/sync-docs.sh HEAD~3..HEAD      # analyzes specific range
#
# Exit codes:
#   0 — docs were already up to date (push can proceed)
#   1 — docs were updated and amended into last commit (re-push required)
#   2 — claude CLI not available or analysis failed (push can proceed as-is)
# =============================================================================

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

RANGE="${1:-HEAD~1..HEAD}"

# ── Dependency check ──────────────────────────────────────────────────────────
if ! command -v claude &>/dev/null; then
  echo "⚠️  'claude' CLI not found — skipping docs sync."
  exit 2
fi

# ── Gather changes ────────────────────────────────────────────────────────────
COMMITS=$(git log --pretty=format:"- %h %s" "$RANGE" 2>/dev/null || true)

if [ -z "$COMMITS" ]; then
  echo "ℹ️  No commits in range '$RANGE' — skipping docs sync."
  exit 0
fi

# Stat summary (which files changed)
FILE_STATS=$(git diff --stat "$RANGE" 2>/dev/null | tail -20 || true)

# Code diff — only source/config files, truncated to keep prompt manageable
CODE_DIFF=$(git diff "$RANGE" \
  -- '*.ts' '*.tsx' '*.json' '*.yaml' '*.yml' '*.sql' \
  2>/dev/null | head -n 400 || true)

echo "🔍 Analyzing changes for docs sync…"

# ── Build prompt ──────────────────────────────────────────────────────────────
PROMPT="You are maintaining project documentation for a MERN monorepo at: $REPO_ROOT

The following commits are being pushed to git:
$COMMITS

Changed files summary:
$FILE_STATS

Relevant code diff (may be truncated at 400 lines):
$CODE_DIFF

---
Your task:
1. Read ARCHITECTURE.md and CLAUDE.md in the repo root.
2. Update them ONLY if the pushed changes introduce:
   - A new or removed service/workspace/package
   - New or changed API routes or endpoints
   - New or changed database tables, columns, or relations
   - New or changed environment variables
   - New architectural patterns, conventions, or important utilities
   - A rename of any service, package, or key file

Do NOT update docs for:
   - Bug fixes, refactors, or logic changes with no structural impact
   - Test changes
   - Changes that are already accurately documented

Be minimal and precise — only touch the sections that are actually out of date."

# ── Call Claude CLI ───────────────────────────────────────────────────────────
claude --print \
  --allowedTools "Edit,Read,Glob,Grep" \
  "$PROMPT" \
  2>&1 | grep -v "^$" || true   # suppress blank lines, don't fail on grep exit

# ── Check if docs changed ─────────────────────────────────────────────────────
if git diff --quiet ARCHITECTURE.md CLAUDE.md 2>/dev/null; then
  echo "✅ Docs are already up to date."
  exit 0
fi

# ── Docs were updated — amend last commit ─────────────────────────────────────
echo ""
echo "📝 Docs updated — amending last commit to include changes…"
git add ARCHITECTURE.md CLAUDE.md
git commit --amend --no-edit --no-verify --quiet
echo "✅ Docs synced and amended into last commit."
exit 1   # Signal pre-push hook to re-run push with the amended SHA
