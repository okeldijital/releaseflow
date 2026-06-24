# TASK-1803 — Contributor Home

## Concept

The Contributor Home replaces the generic dashboard for technical roles.
Instead of org-level stats, releases, and pipeline metrics, the home page
shows only what matters for the contributor's specific work: assigned
items, pending reviews, and recent feedback.

Each role gets a different home, but the pattern is consistent across all
contributor roles. This document defines the pattern and provides the
Designer as the canonical example.

---

## Universal Layout Pattern

```
┌────────────────────────────────────────────────────────────┐
│  ◐ ReleaseFlow                                   🔔 (3)  👤 │
│                                                             │
│  Hello, Taylor                                [⚙ Account]  │
│  Designer · 3 active projects                                │
│                                                             │
│  ─── Assigned [Work Type] ─────────────────────── (2) ────  │
│  [Cards for active work items]                              │
│                                                             │
│  ─── Pending Reviews ───────────────────────────── (1) ────  │
│  [Items awaiting reviewer feedback]                         │
│                                                             │
│  ─── Recent Feedback ──────────────────────────────────────  │
│  [Latest comments and decisions on your work]               │
│                                                             │
│  ─── Quick Access ────────────────────────────────────────  │
│  [Links to the releases you're working on]                  │
└────────────────────────────────────────────────────────────┘
```

Three sections always present:

1. **Assigned [Work Type]** — Active tasks and deliverables. Work the
   contributor needs to act on.
2. **Pending Reviews** — Work the contributor has submitted and is
   awaiting a decision on.
3. **Recent Feedback** — Comments and decisions from reviewers and
   collaborators on the contributor's work.

A fourth section, "Quick Access," provides links to the releases the
contributor is assigned to.

---

## Designer Home

### Who they are
Artwork designer assigned to the Artwork stage of one or more releases.
Their deliverables are cover art, booklets, alternate covers, and
promotional graphics.

### Assigned Artwork

```
┌─── Assigned Artwork ──────────────────────────────── (2) ────┐
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  ◉ Cover Art · Midnight Sessions                         │ │
│  │     Artwork stage · Due Sep 01, 2026  🟢 17 days         │ │
│  │                                                           │ │
│  │     ┌──────────────────────────────────────────────────┐ │ │
│  │     │  [Cover Art v3 preview — thumbnail]              │ │ │
│  │     │  3000×3000 JPG · 4.2 MB                          │ │ │
│  │     │   Awaiting approval · Submitted Aug 14           │ │ │
│  │     └──────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │     Last feedback:                                        │ │
│  │     💬 Sam A&R: "Darken the bottom-left corner.          │ │
│  │         The text gets lost against the background."       │ │
│  │         · Aug 13                                          │ │
│  │                                                           │ │
│  │     ┌──────────┐  ┌───────────┐  ┌──────────┐           │ │
│  │     │ Upload v4│  │  Preview  │  │  View All│           │ │
│  │     └──────────┘  └───────────┘  └──────────┘           │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  ○ Social Media Kit · Summer EP                          │ │
│  │     Artwork stage · Due Aug 20, 2026  🟡 5 days          │ │
│  │                                                           │ │
│  │     Status: Not started                                   │ │
│  │     Required: Square (1080×1080), Story (1080×1920),     │ │
│  │              Banner (1500×500) for Spotify, Instagram     │ │
│  │                                                           │ │
│  │     ┌──────────┐  ┌───────────┐                          │ │
│  │     │  Start   │  │  View All │                          │ │
│  │     └──────────┘  └───────────┘                          │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

Each assigned item shows:
- Status (◉ active / ○ not started / ◐ submitted)
- Release name + stage
- Due date with urgency indicator
- Thumbnail preview if work has begun
- Latest feedback (last comment or review decision)
- Primary action button (Upload / Start / Continue)
- "View All" — navigates to the deliverable workspace filtered to their items

### Pending Reviews

```
┌─── Pending Reviews ─────────────────────────────── (1) ────┐
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ⏳ Cover Art v3 — Awaiting A&R Review                  │ │
│  │     Midnight Sessions · Submitted Aug 14               │ │
│  │     Reviewer: Sam Wilson (A&R)                         │ │
│  │     Waiting: 2 days · SLA: Aug 17                      │ │
│  │                                                        │ │
│  │     ┌──────────────────────────────────────────────┐   │ │
│  │     │  ████████████████████████████░░░░  67%       │   │ │
│  │     │  SLA progress: 2 of 3 business days          │   │ │
│  │     └──────────────────────────────────────────────┘   │ │
│  │                                                        │ │
│  │     ┌──────────┐  ┌──────────┐                         │ │
│  │     │  Nudge   │  │ Withdraw │                         │ │
│  │     └──────────┘  └──────────┘                         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

Pending reviews show:
- What was submitted and to whom
- How long they've been waiting
- SLA progress bar (days elapsed ÷ days allowed)
- Action: "Nudge" (send reminder to reviewer) or "Withdraw" (pull back)

### Recent Feedback

```
┌─── Recent Feedback ──────────────────────────────────────────┐
│                                                               │
│  🔄 Aug 13 · Sam A&R requested changes on Cover Art v2       │
│    Midnight Sessions                                          │
│    "Darken bottom-left. Text gets lost."                      │
│                                                               │
│  💬 Aug 12 · Alex PM commented on Cover Art                  │
│    Midnight Sessions                                          │
│    "Artist wants the midnight blue to be more saturated."     │
│                                                               │
│  ✅ Aug 10 · Sam A&R approved Cover Art v1                   │
│    Summer EP                                                  │
│    "Clean design. Approved for release."                      │
│                                                               │
│  💬 Aug 09 · Artist X commented on Cover Art                 │
│    Summer EP                                                  │
│    "Love it. Maybe try a version with warmer tones?"         │
│                                                               │
│  View all feedback (12 items)                                 │
└──────────────────────────────────────────────────────────────┘
```

