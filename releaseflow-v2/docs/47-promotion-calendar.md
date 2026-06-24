# TASK-2202 — Promotion Calendar

## Concept

A vertical timeline showing all campaign milestones organized by
promotion phase. Five phases: T-30, T-14, T-7, Release Day, Post Release.
Each milestone has a date, title, description, owner, and status.

The Promotion Calendar is embedded in the Campaign Workspace (Schedule
tab) and also available as a standalone view from the Marketing Hub.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Promotion Calendar · Midnight Sessions                          │
│  Street date: Oct 01, 2026                                       │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Today: Sep 15 · T-16 days until release                   │  │
│  │  ████████████████░░░░░░░░░░░░░░░░░░░░  40% through campaign│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ─── T-30: Foundation (30–15 days before) ─────── 3 of 4 done ──  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  ✓ Aug 15   Campaign kickoff                           Anna │ │
│  │     Brief sent to Marketing, PR, and Designer.               │ │
│  │                                                              │ │
│  │  ✓ Aug 22   Creative direction approved                Anna │ │
│  │     Mood board + visual direction confirmed with Artist.     │ │
│  │                                                              │ │
│  │  ✓ Aug 31   Press release draft complete              Jordan│ │
│  │     V1 submitted for internal review.                        │ │
│  │                                                              │ │
│  │  ◐ Sep 09   Social assets deadline                   Taylor│ │
│  │     All images + video clips due. IG Story teaser pending.  │ │
│  │     ┌──────────┐                                             │ │
│  │     │  Nudge   │                                             │ │
│  │     └──────────┘                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ─── T-14: Pre-Save & Tease (14–8 days before) ── 1 of 3 done ──  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  ✓ Sep 17   Pre-save campaign launch                   Anna │ │
│  │     Spotify + Apple Music pre-save links live. First social  │ │
│  │     posts scheduled.                                         │ │
│  │                                                              │ │
│  │  ○ Sep 20   Paid ad creatives ready                  Taylor│ │
│  │     Meta Ads + TikTok Spark Ads. 3 sizes per platform.      │ │
│  │     ┌──────────┐                                             │ │
│  │     │  Remind  │                                             │ │
│  │     └──────────┘                                             │ │
│  │                                                              │ │
│  │  ○ Sep 22   Email newsletter copy finalized           Anna │ │
│  │     Announcement + pre-save CTA. HTML template tested.      │ │
│  │     ┌──────────┐                                             │ │
│  │     │  Edit    │                                             │ │
│  │     └──────────┘                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ─── T-7: Press & Final Prep (7–2 days before) ─ 0 of 3 done ───  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  ○ Sep 24   Press outreach begins                     Jordan│ │
│  │     Press release + EPK sent to media contacts. Embargo:    │ │
│  │     Sep 30.                                                  │ │
│  │     ┌──────────┐                                             │ │
│  │     │  Remind  │                                             │ │
│  │     └──────────┘                                             │ │
│  │                                                              │ │
│  │  ○ Sep 26   Ads entered into Meta Ads Manager         Anna │ │
│  │     Targeting confirmed. Budget: $500 (test).                │ │
│  │                                                              │ │
│  │  ○ Sep 28   Final channel review                       Anna │ │
│  │     All posts, links, and ads tested. All assets confirmed.  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ─── Oct 01: Release Day ──────────────────────── 0 of 3 done ───  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  ○ 09:00   Social posts go live (IG, TikTok, Twitter) Anna  │ │
│  │  ○ 10:00   Newsletter sends                               │ │
│  │  ○ 12:00   Paid ads activate                              │ │
│  │     Meta Ads + TikTok Spark Ads go live.                     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ─── Post Release (1–14 days after) ──────────── 0 of 3 done ───  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  ○ Oct 02   Day 1 engagement check                      Anna │ │
│  │     Streams, saves, playlist adds. Share with team.         │ │
│  │                                                              │ │
│  │  ○ Oct 08   Week 1 engagement report                    Anna │ │
│  │     Full numbers + chart positions if applicable.            │ │
│  │                                                              │ │
│  │  ○ Oct 15   Campaign close + retrospective              Anna │ │
│  │     Final report. Archive campaign assets.                   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ─── Summary ────────────────────────────────────────────────────  │
│  5 of 16 milestones complete · 31% through campaign              │
│  Next: "Paid ad creatives ready" — due Sep 20 (3 days)           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase Templates

Each release type gets default milestones per phase:

### T-30: Foundation (30–15 days before)

| Milestone | Default Owner | Timing |
|-----------|---------------|--------|
| Campaign kickoff brief | Marketing | T-30 |
| Creative direction approved | Marketing + Artist | T-28 |
| Press release draft complete | PR | T-22 |
| Social assets deadline | Designer | T-15 |
| Influencer/playlist pitch list ready | Marketing | T-16 |

