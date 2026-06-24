# TASK-1403 — Versioning UX

## Concept

Deliverables are iterated. A designer submits Cover Art v1, gets feedback,
then submits v2 and v3. The system tracks every version independently —
uploading a new version never overwrites history. Reviewers approve a
specific version. Contributors upload new versions against the same
deliverable.

---

## Version Lifecycle

```
                  ┌──────────────┐
                  │   Uploaded   │  ← Default on first upload
                  └──────┬───────┘
                         │ submit for review
                         ▼
                  ┌──────────────┐
          ┌───────│  Submitted   │◄─────────┐
          │       └──────┬───────┘           │
          │              │                    │
          │       ┌──────┴──────┐            │
          │       │             │            │
          │       ▼             ▼            │
          │ ┌──────────┐ ┌──────────┐       │
          │ │ Approved  │ │ Rejected  │───────┘  (re-upload creates
          │ └──────────┘ └──────────┘           new version, auto-submitted)
          │
          └─ (upload new version — any status)
```

A version is:
- **Uploaded** when first created (draft).
- **Submitted** when flagged for review.
- **Approved** when a reviewer accepts it.
- **Rejected** when a reviewer rejects it.

Only one version can be "current" at a time. The current version is the
most recently uploaded version. The approved version is the one that
passed review. They may differ if new versions are uploaded after approval.

---

## Layout: Version Panel

Shown when clicking a deliverable row in the Deliverable Workspace
(TASK-1401) or clicking a version badge in any context.

```
┌──────────────────────────────────────────────────────────────────┐
│  Cover Art · Midnight Sessions                                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │              ┌─────────────────────────────┐               │  │
│  │              │                             │               │  │
│  │              │    [Current Version v3]     │               │  │
│  │              │    Full-size on click       │               │  │
│  │              │                             │               │  │
│  │              └─────────────────────────────┘               │  │
│  │                                                            │  │
│  │  Cover Art v3                                  🟢 Current  │  │
│  │  Uploaded Jul 14 by Taylor · 4.2 MB · JPG, 3000×3000      │  │
│  │  Status: Submitted for review                              │  │
│  │                                                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │  │
│  │  │ Download │ │ Preview  │ │ Submit   │                   │  │
│  │  └──────────┘ └──────────┘ └──────────┘                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ─── Version History ───────────────────────────────────────────  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  v3 │ Current · ○ Submitted │ Jul 14, Taylor    │ 4.2 MB   │  │
│  │     │ "Adjusted contrast based on feedback."              │  │
│  │     │ ┌──────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │     │ │Preview│ │Compare   │ │Download  │ │ Set as   │   │  │
│  │     │ │      │ │w/ v2     │ │          │ │ Current  │   │  │
│  │     │ └──────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  v2 │ Previous · ✅ Approved │ Jul 12, Taylor   │ 4.0 MB   │  │
│  │     │ "Lightened shadows per Artist request."           │  │
│  │     │ ┌──────┐ ┌──────────┐ ┌──────────┐                │  │
│  │     │ │Preview│ │Compare   │ │Download  │                │  │
│  │     │ │      │ │w/ v1     │ │          │                │  │
│  │     │ └──────┘ └──────────┘ └──────────┘                │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │  v1 │ Previous · ✕ Rejected │ Jul 10, Taylor  │ 3.8 MB   │  │
│  │     │ "Initial draft. Too dark overall."               │  │
│  │     │ ┌──────┐ ┌──────────┐ ┌──────────┐                │  │
│  │     │ │Preview│ │Compare   │ │Download  │                │  │
│  │     │ │      │ │w/base    │ │          │                │  │
│  │     │ └──────┘ └──────────┘ └──────────┘                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  + Upload New Version                                    │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Version Row Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│  v3 │ ○ Submitted │ Jul 14 · Taylor  │ 4.2 MB                     │
│     │                                                             │
│     │  "Adjusted contrast based on reviewer feedback."            │
│     │                                                             │
│     │  ┌──────────────────────────────────────────────────────┐  │
│     │  │  ┌───────┐  ┌─────────┐  ┌──────────┐               │  │
│     │  │  │Preview│  │Compare  │  │ Download │               │  │
│     │  │  └───────┘  └─────────┘  └──────────┘               │  │
│     │  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| v3 | Version number, auto-incremented |
| Status | Badge: ◐ Submitted / ✅ Approved / ✕ Rejected / 📁 Uploaded (draft) |
| Date + Author | "Jul 14 · Taylor" |
| Size | "4.2 MB" |
| Notes | Optional text describing what changed in this version |
| Preview | Opens full-size preview (image) or player (audio) |
| Compare | Side-by-side comparison with another version |
| Download | Direct file download |

### Version Row States

| State | Border | Actions |
|-------|--------|---------|
| Current | Green left border | Download, Preview, Submit for Review |
| Approved | Green dot, no border | Download, Preview, Compare |
| Rejected | Red dot, muted row | Download, Preview, Compare |
| Previous (draft) | Neutral | Download, Preview, Compare |

---

## Compare View

When a user clicks "Compare w/ v2", a side-by-side view opens:

### Image Comparison

```
┌──────────────────────────────────────────────────────┐
│  Compare: Cover Art v2 vs v3                         │
│                                                       │
│  ┌──────────────────┐    ┌──────────────────┐        │
│  │                  │    │                  │        │
│  │   Cover Art v2   │    │   Cover Art v3   │        │
│  │   3000×3000 JPG  │    │   3000×3000 JPG  │        │
│  │   4.0 MB         │    │   4.2 MB         │        │
│  │   ✅ Approved    │    │   ○ Submitted    │        │
│  │                  │    │                  │        │
│  └──────────────────┘    └──────────────────┘        │
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │
│  │ Side by Side│ │  Overlay   │  │  Difference  │   │
│  └────────────┘  └────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────┘
```

Three modes:
- **Side by Side:** Both images at reduced size, side by side.
- **Overlay:** v3 overlaid on v2 with an opacity slider to fade between.
- **Difference:** Pixel-diff overlay showing changed areas in red.

### Audio Comparison

```
┌──────────────────────────────────────────────────────┐
│  Compare: Master File v1 vs v2                        │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  🔈 v1          │  🔊 v2                         │  │
│  │  ████░░░░ 0:46  │  ████████░░ 1:02              │  │
│  │  ▶ Play         │  ▶ Play                        │  │
│  │  16/44.1 · -12  │  16/44.1 · -14 LUFS           │  │
│  │  46.8 MB        │  48.2 MB                       │  │
│  └────────────────────────────────────────────────┘  │
│                                                       │
│  ┌────────────────────────────────────────────────┐  │
│  │  LUFS: -12.1 (v1)  →  -14.2 (v2)  lower 2dB   │  │
│  │  Peak:  +0.3  (v1)  →   -0.8 (v2)  fixed clip │  │
│  │  DR:     8  (v1)   →    12  (v2)  improved     │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

