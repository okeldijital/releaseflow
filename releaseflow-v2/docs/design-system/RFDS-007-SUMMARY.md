# RFDS-007 — Summary

**Status:** Active
**Version:** 1.0
**Date:** 2026-06-28

---

## Governance

Authority: **PDS → RFDS-001 → RFDS-002 → RFDS-003 → RFDS-004 → RFDS-005 → RFDS-006 → RFDS-007 → Feature Specification**

---

## The Seven Experience Patterns

| # | Pattern | Question | Pages |
|---|---------|----------|-------|
| A | Executive Briefing | What requires my attention? | Operations Center |
| B | Workspace | What should I do with this? | Release Workspace, Artist Workspace |
| C | Collection | Which entity needs attention? | Releases, Artists, Assets, Rights Holders |
| D | Detail | What do I need to know? | Settings, Organization, Reports |
| E | Creation | What do I need to provide? | New Release, New Artist, New Asset |
| F | Administration | How is this configured? | Org Settings, User Management |
| G | Review | Is this ready? | Distribution, Approval, Publishing |

---

## Page-to-Pattern Mapping

| Page | Pattern |
|------|---------|
| Operations Center | Executive Briefing |
| Releases | Collection |
| Release Workspace | Workspace |
| New Release | Creation |
| Artists | Collection |
| Artist Workspace | Workspace |
| New Artist | Creation |
| Assets | Collection |
| New Asset | Creation |
| Rights Holders | Collection |
| Settings | Detail |
| Organization | Detail |
| Administration | Administration |
| Distribution | Review |
| Approvals | Review |

---

## Pattern Composition

Every pattern is a composition of:

```
RFDS-003 (Information Architecture) → tier order
RFDS-002 (Spatial System) → zone assignment
RFDS-004 (Visual Hierarchy) → VH per section
RFDS-005 (Navigation) → navigation priority
RFDS-006 (Components) → permitted components
```

---

## Document Index

| Document | Pattern | Purpose |
|----------|---------|---------|
| [Experience Patterns](./RFDS-007-EXPERIENCE-PATTERNS.md) | All | Overview + pattern contract |
| [Executive Briefing](./RFDS-007-EXECUTIVE-BRIEFING.md) | A | Operations Center |
| [Workspace](./RFDS-007-WORKSPACE.md) | B | Release/Artist Workspace |
| [Collection](./RFDS-007-COLLECTION.md) | C | List/browse |
| [Detail](./RFDS-007-DETAIL.md) | D | Single object |
| [Creation](./RFDS-007-CREATION.md) | E | Guided creation |
| [Administration](./RFDS-007-ADMINISTRATION.md) | F | Configuration |
| [Review](./RFDS-007-REVIEW.md) | G | Decision-before-commit |
| [Responsive Behaviour](./RFDS-007-RESPONSIVE-BEHAVIOUR.md) | All | Per-pattern recomposition |

---

## What Comes Next

| Suffix | Purpose |
|--------|---------|
| RFDS-008 | Page Blueprints — instantiate patterns for every page |

RFDS-008 is straightforward because every blueprint simply instantiates one of these seven patterns with page-specific configuration.
