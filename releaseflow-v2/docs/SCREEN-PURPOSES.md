# Screen Purposes — ReleaseFlow

**Version:** 1.0
**Date:** 2026-06-28

---

## Operations Center

**Purpose**: Answer "what requires attention?" within five seconds.

**Content model**:
1. Identity: Operations Center + current organization + today's date
2. Situation: Operational Summary — aggregate health, active releases, blocked work
3. Decision: + Create Release primary CTA
4. Work: Active Releases table — every release with health, stage, deadline, owner
5. History: Recent activity feed + Org Pulse

**Anti-patterns**: Per-release task management. Editing forms. KPI dashboards.

---

## Release Workspace

**Purpose**: Answer four questions immediately:
1. Is this release healthy?
2. What blocks shipping?
3. What changed?
4. What happens next?

**Content model**:
1. Identity: Release title, type, date, artwork — who and what this release is
2. Situation: Operational Summary — health %, readiness, blockers, confidence
3. Decision: Primary action — Advance Stage
4. Work: Release Journey → Tabs (Overview, Workflow, Assets, etc.) → Active tab content
5. Context: Context Rail — Health Ring, Readiness Stack, Dependencies, Attention items

**Anti-patterns**: Organization-level concerns. Other releases' data. Administrative settings in the main workspace.

---

## Artist Workspace

**Purpose**: Manage an artist's creative identity and catalog.

**Content model**:
1. Identity: Artist name, avatar, type, genres, status
2. Situation: Profile completeness %, active releases count
3. Decision: + Add Release primary CTA
4. Work: Active Releases → Completed Releases → Profile → Credits → Assets → Press Kit
5. Context: Context Rail with artist-specific readiness

**Anti-patterns**: CRM-style contact management. Unrelated release data.

---

## Release List

**Purpose**: Navigate to a specific release quickly.

**Content model**:
1. Identity: "Releases" + count
2. Work: Release list — title, type, status, date
3. Decision: New Release CTA + click release → workspace

**Anti-patterns**: Health details per release. Stage breakdowns.

---

## Artist List

**Purpose**: Navigate to a specific artist quickly.

**Content model**: Same as Release List — navigation-focused.

---

## Work

**Purpose**: Show assigned work for the current user.

**Content model**:
1. Identity: "Work" + "Your personal workspace"
2. Work: Tasks sorted by priority + due date
3. Decision: Click task → release workspace

**Anti-patterns**: Org-level metrics. Task CRUD forms.

---

## Assets

**Purpose**: Global media library across releases.

**Content model**:
1. Identity: "Assets" + description
2. Work: Asset list/grid with type, size, status
3. Decision: Upload CTA

---

## Rights Holders

**Purpose**: Manage ownership entities.

**Content model**:
1. Identity: "Rights Holders" + description
2. Work: Holder list — name, type, territory, contact
3. Decision: Add Holder CTA

---

## People

**Purpose**: Team roster.

**Content model**:
1. Identity: "People" + description
2. Work: Member list
3. Decision: Invite CTA

---

## Administration

**Purpose**: System health and configuration.

**Content model**:
1. Identity: "Administration" + description
2. Work: Navigation tiles — Organization, Members, Audit, Diagnostics
3. Decision: Click tile → sub-page

---