### T-14: Pre-Save & Tease (14–8 days before)

| Milestone | Default Owner | Timing |
|-----------|---------------|--------|
| Pre-save/pre-add links live | Marketing | T-14 |
| First social tease post | Marketing | T-13 |
| Paid ad creatives ready | Designer | T-12 |
| Email newsletter copy finalized | Marketing | T-10 |
| Spotify playlist pitch submitted | Marketing | T-8 |

### T-7: Press & Final Prep (7–2 days before)

| Milestone | Default Owner | Timing |
|-----------|---------------|--------|
| Press outreach begins | PR | T-7 |
| Ads entered into platform | Marketing | T-5 |
| Interview/feature confirmations | PR | T-4 |
| Final channel review | Marketing | T-2 |
| All assets confirmed live-ready | Marketing | T-1 |

### Release Day

| Milestone | Default Owner | Timing |
|-----------|---------------|--------|
| Social posts go live | Marketing | 00:00 local (or 09:00) |
| Newsletter sends | Marketing | 10:00 |
| Paid ads activate | Marketing | 12:00 |

### Post Release (1–14 days after)

| Milestone | Default Owner | Timing |
|-----------|---------------|--------|
| Day 1 engagement check | Marketing | +1 day |
| Week 1 engagement report | Marketing | +7 days |
| Ads performance review | Marketing | +7 days |
| Campaign close + retrospective | Marketing | +14 days |

---

## Milestone States

| State | Icon | Meaning |
|-------|------|---------|
| Complete | ✓ | Milestone is done |
| In Progress | ◐ | Work is happening now |
| Pending | ○ | Not yet started |
| Overdue | 🔴 | Past due date and not complete |
| Skipped | – | Intentionally skipped |

---

## Date Navigation

```
┌──────────────────────────────────────────────────────────────┐
│  ◀ Aug 2026    September 2026    October 2026 ▶             │
│                                                               │
│  ┌──┬──┬──┬──┬──┬──┬──┐  ┌──┬──┬──┬──┬──┬──┬──┐           │
│  │Mo│Tu│We│Th│Fr│Sa│Su│  │Mo│Tu│We│Th│Fr│Sa│Su│           │
│  │  │  │  │  │  │  │ 1│  │  │  │  │  │  │  │  │           │
│  │ 2│ 3│ 4│ 5│ 6│ 7│ 8│  │  │  │  │  │  │  │  │           │
│  │ 9│10│11│12│13│14│15│  │  │  │  │  │  │  │  │           │
│  │16│17│18│19│20│21│22│  │  │  │  │  │  │  │  │           │
│  │23│24│25│26│27│28│29│  │  │  │  │  │  │  │  │           │
│  │30│31│  │  │  │  │  │  │  │  │  │  │  │  │  │           │
│  └──┴──┴──┴──┴──┴──┴──┘  └──┴──┴──┴──┴──┴──┴──┘           │
│                                                               │
│  ● Sep 15 = Today     ◐ Sep 20 = Ads deadline               │
│  ★ Oct 01 = Release Day                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Compact View (Release Workspace Sidebar)

When embedded in the release workspace, the Promotion Calendar compacts:

```
┌──────────────────────────────────────┐
│  Campaign · 🟢 On Track               │
│                                       │
│  T-30: ████████░░  75% (3/4)         │
│  T-14: ████░░░░░░  33% (1/3)         │
│  T-7:  ░░░░░░░░░░  0%  (0/3)         │
│  Release Day:  Oct 01                │
│                                       │
│  Next: "Paid ads" due Sep 20         │
│  ┌────────────────────────────────┐  │
│  │  Open Campaign Workspace       │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## Data Model

```typescript
interface PromotionCalendar {
  id: string;
  campaignId: string;
  releaseId: string;
  releaseName: string;
  releaseDate: Timestamp;
  phases: PromotionPhase[];
}

interface PromotionPhase {
  id: string;
  name: string;                // "T-30: Foundation"
  slug: 't_30' | 't_14' | 't_7' | 'release_day' | 'post_release';
  startOffset: number;         // Days before/after release (negative = before)
  endOffset: number;
  milestones: CampaignMilestone[];
  progress: number;            // Completed ÷ total
}

interface CampaignMilestone {
  id: string;
  date: Timestamp;             // Actual calendar date
  phaseSlug: string;
  title: string;               // "Campaign kickoff brief"
  description: string;         // "Brief sent to Marketing, PR, and Designer."
  owner: { id: string; name: string };
  status: 'complete' | 'in_progress' | 'pending' | 'overdue' | 'skipped';
  order: number;
}
```
