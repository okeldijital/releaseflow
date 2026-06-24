# TASK-3001 — End-to-End Release Simulation

## Test Release

**Name:** Lua – The Fading Light
**Type:** EP
**Artist:** Kinn Timo
**Label:** Acme Records
**Target Date:** Nov 15, 2026
**Tracks:** 5
**Budget:** $15,000
**Key Complexity:**
- Track 3 (Eclipse) contains a sample from Melt 2000's "Neon Nights"
- Track 4 (Horizon) is a remix of Melt 2000
- Rights: original artist clearance + sample clearance + mechanical licenses

---

## Step 1: Release Creation

| Action | Doc | Result |
|--------|-----|--------|
| PM clicks "+ New Release" from dashboard | 11 | Modal opens, Step 1 |
| PM enters "Lua – The Fading Light" | 11 | Title accepted |
| PM selects EP type (3–6 tracks, 7 stages) | 11 | EP card highlighted |
| PM sets target date: Nov 15, 2026 | 11 | Date picker confirms |
| PM clicks Continue → Step 2 | 11 | EP Pipeline preview (7 stages) |
| PM clicks Continue → Step 3 | 11 | Summary: EP, 7 stages, Nov 15 |
| PM clicks Create → 1.5s loading → redirect | 11 | Toast: "Lua – The Fading Light created" |

**Checkpoint:** Release exists in DRAFT. `releases/abc123/overview`.

---

## Step 2: Initial Setup — Metadata & Contributors

| Action | Doc | Path |
|--------|-----|------|
| PM on Overview tab, release header shows DRAFT badge | 12, 16 | Overview |
| PM clicks Settings tab | 12 | Config |
| PM sets: Genre = Afro Tech, Subgenre = Deep House | 13 | Fields saved |
| PM sets: Label = Acme Records, Copyright = ℗ 2026 Acme Records | 13 | Saved |
| PM navigates to Tracks tab | 12 | `/releases/abc123/tracks` |
| PM adds 5 tracks: Lua, Pulse, Eclipse, Horizon, The Fading Light | 13 | Rows appear |
| PM enters duration per track (3:42, 4:15, 3:28, 5:01, 4:50) | 13 | Auto-save |
| ISRC auto-generates for all 5 tracks | 13, 20 | 5 ISRCs assigned |
| PM navigates to Contributors tab | 12 | `/releases/abc123/contributors` |
| PM adds Kinn Timo as Primary Artist | 17 | Artist assigned |
| PM adds Kinn Timo as Producer | 17 | Producer assigned |
| PM adds Sam Wilson as Mix Engineer | 17 | Engineer assigned |
| PM adds Taylor as Artwork Designer | 17 | Designer assigned |

**Hesitation point:** Does Kinn Timo need to be added as both Artist AND Producer separately, or is there a bulk-add? Currently doc 17 shows single-add — the PM must do it twice.

**Checkpoint:** 5 tracks, 4 contributors, release in DRAFT.

---

## Step 3: Status Transition — DRAFT → PLANNING

| Action | Doc | Result |
|--------|-----|--------|
| PM sees status badge: DRAFT on release header | 16 | Gray border |
| PM clicks status badge — dropdown: "Begin Planning" | 16 | Status change |
| Server validates: release has title + type → OK | 16 | DRAFT → PLANNING |
| Status badge updates: blue PLANNING | 16 | Blue pill |

**Hesitation point:** Where does the PM click to advance status? Doc 16 defines allowed transitions but no UI element (button/dropdown location) is specified. The release header has the badge — is the badge interactive?

---

## Step 4: Planning Stage

| Action | Doc | Path |
|--------|-----|------|
| PM opens Workflow tab | 12, 28 | `/releases/abc123/workflow` |
| Workflow Board renders: 7 columns | 28 | Planning column shows Active |
| PM clicks Planning column → Stage Detail panel opens | 29 | Right slide-out |
| PM sets: Owner = Alex (PM), Due date = Sep 01 | 29 | Assignments saved |
| PM clicks "View Tasks" → Task Board opens | 31 | `/releases/abc123/workflow/planning/tasks` |
| PM creates task: "Finalize track listing" → assigns to Alex PM | 31 | Task in TODO column |
| PM creates task: "Confirm EP structure with Kinn Timo" → assigns to Alex PM | 31 | Task in TODO column |
| PM creates task: "Book studio for Oct 01–05" → assigns to Alex PM | 31 | Task in TODO column |
| PM drags "Finalize track listing" → In Progress → Review → Done | 31 | Status transitions |
| PM completes remaining 2 tasks | 31 | All tasks DONE |
| Stage auto-advances: Planning → COMPLETED | 28, 5 | Production activates |

