# RFDS-006 — Summary

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Governance

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → RFDS-004 → RFDS-005 → RFDS-006 → Feature Specification**

---

## The Architecture Mirror

```
PRESENTATION              BACKEND
───────────               ───────
Blueprint                 Page
Layout Pattern            Hook
Component                 Service
Token                     Repository
Primitive                 Firestore
```

---

## Seven Component Categories

| # | Category | Components |
|---|----------|-----------|
| 1 | Structural | Page, Section, Container, Grid, Stack, Divider |
| 2 | Informational | Hero, OperationalSummary, HealthRing, Badge, StatusBadge, etc. |
| 3 | Operational | Button, Input, Table, WorkflowBoard, Tabs, etc. |
| 4 | Navigational | Sidebar, Topbar, Breadcrumbs, CommandPalette |
| 5 | Contextual | ContextRail, Tooltip, Avatar, Tag |
| 6 | Feedback | EmptyState, LoadingState, Skeleton, Toast, Alert |
| 7 | Overlay | Modal, Drawer, Dropdown, Dialog |

**44 components** total. One category per component.

---

## Component Contract (Every Component Must Declare)

- Category, Purpose, VH, Information Tier, Zone
- All 10 states (Idle → Empty)
- Accessibility requirements
- Responsive behaviour
- Inputs and outputs
- Token references

---

## Lifecycle

```
Created → Loading → Ready → Updating → Empty → Error → Destroyed
```

---

## Ten Standard States

Idle · Hover · Focus · Active · Loading · Success · Warning · Error · Disabled · Empty

---

## Forbidden Patterns

- Multiple responsibilities per component
- Duplicated business logic
- Token overrides or hard-coded values
- Direct Firestore access outside repositories

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Component Architecture](./RFDS-006-COMPONENT-ARCHITECTURE.md) | Overview + architecture mirror |
| [Component Taxonomy](./RFDS-006-COMPONENT-TAXONOMY.md) | Seven categories |
| [Component Contracts](./RFDS-006-COMPONENT-CONTRACTS.md) | Contract template + examples |
| [Component Lifecycle](./RFDS-006-COMPONENT-LIFECYCLE.md) | Created → Destroyed |
| [Component Behaviour](./RFDS-006-COMPONENT-BEHAVIOUR.md) | State transitions + timing |
| [Component Composition](./RFDS-006-COMPONENT-COMPOSITION.md) | Legal parent-child rules |
| [State Model](./RFDS-006-STATE-MODEL.md) | 10 standard states |
| [Design Token Usage](./RFDS-006-DESIGN-TOKENS-USAGE.md) | Token mapping |
| [Component Inventory](./RFDS-006-COMPONENT-INVENTORY.md) | 44 components catalogued |

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-007 | Layout Patterns |
| RFDS-008 | Page Blueprints |
