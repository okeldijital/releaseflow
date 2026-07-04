# RFC-002 — Screenshot Evidence

**Date:** 2026-06-29

Note: Screenshots cannot be captured in this environment. The evidence references code structure.

---

## Hero Zone (Identity — Tier 1, VH-100)

**Code reference**: `releases/[id]/page.tsx:322-372`

- [ ] Release title at `text-[1.75rem] font-semibold tracking-tight`
- [ ] Artwork placeholder (72×72 rounded-xl)
- [ ] Release type shown (raw span — noted DD-002)
- [ ] Genre shown (raw span — noted DD-003)
- [ ] Health pill inline (`readiness.percentage >= 80 ? 'Healthy' : ...` — noted DD-001)
- [ ] Rights readiness badge (clickable → Rights tab)
- [ ] Blockers count badge (clickable → Workflow tab)
- [ ] Primary action: Advance Stage (when workflow active)
- [ ] Secondary: Edit, Delete

---

## Release Journey (Tier 2)

**Code reference**: `releases/[id]/page.tsx:374-376`

- [ ] `ReleaseJourney` domain component with stage pipeline
- [ ] Current stage highlighted

---

## Operational Summary (Tier 2)

**Code reference**: `releases/[id]/page.tsx:379-392`

- [ ] Uses `OperationalSummary` domain component
- [ ] healthScore, currentStage, completedStages, totalStages all passed
- [ ] onDrillDown wired to tab navigation

---

## Tabs + Content (Tier 4)

**Code reference**: `releases/[id]/page.tsx:398-487`

- [ ] 10 tabs: Overview, Workflow, Assets, Distribution, Campaigns, Budget, Rights, Credits, Activity, Settings
- [ ] Active tab indicated by underline
- [ ] Tab content conditionally rendered per `tab` state

---

## Context Rail (Tier 5, VH-60)

**Code reference**: `releases/[id]/page.tsx:294-316`

- [ ] `HealthRing` — health, readiness, timelineConfidence, workflowCompletion
- [ ] `ReadinessStack` — 7 categories: Audio, Artwork, Metadata, Rights, Distribution, Marketing, Legal
- [ ] `ContextRail` — release name, type, current stage, date, health, attention items

---

## Workflow Board (Tier 4)

**Code reference**: `WorkflowTab` function (line ~530+)

- [ ] `WorkflowBoard` domain component
- [ ] Stage cards with status dots
- [ ] Current stage highlighted
- [ ] Stage detail Drawer on click
- [ ] Tasks section below board
