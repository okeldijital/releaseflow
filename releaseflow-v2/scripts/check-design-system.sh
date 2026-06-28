#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────────────
# scripts/check-design-system.sh
#
# Static guardrail script: detects raw Tailwind / inline patterns that
# bypass the ReleaseFlow Design System (PDS-13).
#
# Usage:
#   ./scripts/check-design-system.sh           # default: report-only
#   STRICT=1 ./scripts/check-design-system.sh  # exit 1 on any violation
#
# Scope:
#   - Page files under apps/web/src/app/**/{page,layout}.tsx
#     (excluding the ui-lab/ design-system showroom)
#   - Shared component packages under packages/{ui,domain-ui}/**/*.tsx
#
# The script deliberately uses plain grep so it can run in CI without
# needing ripgrep, ESLint, or the Next.js build cache.
# ────────────────────────────────────────────────────────────────────────

set -uo pipefail

# Resolve repo root regardless of where the script is invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# ─── Configuration ─────────────────────────────────────────────────────
PAGE_GLOBS=(
  "apps/web/src/app/**/page.tsx"
  "apps/web/src/app/**/layout.tsx"
)
PAGE_EXCLUDES=(
  --exclude-dir=ui-lab
)
PKG_GLOBS=(
  "packages/ui/src/**/*.tsx"
  "packages/domain-ui/src/**/*.tsx"
)

# ─── Helpers ───────────────────────────────────────────────────────────
section() {
  printf '\n\033[1;34m== %s ==\033[0m\n' "$1"
}

# find-in <label> <pattern> <glob...>  (prints "<label> violations: <count>")
# excludes are always applied.
find_in() {
  local label="$1"; shift
  local pattern="$1"; shift
  local hits
  hits=$(grep -rEnH "$pattern" "$@" 2>/dev/null | grep -v 'apps/web/src/app/.*ui-lab/' || true)
  local count
  count=$(printf '%s\n' "$hits" | grep -c . 2>/dev/null || true)
  if [[ -n "$hits" && "$hits" != $'\n' && "$count" -gt 0 ]]; then
    printf '\033[1;33m[%s] %d violation(s):\033[0m\n' "$label" "$count"
    printf '%s\n' "$hits"
    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + count))
  else
    printf '\033[1;32m[%s] 0 violations\033[0m\n' "$label"
  fi
}

TOTAL_VIOLATIONS=0

# ─── Page-level guardrails ────────────────────────────────────────────
section "Page files (apps/web/src/app/**/{page,layout}.tsx)"

# Build a single grep command per pattern across all page globs.
PAGE_GREP_ARGS=()
for g in "${PAGE_GLOBS[@]}"; do
  PAGE_GREP_ARGS+=(--include="$(basename "$g")" --exclude-dir=ui-lab)
done

run_page_check() {
  local label="$1" pattern="$2"
  local hits
  hits=$(grep -rEnH --include='page.tsx' --include='layout.tsx' \
                   --exclude-dir=ui-lab \
                   "$pattern" apps/web/src/app/ 2>/dev/null || true)
  local count
  count=$(printf '%s\n' "$hits" | grep -c . 2>/dev/null || echo 0)
  if [[ -n "$hits" && "$count" -gt 0 ]]; then
    printf '\033[1;33m[%s] %d violation(s):\033[0m\n' "$label" "$count"
    printf '%s\n' "$hits"
    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + count))
  else
    printf '\033[1;32m[%s] 0 violations\033[0m\n' "$label"
  fi
}

# Container → use <Container />
run_page_check "max-w-* (use <Container />)"    '\bmax-w-[a-z0-9-]+'
run_page_check "mx-auto (use <Container />)"    '\bmx-auto\b'

# Card → use <Card />
run_page_check "rounded-xl + border + bg-white (use <Card />)" \
  'rounded-xl[^"]*border[^"]*bg-white'
run_page_check "rounded-2xl + border + bg-white (use <Card />)" \
  'rounded-2xl[^"]*border[^"]*bg-white'

