# 11 — Dashboard Density Review

## Question

Can a Release Manager understand platform health within 30 seconds?

---

## Screens Evaluated

| Screen | Primary Persona | Doc |
|--------|----------------|-----|
| Operations Center | PM | 59, UI/wireframes/operations-center-v1 |
| Executive Dashboard | Owner, Admin | 60 |
| Release Overview (per-release) | PM, A&R | 14 |

---

## Evaluation Criteria

A Release Manager can understand platform health within 30 seconds if:

1. **0–5 seconds:** They see the highest-priority signal (is something
   wrong?)
2. **5–15 seconds:** They understand the scope (how many releases are
   affected? what categories?)
3. **15–25 seconds:** They can identify specific items needing attention
4. **25–30 seconds:** They know what action to take next

---

## Screen 1: Operations Center

### Density Audit (1440px viewport)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Zones (top to bottom)                                                    │
│                                                                           │
│  Z1: "Since you were away"              12 elements, 2-3 releases        │
│  Z2: Alerts section                     3 cards, 40-60px each            │
│  Z3: Blocked Work section               2 cards                           │
│  Z4: Critical Deadlines                 5 rows, 40px each                │
│  Z5: Org Pulse                          5 stat cards, 100px each          │
│                                                                           │
│  Total visible elements: 17-19                                           │
│  Vertical scroll required: Yes (~900px)                                   │
│  All data visible without clicking: Yes                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 30-Second Scan Test

| Time | What the PM sees | Information absorbed |
|------|-----------------|---------------------|
| 0–5s | Top of page. Alerts section with 🔴 badges. | "3 alerts. Critical: Lua budget, Mid Sess artwork. Warning: Sam overloaded." |
| 5–15s | Scan down. Blocked Work section. | "2 blocked. License for 12 days, budget overage for 5." |
| 15–25s | Scan further. Critical Deadlines. | "5 deadlines overdue. Lua mastering, ISRC, Mid Sess artwork — all past due." |
| 25–30s | Bottom. Org Pulse. | "5 active releases. 2 blocked stages. 3 overdue. 2 over budget. 2 shipped." |

**Assessment:** The PM understands: (a) 3 things need immediate attention,
(b) the license is the oldest blocker, (c) Lua is the most troubled
release, (d) overall 5 active releases with 2 shipped.

This is possible because:
- Color signals severity (🔴 = critical) without reading text
- Card hierarchy: alerts first (highest pri), deadlines last (tactical)
- Numbers in Org Pulse are big and scannable (H1 24px)
- Section headers with counts: "Alerts (3)" — instant scope
- Each element is one line: title + context + action. No drilling required.

### What Works

| Element | Why it works |
|---------|-------------|
| Alert cards with left border strip | Color is visible before text is read |
| "Alerts (3)" section header | The count is the signal. The list is the detail. |
| Deadline rows as compact list | 5 items in ~200px. Scannable in 2 seconds. |
| Org Pulse as stat cards | Every number visible without scrolling. |
| Acknowledge button on alerts | PM can claim ownership in 1 click. |

### What Could Be Better

| Issue | Impact | Fix |
|-------|--------|-----|
| 3 alert cards + 2 blocker cards = cognitive load at 5 items in "what's wrong" zone | Slight delay at 5-8s | Collapse Blocked Work when 0 items. Show only when >0. |
| "Since you were away" adds 4-6 lines above alerts | Pushes alerts below fold on small screens | Auto-collapse after first view. PM clicks to expand. |
| Deadline rows don't show release context at a glance | Must read text to understand which release | Add release abbreviation badge: `[LUA]` `[MID]` `[SUM]` |

---

## Screen 2: Executive Dashboard

### Density Audit (full viewport, no scroll)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Zones (single viewport)                                                  │
│                                                                           │
│  Z1: Attention banner                   1 element, 80-120px              │
│  Z2: Stat cards (4)                     1 row, 4 cards, 120px each       │
│  Z3: Budget Pulse                       4-5 bars, 40px each              │
│  Z4: Release Pulse                      5 rows, 6 columns, 40px each     │
│                                                                           │
│  Total visible elements: 14-15                                           │
│  Scroll required: No (fits viewport)                                      │
│  All data visible without clicking: Yes                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

### 30-Second Scan Test

| Time | What the Owner sees | Information absorbed |
|------|--------------------|---------------------|
| 0–5s | Attention banner. 3 items. | "Lua budget, Lua mastering, Sam overloaded. 3 things need me." |
| 5–15s | 4 stat cards: 2 critical, 2 blocked, 1 overdue, 1 shipped. | "2 critical alerts. 2 blocked stages. Okay, not great." |
| 15–25s | Budget Pulse: 5 bars. Lua red, others green. | "Only Lua is over budget. $3K. Others are fine." |
| 25–30s | Release Pulse: 5 rows. Lua has 3 red cells, others mostly green. | "Lua is the problem child. Mid Sess and Summer EP are fine. Neon Remix not started." |

**Assessment:** The Owner understands in 30 seconds: Lua is the only
release that needs their attention. Everything else is on track. They can
ignore 80% of the information and focus on the one release with problems.

### What Works

