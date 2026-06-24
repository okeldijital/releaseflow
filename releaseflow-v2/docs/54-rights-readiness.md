# TASK-2603 — Rights Readiness

## Concept

Answers one question: *"Can ownership be legally verified?"*

Before a release can be distributed, the rights must be clear. If the
label doesn't legally own the master, or a sample hasn't been cleared,
or publishing splits are incomplete, the release is at legal risk.

Rights Readiness is a binary assessment: **Cleared** or **Not Cleared**.
It's not a gradual health metric — it's a legal gate. Either the rights
are verifiable or they are not.

---

## Visual

### Release Header

```
┌──────────────────────────────────────────────────────┐
│  Lua · Kinn Timo                                     │
│                                                       │
│  ┌────────────┐  ┌───────────────┐                    │
│  │ PRODUCTION  │  │ ⚖ Rights Clear│                    │
│  └────────────┘  └───────────────┘                    │
└──────────────────────────────────────────────────────┘
```

### Readiness Panel

```
┌──────────────────────────────────────────────────────────────────┐
│  Rights Readiness                                                 │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │    Result: ⚖ RIGHTS NOT CLEARED                             │  │
│  │                                                             │  │
│  │    3 of 4 rights categories verified. 1 unresolved.         │  │
│  │                                                             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ─── Master Rights ─────────────────────────── ✓ CLEARED ───────  │
│                                                                   │
│  ✓ Owner confirmed: Acme Records (100%)                           │
│  ✓ Copyright ℗ registered                                         │
│  ✓ No territorial conflicts                                       │
│  ✓ No shared-ownership disputes                                   │
│                                                                   │
│  ─── Publishing Rights ───────────────────── ⚠ NOT CLEARED ─────  │
│                                                                   │
│  ✓ Track 1: 100% split, 3 of 3 PRO registered                     │
│  ✓ Track 2: 100% split, 2 of 2 PRO registered                     │
│  ✕ Track 3: PRO registration missing for Artist Y (ASCAP)         │
│     ⚠ Track 4: IPI missing for Kinn Timo (SAMRO)                 │
│                                                                   │
│  Impact: Without PRO registration, publishing royalties cannot    │
│  be collected for these tracks. DSPs do not reject for this,      │
│  but revenue will go unmatched.                                    │
│                                                                   │
│  ─── Mechanical Rights ────────────────────── ✓ CLEARED ─────────  │
│                                                                   │
│  ✓ Tracks 1-2: Original works — no license required              │
│  ✓ Track 3: Sample license secured (Melt 2000 / Melodic Pub)    │
│  ✓ Track 4: Remix license secured (Melt 2000 / Melodic Pub)     │
│                                                                   │
│  ─── Neighbouring Rights ─────────────── ⚠ NOT CLEARED ─────────  │
│                                                                   │
│  ✓ Performers identified: 4 contributors                         │
│  ✓ Shares allocated: 100%                                         │
│  ✕ CMO registrations: 0 of 4 submitted                           │
│     SAMPRA (South Africa), PPL (UK), SoundExchange (USA),        │
│     GVL (Germany) — all pending.                                   │
│                                                                   │
│  Impact: Neighbouring rights revenue will go unmatched until      │
│  CMOs are registered. Not a DSP blocker, but revenue loss risk.   │
│                                                                   │
│  ─── Summary ───────────────────────────────────────────────────  │
│                                                                   │
│  2 cleared · 2 not cleared                                        │
│  Blockers: PRO registration, CMO registration                     │
│  Estimated resolution: Sep 15 (if PRO filings submitted today)   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Verification Rules

### Master Rights — Verified When:

| Rule | Critical |
|------|----------|
| At least one owner with 100% share (or multiple summing to 100%) | Yes |
| Copyright ℗ field is set | Yes |
| No territorial conflicts (same territory, multiple owners ≠ 100%) | Yes |
| License period is active (not expired) | Yes |

### Publishing Rights — Verified When:

| Rule | Critical |
|------|----------|
| Every track has shares summing to 100% | Yes |
| All parties have a PRO assigned | Yes |
| All writers have an IPI number | No (warning) |
| All publishers have an IPI number | No (warning) |

### Mechanical Rights — Verified When:

| Rule | Critical |
|------|----------|
| All tracks classified (Original / Sample / Cover / Remix) | Yes |
| All non-original tracks have a license status of "Secured" | Yes |
| All license territories cover the intended release territories | No (warning) |

### Neighbouring Rights — Verified When:

| Rule | Critical |
|------|----------|
| Performer shares sum to 100% | Yes |
| At least one CMO registration in progress per territory | No (warning) |
| All performers have a claim status of "Claimed" | No (warning) |

---

## Cleared vs Not Cleared

| Result | Condition |
|--------|-----------|
| ⚖ Rights Cleared | All critical rules pass for all four categories |
| ⚖ Rights Not Cleared | Any critical rule fails |

There is no "At Risk" middle state for Rights Readiness. This is a
legal binary — the rights are either verifiable or they are not. Warnings
(IPI missing, CMO pending) do not block clearance but are shown.

---

## Action from Readiness

Each failed check has a "Fix" action that links to the relevant tab in
the Ownership Workspace (TASK-2601):

```
✕ Track 3: PRO registration missing for Artist Y (ASCAP)
   ┌──────────────────────────────────────────────┐
   │  Register with ASCAP                         │
   └──────────────────────────────────────────────┘
   → Opens Publishing Rights tab, Track 3 row

✕ CMO registrations: 0 of 4 submitted
   ┌──────────────────────────────────────────────┐
   │  Register with SAMPRA                        │
   └──────────────────────────────────────────────┘
   → Opens Neighbouring Rights tab
```

---

## Data Model

```typescript
interface RightsReadiness {
  releaseId: string;
  cleared: boolean;              // true if all critical rules pass
  categories: {
    master: RightsCategoryResult;
    publishing: RightsCategoryResult;
    mechanical: RightsCategoryResult;
    neighbouring: RightsCategoryResult;
  };
  failedRules: RightsRuleFailure[];
  computedAt: Timestamp;
}

interface RightsCategoryResult {
  cleared: boolean;
  rulesChecked: number;
  rulesPassed: number;
  rulesFailed: RightsRuleFailure[];
}

interface RightsRuleFailure {
  rule: string;                  // "Every track has shares summing to 100%"
  critical: boolean;
  detail: string;                // "Track 3: total is 75% (25% unallocated)"
  entityId?: string;             // Track ID, party ID, etc.
  fixAction: string;             // "Register with ASCAP"
  fixUrl: string;                // Deep link to the Ownership Workspace tab
}
```
