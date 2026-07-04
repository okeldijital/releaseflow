# RFDS-004 — Colour Responsibility

**Status:** Active
**Version:** 1.0

---

## Principle

Every colour must communicate exactly one thing. A colour must never represent two different concepts. When a user sees green, they must know it means one thing, every time.

---

## Colour Assignments

| Colour | Responsibility | Examples | Must NOT Mean |
|--------|---------------|----------|---------------|
| **Primary (Burnt Orange)** | Primary action and current stage | Button CTA, current workflow stage, active tab | Warning, danger, decoration |
| **Success (Green)** | Healthy, approved, complete | Health state = Excellent/Healthy, requirement approved, stage complete | "On budget," "active," decoration |
| **Warning (Amber)** | Attention, needs review | Health state = Attention, deadline approaching, review pending | "In progress" |
| **Danger (Red)** | Critical, blocked, overdue | Health state = Critical, blocked dependency, overdue deadline | "Important section," decoration |
| **Info (Blue)** | Informational, neutral state | In-progress status, draft status, information alerts | "Click here" |
| **Neutral (Grey/Brown)** | Structure, navigation, metadata | Cards, dividers, sidebar, metadata | Operational state |

---

## Colour Conflict Matrix

| If | And | Conflict |
|----|-----|----------|
| Green = healthy | Green also = "on budget" | User sees green, doesn't know if healthy or budget |
| Red = critical | Red also = "important heading" | Red loses its urgency signal |
| Orange = primary action | Orange also = "new feature" | Primary action is diluted |
| Amber = attention | Amber also = "in progress" | State is ambiguous |

---

## Colour in Context

### Status Badges

| Status | Colour |
|--------|--------|
| active | Green (success-50/600) |
| approved | Green |
| completed | Green |
| released | Green |
| in_progress | Blue (info-50/600) |
| draft | Neutral (surface-100/500) |
| on_hold | Amber (warning-50/700) |
| blocked | Red (danger-50/600) |
| rejected | Red |
| cancelled | Red |

### Health States

| Health | Colour |
|--------|--------|
| Excellent | Green (success) |
| Healthy | Green (success) |
| Attention | Amber (warning) |
| Blocked | Red (danger) |
| Critical | Red (danger) |

### Deadlines

| Deadline | Colour |
|----------|--------|
| Overdue (>0 days past) | Red (danger) |
| Today | Amber (warning) |
| This week | Amber (warning) |
| Future | Neutral (text-400) |

---

## Accent Budget

Every page must respect the accent budget:

| Metric | Limit |
|--------|------:|
| Accent surface area | ≤5% of page |
| Unique accent colours in use | ≤2 at a time |
| Accent elements on screen | ≤3 visible at a time |

The accent budget prevents colour fatigue. When everything is coloured, nothing is important.

---

## Validation

- [ ] Every colour assignment is unique (one colour, one meaning)
- [ ] No colour used for two different states
- [ ] Status badges use the correct semantic colour
- [ ] Health states map to the correct colour
- [ ] ≤2 unique accent colours visible at a time
- [ ] ≤3 accent elements visible at a time