**Hesitation point:** 3 tasks for a stage labeled "Planning" — is this the right granularity? Doc 29 says "all tasks done → stage advances" but doesn't specify minimum task count or whether zero tasks = auto-advance.

---

## Step 5: Production Stage

| Action | Doc | Path |
|--------|-----|------|
| Production stage auto-activates | 28 | Column highlight: Active |
| PM assigns tasks to Producer Z | 31 | "Record stems for Lua" etc. |
| Producer Z logs in, sees Contributor Home | 42 | Dashboard |
| Producer sees 5 tasks: one per track | 42 | Task cards |
| Producer uploads stems to Deliverable Workspace per track | 34, 42 | Files attached |
| Producer marks each task complete | 31 | Tasks → DONE |
| Stage auto-advances: Production → COMPLETED | 5 | Mixing activates |

**Checkpoint:** 5 tracks recorded. Stems uploaded. Production complete.

---

## Step 6: Mixing Stage

| Action | Doc | Path |
|--------|-----|------|
| Mixing stage auto-activates | 28 | Active column |
| PM assigns mixing tasks to Sam Wilson (Mix Eng) | 31 | 5 tasks |
| Sam logs in → Contributor Home → sees 5 mixing tasks | 42 | Task cards with deadlines |
| Sam downloads stems from Deliverable Workspace | 42 | Per-track downloads |
| Sam works offline (3 days) | — | — |
| Sam uploads mix files v1 per track to Deliverable Workspace | 34, 36 | v1 files attached |
| Sam submits Mixing stage for review | 35, 40 | Stage → REVIEW |
| A&R (Sam Wilson, different person — same first name) receives notification | 41, 35 | Approval requested |
| A&R opens Review Panel from notification | 35, 40 | Audio player visible |
| A&R listens to Lua (Track 1): approved mentally | 35 | — |
| A&R listens to Pulse (Track 2): approved mentally | 35 | — |
| A&R listens to Eclipse (Track 3): "Hi-hat too bright, needs taming" | 35 | Mental note |
| A&R listens to Horizon (Track 4): approved | 35 | — |
| A&R listens to The Fading Light (Track 5): "Vocal feels buried in second verse" | 35 | Mental note |
| A&R clicks Request Changes | 35, 40 | Dialog opens |
| A&R writes: "Track 3 hi-hat tame 2dB. Track 5 vocal raise 2dB in verse 2." | 35 | Feedback saved |
| Sam receives notification: changes requested | 41, 61 | 🟡 Warning alert |
| Sam adjusts 2 tracks, uploads v2 | 36, 34 | New versions |
| Sam resubmits | 35, 40 | Stage → REVIEW |
| A&R reviews v2, approves | 35 | Stage → COMPLETED |

**Hesitation point:** The Review Panel (doc 35) shows ONE audio file with waveform — but an EP has 5 tracks. Does the reviewer listen to all 5 from one panel? Are there per-track review buttons? Doc 35 shows "Track 1, Track 2..." with Listen buttons but doesn't specify bulk approve/reject.

---

## Step 7: Mastering Stage

Same flow as Mixing, shorter. Sam Wilson masters all 5 tracks, submits, A&R approves. No revisions needed.

**Checkpoint:** All audio deliverables approved. Mixing and Mastering complete.

---

## Step 8: Artwork Stage

| Action | Doc | Path |
|--------|-----|------|
| Artwork stage activates | 28 | Active column |
| PM assigns Taylor (Designer) to Cover Art task | 31 | Task created |
| PM attaches creative brief: "Dark moody aesthetic, midnight blue tones, Kinn Timo silhouette centered. Title in thin serif. No text on the bottom third." | 32 | Brief in description |
| Taylor logs in → Contributor Home | 42 | Design dashboard |
| Taylor sees: "Cover art for Lua – The Fading Light" with brief inline | 42 | Card with thumbnail placeholder |
| Taylor uploads v1 — rough concept | 36 | v1 uploaded |
| Taylor uploads v2 — with feedback from Artist | 36 | v2 uploaded |
| Taylor uploads v3 — final version | 36 | v3 uploaded |
| Taylor submits v3 for review | 35, 36 | Status → Submitted |
| A&R opens review panel for artwork | 35 | Image preview visible |
| A&R clicks Compare: v2 vs v3 | 36 | Side-by-side comparison |
| A&R approves v3 | 35 | Stage → COMPLETED |

