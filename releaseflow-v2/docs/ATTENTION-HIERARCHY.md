# Attention Hierarchy — ReleaseFlow

**Version:** 1.0

---

## Fixed Priority Order

```
1. CRITICAL    — Release cannot ship. Immediate action required.
        ↓
2. ATTENTION   — Something needs review. Action required soon.
        ↓
3. DECISION    — Primary action the user should take right now.
        ↓
4. OPERATIONAL — Current state: health, stage, progress, metrics.
        ↓
5. CONTEXT     — Supporting details: dates, people, dependencies.
        ↓
6. HISTORY     — What already happened. Informational, not actionable.
```

This order is **absolute**. An overdue blocker (Critical) must always outrank an activity feed (History). A health warning (Attention) must always outrank a completed task (History). Nothing is negotiable.

---

## Layer Definitions

### 1. Critical

| Attribute | Value |
|-----------|-------|
| **Severity** | Release-blocking. Cannot ship without resolution. |
| **Visual weight** | Compact, high-contrast. Red indicators. |
| **Examples** | Blocked workflow stage, unresolved dependency, expired deadline, invalid ownership |
| **User action** | Resolve, Escalate, Follow Up |
| **Placement** | Top of content area, before health summary |
| **Condition** | Hidden when 0 critical items |

### 2. Attention

| Attribute | Value |
|-----------|-------|
| **Severity** | Not blocking, but requires action. Will become critical if ignored. |
| **Visual weight** | Amber indicators. Below critical, above operational. |
| **Examples** | Approaching deadline, incomplete profile, unassigned task, overdue review |
| **User action** | Review, Assign, Complete |
| **Placement** | Below critical, above operational summary |
| **Condition** | Hidden when 0 attention items |

### 3. Decision

| Attribute | Value |
|-----------|-------|
| **Severity** | The single most important action available on this screen |
| **Visual weight** | Primary button, top-right. One per screen. |
| **Examples** | + Create Release, Advance Stage, Generate Package, Add Release |
| **Placement** | Top-right of content area, aligned with hero |
| **Condition** | Always visible |

### 4. Operational

| Attribute | Value |
|-----------|-------|
| **Severity** | Current state — informative, not urgent |
| **Visual weight** | Largest visual element (hero). 25-30% of screen. |
| **Examples** | OperationalSummary, Release Health Table, Active Releases, Workflow Board |
| **Placement** | Below decision, above context |
| **Condition** | Always visible |

### 5. Context

| Attribute | Value |
|-----------|-------|
| **Severity** | Supporting information that informs decisions |
| **Visual weight** | Secondary. 20-25% of screen. |
| **Examples** | Table columns (stage, deadline, owner), tab content, metadata, dependencies |
| **Placement** | Below operational, above history |
| **Condition** | Always visible |

### 6. History

| Attribute | Value |
|-----------|-------|
| **Severity** | Informational only. No action required. |
| **Visual weight** | Compact. 10-15% of screen. Bottom placement. |
| **Examples** | Activity Feed, Audit Log, Timeline |
| **Placement** | Bottom of content area |
| **Condition** | Always visible, may be collapsed |

---

## Violation Examples

| Violation | Why It's Wrong |
|-----------|---------------|
| Activity feed above blockers | Activity is History. Blockers are Critical. History never outranks Critical. |
| "No alerts" empty state above health | An empty critical section should collapse, not display a prominent empty state. |
| Two primary actions | Screens have one primary action. Two creates indecision. |
| Context Rail above hero | Context supports the hero. Hero comes first. |
| Quick Actions at top | Quick Actions are secondary navigation. They never outrank the decision hierarchy. |
