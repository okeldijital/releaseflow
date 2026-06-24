# TASK-2803 — Alert UX

## Concept

Alerts are system-generated notifications triggered by deterministic
rules. Three severity levels: Critical, Warning, Info. Each alert has a
defined escalation path — if unresolved, it escalates to the next
severity level or to a broader audience.

Alerts are rule-based. No AI generation. No LLM dependency. Every alert
originates from a fixed condition evaluated against live data.

---

## Severity Levels

### Critical 🔴

| Property | Value |
|----------|-------|
| Color | Red `#DC2626`, background `#FEF2F2` |
| Icon | ⚠ or 🔴 |
| Meaning | Immediate action required. Release is blocked or at legal/financial risk. |
| Auto-escalates after | 24 hours (paused when acknowledged) |
| Escalation target | Admin + Owner |
| Can be dismissed? | No |
| Can be snoozed? | No |
| Can be acknowledged? | Yes — silences repeat notifications, preserves visibility |

**Triggers:**
- Budget category exceeded by >20%
- Stage blocked for >3 days
- Release date missed (date < today, release not RELEASED)
- Rights not cleared 7 days before street date
- Two or more stages overdue simultaneously

### Warning 🟡

| Property | Value |
|----------|-------|
| Color | Amber `#D97706`, background `#FEF3C7` |
| Icon | ⚡ or 🟡 |
| Meaning | Action needed soon. Situation is not yet critical but trending wrong. |
| Auto-escalates after | 72 hours |
| Escalation target | PM + Admin |
| Can be snoozed? | Yes — 24h, 3d, 1w |

**Triggers:**
- Contributor has 4+ active assignments
- Budget category >75% spent with remaining work
- Approval SLA approaching (1 day before deadline)
- Stage overdue but <3 days
- Campaign health At Risk for >3 days

### Info 🔵

| Property | Value |
|----------|-------|
| Color | Blue `#2563EB`, background `#EFF6FF` |
| Icon | ℹ️ or 🔵 |
| Meaning | Informational. No action required but good to know. |
| Auto-escalates after | Never |
| Escalation target | None |
| Can be snoozed? | Yes — dismissed permanently |

**Triggers:**
- Release shipped (status → RELEASED)
- Stage completed
- Milestone reached
- New contributor added to release
- Distribution live on DSP

---

## Alert Lifecycle

```
  ┌──────────┐
  │  ACTIVE   │────── Dismiss ───────→  DISMISSED
  └────┬─────┘        (Warning/Info)
       │
       ├── Acknowledge ──────────────→  ACKNOWLEDGED
       │  (Critical only)              (repeat notifications suppressed,
       │                                escalation clock paused,
       │                                alert remains visible)
       │
       │ (time elapsed without
       │  action or acknowledgment)
       │
       ▼
  ┌────────────┐
  │  ESCALATED  │──→ Severity increases OR audience expands
  └────┬───────┘
       │
       │ (resolved by user action)
       │
       ▼
  ┌────────────┐
  │  RESOLVED   │
  └────────────┘
```

| State | Meaning |
|-------|---------|
| Active | Alert is live and unaddressed |
| Acknowledged | Someone has seen and owned the alert. Repeat notifications suppressed. Escalation paused. Alert stays visible. (Critical only) |
| Escalated | Alert has been upgraded (severity increased or more people notified) |
| Dismissed | Alert hidden (Warning/Info only) |
| Resolved | Condition that triggered the alert no longer exists |

---

## Alert Card Anatomy

### Active (Unacknowledged)

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔴 CRITICAL                                                         │
│                                                                       │
│  Lua — Advertising budget exceeded by $3,000                         │
│                                                                       │
│  Planned spend ($4,000) exceeds allocation ($1,000) by 300%.         │
│  Adjust the budget allocation or reduce planned advertising spend.   │
│                                                                       │
│  Triggered: Aug 15, 2026 · Active for 3 days                         │
│                                                                       │
│  ┌──────────┐ ┌──────────┐                                            │
│  │  Resolve │ │Acknowledge│  ← Stops repeat pings, keeps alert visible│
│  └──────────┘ └──────────┘                                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Acknowledged

