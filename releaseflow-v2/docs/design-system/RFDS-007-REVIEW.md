# RFDS-007 — Review

**Status:** Active
**Version:** 1.0

---

## Pattern G — Review

**Purpose**: Help users make informed decisions before committing.

**Operational Question**: *Is this ready to proceed?*

**Used By**: Distribution, Approval, Publishing

---

## Reading Order

```
Summary (Tier 1) — What is being reviewed
    ↓
Evidence (Tier 4) — Readiness, completeness, blockers
    ↓
Risk (Tier 2) — What could go wrong
    ↓
Decision (Tier 3) — Approve, reject, or defer
    ↓
Confirmation (Tier 3) — Confirm irreversible action
```

---

## Zone Assignment

| Section | Zone | VH | Width |
|---------|------|-----|-------|
| Summary (entity name, type, status) | Situation | 100 | 640px |
| Evidence (readiness checklist, package details) | Evidence | 70 | 720px |
| Risk indicators (blockers, warnings) | Decision | 80 | 640px |
| Decision buttons (Approve, Reject, Defer) | Decision | 90 | Below risk |
| Confirmation modal | Overlay | 90 | Centered |

---

## Components Permitted

| Component | Section | Category |
|-----------|---------|----------|
| Hero (entity summary) | Summary | Informational |
| ReadinessStack | Evidence | Informational |
| DistributionBoard | Evidence | Informational |
| HealthRing | Evidence | Informational |
| Alert (blocker warning) | Risk | Feedback |
| Button (Approve — primary) | Decision | Operational |
| Button (Reject — danger) | Decision | Operational |
| Button (Defer — secondary) | Decision | Operational |
| ConfirmationDialog | Confirmation | Feedback |

---

## Navigation

| Mechanism | VH | Location |
|-----------|-----|----------|
| Primary Action (Approve) | 90 | Below review content |
| Secondary Actions | 60 | Adjacent |
| Breadcrumbs | 30 | Topbar |

---

## Responsive

- Decision buttons stack on mobile
- Confirmation modal: full-screen on mobile, centered dialog on desktop

---

## Accessibility

- Risk indicators: use both colour and text
- Destructive action: requires confirmation dialog
- Focus returns to decision area after modal close