Recent feedback shows:
- The decision or comment with icon
- Date and reviewer name
- Release context
- The actual feedback text (first 2 lines, expandable)
- "View all" link to full activity feed

### Quick Access

```
┌─── Quick Access ─────────────────────────────────────────────┐
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │  Midnight Sessions   │  │  Summer EP          │            │
│  │  Artwork · Sep 01    │  │  Artwork · Aug 20    │            │
│  │  ─────────────────── │  │  ─────────────────── │            │
│  │  Cover art uploaded  │  │  Social kit pending  │            │
│  │  Awaiting review      │  │  Not yet started     │            │
│  └─────────────────────┘  └─────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

Compact cards for each release the designer is assigned to. Shows:
- Release name
- Stage they're contributing to
- Due date
- One-line status
- Clicking navigates to the release's Artwork stage

---

## Role-Specific Adaptations

### Designer

| Section | Content |
|---------|---------|
| Assigned [Type] | Assigned Artwork: cover art, booklets, social kits, alt covers |
| Primary action | Upload new version |
| Special feature | Thumbnail preview of latest artwork directly in card |

### Mix Engineer

| Section | Content |
|---------|---------|
| Assigned [Type] | Assigned Mixes: stereo mixes, master files per track |
| Primary action | Upload mix/master |
| Special feature | Audio waveform mini-preview; LUFS/peak readout |

### Producer

| Section | Content |
|---------|---------|
| Assigned [Type] | Assigned Production: stems, session files, rough mixes per track |
| Primary action | Upload stems / session files |
| Special feature | Track listing breakdown per release (which tracks need what) |

---

## Empty States

### No Assigned Work

```
┌─── Assigned Artwork ──────────────────────────────── (0) ────┐
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │              ┌──────────┐                                 │ │
│  │              │  🎨       │                                 │ │
│  │              └──────────┘                                 │ │
│  │                                                           │ │
│  │         No artwork assignments yet.                        │ │
│  │    You'll see cover art and design tasks here             │ │
│  │    when a PM assigns you to a release.                    │ │
│  │                                                           │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### No Pending Reviews

```
┌─── Pending Reviews ─────────────────────────────── (0) ────┐
│                                                              │
│  Nothing waiting for review. All submitted work has been     │
│  decided.                                                    │
└──────────────────────────────────────────────────────────────┘
```

### No Recent Feedback

```
┌─── Recent Feedback ──────────────────────────────────────────┐
│                                                               │
│  No feedback yet. Comments and decisions on your work         │
│  will appear here.                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Mobile

```
┌──────────────────────────────┐
│  ◐ ReleaseFlow     🔔 (3)    │
│                               │
│  Hello, Taylor               │
│  Designer · 3 projects       │
│                               │
│  ── Assigned Artwork (2) ──  │
│                               │
│  ◉ Cover Art                 │
│     Midnight Sessions        │
│     Artwork · Sep 01         │
│     [🖼 preview thumb]       │
│     💬 "Darken bottom-left"  │
│     [Upload v4] [Preview]    │
│                               │
│  ○ Social Media Kit          │
│     Summer EP                │
│     Artwork · Aug 20         │
│     [Start]                  │
│                               │
│  ── Pending Reviews (1) ──   │
│                               │
│  ⏳ Cover Art v3             │
│     Waiting on Sam (A&R)     │
│     [Nudge] [Withdraw]       │
│                               │
│  ── Recent Feedback ──       │
│                               │
│  🔄 Sam: requested changes   │
│  💬 Alex: "More saturated"   │
│                               │
│  ── Quick Access ──          │
│  [Midnight Sessions]         │
│  [Summer EP]                 │
└──────────────────────────────┘
```

---

## Data Model

```typescript
interface ContributorHome {
  userId: string;
  role: 'designer' | 'mix_engineer' | 'producer' | 'artist';

  assigned: ContributorWorkItem[];
  pendingReviews: PendingReviewItem[];
  recentFeedback: FeedbackItem[];
  quickAccess: QuickAccessRelease[];
}

interface ContributorWorkItem {
  id: string;
  type: 'deliverable' | 'task';
  title: string;
  releaseName: string;
  releaseId: string;
  stageName: string;
  stageId: string;
  status: 'not_started' | 'in_progress' | 'submitted';
  dueDate?: Timestamp;
  previewUrl?: string;          // Thumbnail for artwork, waveform for audio
  latestFeedback?: FeedbackItem;
  actionLabel: string;          // "Upload v4", "Start", "Continue"
  actionUrl: string;
}

interface PendingReviewItem {
  id: string;
  entityType: 'deliverable' | 'task' | 'stage';
  entityId: string;
  title: string;
  releaseName: string;
  releaseId: string;
  submittedAt: Timestamp;
  reviewer: { id: string; name: string; role: string };
  slaDeadline: Timestamp;
  slaProgress: number;          // Percentage: elapsed / total SLA days
}

interface FeedbackItem {
  id: string;
  type: 'approved' | 'changes_requested' | 'rejected' | 'comment';
  actor: { id: string; name: string };
  body: string;
  releaseName: string;
  releaseId: string;
  createdAt: Timestamp;
}

interface QuickAccessRelease {
  id: string;
  name: string;
  stage: string;
  dueDate?: Timestamp;
  statusSummary: string;        // "Cover art uploaded, awaiting review"
}
```