```
┌──────────────────────────────────────────────────────────────────────┐
│  🔴 CRITICAL · Acknowledged                                          │
│                                                                       │
│  Lua — Advertising budget exceeded by $3,000                         │
│                                                                       │
│  Planned spend ($4,000) exceeds allocation ($1,000) by 300%.         │
│  Adjust the budget allocation or reduce planned advertising spend.   │
│                                                                       │
│  Acknowledged by Leko · Aug 16, 2026 · 09:31                         │
│  Escalation paused. Next escalation: Aug 17, 09:31 (if unresolved)   │
│                                                                       │
│  ┌──────────┐                                                         │
│  │  Resolve │                                                         │
│  └──────────┘                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### Elements

| Element | Description |
|---------|-------------|
| Severity badge | 🔴 Critical / 🟡 Warning / 🔵 Info |
| Title | Entity name + condition summary |
| Description | 1–2 lines explaining the situation |
| Trigger metadata | When the alert fired + how long it has been active |
| Acknowledge info | (When acknowledged) Who acknowledged it, when, escalation pause details |
| Resolve | Links to the entity where the issue can be fixed |
| Acknowledge | (Critical only) Signals ownership. Suppresses repeat notifications. Pauses escalation clock. Alert stays visible. |
| Snooze | Temporarily hide (Warning only: 24h / 3d / 1w) |
| Dismiss | Acknowledge and hide (Info: permanent; Warning: until condition re-triggers) |

---

## Escalation Rules

### Rule: Critical Escalation (24h, paused by acknowledgment)

```
Alert: 🔴 "Mastering blocked for 3 days"
Day 0, 10:00: Alert fires (Critical · PM notified)
Day 0, 10:05: PM acknowledges alert
              → Repeat notifications suppressed
              → Escalation clock pauses at 5 minutes elapsed
              → Alert stays visible with "Acknowledged by Leko · 10:05"
Day 1, 10:05: 24h after acknowledgment, escalation clock resumes
              → If still unresolved, escalation fires
              → Audience expands: Admin + Owner notified
              → Email: "Critical alert acknowledged 24h ago, still unresolved"
Day 3: Still unresolved → SECOND ESCALATION
       Email to Owner: "Urgent: unresolved for 3 days"
```

If nobody acknowledges:
```
Day 0, 10:00: Alert fires
Day 1, 10:00: 24h elapsed, no acknowledgment → ESCALATED immediately
```

### Rule: Acknowledgment Reset on Activity

When the acknowledged user takes action (edits budget, moves stage, etc.)
within the acknowledgment window, the escalation clock resets:

```
Day 0, 10:00: Alert fires
Day 0, 10:05: PM acknowledges
Day 0, 14:30: PM adjusts budget allocation (activity detected)
              → Escalation clock resets to 0
              → Next escalation: Day 1, 14:30 (if still unresolved)
```

### Rule: Warning Escalation (72h)

```
Alert: 🟡 "Sam Wilson overloaded — 5 releases"
Day 0: Alert fires (Warning · PM notified)
Day 3: No resolution → ESCALATED
       Severity: Warning → Critical
       Reason: "Warning unresolved for 72 hours. Escalating."
       Admin + Owner notified
```

### Rule: Release Date Proximity Escalation

```
Alert: 🟡 "Rights not cleared — 14 days until release"
Day 0: Alert fires (Warning)
Day 7: T-7 days until release → ESCALATED
       Severity: Warning → Critical
       Reason: "7 days until street date. Rights still not cleared."