**Hesitation point:** Doc 36's compare view has 3 modes (side-by-side, overlay, difference). Switching between them requires clicking 3 buttons. On mobile, this would be cumbersome.

---

## Step 9: Pre-Release — Completeness & Rights

| Action | Doc | Path |
|--------|-----|------|
| PM opens Requirements Workspace | 38 | `/releases/abc123/requirements` |
| Requirements show: Audio (5/5 met ✓), Artwork (1/1 met ✓), Metadata (3/4 — UPC missing ✕), Distribution (0/3 — all missing ✕) | 38 | Status grid |
| PM opens Distribution Workspace | 43 | `/releases/abc123/distribution` |
| PM sees Metadata tab: Title ✓, Genre ✓, Label ✓, Copyright ℗ ✕, Copyright © ✕, UPC ✕ | 43 | Red missing fields |
| PM fills: Copyright ℗ = "℗ 2026 Acme Records" | 43 | Saved |
| PM fills: Copyright © = "© 2026 Kinn Timo" | 43 | Saved |
| PM generates UPC | 43 | UPC assigned |
| PM switches to Tracks tab | 43 | All 5 tracks show ISRC ✓ |
| PM clicks "Re-run validation" | 44 | DSP Readiness Report runs |
| Report: 0 critical issues, 2 warnings (Spotify Canvas missing, Apple Motion missing — both optional) | 44 | 🟡 READY WITH WARNINGS |
| PM opens Delivery Checklist | 45 | 24 items |
| PM checks off items 1–18 (all audio, artwork, metadata checks) | 45 | Progress: 18/24 |
| 6 items remain: UPC ✓ now, Copyright ✓ now, 4 optional items (Canvas, Motion, Press Release, Social Kit) | 45 | Optional items don't block |
| PM leaves optional items unchecked | 45 | Submit button: ENABLED |

Now the rights complexity emerges.

| Action | Doc | Path |
|--------|-----|------|
| PM opens Ownership Workspace | 52 | `/releases/abc123/ownership` |
| Master Rights: "℗ 2026 Acme Records" — Owner: Acme Records 100%. ✓ | 52 | Clear |
| Publishing Rights tab: Track 1–5 need writer/publisher splits | 52 | Empty per-track tables |
| PM uses Split Editor: Kinn Timo 50% (Writer, SAMRO), Acme Publishing 25% (Publisher, SAMRO), Artist Y 25% (Co-writer, ASCAP) | 53 | 100% ✓ |
| PM "Applies to all tracks" — bulk action | 53 | All 5 tracks get same split |
| Mechanical Rights tab: Track 3 flagged — contains sample from Melt 2000 | 52 | Warning |
| PM clicks Track 3: "Eclipse contains sample from 'Neon Nights' by Melt 2000 / Melodic Publishing" | 52 | License status: Pending |
| PM clicks Track 4: "Horizon is a remix of Melt 2000 original" | 52 | License status: Pending |
| PM marks both tracks: "Sample clearance requested Aug 15. Awaiting Melodic Publishing." | 52 | Status: Pending |
| PM opens Rights Readiness | 54 | ⚖ RIGHTS NOT CLEARED |
| 2 mechanical licenses pending. Blocking distribution? | 54 | Critical rules: YES — non-original tracks without Secured license = NOT CLEARED |

**Major hesitation point:** The release is technically ready (all audio approved, all metadata complete, delivery checklist passed) but can't legally ship because the mechanical licenses aren't secured. The PM now has a stalled release with no clear escalation path for the rights holder (Melt 2000 / Melodic Publishing).

**Gap:** No "Escalate to Rights Holder" or "Follow Up on License" workflow exists. The PM just waits.

---

## Step 10: Rights Resolution

| Action | Doc | Status |
|--------|-----|--------|
| PM follows up with Melodic Publishing (off-platform — email/phone) | — | Out of band |
| Melodic Publishing approves sample + remix license | — | Off-platform |
| PM returns to Mechanical Rights tab, marks both licenses as Secured | 52 | Status: Secured ✓ |
| PM re-runs Rights Readiness | 54 | ⚖ RIGHTS CLEARED |

