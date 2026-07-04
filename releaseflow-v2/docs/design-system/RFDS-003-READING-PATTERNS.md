# RFDS-003 — Reading Patterns

**Status:** Active
**Version:** 1.0

---

## Principle

Reading order is deterministic. Every user on every device reads the same narrative, in the same order. The order changes by *viewport*, not by *preference*.

---

## The Reading Order

```
Situation
    ↓
Assessment
    ↓
Decision
    ↓
Evidence
    ↓
Context
    ↓
History
```

This is the fixed order. The spatial arrangement changes per breakpoint, but the cognitive order does not.

---

## Reading Order Per Breakpoint

### Desktop (≥1024px)

The full narrative, laid out with Tier 1–4 in the main column, Tier 5 in a side rail, Tier 6 below the fold.

```
┌────────────────────────────────────────────────────────────┐
│ Nav Rail (left)                                             │
│ ┌────────────────────────────┬──────────────────────────┐  │
│ │ Q1 Situation (Tier 1)       │                          │  │
│ │ Hero briefing               │  Q5 Context (Tier 5)     │  │
│ │ ↓                           │  Context Rail            │  │
│ │ Q2 Assessment (Tier 2)      │  - Health                │  │
│ │ ↓                           │  - Readiness            │  │
│ │ Q3 Decision (Tier 3)        │  - Dependencies         │  │
│ │ ↓                           │                          │  │
│ │ Q4 Evidence (Tier 4)        │                          │  │
│ │ Tables, Metrics             │                          │  │
│ └────────────────────────────┴──────────────────────────┘  │
│ Q6 History (Tier 6) — Activity feed, bottom of page         │
└────────────────────────────────────────────────────────────┘
```

### Laptop (768–1023px)

Same order, but Tier 5 collapses below Tier 4 (no context rail on laptop by default).

```
┌────────────────────────────────────────────────┐
│ Nav Rail (collapsed)                            │
│ Q1 Situation                                     │
│ Q2 Assessment                                    │
│ Q3 Decision                                      │
│ Q4 Evidence (full width)                         │
│ Q5 Context (collapsed section or moved to tab)   │
│ Q6 History                                       │
└────────────────────────────────────────────────┘
```

### Tablet (640–767px)

Same order, single column, Tier 5 in a drawer.

```
┌──────────────────────────────────┐
│ Nav Rail (drawer, auto-close)    │
│ Q1 Situation                       │
│ Q2 Assessment                      │
│ Q3 Decision                        │
│ Q4 Evidence (table scroll)         │
│ Q5 Context (drawer)                │
│ Q6 History                         │
└──────────────────────────────────┘
```

### Mobile (<640px)

Same order, compressed. Tier 4 may become a card list. Tier 5 hides behind a tab.

```
┌──────────────────────┐
│ Nav Rail (drawer)    │
│ Q1 Situation           │
│ Q2 Assessment          │
│ Q3 Decision            │
│ Q4 Evidence (cards)    │
│ [Q5 Context tab]       │
│ Q6 History             │
└──────────────────────┘
```

---

## Reading Order Rules

### Rule 1: Tier order is fixed

The narrative order (Situation → Assessment → Decision → Evidence → Context → History) is invariant.

A page may not change the order. It may compress the order (e.g., Tier 1 and Tier 2 in the same line) but never reverse it.

### Rule 2: Tier 1 is always first

Every page must begin with Tier 1 (Situation). The user must know what is happening before anything else.

### Rule 3: Tier 3 is the focal point

After Tier 1 and Tier 2, the user must see Tier 3 (Decision) without scrolling. The highest-value action is always visible.

### Rule 4: Tier 4 supports Tier 3

Evidence appears after the decision. It confirms what the user just decided. It does not precede the decision.

### Rule 5: Tier 5 is peripheral

Context never blocks the main flow. It is in a rail, a drawer, or behind a tab.

### Rule 6: Tier 6 is at the bottom

History is the least important. It is at the bottom. It is quieter than any other content.

---

## Reading Order Per Page Type

### Operations Center (Briefing-First)

```
1. Hero (Q1: Tier 1)
2. Assessment (Q2: Tier 2)
3. Actions (Q3: Tier 3)
4. Metrics (Q4: Tier 4, inline)
5. Active Releases (Q4: Tier 4, table)
6. Attention (Q5/Q2: conditional, Tier 4)
7. Activity (Q6: Tier 6, bottom)
```

### Release Workspace (Detail-First)

```
1. Hero (Q1: Tier 1)
2. Context Rail (Q5/Q2: Tier 5, right rail)
3. Tabs (Q3, Q4, Q6: by tab)
4. Active Tab Content
5. Activity (Q6: within Activity tab)
```

### Artist Workspace (Profile-First)

```
1. Hero (Q1: Tier 1)
2. Context Rail (Q5/Q2: Tier 5, right rail)
3. Tabs (Q3, Q4, Q6: by tab)
4. Active Tab Content
```

### Work Page (Task-First)

```
1. Greeting (Q1: Tier 1)
2. Tasks (Q3: Tier 3)
3. Reviews (Q3: Tier 3)
4. Workload (Q2: Tier 2, summary)
5. Activity (Q6: Tier 6)
```

---

## Reading Pattern Anti-Patterns

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| Evidence before Decision | The user sees numbers before knowing what to do |
| History before Decision | Yesterday's events distract from today's action |
| Tier 1 in the middle of the page | The user has no anchor |
| Two competing focal points | The eye cannot decide where to start |
| Tier 5 before Tier 3 | Context is peripheral, not the answer |
| Tier 7 in primary content | Metadata is not for the user |
| Same tier in two competing zones | The eye doesn't know which wins |
