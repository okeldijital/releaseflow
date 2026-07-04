# RFDS-001 — Design Principles

**Status:** Active
**Version:** 1.0

---

## The 7 Principles

These are permanent. They may be amended, but they may not be removed without unanimous approval.

---

### 1. Operational Clarity

**Every screen communicates operational state before operational detail.**

The user knows what is happening before they know what details are happening.

```
✓  Health: Critical (clarity — conclusion first)
✗  15 of 7 readiness checks failed (detail — no conclusion)
```

---

### 2. Decisions Before Data

**The system interprets. Users decide.**

The interface summarises. It does not expose raw database values for the user to interpret.

```
✓  One release requires immediate attention. (interpretation)
✗  status=blocked, requirement[0].status=required, 1 of 7 readiness checks passed. (raw data)
```

---

### 3. Editorial Composition

**Pages are composed like professional editorial layouts.**

Hierarchy comes from:
- Typography
- Spacing
- Composition
- Alignment

Not from:
- Card backgrounds
- Heavy borders
- Decorative shadows
- Visual ornaments

A page should read like a New York Times feature. Not like a Bootstrap template.

---

### 4. Quiet Interfaces

**Silence is intentional.**

Whitespace communicates. Empty space has meaning. Decoration must justify itself.

If removing an element improves the interface, it should be removed. If keeping it has no explanation, it should not exist.

Every visual element must answer: "What is this doing here that nothing else does?"

---

### 5. Information Hierarchy

**Every element receives a defined priority.**

No two unrelated elements share equal visual weight. Hierarchy is explicit. It is not a result of layout — it is a requirement of layout.

See `RFDS-001-ATTENTION-MODEL.md` for the explicit priority budget.

---

### 6. Progressive Disclosure

**Only information required for the current decision is immediately visible.**

Everything else is progressively revealed — through interaction, expansion, or navigation.

| Level | Visibility |
|-------|-----------|
| Critical (immediate decision) | Always visible |
| Operational state | Visible without scrolling |
| Supporting evidence | Visible at the section level |
| History | Collapsed, expandable, or on demand |
| Reference data | Available through navigation |

---

### 7. Functional Beauty

**Beauty exists to improve comprehension. Never for ornament.**

Visual choices serve operational understanding. If a design decision is "nice" but does not improve comprehension, it is not permitted.

```
✓  Larger date = page identity (improves orientation)
✗  Larger date = "looks editorial" (subjective preference)
```

---

## How Principles Interact

These principles are not independent. They reinforce each other.

| Combination | Result |
|-------------|--------|
| Clarity + Hierarchy | The right thing is visible at the right time |
| Decisions + Functional Beauty | The system tells you what to do in a beautiful way |
| Editorial + Quiet | Professional appearance without visual noise |
| Progressive Disclosure + Hierarchy | Detail available without competing with the headline |
| Decisions + Data | Conclusions supported by evidence |

When two principles appear to conflict (e.g., "decisions before data" vs "evidence hierarchy"), the precedence is:

1. Clarity (the user knows what to do)
2. Decisions (the system has already done the work)
3. Editorial (the composition supports comprehension)
4. Silence (decoration is removed)
5. Hierarchy (priority is explicit)
6. Disclosure (detail is available when needed)
7. Beauty (it serves comprehension, not ornament)
