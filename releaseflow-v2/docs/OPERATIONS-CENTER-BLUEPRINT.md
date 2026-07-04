# Operations Center Blueprint

**Screen:** `/dashboard`
**Purpose:** Answer "what requires attention?" within five seconds.

---

## Five-Second Questions

Operations Manager, within 5 seconds of loading this screen, must be able to answer:

| # | Question | Answered By |
|---|----------|-------------|
| 1 | What needs immediate attention? | Critical + Attention layers (top) |
| 2 | Which releases are at risk? | Active Releases table — health column |
| 3 | Which releases are ready to move? | Active Releases table — stage column |
| 4 | What changed today? | Recent Activity feed (bottom) |
| 5 | What action should I take next? | Primary Action (+ Create Release) + Quick Actions |

---

## Fixed Layout

```
┌────────────────────────────────────────────────────┐
│  Operations Center                    + Create Release  │  ← Decision
│                                                    │
│  ─── Operational Summary ──────────────────────    │  ← Operational (hero)
│  5 active · 2 blocked · 3 overdue · Health: 85%   │
│                                                    │
│  ─── Active Releases ──────────────────────────    │  ← Operational (table)
│  Release    │ Health    │ Stage    │ Deadline│Owner│
│  ───────────┼───────────┼──────────┼─────────┼─────│
│  Lua · EP   │ 🟡 Atten  │ Mastering│ 5d ago  │Alex │
│  Mid Sess   │ 🟢 Heal   │ Mixing   │ 16 days │Sam  │
│  Summer EP  │ 🟢 Heal   │ Artwork  │ 3 days  │AMgr │
│  Neon Remix │ 🔴 Crit   │ Prod     │ 11 days │Alex │
│                                                    │
│  ─── Attention ────────────────────────────────     │  ← Critical/Attention
│  Alerts (2)   Blocked Work (1)   Deadlines (3)    │
│                                                    │
│  ─── Org Pulse ────────────────────────────────     │  ← Context
│  5 active │ 2 blocked │ 3 overdue │ 2 shipped      │
│                                                    │
│  ─── Recent Activity ──────────────────────────     │  ← History
│  🔵 Stage advanced · 2h ago                        │
│  🟢 Task completed · 3h ago                        │
│                                                    │
│  ─── Quick Actions ────────────────────────────     │  ← Navigation
│  New Release · New Artist · Upload Assets          │
└────────────────────────────────────────────────────┘
```

---

## Layer Order Enforcement

| Layer | Component | Condition |
|-------|-----------|-----------|
| Decision | + Create Release button | Always visible |
| Operational | OperationalSummary | Always visible |
| Operational | Active Releases Table | Always visible |
| Critical | Alerts | Hidden when 0 |
| Attention | Blocked Work | Hidden when 0 |
| Attention | Deadlines | Hidden when 0 |
| Context | Org Pulse | Always visible |
| History | Recent Activity | Always visible |
| Navigation | Quick Actions | Always visible |

---

## Content Rules

### What must appear
- Health state for every active release (not just a count)
- Release name, artist, type per row
- Current stage (actual workflow stage name, not release status)
- Deadline with relative time ("3d overdue", "Today", "In 5 days")
- Owner per release
- Aggregate health score for the organization

### What must not appear
- Per-release task lists
- Per-release stage details
- File uploads or editing forms
- Administrative settings
- Artist profiles
- Release creation form (CTA only)

### Empty states
- No active releases → "Create your first release" with CTA
- No alerts → Section collapses entirely (do not show "No alerts" empty state)
- No activity → "Activity will appear when your team takes action"
