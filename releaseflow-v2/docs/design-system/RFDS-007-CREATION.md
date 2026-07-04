# RFDS-007 — Creation

**Status:** Active
**Version:** 1.0

---

## Pattern E — Creation

**Purpose**: Guide users through successful creation.

**Operational Question**: *What do I need to provide to create this?*

**Used By**: New Release, New Artist, New Asset

---

## Reading Order

```
Context (Tier 5) — What is being created, why
    ↓
Input (Tier 4) — Form fields, required/optional
    ↓
Validation (Tier 2) — Errors, warnings
    ↓
Confirmation (Tier 3) — Create button, summary
```

No unnecessary navigation. The user should not leave this page until creation succeeds.

---

## Zone Assignment

| Section | Zone | VH | Width |
|---------|------|-----|-------|
| Context (title, guidance) | Situation | 100 | 640px |
| Input form | Decision | 70 | 720px |
| Validation messages | Decision | 80 | Inline with form |
| Action (Create button) | Decision | 90 | Below form |

---

## Components Permitted

| Component | Section | Category |
|-----------|---------|----------|
| Page header (title + description) | Context | Informational |
| Input | Form | Operational |
| Select | Form | Operational |
| TextArea | Form | Operational |
| Button (primary: Create) | Action | Operational |
| Button (secondary: Cancel) | Action | Operational |
| Alert (validation error) | Validation | Feedback |
| InlineMessage (field error) | Validation | Feedback |

---

## Navigation

| Mechanism | VH | Location |
|-----------|-----|----------|
| Primary Action (Create) | 90 | Below form |
| Secondary Action (Cancel) | 50 | Below form, adjacent |
| Breadcrumbs | 30 | Topbar |
| Navigation Rail | 40 | Left |

---

## Responsive

- Form: 720px max on desktop, full width on mobile
- Fields: stacked on mobile
- Create button: full-width on mobile

---

## Accessibility

- Form labels required on every field
- Error messages associated with fields via `aria-describedby`
- Focus moves to first error on validation failure
- Keyboard: Tab through fields, Enter to submit
