# RFDS-007 — Administration

**Status:** Active
**Version:** 1.0

---

## Pattern F — Administration

**Purpose**: Configure the platform safely.

**Operational Question**: *How is this system configured?*

**Used By**: Organization Settings, User Management, Administration pages

---

## Reading Order

```
Context (Tier 5) — What is being configured
    ↓
Configuration (Tier 4) — Settings, controls
    ↓
Validation (Tier 2) — Errors, confirmations
    ↓
Audit (Tier 6) — Who changed what, when
```

---

## Zone Assignment

| Section | Zone | VH | Width |
|---------|------|-----|-------|
| Context (title, description) | Situation | 100 | 640px |
| Settings (tiles, sections) | Evidence | 70 | 720px |
| Save/Cancel actions | Decision | 70 | Below settings |
| Audit log | History | 40 | Bottom |

---

## Components Permitted

| Component | Section | Category |
|-----------|---------|----------|
| Page header | Context | Informational |
| Card (settings sections) | Configuration | Structural |
| Input / Select / Toggle | Configuration | Operational |
| Button (Save, Cancel) | Actions | Operational |
| ConfirmationDialog | Actions | Feedback |
| ActivityFeed | Audit | Informational |

---

## Responsive

- Settings cards: 2-col grid on desktop, 1-col on tablet, stacked on mobile

---

## Accessibility

- Single H1
- Each setting: labelled, keyboard accessible
- Destructive actions: confirmed via ConfirmationDialog
- Audit log: chronologically ordered
