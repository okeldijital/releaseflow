# PX-003 — Navigation Migration Report

**Agent:** Agent A — Product Architecture  
**Date:** June 2026  
**Status:** Complete  
**References:** PDS-03, PDS-12

---

## 1. Summary

Replaced the existing application shell and navigation with the PDS-compliant architecture. The sidebar now has 7 primary items grouped into 3 sections (Operations, Resources, System). Breadcrumbs are auto-generated from the URL pathname. Page title conventions are standardized.

---

## 2. Files Changed

### 2.1 `packages/ui/src/navigation/sidebar.tsx`

| Change | Detail |
|--------|--------|
| `Sidebar` props | Added `sections: NavSection[]` prop for configurable section labels |
| `NavSection` type | New export: `{ key: string; label: string }` |
| Section rendering | Sections now rendered in `sections` array order (not object iteration) |
| Active detection | `/` route is treated as exact match (not prefix match) to avoid all routes matching Home |
| Removed | Hardcoded `sections` record (`operations`, `execution`, `monitoring`, `administration`) |
| Dark mode | Added dark mode classes for sidebar, nav items, user section |

### 2.2 `packages/ui/src/layouts/app-shell.tsx`

| Change | Detail |
|--------|--------|
| `AppShell` props | Added `navSections: NavSection[]` — passed through to Sidebar |
| Dark mode | Added missing dark mode classes for background and context rail |

### 2.3 `packages/ui/src/index.ts`

| Change | Detail |
|--------|--------|
| Exports | Added `NavSection` type export |

### 2.4 `apps/web/src/app/(app)/layout.tsx`

| Change | Detail |
|--------|--------|
| Nav items | Replaced 8-item flat list with 7-item PDS grouped structure |
| Removed from sidebar | Campaigns, Operations, Approvals, Organizations, Contributor (accessibly via URL) |
| Sections | `navSections`: Operations (Home, Releases, Work), Resources (Artists, Assets, People), System (Administration) |
| Breadcrumbs | `buildBreadcrumbs()` auto-generates breadcrumbs from pathname |
| Path labels | `pathLabels` map: human-readable labels for route segments |
| Page titles | `pageTitles` map: page heading conventions (e.g., `/dashboard` → "Operations Center") |
| Terminology | `label: 'People'` replaces old Teams concept; `label: 'Work'` replaces Contributor |
| Dynamic IDs | UUID-like path segments show truncated label |

### 2.5 `apps/web/src/app/(app)/dashboard/page.tsx`

| Change | Detail |
|--------|--------|
| H1 heading | "Dashboard" → "Operations Center" |

### 2.6 New Pages Created

| Route | File | Content |
|-------|------|---------|
| `/assets` | `(app)/assets/page.tsx` | Placeholder with EmptyState — global asset library |
| `/people` | `(app)/people/page.tsx` | Placeholder with EmptyState — People directory |
| `/work` | `(app)/work/page.tsx` | Placeholder with EmptyState — personal workspace |
| `/administration` | `(app)/administration/page.tsx` | Administration hub with links to sub-pages |
| `/administration/audit` | `(app)/administration/audit/page.tsx` | Redirect to `/audit` |
| `/administration/diagnostics` | `(app)/administration/diagnostics/page.tsx` | Redirect to `/diagnostics` |
| `/administration/members` | `(app)/administration/members/page.tsx` | Redirect to `/organizations` |

---

## 3. Navigation Map (Before → After)

### Before (8 items, 4 sections)

```
Operations: Dashboard, Releases, Artists
Execution: Campaigns, Contributor
Monitoring: Operations, Approvals
Administration: Organizations
```

### After (7 items, 3 sections) — PDS-03 Compliant

```
Operations: Home, Releases, Work
Resources: Artists, Assets, People
System: Administration
```

### Mapping