**Gap:** License status transitions are manual (PM clicks "Secured"). No integration with rights management platforms or contract tracking. This is expected for V1 but should be noted.

---

## Step 11: Campaign

| Action | Doc | Path |
|--------|-----|------|
| Anna (Marketing) opens Campaign Workspace | 46 | `/releases/abc123/campaign` |
| Creates campaign: Oct 15 – Nov 29 (45 days, T-30 to +14) | 46 | Campaign active |
| Sets budget: $4,000 (from advertising budget category) | 46, 55 | Linked to budget |
| Uploads assets: cover promo, IG teaser, Spotify Canvas | 46 | 3 assets |
| Configures channels: Instagram, Spotify, TikTok, Email, Meta Ads | 46 | 5 channels |
| Promotion Calendar populates with 16 milestones across 5 phases | 47 | Timeline visible |
| Campaign Health: 🟢 On Track | 48 | All milestones scheduled |

---

## Step 12: Release Day — Nov 15

| Action | Doc | Result |
|--------|-----|--------|
| PM opens Release Readiness Dashboard | 37 | 🟢 READY |
| All 4 dimensions green: Audio ✓, Artwork ✓, Metadata ✓, Distribution ✓ | 37 | Ready to ship |
| PM opens Delivery Checklist — all required items checked | 45 | 18/18 required |
| PM opens DSP Readiness Report — 🟡 READY WITH WARNINGS | 44 | No blocking issues |
| PM opens Distribution Workspace → Packaging tab | 43 | All DSPs show green |
| PM clicks "Submit to Spotify, Apple Music, Amazon Music, Tidal" | 43 | Submission starts |
| **Gap:** No submission status/confirmation flow exists. Does the PM see a spinner? A toast? A new status page? | — | **Undefined** |
| Assume: toast "Submitted to 4 DSPs" → Distribution Workspace shows per-DSP status | — | Implied by doc 43 |
| Release status: READY → RELEASED (manual by PM) | 16 | Green RELEASED badge |
| Campaign executes: social posts, newsletter, ads per Promotion Calendar | 47 | 8 milestones fire |
| Info alert fires: "Lua – The Fading Light released" | 61 | 🔵 Info |

---

## Step 13: Post-Release

| Action | Doc | Result |
|--------|-----|--------|
| Day +1: Anna checks engagement | 47 | Milestone: Day 1 check |
| Day +7: Anna compiles Week 1 report | 47 | Milestone: Week 1 report |
| Day +14: Campaign close + retrospective | 47, 46 | Campaign → Completed |
| 30 days: Auto-archive check runs | 16 | No pending tasks → ARCHIVED |

---

## Gaps Found

| # | Gap | Severity | Where |
|---|-----|----------|-------|
| 1 | Status transition UI undefined — how does PM click from DRAFT → PLANNING? | High | Doc 16 defines transitions, no button spec |
| 2 | Bulk review for EP/Album missing — A&R reviews 5 tracks one by one in same panel | Medium | Doc 35 shows single-track review |
| 3 | "Submit to DSPs" has no confirmation/loading/status flow | High | Doc 43 shows button, no pipeline |
| 4 | Mechanical license resolution is entirely off-platform | High | Doc 52 shows status field, no workflow |
| 5 | No "Apply to all tracks" for publishing splits (bulk) | Medium | Doc 53 shows single-track split editor |
| 6 | Compare mode switching requires 3 clicks | Low | Doc 36: side-by-side / overlay / difference |
| 7 | Title field length — "Lua – The Fading Light" is 23 chars. How does it truncate in sidebar/release cards? | Low | Not specified |
| 8 | Can a release be blocked by rights while otherwise ready? | Medium | Docs 37/54 don't cross-reference |
| 9 | No "Escalate license" workflow for stalled mechanical rights | High | Doc 52 has status, no action |
| 10 | Post-release monitoring page missing | Medium | No spec for RELEASED state dashboard |

---

## Verdict

The release **could** ship with the existing specs if all out-of-band
actions (license negotiation, DSP submission) are resolved externally.
However, 3 high-severity gaps (status transition UI, DSP submission flow,
license escalation) would create friction that a PM cannot resolve from
within ReleaseFlow.
