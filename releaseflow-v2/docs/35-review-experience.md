# TASK-1402 — Review Experience

## Concept

The review experience is a shared pattern that applies to stages,
deliverables, and tasks. When work is submitted for approval, the reviewer
opens a dedicated review panel and makes one of three decisions:

1. **Approve** — Work is accepted as-is. Progress advances.
2. **Reject** — Work is fundamentally wrong. Must restart from scratch.
3. **Request Changes** — Work is on the right track but needs revision.
   Resubmit after changes.

This becomes the basis for all V2 approval workflows. In V1, reviews are
manual (not enforced), but the UX pattern is consistent.

---

## Where Review Happens

| Context | Trigger | Reviewer | What's Reviewed |
|---------|---------|----------|----------------|
| Stage review | Stage status → REVIEW | A&R, Artist, Admin | All deliverables in the stage |
| Deliverable review | Deliverable status → Submitted | A&R, PM, Artist | A single deliverable |
| Task review | Task submitted for approval | Stage owner, A&R | Task outcome + attachments |

Each context renders a review panel with the same three-action pattern.

---

## Layout: Stage Review

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Review: Mastering Stage                                                  │
│  Midnight Sessions · Submitted by Sam Wilson · 2 hours ago               │
│                                                                           │
│  ─── Deliverables Submitted ───────────────────────────────────────────  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  🔊 Master File                                                  │  │
│  │                                                                     │  │
│  │  ┌───────────────────────────────────────────────────────────────┐│  │
│  │  │  ▶ midnight-sessions-master-v2.wav            ◉◉◉◉◉◉◉◉  2:34  ││  │
│  │  │  ─── 16-bit / 44.1kHz · 48.2 MB · Uploaded Jul 15           ││  │
│  │  │  ┌────────┐ ┌──────────┐ ┌────────────┐                      ││  │
│  │  │  │▶ Play  │ │⏸ Pause  │ │🔊 Waveform │                      ││  │
│  │  │  └────────┘ └──────────┘ └────────────┘                      ││  │
│  │  └───────────────────────────────────────────────────────────────┘│  │
│  │                                                                     │  │
│  │  ✅ Track 1 — Midnight Sessions                  Listen  [▼]       │  │
│  │  ✅ Track 2 — Late Night Drive                    Listen  [▼]       │  │
│  │  ✅ Track 3 — City Lights                         Listen  [▼]       │  │
│  │  ✅ Track 4 — Fading Echo                         Listen  [▼]       │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ─── Submitter Notes ───────────────────────────────────────────────────  │
│                                                                           │
│  "All four tracks mastered with -14 LUFS integrated loudness.             │
│   True peak at -1dB across all tracks. Reference tracks attached           │
│   for comparison."                                                         │
│                                  — Sam Wilson, Mix Engineer · Jul 15      │
│                                                                           │
│  ─── Previous Feedback ────────────────────────────────────────────────  │
│                                                                           │
│  💬 Artist X, Jul 12: "V1 was too compressed. Can we get more
│     dynamic range in Track 2?"                                             │
│                                                                           │
│  💬 Sam Wilson, Jul 13: "Acknowledged. Working on v2 with
│     increased dynamic range."                                              │
│                                                                           │
│  ─── Activity ──────────────────────────────────────────────────────────  │
│                                                                           │
│  🟡 Sam Wilson submitted Mastering for review · Jul 15, 2:34 PM          │
│  📁 midnight-sessions-master-v2.wav uploaded · Jul 15, 2:11 PM           │
│  📋 Mastering stage moved to REVIEW · Jul 15, 2:11 PM                    │
│                                                                           │
│  ─── Your Decision ─────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │ │
│  │  │  ✅ Approve      │  │  🔄 Request      │  │  ✕ Reject       │   │ │
│  │  │                  │  │     Changes       │  │                  │   │ │
│  │  │  Accept as-is.   │  │                  │  │                  │   │ │
│  │  │  Stage advances. │  │  Needs revision. │  │  Start over.     │   │ │
│  │  │                  │  │  Resubmit after. │  │  Fundamental     │   │ │
│  │  │                  │  │                  │  │  issues.         │   │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │ │
│  │                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Decision Dialogs

### Approve

```
┌──────────────────────────────────────────┐
│  Approve Mastering Stage?                 │
│                                            │
│  This will mark the stage as complete      │
│  and advance the release to the next       │
│  stage.                                    │
│                                            │
│  ── Add a note (optional) ──              │
│  ┌──────────────────────────────────────┐  │
│  │ Great work. Levels are clean and     │  │
│  │ dynamic range is perfect.            │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ┌──────────────────┐ ┌──────────┐        │
│  │  ✅ Approve      │ │  Cancel  │        │
│  └──────────────────┘ └──────────┘        │
└──────────────────────────────────────────┘
```

### Request Changes

```
┌──────────────────────────────────────────┐
│  Request Changes to Mastering?            │
│                                            │
│  The submitter will need to make changes   │
│  and resubmit before the stage can         │
│  advance.                                  │
│                                            │
│  ── Required: what needs to change? ──    │
│  ┌──────────────────────────────────────┐  │
│  │ Track 2 (Late Night Drive):           │  │
│  │ - Vocal feels buried in the mix,     │  │
│  │   raise by ~2dB.                     │  │
│  │ - Hi-hat is too bright in the intro. │  │
│  │                                       │  │
│  │ Everything else looks solid.          │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  [Cancel]     [🔄 Request Changes]         │
└──────────────────────────────────────────┘
```

### Reject

