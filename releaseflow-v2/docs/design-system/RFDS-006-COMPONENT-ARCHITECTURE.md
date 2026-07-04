# RFDS-006 — Component Architecture

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Governance

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → RFDS-004 → RFDS-005 → RFDS-006 → Feature Specification**

---

## Mission

RFDS-006 defines the architecture of every reusable UI component.

It answers: *What is a component responsible for, and how is it allowed to behave?*

Not appearance. Not spacing. Not typography. Those are already defined. RFDS-006 defines **contracts**.

---

## The Architecture Mirror

```
PRESENTATION LAYER              BACKEND LAYER
─────────────────               ──────────────
Blueprint                       Page
    ↓                               ↓
Layout Pattern                  Hook
    ↓                               ↓
Component                       Service
    ↓                               ↓
Token                           Repository
    ↓                               ↓
Primitive                       Firestore
```

Every layer of the application is governed by explicit contracts, not convention.

---

## The Seven Categories

Every component belongs to exactly one category.

| Category | Purpose | Examples | VH Range |
|----------|---------|----------|----------|
| **Structural** | Layout only — no business logic | Page, Section, Container, Grid, Stack | 10–40 |
| **Informational** | Display information | Badge, StatusBadge, MetricCard, HealthRing | 40–80 |
| **Operational** | Enable work | Table, Button, Input, ProgressBar, WorkflowBoard | 60–90 |
| **Navigational** | Move through product | Sidebar, Tabs, Breadcrumbs, CommandPalette | 30–60 |
| **Contextual** | Supporting information | ContextRail, ReadinessStack, Tooltip | 50–60 |
| **Feedback** | Inform user of state change | EmptyState, LoadingState, Toast, Alert | 50–70 |
| **Overlay** | Temporary interaction | Modal, Drawer, Dropdown, Dialog | 50–90 |

No component may belong to multiple categories.

---

## Component Contract Template

Every component MUST declare:

```yaml
Component:
  Name: OperationalSummary
  Category: Informational
  Purpose: Summarise operational state at a glance
  VH: 80
  Information Tier: Assessment (RFDS-003)
  Zone: Decision (RFDS-002)
  Navigation Priority: Not applicable (RFDS-005)
  States: [Loading, Ready, Warning, Critical, Empty, Error]
  Accessibility: Required — role="region", aria-label
  Responsive: Required — 640px reading width, stacks on mobile
  Inputs: healthScore, currentStage, completedStages, totalStages, readyItems, totalItems, pendingApprovals, blockers, daysUntilRelease
  Outputs: Rendered operational summary card
  References: RFDS-002 (alignment), RFDS-004 (typography, colour)
```

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Component Architecture](./RFDS-006-COMPONENT-ARCHITECTURE.md) | This overview |
| [Component Taxonomy](./RFDS-006-COMPONENT-TAXONOMY.md) | Seven categories and their rules |
| [Component Contracts](./RFDS-006-COMPONENT-CONTRACTS.md) | Contract template and examples |
| [Component Lifecycle](./RFDS-006-COMPONENT-LIFECYCLE.md) | Created → Ready → Destroyed |
| [Component Behaviour](./RFDS-006-COMPONENT-BEHAVIOUR.md) | Interactive state transitions |
| [Component Composition](./RFDS-006-COMPONENT-COMPOSITION.md) | Legal parent-child relationships |
| [State Model](./RFDS-006-STATE-MODEL.md) | Ten standard states |
| [Design Token Usage](./RFDS-006-DESIGN-TOKENS-USAGE.md) | Token mapping per component |
| [Component Inventory](./RFDS-006-COMPONENT-INVENTORY.md) | Every reusable component catalogued |
| [Summary](./RFDS-006-SUMMARY.md) | Quick reference |

---

## Forbidden Patterns

| Pattern | Why Banned |
|---------|------------|
| Component with multiple responsibilities | One component, one purpose |
| Duplicated business logic across components | Logic lives in hooks/services, not components |
| Component that owns both layout AND data | Layout components don't fetch data |
| Visual variant without semantic meaning | A "blue button" is not a variant — "primary" is |
| Token override (`!important`, arbitrary values) | All values must come from PDS |
| Hard-coded spacing or colour | Use token references only |
| Direct repository call from a component | Components call hooks; hooks call services |
| Firestore usage outside approved layers | Only repositories access Firestore |

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-007 | Layout Patterns |
| RFDS-008 | Page Blueprints |
