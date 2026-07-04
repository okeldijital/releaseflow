# RFC-001 — Correction Plan

**Date:** 2026-06-29

---

## Sprint: RFC-002 — Operations Center Gold → Platinum

### Objectives

Resolve the 11 actionable design debt items to achieve Platinum certification.

---

### Block 1: Live Assessment Data (DD-001, DD-002, DD-003, DD-004, DD-007, DD-008, DD-010)

**Target**: Replace hardcoded Assessment values with live operational intelligence.

| Change | File | Lines |
|--------|------|-------|
| Add `aggregateConfidencePct` to `ReleaseIntelligence` type | `operational-intelligence-service.ts` | +1 field |
| Compute confidence from release readiness average | `operational-intelligence-service.ts` | +5 lines |
| Pass confidence to dashboard via hook | `useOperationsCenter.ts` | +1 field |
| Replace hardcoded Confidence, Deadline, Current Stage | `dashboard/page.tsx` | -3 lines, +3 lines |
| Compute nearest deadline from `releases[].daysUntilRelease` | `dashboard/page.tsx` | +5 lines |
| Compute majority stage from `releases[].currentStage` | `dashboard/page.tsx` | +3 lines |

**Effort**: ~30 minutes. No architectural changes. Data already available in `ReleaseIntelligence`.

---

### Block 2: Spatial Refinement (DD-005)

| Change | File | Lines |
|--------|------|-------|
| Change `mb-10` → `mb-12` for chapter transition | `dashboard/page.tsx` | 1 line |

**Effort**: 30 seconds.

---

### Block 3: Navigation (DD-006)

| Change | File | Lines |
|--------|------|-------|
| Add `useEffect` keyboard listener for ⌘K in AppShell | `packages/ui/src/layouts/app-shell.tsx` | +10 lines |

**Effort**: 5 minutes.

---

### Block 4: Visual Refinement (DD-009, DD-012)

| Change | File | Lines |
|--------|------|-------|
| Change activity dot from `surface-300` to `text-text-400/50` | `dashboard/page.tsx` | 1 line |
| Hide "Immediate Actions" section when `actions.length === 0` | `dashboard/page.tsx` | +3 lines |

**Effort**: 2 minutes.

---

## Total Effort

| Block | Time |
|-------|------|
| Live Assessment Data | 30 min |
| Spatial Refinement | <1 min |
| Navigation | 5 min |
| Visual Refinement | 2 min |
| **Total** | **~40 min** |

---

## Post-Correction State

After RFC-002, the Operations Center will:
- Show live confidence, deadline, and stage data
- Use correct spacing per RFDS-002
- Wire ⌘K keyboard shortcut
- Refine visual details

All 12 design debt items resolved. Ready for **Platinum** re-certification.