# Spinner → use <LoadingState />
run_page_check "animate-spin (use <LoadingState />)" '\banimate-spin\b'

# Typography → use <Typography />
run_page_check "text-[Npx] / text-[Nrem] (use <Typography />)" \
  'text-\[[0-9]+(\.[0-9]+)?(px|rem)\]'

# Semantic colour tokens
run_page_check "bg-zinc-* (use surface tokens)"  '\bbg-zinc-[0-9]+\b'
run_page_check "text-zinc-* (use text tokens)"   '\btext-zinc-[0-9]+\b'

# Hardcoded colour hex literals (matches #abc, #abcdef, #abcd, #abcdef12)
run_page_check "hardcoded hex colour"            '#[0-9a-fA-F]{3,8}\b'

# Shadow legacy alias
run_page_check "shadow-elevated (use shadow-raised)" '\bshadow-elevated\b'

# ─── Component-level guardrails ───────────────────────────────────────
section "Shared component packages (packages/{ui,domain-ui}/src/**/*.tsx)"

run_pkg_check() {
  local label="$1" pattern="$2"
  local hits
  hits=$(grep -rEnH --include='*.tsx' "$pattern" packages/ 2>/dev/null || true)
  local count
  count=$(printf '%s\n' "$hits" | grep -c . 2>/dev/null || echo 0)
  if [[ -n "$hits" && "$count" -gt 0 ]]; then
    printf '\033[1;33m[%s] %d violation(s):\033[0m\n' "$label" "$count"
    printf '%s\n' "$hits"
    TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + count))
  else
    printf '\033[1;32m[%s] 0 violations\033[0m\n' "$label"
  fi
}

# Radius tokens
run_pkg_check "rounded-2xl in components (use rounded-lg)" '\brounded-2xl\b'
run_pkg_check "rounded-[Npx] in components (use Radius token)" '\brounded-\[[0-9]+(px|rem)\]'

# Motion tokens
run_pkg_check "duration-[Nms] in components (use Motion token)" \
  '\bduration-\[[0-9]+(ms|s)\]'

# Shadow tokens
run_pkg_check "shadow-elevated in components (use shadow-raised)" \
  '\bshadow-elevated\b'

# ─── Token usage summary (informational) ──────────────────────────────
section "Arbitrary-value token counts in packages/ (informational)"

count_in_pkgs() {
  local label="$1" pattern="$2"
  # grep -c prints the count of matching *lines* per file; wc -l sums.
  local count
  count=$(grep -rEon --include='*.tsx' "$pattern" packages/ 2>/dev/null | wc -l | tr -d ' ')
  printf '%-40s %5d\n' "$label" "$count"
}

count_in_pkgs "text-[Npx]"      'text-\[[0-9]+px\]'
count_in_pkgs "text-[Nrem]"     'text-\[[0-9.]+rem\]'
count_in_pkgs "w-[Npx]"         'w-\[[0-9]+px\]'
count_in_pkgs "h-[Npx]"         'h-\[[0-9]+px\]'
count_in_pkgs "gap-[Npx]"       'gap-\[[0-9]+px\]'
count_in_pkgs "rounded-[Npx]"   'rounded-\[[0-9]+px\]'
count_in_pkgs "duration-[Nms]"  'duration-\[[0-9]+ms\]'
count_in_pkgs "p-5 (20px)"      'p-5\b'
count_in_pkgs "gap-1.5"         'gap-1\.5'
count_in_pkgs "gap-2.5"         'gap-2\.5'
count_in_pkgs "gap-3.5"         'gap-3\.5'

# ─── Result ────────────────────────────────────────────────────────────
printf '\n\033[1;34m== Summary ==\033[0m\n'
if [[ "$TOTAL_VIOLATIONS" -eq 0 ]]; then
  printf '\033[1;32mNo design-system guardrail violations.\033[0m\n'
  exit 0
fi

printf '\033[1;31mTotal guardrail violations: %d\033[0m\n' "$TOTAL_VIOLATIONS"

if [[ "${STRICT:-0}" == "1" ]]; then
  exit 1
fi
exit 0
