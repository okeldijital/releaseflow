# RFC-003 — Design Debt Register

**Date:** 2026-06-29

---

## DD-001 — Assets Page Has No Operational List

| Field | Value |
|-------|-------|
| Severity | Medium |
| Page | Assets |
| Problem | Page shows only empty state — "Upload audio, artwork, video, or documents" |
| Expected | Collection list of assets across releases |
| Fix | Integrate `useAssetsByRelease` hook with org-wide scope |
| Effort | Medium — requires data query |

## DD-002 — Rights Holders Uses Card List

| Field | Value |
|-------|-------|
| Severity | Medium |
| Problem | Card list instead of table — different from Releases/Artists |
| Fix | Replace `<Card>` loop with `<Table>` component |
| Effort | Low — ~5 lines |

## DD-003 — Artists Subtitle Structure

| Field | Value |
|-------|-------|
| Severity | Low |
| Problem | Subtitle: `"{count} artist(s)"` — different from Releases' `"{count} release(s)"` structure |
| Fix | Standardize to same pattern |
| Effort | Trivial |

## DD-004 — Assets Width

| Field | Value |
|-------|-------|
| Severity | Low |
| Problem | `max-w-6xl` vs `max-w-4xl` on Releases |
| Fix | Standardize to `max-w-4xl` |
| Effort | Trivial |

## DD-005 — Rights Row Height

| Field | Value |
|-------|-------|
| Severity | Low |
| Problem | Card padding differs from table row height |
| Fix | Use table component for consistency |
| Effort | Same as DD-002 |

## DD-006 — Assets Language

| Field | Value |
|-------|-------|
| Severity | Low |
| Problem | Editorial description rather than operational language |
| Fix | "Assets across your releases" |

---

## Resolution Priority

| Priority | Items |
|----------|-------|
| 1 (immediate) | DD-002, DD-004, DD-005 (trivial fixes) |
| 2 (next sprint) | DD-001 (requires data query) |
| 3 (refinement) | DD-003, DD-006 |

**Total effort**: ~30 minutes (excluding DD-001 which needs data infrastructure)