| Old Label | Old Route | New Label | New Route | Status |
|-----------|-----------|-----------|-----------|--------|
| Dashboard | `/dashboard` | Home | `/dashboard` | Renamed |
| Releases | `/releases` | Releases | `/releases` | Unchanged |
| Artists | `/artists` | Artists | `/artists` | Moved to Resources |
| Campaigns | `/campaigns` | — | — | Removed from sidebar |
| Operations | `/operations` | — | — | Merged into Home |
| Approvals | `/approvals` | — | — | Moved to Work context |
| Organizations | `/organizations` | Administration | `/administration` | Renamed, regrouped |
| Contributor | `/contributor` | Work | `/work` | Renamed |
| — | — | Assets | `/assets` | New |
| — | — | People | `/people` | New |

---

## 4. Breadcrumb System

### Implementation

- Auto-generated from `usePathname()` in `(app)/layout.tsx`
- `pathLabels` map translates route segments to human-readable labels
- UUID-like segments (20+ hex chars) show truncated ID
- Special handling for `new`, `edit`, `audit`, `diagnostics` segments
- Rendered in Topbar via `Breadcrumbs` component

### Examples

| Pathname | Breadcrumbs |
|----------|-------------|
| `/dashboard` | Home |
| `/releases` | Home / Releases |
| `/releases/new` | Home / Releases / New |
| `/releases/abc123-def456` | Home / Releases / abc123-d... |
| `/artists/xyz789` | Home / Artists / xyz789-... |
| `/administration/audit` | Home / Administration / Audit |

---

## 5. Page Title Conventions

Per PDS-03 and user directive: "Sidebar item = Home, Page heading = Operations Center"

| Sidebar Label | Route | Page H1 |
|---------------|-------|---------|
| Home | `/dashboard` | Operations Center |
| Releases | `/releases` | Releases |
| Work | `/work` | Work |
| Artists | `/artists` | Artists |
| Assets | `/assets` | Assets |
| People | `/people` | People |
| Administration | `/administration` | Administration |

---

## 6. Preserved Functionality

The following existing routes remain fully functional (accessible via URL or links from pages), only removed from sidebar:

- `/campaigns`, `/campaigns/new`, `/campaigns/[id]`
- `/operations`
- `/approvals`
- `/organizations`
- `/contributor`
- `/budgets`
- `/brief`
- `/rights-holders`, `/rights-holders/new`
- `/audit`
- `/diagnostics`

Route guards and authentication are unchanged. The middleware and auth context are untouched.

---

## 7. Compliance with PDS

| PDS Rule | Status |
|----------|--------|
| NR-001: Max 7 primary nav items | ✅ 7 items |
| NR-002: Every item represents real-world object | ✅ Home, Releases, Work, Artists, Assets, People, Administration |
| NR-003: Settings never inside operational workflows | ✅ Administration is separate section |
| NR-004: Operational info never inside Administration | ✅ Administration is config only |
| NR-005: Every page belongs to one primary object | ✅ |
| NR-006: "Where should I go?" feels obvious | ✅ 3 clearly named sections |
| IA-001: Release is the centre | ✅ Releases in Operations section |
| Breadcrumbs follow real-world objects | ✅ |
| Sidebar item = Home, heading = Operations Center | ✅ |

---

## 8. Deviations

None. All changes are derived from PDS-03, PDS-11A, and PDS-12.

---

## 9. Questions Requiring Product Owner Approval

1. **Cross-release views:** Campaigns and Budgets are removed from primary nav per PDS-03 (they are Release Workspace tabs). Should cross-release aggregation views (e.g., all campaigns across releases) be added to the Operations Center (Home)? See PDP-001.

2. **Deprecated route timeline:** Should `/campaigns`, `/budgets`, `/approvals`, `/operations`, `/organizations`, `/contributor`, `/brief`, `/rights-holders` eventually become redirects to their new locations, or remain indefinitely accessible for backward compatibility?

3. **Release Workspace tabs:** The PDS specifies 10 tabs but only 4 exist (Overview, Workflow, Deliverables, Dependencies from types.ts). Should the remaining 6 (Tasks, Distribution, Campaigns, Budget, Rights, Activity, Settings) be created now or deferred to subsequent sprints?
