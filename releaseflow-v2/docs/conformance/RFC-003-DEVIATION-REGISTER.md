# RFC-003 — Deviation Register

**Date:** 2026-06-29

---

| ID | Severity | Category | Page | Description | Fix |
|----|----------|----------|------|-------------|-----|
| DD-001 | Medium | Structure | Assets | Page shows empty state, no operational list | Use `useAssetsByRelease` or equivalent hook to populate a list |
| DD-002 | Medium | Structure | Rights Holders | Uses card list instead of table component | Replace with `<Table>` for consistency with Releases/Artists |
| DD-003 | Low | Spatial | Artists | `px-5 sm:px-7` — but hero subtitle has different structure | Standardize subtitle pattern: "X artists" with count |
| DD-004 | Low | Spatial | Assets | `max-w-6xl px-6` — different max-width from Releases `max-w-4xl` | Standardize to max-w-4xl |
| DD-005 | Low | Visual | Rights | Card list items use `padding="sm"` on Card — different from table row height | Standardize row height with other collection pages |
| DD-006 | Low | Information | Assets | Title says "Global media library for audio..." — should use operational language | "Assets across your releases" or similar |

---

## Summary

| Page | Items |
|------|------:|
| Releases | 0 |
| Artists | 1 |
| Assets | 3 |
| Rights Holders | 2 |
| **Total** | **6** |
