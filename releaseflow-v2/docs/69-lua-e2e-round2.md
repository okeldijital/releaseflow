# TASK-BS-101 — Lua E2E Round 2

## Focus Areas

1. **Status transitions** — Every transition must have a defined UI element
2. **Dependency tracking** — The mechanical license from Pending to Secured
3. **Campaign flow** — Full lifecycle: creation → execution → close
4. **Distribution flow** — DSP readiness → validation → submission → live

## Test Release (same as Round 1)

**Release:** Lua – The Fading Light · EP · Kinn Timo · Nov 15, 2026

---

## Focus 1: Status Transitions

### Transition Map with UI Elements

| Transition | Trigger | UI Element | Doc |
|------------|---------|-----------|-----|
| DRAFT → PLANNING | PM clicks status badge dropdown | Release header status badge is interactive. Clicking opens dropdown: "Begin Planning" | 12, 16 |
| PLANNING → PRODUCTION | PM clicks status badge → "Start Production" | Same dropdown, guard: ≥1 track + ≥1 contributor | 12, 16 |
| PRODUCTION → ON HOLD | PM clicks status badge → "Put on Hold" | Opens reason dialog (min 10 chars) | 16, 29 |
| ON HOLD → PRODUCTION | PM clicks status badge → "Resume" | Guard: ON HOLD status only | 16 |
| PRODUCTION → READY | Auto when all stages COMPLETE | No manual trigger — system transitions | 5, 16 |
| READY → RELEASED | PM clicks status badge → "Publish" | Guard: release date ≤ today. Confirmation dialog. | 16 |
| READY → PRODUCTION | PM clicks status badge → "Reopen" | Guard: Owner/Admin only. Audit-logged. | 16 |
| RELEASED → ARCHIVED | Auto (30 days + 0 pending tasks) OR PM clicks "Archive" | Confirmation: "Archive Lua – The Fading Light? This is permanent." | 16 |

### Status Badge Interaction Spec

```
┌──────────────────────────────────────────────────────┐
│  Midnight Sessions  Single · Artist X                 │
│                                                       │
│  ┌───────────┐                                       │
│  │ DRAFT  ▼  │  ← Clickable badge with dropdown      │
│  └───────────┘                                       │
│     │                                                 │
│     ▼                                                 │
│  ┌─────────────────────┐                              │
│  │  Begin Planning     │  ← Allowed transition        │
│  │  ─────────────────  │                              │
│  │  Cancel Release     │  ← Destructive, confirmation │
│  └─────────────────────┘                              │
└──────────────────────────────────────────────────────┘
```

**Result:** All 8 transitions have a defined UI trigger. The status badge
is interactive. The dropdown shows only allowed transitions from the
current state. Destructive transitions (Cancel, Archive) require
confirmation.

---

## Focus 2: Dependency Tracking

### The Mechanical License — Full Lifecycle

```
Step 1: PM discovers dependency
  → Opens Requirements Workspace (doc 38)
  → Sees: Mechanical Rights tab: "Eclipse: Sample — License: Pending"
  → Opens Dependency Workspace (doc 66)
  → Adds external dependency:
      Type: Mechanical License
      Rights holder: Melodic Publishing
      Contact: legal@melodicpublishing.com
      Blocks: Distribution stage, Track 3 (Eclipse), Track 4 (Horizon)
      Est. resolution: Sep 15

Step 2: PM logs first contact
  → From Dependency Workspace, clicks "Follow Up"
  → Logs: "Emailed legal@melodicpublishing.com, Aug 25"
  → Dependency status: Contacted
  → System schedules auto-reminder: Aug 30 (5 days)

Step 3: No response (5 days)
  → Auto-reminder fires: 🔴 "Follow up on Melodic Pub license — no response in 5 days"
  → PM opens Blocker Dashboard (doc 67), clicks "Follow Up"
  → Logs: "Follow-up email sent. No response."
  → Dependency status still: Contacted
  → System schedules next reminder: Sep 04

Step 4: No response (14 days)
  → Third contact logged: "Called +1-555-0100, left voicemail"
  → Blocker shows: "14 days · 3 contact attempts · No response"
  → PM clicks "Escalate" → assigns to Jane Admin
  → Jane receives Critical alert (doc 61): "Mechanical license unresolved for 14 days"

Step 5: Jane Admin intervenes
  → Jane contacts Melodic Publishing by phone (off-platform)
  → Melodic Pub approves the license over the phone, sends confirmation email
  → Jane returns to Dependency Workspace
  → Clicks "Resolve" on the dependency
  → Status: Secured ✓
  → Dependency auto-resolves
  → Blocker Dashboard: "License — Resolved" moves to Recently Resolved
  → Dependency Timeline: License bar turns green (✓ complete)

Step 6: Cascade clears
  → Distribution stage auto-unblocks (dependency resolved)
  → Rights Readiness (doc 54) re-runs: ⚖ RIGHTS CLEARED
  → Release Readiness (doc 37) updates: Distribution → 🟢 Ready
  → PM receives Info alert: "All dependencies resolved for Lua"
```

