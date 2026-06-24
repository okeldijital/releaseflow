# TASK-2201 — Campaign Workspace

## Concept

Each release can have one active campaign. The Campaign Workspace is where
the marketing team plans, builds, and executes the promotional push around
a release. Four tabs: Assets, Schedule, Channels, Checklist.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back    Campaign · Midnight Sessions                    🟢 On Track   │
│                                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ ● Assets │ │○ Schedule│ │○ Channels│ │○Checklist│                    │
│  │  (8)     │ │ (5 ms)   │ │ (4 active)│ │ (6/10)  │                    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                    │
│                                                                           │
│  ─── Assets ───────────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Asset              │ Type      │ Version │ Status   │ Channel   │    │
│  │─────────────────────┼───────────┼─────────┼──────────┼───────────│    │
│  │  Cover art promo    │ Image     │ v2      │ ✓ Ready  │ Instagram │    │
│  │  1080×1080 JPG      │           │         │          │           │    │
│  │  ──────────────────┼───────────┼─────────┼──────────┼───────────│    │
│  │  Spotify Canvas     │ Video     │ v1      │ ✓ Ready  │ Spotify   │    │
│  │  9:16 · 6s · MP4    │           │         │          │           │    │
│  │  ──────────────────┼───────────┼─────────┼──────────┼───────────│    │
│  │  Press photo set    │ Image     │ v1      │ ✓ Ready  │ Press     │    │
│  │  3000×3000 JPG ×4   │           │         │          │           │    │
│  │  ──────────────────┼───────────┼─────────┼──────────┼───────────│    │
│  │  IG Story teaser    │ Video     │ —       │ ○ Pending│ Instagram │    │
│  │  9:16 · 15s · MP4   │           │         │          │           │    │
│  │  ──────────────────┼───────────┼─────────┼──────────┼───────────│    │
│  │  Press release      │ Document  │ v2      │ ◐ Draft  │ Press     │    │
│  │  PDF / Google Docs  │           │         │          │           │    │
│  │  ──────────────────┼───────────┼─────────┼──────────┼───────────│    │
│  │  Email newsletter   │ Copy      │ v1      │ ✓ Ready  │ Email     │    │
│  │  HTML template      │           │         │          │           │    │
│  │  ──────────────────┼───────────┼─────────┼──────────┼───────────│    │
│  │  Paid ad creative   │ Image     │ —       │ ○ Pending│ Meta Ads  │    │
│  │  1200×628 JPG ×3    │           │         │          │           │    │
│  │  ──────────────────┼───────────┼─────────┼──────────┼───────────│    │
│  │  Lyric video clip   │ Video     │ —       │ ○ Pending│ TikTok    │    │
│  │  9:16 · 30s · MP4   │           │         │          │           │    │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  + Upload Asset        ⚙ Manage Channels                         │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Asset Types

| Type | Icon | Examples | Formats |
|------|------|----------|---------|
| Image | 🖼 | Cover promo, press photos, ad creatives, banners | JPG, PNG, max 20MB |
| Video | 🎬 | Spotify Canvas, IG Reel, TikTok, YouTube Short | MP4, MOV, max 500MB |
| Document | 📄 | Press release, one-sheet, bio, EPK | PDF, Google Docs link |
| Copy | 📝 | Email templates, social captions, ad copy | Markdown inline |

### Asset Status

| Status | Meaning |
|--------|---------|
| ✓ Ready | Approved and ready to deploy |
| ◐ Draft | In progress, not yet approved |
| ○ Pending | Not started |
| ✕ Rejected | Rejected by reviewer |

---

## Section 2: Schedule

