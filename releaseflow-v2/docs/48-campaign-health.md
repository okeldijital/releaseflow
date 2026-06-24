# TASK-2203 — Campaign Health

## Concept

Campaign Health evaluates whether a marketing campaign is on track
independently from the release's health (TASK-803) and readiness
(TASK-1601). A release can be healthy but its campaign can be at risk
— or vice versa.

Three states: **On Track**, **At Risk**, **Delayed**.

Health is computed from three factors: schedule adherence, asset
readiness, and channel activation.

---

## Display

### Campaign Header

```
┌──────────────────────────────────────────────────────────┐
│  Campaign · Midnight Sessions                            │
│                                                           │
│  ┌──────────────┐                                        │
│  │  🟢 On Track  │                                        │
│  └──────────────┘                                        │
│  All milestones on schedule. 8/10 checklist complete.    │
└──────────────────────────────────────────────────────────┘
```

### Campaign Card (Marketing Hub)

```
┌──────────────────────────────────────────────┐
│  Midnight Sessions                  🟢 On Track│
│  Release: Oct 01, 2026                       │
│  ──[████████████░░░░░░]── 60% checklist       │
│  Next: "Paid ads" due Sep 20 · 3 days        │
│  Owner: Anna · 4 days since last activity    │
└──────────────────────────────────────────────┘
```

---

## Computation

### Formula

```
Campaign Health = WORST(scheduleScore, assetScore, channelScore)
```

### Factor 1: Schedule Adherence

| Condition | Score |
|-----------|-------|
| 0 overdue milestones | 🟢 On Track |
| 1 overdue milestone | 🟡 At Risk |
| 2+ overdue milestones | 🔴 Delayed |

A milestone is "overdue" when `date < now` AND `status ≠ complete` AND
`status ≠ skipped`.

### Factor 2: Asset Readiness

| Condition | Score |
|-----------|-------|
| All required assets are Ready, ≥75% of total assets are Ready | 🟢 On Track |
| ≥50% of required assets are Ready; some in Draft | 🟡 At Risk |
| <50% of required assets are Ready or any required asset is Rejected | 🔴 Delayed |

Required assets are defined by the channels activated for the campaign.
If only Instagram is active, only Instagram's asset requirements are
counted.

### Factor 3: Channel Activation

| Condition | Score |
|-----------|-------|
| All planned channels are Active or Complete | 🟢 On Track |
| At least one channel is Active, none are past due | 🟡 At Risk |
| No channels are Active, or a channel is past its scheduled start | 🔴 Delayed |

A channel is "past due" when `scheduleStart < now` AND `status = planned`.

---

## Overall Health Mapping

| Worst Factor | Overall Campaign Health |
|--------------|------------------------|
| All On Track | 🟢 On Track |
| Any At Risk | 🟡 At Risk |
| Any Delayed | 🔴 Delayed |

---

## Health Details Panel

Clicking the health badge expands a details panel:

```
┌──────────────────────────────────────────────────────────┐
│  Campaign Health Details                                  │
│                                                           │
│  ── Schedule ────────────────────────────────────────    │
│  🟢 On Track · 0 overdue milestones                       │
│  12 of 16 complete · Next: "Paid ads" due Sep 20         │
│                                                           │
│  ── Assets ──────────────────────────────────────────    │
│  🟡 At Risk · 5 of 9 required assets ready                │
│  Missing: IG Story teaser, Paid ad creative, Lyric vid   │
│     ┌──────────┐                                         │
│     │  View    │                                         │
│     └──────────┘                                         │
│                                                           │
│  ── Channels ────────────────────────────────────────    │
│  🟢 On Track · 2 active, 4 planned                        │
│  Active: Instagram, Spotify                               │
│  Planned: TikTok (Sep 24), Email (Oct 01), Ads (Sep 24)  │
│                                                           │
│  ── Recommendations ─────────────────────────────────    │
│  ⚠ "IG Story teaser" is the most urgent missing asset.    │
│     It is needed for Instagram activation (in 2 days).   │
│                                                           │
│  ⚠ "Paid ad creative" due in 3 days. Owner: Taylor.      │
│     If delayed, Meta Ads channel will miss its start.    │
└──────────────────────────────────────────────────────────┘
```

---

## Health vs Release Health vs Release Readiness

| Dimension | Release Health (TASK-803) | Release Readiness (TASK-1601) | Campaign Health (TASK-2203) |
|-----------|--------------------------|-------------------------------|-----------------------------|
| Question | "Is execution on track?" | "Can we release?" | "Is the campaign on track?" |
| Evaluates | Overdue stages, blocked stages, date proximity | Deliverable approvals, metadata, distribution | Schedule adherence, asset readiness, channel activation |
| Discrete from | — | Release Health | Release Health + Release Readiness |
| States | 🟢 Green / 🟡 Amber / 🔴 Red | 🟢 Ready / 🟡 At Risk / 🔴 Blocked | 🟢 On Track / 🟡 At Risk / 🔴 Delayed |
| Audience | PM, Admin | PM, Admin, Owner | Marketing, PM, PR |
| Display | Release card, header | Release header, overview | Campaign workspace, marketing hub |

All three can coexist with different values. Example:
- Release Health: 🟢 Green (no overdue stages)
- Release Readiness: 🔴 Blocked (missing UPC, ISRC)
- Campaign Health: 🟡 At Risk (ads creative not ready)
- Interpretation: "Production is on time, but we're missing distribution identifiers and the campaign's ad assets are slipping."

---

## Auto-Recommendations

When health is At Risk or Delayed, the system generates recommendations:

```
⚠ Recommendations

• "IG Story teaser" is 3 days overdue. It's a required asset for
  Instagram channel activation. Notify Taylor.

• Channel "Meta Ads" starts Sep 24 but has no creative assets ready.
  The asset deadline (Sep 20) is in 3 days. Escalate to Anna.

• Campaign has been "At Risk" for 5 days with no status change.
  Schedule a check-in with the marketing team.
```

---

## Data Model

```typescript
interface CampaignHealth {
  campaignId: string;
  overall: 'on_track' | 'at_risk' | 'delayed';
  factors: {
    scheduleAdherence: {
      score: 'on_track' | 'at_risk' | 'delayed';
      overdueCount: number;
      totalMilestones: number;
      completedCount: number;
    };
    assetReadiness: {
      score: 'on_track' | 'at_risk' | 'delayed';
      requiredCount: number;
      readyCount: number;
      missingAssets: { id: string; title: string; channelName: string }[];
    };
    channelActivation: {
      score: 'on_track' | 'at_risk' | 'delayed';
      activatedCount: number;
      totalPlanned: number;
      pastDueChannels: { id: string; name: string; scheduledStart: Timestamp }[];
    };
  };
  recommendations: string[];     // Auto-generated
  lastActivityAt: Timestamp;     // Latest status change in campaign
  computedAt: Timestamp;
}
```