```

---

## Alert Generation Rules

All rules are hardcoded — no machine learning, no AI:

```typescript
const ALERT_RULES: AlertRule[] = [
  {
    id: 'budget_exceeded',
    condition: (release) => {
      const overages = release.budget.categories.filter(
        c => c.planned > c.allocated * 1.2  // 20%+ over allocation
      );
      return overages.length > 0;
    },
    severity: 'critical',
    title: (release, cat) => `${cat.name} budget exceeded by $${cat.planned - cat.allocated}`,
    description: (release, cat) =>
      `Planned spend ($${cat.planned}) exceeds allocation ($${cat.allocated}) by ${Math.round((cat.planned/cat.allocated - 1) * 100)}%.`,
    resolveUrl: (release, cat) => `/releases/${release.id}/budget`,
    escalationHours: 24,
    escalateTo: ['admin', 'owner'],
  },
  {
    id: 'stage_blocked',
    condition: (release) => {
      const blocked = release.stages.filter(
        s => s.status === 'BLOCKED' && hoursSince(s.blockedAt) > 72
      );
      return blocked.length > 0;
    },
    severity: 'critical',
    escalationHours: 24,
    escalateTo: ['admin', 'owner'],
  },
  {
    id: 'contributor_overloaded',
    condition: (user) => user.activeAssignments >= 4,
    severity: 'warning',
    escalationHours: 72,
    escalateTo: ['admin'],
  },
  {
    id: 'budget_approaching_limit',
    condition: (cat) => cat.spent / cat.allocated > 0.75 && cat.planned > cat.remaining,
    severity: 'warning',
    escalationHours: 72,
    escalateTo: ['pm', 'admin'],
  },
  {
    id: 'approval_sla_near',
    condition: (approval) => hoursUntil(approval.slaDeadline) <= 24 && approval.status === 'pending',
    severity: 'warning',
    escalationHours: 72,
    escalateTo: ['pm'],
  },
  {
    id: 'release_shipped',
    condition: (release) => release.status === 'RELEASED' && hoursSince(release.releasedAt) <= 24,
    severity: 'info',
    escalateTo: [],
  },
  {
    id: 'stage_completed',
    condition: (stage) => stage.status === 'COMPLETED' && hoursSince(stage.completedAt) <= 1,
    severity: 'info',
    escalateTo: [],
  },
];
```

---

## Alert Notification Channels

| Severity | In-App | Push | Email |
|----------|--------|------|-------|
| Critical | Immediate | Immediate | Immediate |
| Warning | Immediate | Yes | Daily digest only |
| Info | Silent (badge only) | No | No |

Critical alerts bypass notification preferences — they always notify
via all channels.

---

## Acknowledge Behavior

Only Critical alerts support acknowledgment. It is designed to prevent
alert fatigue while preserving visibility.

### What Acknowledge Does

| Effect | Detail |
|--------|--------|
| Suppresses repeat notifications | No more push/email/in-app pings for this alert |
| Pauses escalation clock | The 24h countdown stops. Resumes 24h after acknowledgment. |
| Preserves visibility | Alert stays in the Operations Center and on the release dashboard |
| Shows ownership | Alert card shows "Acknowledged by [Name] · [Time]" |
| Resets on activity | If the acknowledging user takes action, the clock resets |

### What Acknowledge Does NOT Do

| Non-effect | Detail |
|------------|--------|
| Does not hide the alert | It remains visible to everyone |
| Does not resolve it | The underlying condition still exists |
| Does not reassign it | No ownership transfer. It's a signal, not a claim. |

### Acknowledge Action

Clicking "Acknowledge" on a Critical alert immediately transitions it
to the Acknowledged state. No confirmation dialog — the action is low-risk
and reversible (resolving the condition clears the acknowledgment).

### Re-Alerting

If an alert is acknowledged and then the condition worsens (e.g., budget
overage increases from +$3K to +$5K), a new alert reference fires but
the existing acknowledgment is preserved. The escalation clock restarts
for the worsened condition.

If the condition is resolved and then re-triggered within 48 hours, the
alert fires fresh (Active, not Acknowledged).

---

## Snooze Behavior

Only Warning alerts can be snoozed:

```
┌──────────────────────────────┐
│  Snooze Alert                 │
│                               │
│  "Sam Wilson overloaded"     │
│                               │
│  ○ 24 hours                  │
│  ○ 3 days                    │
│  ○ 1 week                    │
│                               │
│  ┌──────────┐ ┌──────────┐   │
│  │  Snooze  │ │  Cancel  │   │
│  └──────────┘ └──────────┘   │
└──────────────────────────────┘
```

Snoozed alerts reappear after the snooze period expires. If the
underlying condition is resolved while snoozed, the alert auto-resolves
and does not reappear.

---

## Dismiss Behavior

Dismissing an Info alert removes it permanently. Dismissing a Warning
alert hides it until the condition is re-triggered (e.g., a contributor
returns to under 4 active, then goes back to 4+ — a new alert fires).

Critical alerts cannot be dismissed. They may only be acknowledged
(which preserves visibility while suppressing notifications) or resolved.

---

## Data Model

```typescript
interface Alert {
  id: string;
  ruleId: string;                // FK to AlertRule
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  status: 'active' | 'acknowledged' | 'escalated' | 'dismissed' | 'resolved';
  entityType: string;            // "release", "stage", "budget", "contributor"
  entityId: string;
  resolveUrl: string;            // Deep link to fix the issue
  triggeredAt: Timestamp;
  acknowledgedAt?: Timestamp;
  acknowledgedBy?: { id: string; name: string };
  escalationPausedUntil?: Timestamp;  // When escalation clock resumes
  escalatedAt?: Timestamp;
  escalatedTo?: string[];        // Role IDs
  escalationLevel: number;       // 0 = original, 1 = first escalation, etc.
  dismissedAt?: Timestamp;
  dismissedBy?: string;
  snoozedUntil?: Timestamp;
  resolvedAt?: Timestamp;
  resolvedBy?: string;           // "system" if auto-resolved by condition clearing
}

interface AlertRule {
  id: string;
  name: string;                  // "budget_exceeded", "stage_blocked", etc.
  severity: 'critical' | 'warning' | 'info';
  condition: (context: AlertContext) => boolean;
  escalationHours: number;       // 0 = never escalate
  escalateTo: string[];          // Role IDs to notify on escalation
}
```
