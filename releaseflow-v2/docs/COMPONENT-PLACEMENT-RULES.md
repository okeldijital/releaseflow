# Component Placement Rules — ReleaseFlow

**Version:** 1.0

---

## Rule: Every component has exactly one permitted zone.

No component may appear in a zone not listed here. No screen may place a component outside its permitted zone without a documented exception.

---

## Core Components

### OperationalSummary

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Top third of operational pages |
| **Screens** | Operations Center, Release Workspace, Artist Workspace |
| **Placement** | Below hero, above tabs |
| **Forbidden** | Context Rail, Sidebar, tab content, Work page |

### HealthRing

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Context Rail only |
| **Screens** | Release Workspace, Artist Workspace |
| **Forbidden** | Content area, hero, tab content, Operations Center |

### ReadinessStack

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Context Rail, below HealthRing |
| **Screens** | Release Workspace, Artist Workspace |
| **Forbidden** | Above the hero, Operations Center, tab content |

### ContextRail

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Fixed right panel, 320px, below topbar |
| **Screens** | Release Workspace, Artist Workspace |
| **Forbidden** | Operations Center, list pages, Work page |

### ReleaseJourney

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Hero section, between header and OperationalSummary |
| **Screens** | Release Workspace |
| **Forbidden** | Operations Center, Artist Workspace, tab content |

### WorkflowBoard

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Workflow tab content |
| **Screens** | Release Workspace (Workflow tab) |
| **Forbidden** | Context Rail, hero, Overview tab, Operations Center |

### Attention Panel

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Content area, below OperationalSummary, above History |
| **Screens** | Operations Center |
| **Forbidden** | Context Rail, hero, tab content (belongs in Context Rail for workspace screens) |

### Activity Feed

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Bottom of content area, or Activity tab |
| **Screens** | Operations Center, Release Workspace, Artist Workspace |
| **Forbidden** | Above blockers, above health, hero section |

### Quick Actions

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Bottom-right of content area |
| **Screens** | Operations Center |
| **Forbidden** | Top of page, hero section, Context Rail |

---

## Navigation Components

### Sidebar

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Fixed left, 240px |
| **Screens** | All authenticated pages |
| **Forbidden** | Content area, right panel |

### Topbar

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Fixed top, 64px |
| **Screens** | All authenticated pages |
| **Forbidden** | Content area |

### Tabs

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Below OperationalSummary, above tab content |
| **Screens** | Release Workspace, Artist Workspace |
| **Forbidden** | Operations Center, list pages, Context Rail |

### Breadcrumbs

| Attribute | Rule |
|-----------|------|
| **Permitted zone** | Topbar, left of search |
| **Screens** | All authenticated pages |
| **Forbidden** | Content area |

---

## Enforcement

These placement rules are enforced by:
1. **Code review**: No component is placed outside its permitted zone
2. **Design review**: No screen layout violates these rules without a documented ADR
3. **Component API**: Components that require a specific zone (e.g., ContextRail) enforce it via their API (e.g., ContextRail is only rendered inside WorkspaceLayout)

Violations discovered post-freeze must be treated as P2 defects.
