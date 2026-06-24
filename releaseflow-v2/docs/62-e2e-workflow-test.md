# TASK-3001 — End-to-End Workflow Test

## Test Release

**Name:** Midnight Sessions
**Type:** Single
**Artist:** Artist X
**Label:** Acme Records
**Target Date:** Oct 01, 2026
**Tracks:** 4

---

## Step 1: Release Creation

| Action | Doc | Status |
|--------|-----|--------|
| PM clicks "+ New Release" from dashboard | 11, 21 | ✅ |
| Enters title, selects Single, sets date Oct 01 | 11 | ✅ |
| Previews Single Pipeline (7 stages) | 11, 15 | ✅ |
| Reviews summary and clicks "Create" | 11 | ✅ |
| Redirected to `/releases/{id}/overview` with toast | 11 | ✅ |

---

## Step 2: Initial Setup

| Action | Doc | Status |
|--------|-----|--------|
| PM sees release header with DRAFT status badge | 12, 16 | ✅ |
| Overview tab shows 0% progress, empty stat cards | 14 | ✅ |
| PM navigates to Tracks tab, adds 4 tracks | 12, 13 | ✅ |
| PM enters title, duration, ISRC per track | 13 | ✅ |
| PM navigates to Contributors tab, adds Artist X + Producer Z | 12, 17 | ✅ |
| PM begins planning: DRAFT → PLANNING | 16 | ✅ |

**Gap:** No explicit doc for how the user clicks "Begin Planning" on the status. The transition exists in the status model (doc 16) but no button spec.

---

## Step 3: Planning Stage

| Action | Doc | Status |
|--------|-----|--------|
| PM opens Workflow tab, sees Workflow Board | 28 | ✅ |
| PM clicks "Planning" column, opens Stage Detail | 29 | ✅ |
| PM sets owner (Alex), due date (Aug 15) | 29 | ✅ |
| PM opens Task Board within Planning | 31 | ✅ |
| PM creates tasks: "Draft release plan", "Confirm track list", "Book session" | 31 | ✅ |
| Assigns tasks to Alex PM, Sam A&R | 31 | ✅ |
| Mark tasks complete as work finishes | 31 | ✅ |
| PM advances Planning → COMPLETE. Production activates. | 28, 29, 5 | ✅ |

**Gap:** The task board (doc 31) lives within a stage, but how does a PM navigate from Workflow Board → Stage Detail → Task Board? Is there a "View Tasks" button on the stage column? Doc 28 shows it.

---

## Step 4: Production Stage

| Action | Doc | Status |
|--------|-----|--------|
| Producer Z logs in, sees Contributor Home | 42 | ✅ |
| Producer sees task "Record stems for all 4 tracks" | 42, 33 | ✅ |
| Producer starts work, uploads stems to Deliverable Workspace | 42, 34 | ✅ |
| Producer marks task complete | 42, 31 | ✅ |
| PM reviews deliverables in Deliverable Workspace | 34 | ✅ |

**Gap:** Deliverable Workspace (doc 34) links deliverables to stages via `stageId`, but the contributor home (doc 42) doesn't show which deliverable they're working on — it shows tasks. The connection between "task → deliverable" is implicit.

---

## Step 5: Mixing Stage

| Action | Doc | Status |
|--------|-----|--------|
| PM activates Mixing stage | 28 | ✅ |
| Sam Wilson (Mix Eng) assigned to mixing tasks | 31, 32 | ✅ |
| Sam uploads mix files v1 | 36, 34 | ✅ |
| Sam submits for review | 35, 40 | ✅ |
| A&R opens Review Panel | 35, 40 | ✅ |
| A&R requests changes: "Vocal too loud in Track 2" | 35 | ✅ |
| Sam uploads v2, resubmits | 36, 35 | ✅ |
| A&R approves | 35 | ✅ |

**Gap:** The versioning UX (doc 36) supports v1→v2, but the Approval UX (doc 40) doesn't explicitly reference versioning. Does the reviewer see which version they're reviewing? Doc 35 shows "v2" in the header, so yes — but the link between the two specs could be tighter.

---

## Step 6: Mastering Stage

| Action | Doc | Status |
|--------|-----|--------|
| Sam Wilson masters all 4 tracks | 31, 32 | ✅ |
| Sam uploads master files v1 | 36, 34 | ✅ |
| A&R + Artist review and approve | 35 | ✅ |

---

## Step 7: Artwork Stage

| Action | Doc | Status |
|--------|-----|--------|
| Taylor (Designer) logs in, sees Contributor Home | 42 | ✅ |
| Taylor sees "Cover art" task with creative brief | 42 | ✅ |
| Taylor uploads Cover Art v1, v2, v3 (iterations) | 36 | ✅ |
| Taylor submits v3 for review | 36, 35 | ✅ |
| A&R approves v3 | 35 | ✅ |

---

## Step 8: Pre-Release Preparation

