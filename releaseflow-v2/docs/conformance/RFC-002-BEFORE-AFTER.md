# RFC-002 — Before/After

**Date:** 2026-06-29

---

## Before (Current State — Gold)

```
◀ Back to releases

┌────┐ Lua · The Fading Light        Advance Stage
│ 🎵 │ EP · Afro Tech · Nov 15      Edit  Delete
└────┘ Healthy · 68% · Mastering
        Rights Incomplete · 1 blocker

ReleaseJourney: Plan ✓ → Prod ✓ → Mix ✓ → Master ◉ → Art ○

OperationalSummary
[Health + narrative + metrics]

Tabs: Overview | Workflow | Assets | Distribution | Rights | Activity | ...

[Tab content]

Context Rail (right)
├── HealthRing
├── ReadinessStack
└── ContextRail (dependencies, attention)
```

> **Issue**: Health shows "Healthy · 68%" using a 3-level system. The PDS requires 5 levels (68% should be "Attention").

> **Issue**: "EP" and "Afro Tech" displayed as raw text spans, not Badge components.

> **Issue**: Health pill lacks a dot indicator and background pill treatment.

---

## After (Platinum Target)

```
◀ Back to releases

┌────┐ Lua · The Fading Light        Advance Stage
│ 🎵 │ [EP] [Afro Tech] · Nov 15    Edit  Delete
└────┘ 🟡 Attention 68% · Mastering
        [Rights Incomplete] · 🔴 1 blocker

ReleaseJourney: Plan ✓ → Prod ✓ → Mix ✓ → Master ◉ → Art ○

OperationalSummary
[Health + narrative + metrics]

Tabs: Overview | Workflow | Assets | Distribution | Rights | Activity | ...

[Tab content]

Context Rail (right — now visible at ≥1024px)
├── HealthRing
├── ReadinessStack
└── ContextRail (dependencies, attention)
```

**Changes for Platinum**:
1. Health: 5-level `computeHealth(readiness.percentage)` → shows "Attention" at 68% (DD-001)
2. Type/genre: Badge components from RFDS-006 (DD-002, DD-003)
3. Health pill visual: dot + background pill + label (DD-005)
4. Page padding standardized (DD-006)
5. Context rail visible at lg: breakpoint (DD-007)
6. Duplicate daysUntil removed (DD-008)
7. Status dropdown accessible (DD-004)