```
┌──────────────────────────────────────────┐
│  Reject Mastering Submission?             │
│                                            │
│  This is the strongest signal. The        │
│  current submission is not acceptable.     │
│  The stage reverts to In Progress.         │
│                                            │
│  ── Required: why is this rejected? ──   │
│  ┌──────────────────────────────────────┐  │
│  │ Multiple tracks are peaking above     │  │
│  │ 0dB with audible clipping. True       │  │
│  │ peak must stay below -1dB.            │  │
│  │                                       │  │
│  │ This needs to be re-mastered from     │  │
│  │ the source stems.                     │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  [Cancel]     [✕ Reject Submission]        │
└──────────────────────────────────────────┘
```

---

## Decision Consequences

| Decision | Stage Effect | Deliverable Effect | Task Effect | Notifications Sent |
|----------|-------------|-------------------|-------------|-------------------|
| Approve | Status → COMPLETE. Next stage activates. | Status → Granted. Version locked. | Status → DONE. | Submitter, PM, Artist |
| Request Changes | Status → IN_PROGRESS. Resubmit required. | Status → Submitted (unchanged). Feedback attached. | Status → IN_PROGRESS. Feedback attached. | Submitter, PM |
| Reject | Status → IN_PROGRESS. All deliverables go back. | Status → Rejected. Version locked but not granted. | Status → TODO. | Submitter, PM, Artist, Admin |

---

## Review Panel Content by Context

### Audio Deliverable Review

```
┌────────────────────────────────────────────┐
│  🔊 [Waveform player with playback]        │
│                                             │
│  Technical metadata:                        │
│  Sample rate: 44.1kHz                       │
│  Bit depth: 16-bit                          │
│  Channels: Stereo                           │
│  Duration: 3:42                             │
│  LUFS: -14.2 integrated                     │
│  True peak: -0.8dB                          │
│  File: midnight-sessions-master-v2.wav      │
│  Size: 48.2 MB                              │
└────────────────────────────────────────────┘
```

### Artwork Deliverable Review

```
┌────────────────────────────────────────────┐
│  🖼 [Image preview, full-size on click]     │
│                                             │
│  Technical metadata:                        │
│  Dimensions: 3000×3000px                    │
│  Format: JPG                                │
│  Color space: sRGB                          │
│  DPI: 300                                   │
│  File: cover-art-v3.jpg                     │
│  Size: 4.2 MB                               │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │ View Full│  │ Download │                │
│  └──────────┘  └──────────┘                │
└────────────────────────────────────────────┘
```

### Metadata Deliverable Review (Distribution)

```
┌────────────────────────────────────────────┐
│  📋 Metadata Sheet                          │
│                                             │
│  ── Release Metadata ──                    │
│  Title:        Midnight Sessions            │
│  Artist:       Artist X                     │
│  Label:        Acme Records                 │
│  Genre:        Alternative R&B              │
│  Release Date: Oct 01, 2026                 │
│  UPC:          [Not set]                    │
│                                             │
│  ── Track Listing ──                       │
│  Track 1: Midnight Sessions       ISRC: [—] │
│  Track 2: Late Night Drive        ISRC: [—] │
│  Track 3: City Lights             ISRC: [—] │
│  Track 4: Fading Echo             ISRC: [—] │
│                                             │
│  ⚠ Metadata is incomplete.                  │
│  Missing: UPC, ISRC codes for all tracks.   │
└────────────────────────────────────────────┘
```

---

## Reviewer Workload View

The reviewer (A&R, PM, Artist) needs a queue of items awaiting their
review. This is shown as a separate view in the notification center or
as a section on their dashboard:

```
┌────────────────────────────────────────────────────────────┐
│  Items Awaiting Your Review                                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  ◐ Mastering Stage                                      │ │
│  │     Midnight Sessions · Submitted Jul 15 by Sam Wilson │ │
│  │     ┌────────────────┐                                 │ │
│  │     │  Review Stage  │                                 │ │
│  │     └────────────────┘                                 │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  ◐ Cover Art v3                                         │ │
│  │     Midnight Sessions · Submitted Jul 14 by Taylor     │ │
│  │     ┌────────────────┐                                 │ │
│  │     │  Review Artwork│                                 │ │
│  │     └────────────────┘                                 │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  ◐ Stereo Mix — Track 2                                │ │
│  │     Summer EP · Submitted Jul 12 by Sam               │ │
│  │     ┌────────────────┐                                 │ │
│  │     │  Review Mix    │                                 │ │
│  │     └────────────────┘                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  3 items awaiting review                                    │
└────────────────────────────────────────────────────────────┘
```

---

## Review Audit Trail

Every review decision is logged:

```
┌────────────────────────────────────────────────────────┐
│  Review History — Mastering Stage                      │
│                                                        │
│  🔄 Jul 12 · Requested Changes by Artist X             │
│    "V1 was too compressed. More dynamic range needed." │
│                                                        │
│  📁 Jul 13 · v2 submitted by Sam Wilson                │
│    "Re-mastered with -14 LUFS and increased range."    │
│                                                        │
│  ✅ Jul 15 · Approved by A&R Sam                       │
│    "Levels are clean. Dynamic range is perfect."       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface ReviewDecision {
  id: string;
  resourceType: 'stage' | 'deliverable' | 'task';
  resourceId: string;
  reviewerId: string;
  decision: 'approve' | 'request_changes' | 'reject';
  feedback: string;            // Required for request_changes and reject
  decidedAt: Timestamp;
  versionReviewed?: string;    // Locked to a specific version
}

interface ReviewQueueItem {
  resourceType: 'stage' | 'deliverable' | 'task';
  resourceId: string;
  label: string;               // "Mastering Stage", "Cover Art v3"
  releaseName: string;         // "Midnight Sessions"
  submittedBy: { id: string; name: string };
  submittedAt: Timestamp;
  priority: 'normal' | 'overdue';  // Overdue if past the review deadline
}
```