| Action | Doc | Status |
|--------|-----|--------|
| PM opens Requirements Workspace | 38 | ✅ |
| PM sees metadata gap: UPC missing, Copyright © missing | 38 | ✅ |
| PM opens Distribution Workspace | 43 | ✅ |
| PM runs DSP Readiness Report | 44 | ✅ |
| Report shows: Track 4 missing ISRC, UPC missing, artwork OK | 44 | ✅ |
| PM fixes ISRC, assigns UPC, sets Copyright | 43, 44 | ✅ |
| PM opens Delivery Checklist | 45 | ✅ |
| PM checks off: Cover Artwork ✓, Master WAV ✓, ISRC ✓, UPC ✓, Copyright ✓ | 45 | ✅ |
| All 24 items checked → Submit button enabled | 45 | ✅ |

**Gap:** The Requirements Workspace (doc 38) and Distribution Workspace (doc 43) have overlapping concerns (metadata completeness). A PM shouldn't need to check both — but currently they show different views of the same data.

---

## Step 9: Rights & Ownership

| Action | Doc | Status |
|--------|-----|--------|
| PM opens Ownership Workspace | 52 | ✅ |
| Master Rights: Acme Records 100% — confirmed | 52 | ✅ |
| Publishing Rights: Kinn Timo 50%, Acme Pub 25%, Artist Y 25% | 52, 53 | ✅ |
| PM uses Split Editor to verify totals | 53 | ✅ |
| Mechanical Rights: all original — no licenses needed | 52 | ✅ |
| Rights Readiness: ⚖ Rights Cleared | 54 | ✅ |

**Gap:** Midnight Sessions has Artist X as the artist, but the publishing splits reference Kinn Timo. This is from a different example release. In a real test, the publishing splits should match the artist on the release. This is a data consistency issue — the docs use different example data across artifacts.

---

## Step 10: Campaign

| Action | Doc | Status |
|--------|-----|--------|
| PM (or Marketing) opens Campaign Workspace | 46 | ✅ |
| Anna (Marketing) creates campaign: T-30 to +14 days | 46 | ✅ |
| Anna uploads campaign assets (social media kit, press photos) | 46 | ✅ |
| Anna configures channels: Instagram, Spotify, TikTok, Email, Meta Ads | 46 | ✅ |
| Anna sets up Promotion Calendar with milestones | 47 | ✅ |
| Campaign Health: On Track | 48 | ✅ |

---

## Step 11: Release Day Preparation

| Action | Doc | Status |
|--------|-----|--------|
| PM opens Release Readiness Dashboard | 37 | ✅ |
| All 4 dimensions: Audio ✓, Artwork ✓, Metadata ✓, Distribution ✓ | 37 | ✅ |
| Overall: 🟢 READY | 37 | ✅ |
| Release status: READY → Release date Oct 01 | 16 | ✅ |
| PM opens Operations Center | 59 | ✅ |
| No critical alerts for Midnight Sessions | 59 | ✅ |

---

## Step 12: Release Day

| Action | Doc | Status |
|--------|-----|--------|
| Oct 01 arrives. Release status → RELEASED | 16 | ✅ |
| Campaign milestones execute: social posts, newsletter, ads | 47 | ✅ |
| Info alert fires: "Midnight Sessions released" | 61 | ✅ |
| Release appears in "Released this month" on Executive Dashboard | 60 | ✅ |

---

## Step 13: Post-Release

| Action | Doc | Status |
|--------|-----|--------|
| Day +7: Campaign engagement report due | 47 | ✅ |
| Day +14: Campaign close + retrospective | 47 | ✅ |
| 30 days after release: auto-archive check | 16 | ✅ |

---

## Gaps Found

| # | Gap | Severity | Recommendation |
|---|-----|----------|---------------|
| 1 | "Begin Planning" button has no UX spec | Medium | Add status transition button group to release header in doc 12 or 16 |
| 2 | Task → Deliverable connection is implicit | Low | Doc 31/34 should reference that a task can "satisfy" a deliverable requirement |
| 3 | Versioning and Approval are loosely coupled | Low | Doc 35 should explicitly reference version locking on approval |
| 4 | Requirements Workspace and Distribution Workspace overlap | Medium | Consolidate metadata completeness into one source of truth (Distribution Workspace) |
| 5 | Example data inconsistency across docs | Low | Publishing split examples should match the release's actual artist |
| 6 | No explicit "Submit to DSPs" flow | Medium | Doc 43 shows a Submit button but no confirmation/loading/submission-status flow |
| 7 | Post-release monitoring page missing | Medium | No spec for what happens after RELEASED — analytics, takedown, reissue |
| 8 | No cross-release dependencies | Low | Can Release B be blocked until Release A ships? Not addressed. |

## Verdict

The end-to-end flow is **documented and coherent**. A PM can trace a
release from creation through to distribution using the existing specs.
7 of 8 gaps are low/medium severity and can be addressed in future
sprints. Gap 6 (Submit to DSPs flow) is the most impactful — the button
exists but the submission pipeline isn't fully specified.
