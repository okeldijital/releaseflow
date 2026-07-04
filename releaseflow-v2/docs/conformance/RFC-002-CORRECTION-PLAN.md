# RFC-002 — Correction Plan

**Date:** 2026-06-29

---

## Sprint: Gold → Platinum (~20 minutes)

### Block 1: Health Standardization (DD-001, DD-005)

Replace the inline 3-level health computation with `computeHealth()` from operational-intelligence-service.ts.

```typescript
// Before (line 311-313)
const healthPillLabel = readiness.percentage >= 80 ? 'Healthy' : readiness.percentage >= 50 ? 'Attention' : 'Critical';

// After
import { computeHealth } from '@/lib/operational-intelligence-service';
const healthState = computeHealth(readiness.percentage);
// Use healthState (5-level: Excellent/Healthy/Attention/Blocked/Critical)
```

### Block 2: Badge Components (DD-002, DD-003)

Replace raw `<span>` elements with `Badge` components from RFDS-006 inventory.

```typescript
// Before
<span className="text-sm text-text-500">{release.releaseType}</span>

// After
<Badge label={release.releaseType} color="bg-surface-100 text-text-700" />
```

### Block 3: Deduplication (DD-008)

Remove local `daysUntil()` function. Use from operational-intelligence-service.

### Block 4: Structural Refinements (DD-004, DD-006, DD-007)

- Context rail breakpoint: `xl:` → `lg:`
- Page padding: standardize
- Status dropdown: add `role="dialog"`

---

## Effort

| Block | Minutes |
|-------|---------|
| Health standardization | 5 |
| Badge components | 5 |
| Deduplication | 2 |
| Structural refinements | 8 |
| **Total** | **~20** |
