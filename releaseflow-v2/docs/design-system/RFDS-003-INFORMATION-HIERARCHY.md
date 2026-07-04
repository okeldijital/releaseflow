# RFDS-003 — Information Hierarchy

**Status:** Active
**Version:** 1.0

---

## Purpose

Every component on a page must be classified into a tier. The classification determines its visual weight, reading width, and content hierarchy.

A page is not a collection of sections. It is a sequence of operational answers.

---

## The Seven Tiers (Detailed)

| Tier | Purpose | Priority | Reading Width | Visual Weight |
|------|---------|----------|----------------|-----------------|
| **1 — Situation** | Current operational state | 100 | 640px | Dominant |
| **2 — Assessment** | Operational health | 80 | 640px | Strong |
| **3 — Decision** | What to do now | 90 | 640px | Dominant |
| **4 — Evidence** | Supporting data | 70 | 960–1120px | Standard |
| **5 — Context** | Related information | 50 | 360px (rail) | Quiet |
| **6 — History** | Chronological record | 10 | 640px | Minimal |
| **7 — Metadata** | Technical values | 5 | Inline | Invisible |

The attention priority comes from RFDS-001. The tier assignment is the operational equivalent.

---

## Tier Composition Rules

### Rule 1: Every page has one Tier 1 (Situation)

The Situation tier answers "what is happening?" It is always the first content below the topbar.

| Content | Where |
|---------|------|
| Page identity (H1, date) | Top of content, flush left |
| Briefing (conclusion) | Below identity, 640px width |
| Hero CTAs (primary action) | Top right of content area |

### Rule 2: Decision is the focal point

The Decision tier is what the user should do. It contains the highest-value action the interface can offer.

| Content | Where |
|---------|------|
| Assessment (2-col grid) | Below hero, 16–24px gap |
| Immediate actions (text list) | Below assessment, 16–24px gap |
| Recommendations | Same zone as actions |

### Rule 3: Evidence follows Decision

The Evidence tier contains data that supports the decision. Tables, metrics, charts.

| Content | Where |
|---------|------|
| Org Pulse (inline) | Below decisions, 40px gap |
| Tables (data) | 24px gap from metrics |
| Metrics summaries | Within inline pulse |
| Inline charts (future) | 960–1120px width |

### Rule 4: Context is peripheral

The Context tier is a side rail. It does not compete with the main column.

| Content | Where |
|---------|------|
| Context rail | Right side of canvas (≥1280px) |
| Tabs bar | Above active tab content |
| Side panels (drawers) | Right edge, overlay |

### Rule 5: History is at the bottom

The History tier is the least important content. It is at the bottom of the page.

| Content | Where |
|---------|------|
| Activity feed | Bottom of page |
| Audit log | Settings page, bottom |
| Version history | Settings page, bottom |

### Rule 6: Metadata never competes

Metadata (Tier 7) never appears in a primary content area. It is always subordinate to Tier 1–6 content.

| Content | Where |
|---------|------|
| IDs | Inline with the record they reference |
| Timestamps | Secondary alignment, muted color |
| Technical values | Tooltip or details panel |

---

## Zone → Tier Mapping

| Zone | Tier(s) Allowed |
|------|-----------------|
| Situation | Tier 1 |
| Decision | Tier 2, Tier 3 |
| Evidence | Tier 4, Tier 6 (history can be evidence) |
| Context | Tier 4 (related), Tier 5 (related info) |
| History | Tier 6 |
| Navigation | Tier 7 (metadata) |

---

## Tier Visibility Per Breakpoint

| Tier | Desktop | Laptop | Tablet | Mobile |
|------|---------|--------|--------|--------|
| 1 Situation | Visible | Visible | Visible | Visible |
| 2 Assessment | Visible | Visible | Visible | Visible |
| 3 Decision | Visible | Visible | Visible | Visible |
| 4 Evidence | Full table | Full table | Scroll/cards | Cards |
| 5 Context | Rail | Rail | Drawer | Tab |
| 6 History | List | List | List | Tab |
| 7 Metadata | Inline | Inline | Inline | Inline |

---

## Composition Patterns

### Pattern A: Briefing-First

| Order | Tier | Example |
|-------|------|---------|
| 1 | Tier 1 | Hero briefing (conclusion first) |
| 2 | Tier 2 | Assessment (2-col grid) |
| 3 | Tier 3 | Immediate actions (text list) |
| 4 | Tier 4 | Metrics (inline) + Table |
| 5 | Tier 6 | Recent activity |

Use: Operations Center, Dashboard

### Pattern B: Detail-First

| Order | Tier | Example |
|-------|------|---------|
| 1 | Tier 1 | Header (name + status) |
| 2 | Tier 2 | Assessment / health |
| 3 | Tier 4 | Tabs (Workflow, Assets, Rights, etc.) |
| 4 | Tier 4 | Active tab content |
| 5 | Tier 6 | Activity (within tab) |

Use: Release Workspace, Artist Workspace

### Pattern C: Task-First

| Order | Tier | Example |
|-------|------|---------|
| 1 | Tier 1 | Greeting (context) |
| 2 | Tier 3 | Tasks (immediate work) |
| 3 | Tier 4 | Reviews (pending) |
| 4 | Tier 2 | Workload summary |
| 5 | Tier 6 | Recent activity |

Use: Work page, My Tasks

---

## Anti-Patterns

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| Tier 1 below Tier 4 in a section | Evidence before conclusion — eye reads bottom-up |
| Tier 3 above Tier 2 | Decision without assessment is premature |
| Tier 7 in primary content | Metadata never competes with operational info |
| Tier 6 above Tier 3 | History before decision is noise |
| Tier 1 spread across multiple sections | The user should know the state immediately |
| Same tier in two adjacent sections | Two competing focal points |
| Tier 4 before Tier 3 | Evidence without recommendation is a data dump |