### Dependency Tracking Verdict

| Criterion | Status |
|-----------|--------|
| Dependency creation has UI | ✅ Dependency Workspace (doc 66) |
| Contact tracking has UI | ✅ Contact attempt log in dep detail |
| Auto-reminders exist | ✅ System schedules at 5/10/15 days |
| Escalation path exists | ✅ "Escalate" button + Critical alert |
| Resolution has UI | ✅ "Resolve" button, dependency transitions |
| Cascade clearing is visible | ✅ Auto-unblock + alerts on resolution |

---

## Focus 3: Campaign Flow

### Lua Campaign — Full Trace

```
Phase 1: Creation (Oct 01 — T-45)
  → Anna (Marketing) opens Campaign Workspace (doc 46)
  → Creates campaign: "Lua Release Campaign"
  → Period: Oct 01 – Nov 29 (60 days)
  → Budget: $4,000 (linked to Advertising budget category)
  → Promotion Calendar (doc 47) auto-populates 16 milestones

Phase 2: Asset Collection (T-30 to T-14)
  → Anna opens Assets tab
  → Uploads: Cover promo (1080×1080), IG Story teaser (9:16 MP4),
             Spotify Canvas (9:16 6s MP4), Press photo set (×4)
  → All 4 assets: Ready ✓

Phase 3: Channel Activation
  → Anna opens Channels tab
  → Activates: Instagram (6 posts + 3 stories scheduled)
               Spotify (Canvas + pre-save link)
               TikTok (2 videos)
               Email (1 newsletter)
               Meta Ads (3 creatives, $4,000 budget)
  → 5 channels: Active ●

Phase 4: Campaign Execution (T-14 to Release Day)
  → Promotion Calendar tracks 16 milestones across 5 phases
  → T-14: Pre-save campaign launch (Sep 17)
  → T-7: Press outreach begins (Sep 24)
  → T-3: Final review (Sep 28)
  → Release Day (Oct 01): Social posts, newsletter, ads go live
  → Campaign Health (doc 48): 🟢 On Track throughout

Phase 5: Post-Release (Release Day to +14)
  → Day +1: Engagement check
  → Day +7: Week 1 report
  → Day +14: Campaign close + retrospective
  → Campaign status: Completed → Archived

Phase 6: Cross-Reference
  → Campaign costs flow to Budget Workspace (doc 55):
      Advertising category: $4,000 planned → $4,000 approved
  → Campaign assets visible in Artist Workspace (doc 49):
      Kinn Timo → Campaigns tab → Lua Release Campaign
```

### Campaign Flow Verdict

| Criterion | Status |
|-----------|--------|
| Creation flow | ✅ Campaign Workspace + Promotion Calendar |
| Asset management | ✅ Assets tab with per-channel linking |
| Channel activation | ✅ 10 channels, each with status |
| Timeline with milestones | ✅ 5-phase Promotion Calendar |
| Health tracking | ✅ Campaign Health (doc 48) |
| Cross-reference to budget | ✅ Linked via Advertising category |
| Cross-reference to artist | ✅ Artist Workspace Campaigns tab |
| Post-release close | ✅ Complete → Archived |

---

## Focus 4: Distribution Flow

### Lua Distribution — Full Trace