```
┌─ Schedule ───────────────────────────────────────────────────────────┐
│                                                                        │
│  Campaign period: Aug 15 – Oct 14, 2026  (60 days)                   │
│                                                                        │
│  T-45  Aug 15 ───┐  Campaign kickoff                                  │
│                   │  • Brief Marketing + PR + Designer                │
│                   │  • Share creative direction doc                   │
│                   │  Owner: Anna (Marketing)                          │
│                   │                                                    │
│  T-30  Aug 31 ───┐  Press release draft                               │
│                   │  • Write + submit v1 for internal review          │
│                   │  Owner: Jordan (PR)                               │
│                   │                                                    │
│  T-21  Sep 09 ───┐  Social assets deadline                            │
│                   │  • All images + video clips ready                 │
│                   │  • Cover promo, IG Story, TikTok clip             │
│                   │  Owner: Taylor (Designer)                         │
│                   │                                                    │
│  T-14  Sep 17 ───┐  Pre-save campaign launch                          │
│                   │  • Spotify + Apple Music pre-save links live      │
│                   │  • Social posts start                             │
│                   │  Owner: Anna (Marketing)                          │
│                   │                                                    │
│  T-7   Sep 24 ───┐  Press outreach begins                             │
│                   │  • Press release sent to media list               │
│                   │  • Review copies + interviews scheduled           │
│                   │  Owner: Jordan (PR)                               │
│                   │                                                    │
│  T-3   Sep 28 ───┐  Final review                                      │
│                   │  • All assets confirmed live-ready                │
│                   │  • Channels tested, links verified                │
│                   │  Owner: Anna (Marketing)                          │
│                   │                                                    │
│           Oct 01 ────  ★ RELEASE DAY ★                                │
│                   │  • All posts go live                              │
│                   │  • Newsletter sends                               │
│                   │  • Ads activate                                   │
│                   │  Owner: Anna (Marketing)                          │
│                   │                                                    │
│  +7   Oct 08 ───┐  Week 1 engagement report                           │
│                   │  • Compile streams, saves, playlist adds          │
│                   │  Owner: Anna (Marketing)                          │
│                   │                                                    │
│  +14  Oct 15 ───┐  Campaign close                                     │
│                   │  • Full report + retrospective                    │
│                   │  • Archive campaign assets                        │
│                   │  Owner: Anna (Marketing)                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  + Add milestone                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Section 3: Channels

```
┌─ Channels ───────────────────────────────────────────────────────────┐
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Channel         │ Status    │ Posts/Assets │ Scheduled │ Owner │ │
│  │──────────────────┼───────────┼──────────────┼───────────┼───────│ │
│  │  Instagram       │ ● Active  │ 6 posts      │ Sep 17–   │ Anna  │ │
│  │                  │           │ 3 stories    │ Oct 08    │       │ │
│  │  ───────────────┼───────────┼──────────────┼───────────┼───────│ │
│  │  TikTok          │ ○ Planned │ 2 videos     │ Sep 24–   │ Anna  │ │
│  │                  │           │              │ Oct 01    │       │ │
│  │  ───────────────┼───────────┼──────────────┼───────────┼───────│ │
│  │  Spotify         │ ● Active  │ Canvas       │ Sep 17    │ Anna  │ │
│  │  (pre-save)      │           │ Playlist pic |           │       │ │
│  │  ───────────────┼───────────┼──────────────┼───────────┼───────│ │
│  │  Email           │ ○ Planned │ Newsletter   │ Oct 01    │ Anna  │ │
│  │  (newsletter)    │           │ 1 send       │           │       │ │
│  │  ───────────────┼───────────┼──────────────┼───────────┼───────│ │
│  │  Meta Ads        │ ○ Planned │ 3 creatives  │ Sep 24–   │ Anna  │ │
│  │  (paid)          │           │              │ Oct 08    │       │ │
│  │  ───────────────┼───────────┼──────────────┼───────────┼───────│ │
│  │  Press           │ ◐ Prep   │ Press release │ Sep 24    │Jordan │ │
│  │  (outreach)      │           │ EPK, photos  │           │       │ │
│  │  ───────────────┼───────────┼──────────────┼───────────┼───────│ │
│  │  YouTube         │ ○ Planned │ Lyric video  │ Oct 01    │ Anna  │ │
│  └──────────────────┴───────────┴──────────────┴───────────┴───────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  + Add Channel                                                │     │
│  └──────────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────────┘
```

### Channel Status

| Status | Meaning |
|--------|---------|
| ● Active | Channel is live with content deployed |
| ◐ Prep | Content is being prepared |
| ○ Planned | Scheduled but not yet started |
| ✓ Complete | Channel activity is finished |

### Channel Templates

Pre-configured channels available to add:

| Channel | Default Assets Needed | Default Cadence |
|---------|----------------------|-----------------|
| Instagram | Cover promo, Story teaser, BTS clips | 1 post/day during campaign |
| TikTok | Vertical video, Trend audio | 2–3 clips |
| Spotify | Canvas, playlist pitch, pre-save link | 1-time setup |
| Apple Music | Motion art, pre-add link | 1-time setup |
| Email | HTML template, copy | 1 send (release day) |
| Meta Ads | Ad creatives (3 sizes), copy | Active for 2 weeks |
| Press | Press release, photos, EPK | 1-week push |
| YouTube | Music video, lyric video, Shorts | 1 upload + Shorts |
| Twitter/X | Card images, copy | 1 tweet/day |
| Discord | Server announcement, listening party | Event + 1 post |

---

## Section 4: Checklist

```
┌─ Checklist ──────────────────────────────────────── 6 of 10 ────────┐
│                                                                       │
│  ☑ ✓ Creative direction doc shared with team          Anna · Aug 15 │
│  ☑ ✓ Press release draft complete                     Jordan · Sep 02│
│  ☑ ✓ Cover art promo asset approved                   Taylor · Sep 05│
│  ☑ ✓ Spotify Canvas created + uploaded                Taylor · Sep 08│
│  ☑ ✓ Pre-save links active (Spotify + Apple Music)    Anna · Sep 17 │
│  ☑ ✓ Social media copy written                        Anna · Sep 18 │
│  ☐ ○ Paid ad creatives ready (Meta Ads)               Taylor · Sep 24│
│       ┌──────────┐                                                   │
│       │  Remind  │                                                   │
│       └──────────┘                                                   │
│  ☐ ○ Press outreach started (media list contacted)     Jordan · Sep 24│
│       ┌──────────┐                                                   │
│       │  Remind  │                                                   │
│       └──────────┘                                                   │
│  ☐ ○ Newsletter scheduled for Oct 01                   Anna · Sep 28 │
│       ┌──────────┐                                                   │
│       │  Remind  │                                                   │
│       └──────────┘                                                   │
│  ☐ ○ Final channel review (all links + posts tested)   Anna · Sep 30 │
│       ┌──────────┐                                                   │
│       │  Remind  │                                                   │
│       └──────────┘                                                   │
│                                                                       │
│  ██████████████████████░░░░░░░░░░  60% complete                      │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface Campaign {
  id: string;
  releaseId: string;
  releaseName: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  health: 'on_track' | 'at_risk' | 'delayed';  // TASK-2203
  startDate: Timestamp;
  endDate: Timestamp;
  owner: { id: string; name: string; role: string };
  assets: CampaignAsset[];
  schedule: CampaignMilestone[];
  channels: CampaignChannel[];
  checklist: CampaignChecklistItem[];
}

interface CampaignAsset {
  id: string;
  type: 'image' | 'video' | 'document' | 'copy';
  title: string;
  version: number;
  status: CampaignAssetStatus;
  channelIds: string[];
  uploadedAt?: Timestamp;
  uploadedBy?: { id: string; name: string };
}

interface CampaignMilestone {
  id: string;
  date: Timestamp;
  label: string;              // "T-30", "Release Day", "+7"
  title: string;
  description: string;
  owner: { id: string; name: string };
  status: 'complete' | 'pending' | 'overdue';
}

interface CampaignChannel {
  id: string;
  slug: string;               // "instagram", "tiktok", "spotify", etc.
  name: string;
  status: 'active' | 'prep' | 'planned' | 'complete';
  assetCount: number;
  scheduleStart?: Timestamp;
  scheduleEnd?: Timestamp;
  owner: { id: string; name: string };
}

interface CampaignChecklistItem {
  id: string;
  label: string;
  status: 'complete' | 'pending';
  assignee: { id: string; name: string };
  dueDate: Timestamp;
}

type CampaignAssetStatus = 'ready' | 'draft' | 'pending' | 'rejected';
```
