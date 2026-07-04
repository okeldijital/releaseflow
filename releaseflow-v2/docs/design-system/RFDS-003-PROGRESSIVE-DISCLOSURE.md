# RFDS-003 — Progressive Disclosure

**Status:** Active
**Version:** 1.0

---

## Purpose

The default state of every page must show only what is required for the current decision. Everything else is hidden until the user requests it.

This prevents cognitive overload and keeps the page focused.

---

## The Three Layers

| Layer | Visibility | Trigger | Examples |
|-------|-----------|---------|----------|
| **Immediate** | Always visible | Default state | Hero, briefing, assessment, actions |
| **Expanded** | Visible after user intent | Click, hover, scroll | Tabs, expandable sections, accordions |
| **Detailed** | Visible only when requested | Explicit click, navigation | Tables, history, technical values |

---

## Layer Application Per Tier

| Tier | Default Layer | Disclosure |
|------|---------------|------------|
| Tier 1 Situation | Immediate | Always visible |
| Tier 2 Assessment | Immediate | Always visible |
| Tier 3 Decision | Immediate | Always visible (max 3 actions) |
| Tier 4 Evidence | Expanded | Table on demand or scroll |
| Tier 5 Context | Expanded | Rail on desktop, drawer on mobile |
| Tier 6 History | Detailed | Collapsed by default, expandable |
| Tier 7 Metadata | Detailed | Hover or details panel only |

---

## Disclosure Patterns

### Pattern 1: Always Visible (Tier 1–3)

The Situation, Assessment, and Decision tiers are always visible. They answer the three immediate questions.

```
✓  Hero briefing
✓  Assessment grid
✓  Action list (max 3)
```

### Pattern 2: On Scroll or Click (Tier 4)

Evidence is always present but may be below the fold. The user scrolls to see it, or clicks a "Show more" button.

```
Hero
Assessment
Actions
[Show evidence] ← click to expand
```

### Pattern 3: In Context Rail (Tier 5)

Context lives in a side rail on desktop. On tablet, it becomes a drawer. On mobile, it becomes a tab.

```
Content Area          |  Context Rail
Hero                  |  Health Ring
Assessment            |  Readiness
Actions               |  Dependencies
Evidence              |  Attention
```

### Pattern 4: Collapsed History (Tier 6)

History is collapsed by default. The user expands it to see what happened.

```
▼ Recent Activity

[expanded on click]
```

### Pattern 5: Detail Panel on Demand (Tier 7)

Metadata never appears in primary content. It is always behind a detail interaction.

- Hover for tooltip
- Click for details modal
- Navigate to dedicated page

---

## Anti-Patterns

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| Showing everything by default | Cognitive overload |
| Hiding Tier 1–3 (Situation, Assessment, Decision) | The user has no orientation |
| Tier 4 in primary content with no Tier 3 | Data without recommendation is decoration |
| Hiding critical items behind clicks | Safety-critical info must be visible |
| Showing Tier 7 (metadata) as primary | Metadata is not for the current decision |
| Two layers competing for the same attention | Layer 1 should win, always |