```
Step 1: Pre-flight Checks
  → PM opens Distribution Workspace (doc 43)
  → Metadata tab: Title ✓, Genre ✓, Label ✓, Date ✓
                  Copyright ℗ ✓ (filled in Round 1)
                  Copyright © ✓ (filled in Round 1)
                  UPC ✓ (generated in Round 1)
  → Tracks tab: All 5 ISRCs ✓, durations ✓, explicit flags ✓
  → Artwork tab: Resolution ✓ (3000×3000), Format ✓ (JPG),
                 Color space ✓ (sRGB), File size ✓ (4.2MB)
  → Compliance tab: Parental Advisory ✓, Licensing ✓
  → Packaging tab:
      Spotify    ✓ Master WAV + ✓ Artwork + ✓ Metadata
      Apple Music ✓ Master WAV + ✓ Artwork + ✓ Metadata
      Amazon      ✓ Master WAV + ✓ Artwork + ✓ Metadata
      Tidal       ✓ Master WAV + ✓ Artwork + ✓ Metadata

Step 2: Automated Validation
  → PM clicks "Re-run validation" (doc 44)
  → DSP Readiness Report:
      🔴 NOT READY → 🟢 READY (all critical issues resolved)
      ✓ ISRC: All 5 tracks assigned
      ✓ UPC: GS1 GTIN-12 assigned
      ✓ Artwork: All automated checks passed
      ✓ Metadata: All fields complete

Step 3: Delivery Checklist
  → PM opens Delivery Checklist (doc 45)
  → All 18 required items checked ✓
  → Progress: 18/18 required · 100%
  → Submit button: ENABLED with glow pulse

Step 4: Submission
  → PM clicks "Submit to Spotify, Apple Music, Amazon Music, Tidal"
    (doc 43, Packaging tab)
  → Confirmation dialog (NEW — designed in this doc):

┌──────────────────────────────────────────────────────────────┐
│  Submit Lua – The Fading Light to DSPs?                      │
│                                                               │
│  Release: Lua – The Fading Light (EP)                        │
│  Artist: Kinn Timo                                            │
│  Street date: Nov 15, 2026                                    │
│                                                               │
│  Submitting to:                                                │
│  ✓ Spotify    ·  5 tracks  ·  Cover art v3  ·  DDEX          │
│  ✓ Apple Music · 5 tracks  ·  Cover art v3  ·  DDEX          │
│  ✓ Amazon     ·  5 tracks  ·  Cover art v3  ·  DDEX          │
│  ✓ Tidal      ·  5 tracks  ·  Cover art v3  ·  DDEX          │
│                                                               │
│  ⚠ This action cannot be undone. DSPs typically process      │
│     submissions within 24–48 hours.                           │
│                                                               │
│  ┌──────────────────┐ ┌──────────┐                           │
│  │  Submit to DSPs  │ │  Cancel  │                           │
│  └──────────────────┘ └──────────┘                           │
└──────────────────────────────────────────────────────────────┘

  → PM clicks "Submit to DSPs"
  → Loading state: per-DSP progress spinners

Step 5: Submission Status Dashboard (NEW)

┌──────────────────────────────────────────────────────────────┐
│  Submission Status · Lua – The Fading Light                  │
│                                                               │
│  Submitted: Oct 02, 2026 · 10:15 AM                           │
│                                                               │
│  Spotify      ◐ Processing                                    │
│  Apple Music  ◐ Processing                                    │
│  Amazon       ◐ Processing                                    │
│  Tidal        ◐ Processing                                    │
│                                                               │
│  Expected: 24–48 hours. You'll be notified when each DSP     │
│  responds.                                                    │
└──────────────────────────────────────────────────────────────┘

  → 6 hours later:
      Spotify      ✓ Approved — Expected live: Oct 03
      Apple Music  ✓ Approved — Expected live: Oct 03
      Amazon       ◐ Processing
      Tidal        ◐ Processing

  → 12 hours later:
      All 4 DSPs: ✓ Approved
      ReleaseFlow → RELEASED status

Step 6: Live Monitoring (NEW)
  → Overview tab transforms to Release Monitoring view:

┌──────────────────────────────────────────────────────────────┐
│  Lua – The Fading Light · Released Oct 01, 2026              │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Spotify  │ │  Apple   │ │  Amazon  │ │  Tidal   │       │
│  │ ✓ Live   │ │ ✓ Live   │ │ ✓ Live   │ │ ✓ Live   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  Days since release: 1                                        │
│  Campaign: 🟢 On Track (T+1 milestone reached)               │
│                                                               │
│  ─── Post-Release Tasks ───────────────────────────────────  │
│  ○ Day +7: Campaign engagement report                        │
│  ○ Day +14: Campaign close + retrospective                  │
│  ○ Day +30: Auto-archive check                               │
└──────────────────────────────────────────────────────────────┘
```

### Distribution Flow Verdict

| Criterion | Round 1 | Round 2 |
|-----------|---------|---------|
| DSP readiness check | ✅ Doc 44 | ✅ Same |
| Delivery checklist | ✅ Doc 45 | ✅ Same |
| Submission button | ❌ No confirmation/status flow | ✅ Confirmation dialog + submission dashboard |
| Per-DSP status tracking | ❌ Not specified | ✅ Processing → Approved → Live |
| Post-release monitoring | ❌ Not specified | ✅ Release Monitoring view |
| Submission flow complete | ❌ Gap | ✅ Filled |

### New Docs Created

| Doc | Title | Purpose |
|-----|-------|---------|
| 66 | Dependency Workspace | Dependency creation, contact tracking, resolution |
| 67 | Blocker Dashboard | Cross-release blocked items, escalation |
| 68 | Dependency Timeline | Gantt forecast, critical path, "what if" mode |

Plus this doc defines:
- Status badge dropdown with allowed transitions
- DSP submission confirmation dialog
- Submission status dashboard with per-DSP progress
- Release Monitoring view for post-release

---

## Round 2 vs Round 1

| Area | Round 1 Status | Round 2 Status |
|------|---------------|---------------|
| Status transitions | ❌ No UI element defined | ✅ Status badge dropdown |
| Dependency tracking | ❌ Entirely off-platform | ✅ Dependency Workspace + Blocker Dashboard + Timeline |
| Campaign flow | ✅ Defined | ✅ Verified — full trace |
| Distribution flow | ❌ No submission pipeline | ✅ Confirmation + progress + live monitoring |
| Post-release | ❌ No monitoring view | ✅ Release Monitoring view |
| High-severity gaps | 3 | 0 |
