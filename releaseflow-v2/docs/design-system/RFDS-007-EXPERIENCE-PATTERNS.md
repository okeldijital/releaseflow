# RFDS-007 — Experience Patterns

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Governance

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → RFDS-004 → RFDS-005 → RFDS-006 → RFDS-007 → Feature Specification**

---

## Mission

RFDS-007 defines the canonical user experiences that exist within ReleaseFlow.

It answers: *What type of experience is the user currently having?*

A layout is geometry. An experience is the combination of information architecture, spatial system, visual hierarchy, navigation, and components into a reusable operational flow.

---

## The Seven Experience Patterns

| Pattern | Purpose | Used By |
|---------|---------|---------|
| **Executive Briefing** | Answer operational state in <3 seconds | Operations Center |
| **Workspace** | Complete operational work on an entity | Release Workspace, Artist Workspace |
| **Collection** | Find and manage operational records | Releases, Artists, Assets, Rights Holders |
| **Detail** | Understand one object in depth | Settings, Organization, Reports |
| **Creation** | Guide users through successful creation | New Release, New Artist, New Asset |
| **Administration** | Configure the platform safely | Organization Settings, User Management |
| **Review** | Make informed decisions before committing | Distribution, Approval, Publishing |

Each page must implement exactly one primary experience pattern. Secondary patterns are permitted only in embedded modules.

---

## Pattern Contract

Every experience pattern MUST declare:

| Field | Required | Description |
|-------|----------|-------------|
| Purpose | Yes | Why this pattern exists |
| Operational Question | Yes | The single question the pattern answers |
| Reading Order | Yes | Sequence of information tiers |
| Information Tiers | Yes | Tiers 1–7 mapping |
| Spatial Zones | Yes | Zones from RFDS-002 |
| Visual Hierarchy | Yes | VH values per section |
| Navigation Model | Yes | Mechanisms from RFDS-005 |
| Component Inventory | Yes | Components from RFDS-006 inventory |
| Responsive Adaptations | Yes | How the experience recomposes per breakpoint |
| Accessibility | Yes | ARIA, keyboard, focus requirements |

---

## Pattern Composition

An experience pattern is NOT a component. It is a composition rule that governs how components, tiers, zones, and navigation combine.

```
EXPERIENCE PATTERN
    ├── Information Architecture (RFDS-003) → tier order
    ├── Spatial System (RFDS-002) → zone assignment
    ├── Visual Hierarchy (RFDS-004) → visual weight per zone
    ├── Navigation (RFDS-005) → navigation priority per zone
    └── Components (RFDS-006) → which components are permitted
```

---

## Pattern Selection Rules

1. Every page must implement exactly one primary experience pattern
2. A page may embed a secondary pattern inside a tab or panel
3. Mixing two primary patterns on one page is forbidden
4. New patterns require an RFDS amendment

---

## Document Index

| Document | Purpose |
|----------|---------|
| [Experience Patterns](./RFDS-007-EXPERIENCE-PATTERNS.md) | This overview |
| [Executive Briefing](./RFDS-007-EXECUTIVE-BRIEFING.md) | Operations Center pattern |
| [Workspace](./RFDS-007-WORKSPACE.md) | Release/Artist Workspace pattern |
| [Collection](./RFDS-007-COLLECTION.md) | List/browse pattern |
| [Detail](./RFDS-007-DETAIL.md) | Deep-dive single object pattern |
| [Creation](./RFDS-007-CREATION.md) | Guided creation flow |
| [Administration](./RFDS-007-ADMINISTRATION.md) | Configuration pattern |
| [Review](./RFDS-007-REVIEW.md) | Decision-before-commit pattern |
| [Responsive Behaviour](./RFDS-007-RESPONSIVE-BEHAVIOUR.md) | Per-pattern responsive adaptations |
| [Summary](./RFDS-007-SUMMARY.md) | Quick reference + page mapping |

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-008 | Page Blueprints — instantiate patterns for every page |

RFDS-008 becomes straightforward because every blueprint simply instantiates an experience pattern with page-specific configuration.
