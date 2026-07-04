# Changelog — ReleaseFlow 1.0.0-RC1

**Date:** 2026-06-28
**Status:** Release Candidate

---

## Architecture

- **7 repositories** created: Organization, Release, Workflow, Artist, Asset, Rights, Distribution
- **7 services** refactored to 0 Firestore: Release, Workflow, Artist, Asset, Rights, Distribution, OperationsCenter
- **8 hooks** created: useRelease, useWorkflow, useActivity, useArtist, useArtists, useAsset, useReleaseAssets, useRightsHolders, useReleaseOwnership, useOperationsCenter
- **3 P1 targets resolved**: useOperationsCenter, organizations page, onboarding page — all 0 Firestore
- Sign-out state cleanup: org store, role store, Firebase session
- Organization race condition: `orgsLoaded` guard in dashboard
- Atomic release creation: writeBatch for Release + Workflow + Stages + Requirements + Activity

## UI — Application Shell (PX-200.1)

- Sidebar: 300ms slide transition, Escape dismiss on mobile, auto-close on nav
- Topbar: Search with ⌘K badge, notification bell with unread count, command palette trigger
- AppShell: Skip-to-content link, keyboard shortcuts (⌘K, ⌘\)
- New: `Page` layout component for consistent page containers
- Reduced-motion support added

## UI — Operations Center (PX-200.2)

- Real release data from repository (no hardcoded rows)
- 5 Org Pulse stat cards (active, blocked, overdue, over budget, shipped)
- Spec-compliant section ordering: Header → OperationalSummary → Active Releases → Attention → Org Pulse → Activity → Quick Actions → Footer
- Role-aware Quick Actions: owner/admin/mgr vs contributor

## UI — Release Workspace (PX-200.3)

- Hero: Artwork placeholder, editorial title, health pill, status dropdown with scale-in
- 10 tabs: Overview, Workflow, Assets, Distribution, Campaigns, Budget, Rights, Credits, Activity, Settings
- Context Rail: HealthRing → ReadinessStack → ContextRail
- WorkflowBoard integration with stage cards + task management
- Interactive deep-linking: rights badge → Rights tab, blockers badge → Workflow tab

## UI — Artist Workspace (PX-200.4)

- 6 tabs: Overview, Releases, Credits, Assets, Press Kit, Activity
- Profile completeness pill with semantic coloring
- Activity tab with chronological feed from useActivity hook

## UI — Supporting Workspaces (PX-200.5)

- Assets: Org-aware, asset validation rules (5 categories)
- Rights Holders: useRightsHolders hook, percentage validation (1-100% per type)
- Work: Real task listing from getTasksByAssignee()
- People: Consistent empty state
- Administration: 4-tile navigation grid

## Engineering

| Metric | Value |
|--------|-------|
| TypeScript | 6/6 packages |
| Tests | 327 passed |
| Build | 3.2s |
| Lint | 0 errors |
| Pages recovered | 14/21 (67%) |
| P0/P1 defects | 0 |
| P2 defects | 10 |