Audio comparison shows waveform side by side, with synchronized playback
(clicking Play starts both from zero) and a technical diff table showing
key metrics.

---

## Upload New Version

```
┌──────────────────────────────────────────────────┐
│  Upload New Version of: Cover Art             [×] │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │                                            │   │
│  │        Drop file or click to browse        │   │
│  │         JPG, PNG (max 20MB)               │   │
│  │                                            │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  Version notes (what changed?)                     │
│  ┌────────────────────────────────────────────┐   │
│  │ Adjusted contrast per reviewer feedback.   │   │
│  │ Lightened shadows in bottom-left corner.   │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  Submit for review on upload?                      │
│  ◉ Yes, submit for review immediately              │
│  ○ No, keep as draft                               │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │  Upload v4                                 │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

Key behaviors:
- Version number auto-increments (v3 → v4).
- Version notes are optional but encouraged for review context.
- "Submit on upload" auto-triggers review state.
- Upload replaces the "current" version but does NOT delete previous
  versions.

---

## Version Permissions

| Action | Who Can Do It |
|--------|---------------|
| View all versions | Owner, Admin, PM, A&R, Artist, plus the contributor assigned to the deliverable |
| Upload new version | Owner, Admin, PM, plus contributor assigned to the deliverable |
| Submit for review | Owner, Admin, PM, plus the contributor who uploaded |
| Set as current | Owner, Admin, PM |
| Delete a version | Owner, Admin, PM |
| Compare versions | All roles with `asset:view` |
| Download | All roles with `asset:view` |

---

## Cross-Reference: Where Version Shows

| Context | How Version Is Displayed |
|---------|--------------------------|
| Deliverable Workspace (TASK-1401) | "v3" in Version column |
| Stage Detail (TASK-802) | "Submitted v3" in activity feed |
| Task Detail (TASK-1102) | "Attached v3" in attachment list |
| Review Panel (TASK-1402) | "Reviewing v3 of Cover Art" in header |
| Notification | "Taylor uploaded Cover Art v4 for review" |

---

## Data Model

```typescript
interface AssetVersion {
  id: string;
  deliverableId: string;       // FK to Deliverable
  versionNumber: number;       // Auto-increment per deliverable (1, 2, 3...)
  status: VersionStatus;
  fileUrl: string;             // Cloud storage URL
  filename: string;
  mimeType: string;            // "image/jpeg", "audio/wav", etc.
  fileSize: number;            // Bytes
  dimensions?: { width: number; height: number };  // For images
  sampleRate?: number;         // For audio: 44100, 48000
  bitDepth?: number;           // For audio: 16, 24
  channels?: string;           // For audio: "mono", "stereo"
  duration?: number;           // For audio/video: seconds
  notes?: string;              // "What changed in this version"
  uploadedBy: { id: string; name: string };
  uploadedAt: Timestamp;
  deletedAt?: Timestamp;       // Soft delete
  isCurrent: boolean;          // True for the latest uploaded version
}

type VersionStatus = 'uploaded' | 'submitted' | 'approved' | 'rejected';
```

### Version Numbering Rules

- Version numbers are per-deliverable (not global).
- Start at 1, auto-increment on each new upload.
- Deleted versions don't get repurposed — the next upload gets the next
  sequential number (v1, v2, [v3 deleted], v4).
- "v1" is always the first upload, even if that version is later deleted.

### Storage

```
/rf/releases/{releaseId}/deliverables/{deliverableId}/v2/cover-art.jpg
/rf/releases/{releaseId}/deliverables/{deliverableId}/v3/cover-art.jpg
```

Each version has its own directory to prevent filename collisions. The
`fileUrl` in the database points to the versioned path.