| Element | Why it works |
|---------|-------------|
| Attention banner at the top | The first thing the eye sees. Zero scrolling. |
| Color-only cells in Release Pulse | A red cell screams. 5 cells per row × 5 rows = 25 cells. In 3 seconds, the Owner spots the 3 red cells. |
| Budget Pulse as compact bars | 5 releases in 200px. Variance is visual, not numeric. |
| Single viewport, no scroll | The entire dashboard fits. The Owner's coffee doesn't go cold. |

### What Could Be Better

| Issue | Impact | Fix |
|-------|--------|-----|
| Release Pulse: 5 rows × 6 columns = 30 cells. At 1440px this is readable. At 1024px, text truncates. | Columns compress on smaller screens. Labels become "Prg", "Hlth", "Rdns". | Abbreviate column headers. Use icons with tooltips on smaller breakpoints. |
| No trend indicators | Owner sees current state but not direction. Was Lua green last week and is now red? That's more alarming. | Add △/▽ trend indicators. "Lua: 🔴 (▼ was 🟢 last week)." |

---

## Screen 3: Release Overview (per-release)

### Density Audit

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Zones                                                                    │
│                                                                           │
│  Z1: Release header + status + readiness + stage pipeline   120px        │
│  Z2: Stat cards (5)                                        1 row         │
│  Z3: Stage Pipeline (compact)                               80px         │
│  Z4: Upcoming Deadlines                                     5 items      │
│  Z5: Pending Tasks                                          3 items      │
│  Z6: Quick Actions                                          1 row         │
│                                                                           │
│  Total visible elements: 16-18                                           │
│  Scroll required: Yes (~700px)                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### 30-Second Scan Test

| Time | What the PM sees | Information absorbed |
|------|-----------------|---------------------|
| 0–5s | Header: status + readiness badges. Stage pipeline. | "Lua is in PRODUCTION, At Risk. Stages: 3 done, 1 active, 3 pending." |
| 5–15s | Stat cards: 57% progress, 5 tracks, 4 contributors, 8 tasks, 3 pending. | "Halfway done. 5 tracks. 8 active tasks." |
| 15–25s | Deadlines: 3 items. One overdue, one today. | "Mastering is overdue. Artwork starts today." |
| 25–30s | Pending tasks. Quick actions. | "3 tasks pending. Can add task, upload, or invite." |

**Assessment:** The PM understands the release's current state in 30
seconds. The stage pipeline gives the big picture. Stat cards give
granularity. Deadlines give urgency.

### What Works

| Element | Why it works |
|---------|-------------|
| Stage pipeline as visual timeline | 7 stages in a horizontal line. Done/Active/Pending is 3 shapes. No reading required. |
| Status + Readiness badges side by side | Lifecycle phase AND shipping risk in one glance. |
| Stat cards with labels | "57% Progress" — number + label, no ambiguity. |
| Deadlines as compact list | Overdue first, color-coded. PM scans in 3 seconds. |

### What Could Be Better

| Issue | Impact | Fix |
|-------|--------|-----|
| 5 stat cards takes horizontal space | On smaller screens, 5 cards overflow or need a grid | Reduce to 4 stat cards on <1024px. Drop "Pending Tasks" (redundant with task list below). |
| No health indicator on overview | Release Health (TASK-803) is shown in the Release Pulse but not on the per-release overview | Add a health dot next to the stage pipeline. "🟢 Healthy" / "🟡 At Risk" / "🔴 Blocked". |

---

## Scoring

| Screen | 0-5s Signal | 5-15s Scope | 15-25s Specifics | 25-30s Action | Score |
|--------|------------|-------------|-----------------|---------------|-------|
| Operations Center | ✅ Colors signal severity immediately | ✅ Section counts show scope | ✅ Deadline rows identify items | ✅ Buttons on every alert/blocker | **Excellent** |
| Executive Dashboard | ✅ Attention banner is the signal | ✅ Stat cards + Budget Pulse show scope | ✅ Release Pulse identifies the problem child | ✅ Click-through to release or alert | **Excellent** |
| Release Overview | ✅ Pipeline + badges = instant state | ✅ Stat cards give granularity | ✅ Deadlines + tasks identify specifics | ✅ Quick Actions bar | **Good** |

### Overall Score: **Excellent**

#### Rationale

The Operations Center and Executive Dashboard both achieve Excellent.
The Release Overview is Good — it's comprehensive but slightly less
scannable due to the 5th stat card and the absence of the health
indicator on the overview.

A Release Manager can open the Operations Center, scan for 30 seconds,
and know:
- Whether anything is on fire (alerts)
- How many releases are affected (alert count + stat cards)
- What's blocking progress (blocked work)
- What needs attention today (critical deadlines)

They can then drill into any specific release's Overview and, in another
30 seconds, understand that release's detailed state.

The Executive Dashboard serves the Owner equally well — one viewport,
zero scroll, 30 seconds, done. No drilling required for the daily pulse
check.

---

## Density to Fix for "Excellent" Across All Screens

| # | Fix | Screen | Effort |
|---|-----|--------|--------|
| 1 | Collapse "Since you were away" after first view | Operations Center | Low |
| 2 | Add release abbreviation badges to deadline rows | Operations Center | Low |
| 3 | Add trend indicators (△/▽) to Release Pulse | Executive Dashboard | Medium |
| 4 | Add health dot to release overview | Release Overview | Low |
| 5 | Reduce stat cards to 4 on <1024px | Release Overview | Low |

All 5 fixes are low/medium effort. 3 of 5 are low.
