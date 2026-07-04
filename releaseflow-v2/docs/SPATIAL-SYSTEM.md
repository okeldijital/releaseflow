# Spatial System — ReleaseFlow

**Version:** 1.0
**Source:** PDS-13 8-point grid, extended with rules

---

## Spacing Scale

```
 4px  — Tight coupling (icon + text, badge padding)
 8px  — Related elements (card padding, button gap, list gap)
12px  — Card internal padding minimum
16px  — Card padding, stat cards, section padding
24px  — Section spacing, component separation
32px  — Major section gap, hero spacing
48px  — Large section gap, before/after hero
64px  — Page-level separation
96px  — Major editorial moments
```

---

## Page Structure

```
┌──────────────────────────────────────────────────┐
│  Topbar (64px height)                             │
├────────┬─────────────────────────────────────────┤
│        │  Page padding: 24px (px-6)              │
│        │                                          │
│ Sidebar│  Content max-width: 1024px              │
│ 240px  │  (max-w-4xl equivalent)                 │
│        │                                          │
│        │  Section gap: 32px between major        │
│        │  sections                                │
│        │                                          │
│        │  Card gap: 8px between cards            │
│        │  in a section                            │
│        │                                          │
│        │  List gap: 4px between rows             │
│        │                                          │
└────────┴──────────────────────────────────────────┘
```

---

## Section Spacing Rules

| Relationship | Gap | Rationale |
|-------------|-----|-----------|
| Hero → OperationalSummary | 24px | Tight coupling — both are identity |
| OperationalSummary → Tab bar | 32px | Transition to detail |
| Tab bar → Tab content | 0px | Tab bar and content are one unit |
| Section → Section within content | 32px | Clear separation of concerns |
| Card → Card within a section | 8px | Related, visually grouped |
| List item → List item | 4px | Dense, scannable |
| Activity item → Activity item | 8px | Chronological, related |
| Table row → Table row | 0px (border) | Continuous data |
| Footer → Last section | 48px | Signal end of page content |

---

## Card Internal Spacing

```
┌──────────────────────────────────┐
│  padding: 12px (minimum)          │
│                                    │
│  Title                             │
│  ↓ gap: 4px                       │
│  Subtitle / Metadata               │
│  ↓ gap: 8px                       │
│  Description / Detail              │
│  ↓ gap: 8px                       │
│  Actions (buttons)                 │
│                                    │
└──────────────────────────────────┘
```

Card padding never drops below 12px. Dense operational cards may use 12px. Editorial cards may use 16-20px.

---

## Table Rhythm

```
┌─────────────────────────────────────┐
│  Header row: padding 8px vertical   │
│  Data row: padding 12px vertical    │
│  Cell: padding 12px horizontal      │
│  Column gap: minimum 16px           │
└─────────────────────────────────────┘
```

Tables use consistent row heights. Health columns are narrow (84px). Text columns expand to fill. Owner columns are fixed (100px).

---

## Context Rail

```
Width: 320px (fixed)
Top offset: 64px (below topbar)
Internal padding: 16px horizontal, 24px vertical
Section gap: 24px between rail sections
```

---

## Responsive Adjustments

| Breakpoint | Page Padding | Max Width | Context Rail |
|-----------|-------------|-----------|-------------|
| <640px | 16px | 100% | Hidden |
| 640-1023px | 20px | 100% | Hidden |
| 1024-1279px | 24px | 1024px | Hidden |
| ≥1280px | 24px | 1024px | 320px, visible |

---

## Anti-Patterns

| Practice | Why |
|----------|-----|
| Arbitrary spacing values | Only the 9 defined values may be used |
| 8px card padding | Below minimum — use 12px |
| Cards separated by 24px | Too much separation — cards should feel grouped |
| Full-width content without max-width | Content beyond ~1024px becomes unreadable on wide screens |
| Center-aligned operational content | Left-align for scanning. Center only for identity/onboarding |
