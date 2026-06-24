# TASK-1401 — Deliverable Workspace

## Concept

A release-level view that organizes all deliverables by type grouping
rather than by stage. While the Workflow Board shows stage-by-stage
progress, the Deliverable Workspace answers "what deliverables does this
release need, and what's the status of each?"

Groupings: Artwork, Audio, Video, Marketing, Distribution. Each grouping
shows its deliverables with status, version, and assignment.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back to Release    Deliverables · Midnight Sessions           ⚙       │
│                                                                           │
│  ─── Artwork ──────────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  Deliverable         │ Status    │ Version │ Owner    │ Due     │    ││
│  │──────────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Cover Art           │ ● Granted │ v3      │ 👤 Taylor│ Sep 01  │    ││
│  │  3000x3000 JPG/PNG   │           │         │ Designer │         │    ││
│  │  ───────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Booklet             │ ○ Pending │ —       │ 👤 Taylor│ Sep 10  │    ││
│  │  Multi-page PDF      │           │         │ Designer │         │    ││
│  │  ───────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Alternate Cover     │ ◐ Optional│ —       │ —        │ —       │    ││
│  │  (if needed)         │           │         │          │         │    ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Audio ────────────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  Deliverable         │ Status    │ Version │ Owner    │ Due     │    ││
│  │──────────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Raw Stems           │ ◐ Submitted│ v1     │ 👤 Sam   │ Jul 05  │    ││
│  │  Per-track WAV 24/48 │           │ T1-4    │ Producer │         │    ││
│  │  ───────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Stereo Mix          │ ○ Pending │ —       │ 👤 Sam   │ Aug 01  │    ││
│  │  WAV 24/48           │           │         │ Engineeer│         │    ││
│  │  ───────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Master File         │ ○ Pending │ —       │ 👤 Sam   │ Aug 15  │    ││
│  │  WAV 16/44.1         │           │         │ Engineeer│         │    ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Video ────────────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  Deliverable         │ Status    │ Version │ Owner    │ Due     │    ││
│  │──────────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Music Video         │ ◐ Optional│ —       │ —        │ —       │    ││
│  │  1080p / 4K .mov     │           │         │          │         │    ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Marketing ────────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  Deliverable         │ Status    │ Version │ Owner    │ Due     │    ││
│  │──────────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Social Media Kit    │ ○ Pending │ —       │ 👤 Anna  │ Sep 05  │    ││
│  │  Square + Story     │           │         │ Marketing│         │    ││
│  │  ───────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Press Photos        │ ○ Pending │ —       │ 👤 Taylor│ Sep 05  │    ││
│  │  3000x3000 JPG       │           │         │ Designer │         │    ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Distribution ──────────────────────────────────────────────────────  │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  Deliverable         │ Status    │ Version │ Owner    │ Due     │    ││
│  │──────────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  UPC Code            │ ○ Pending │ —       │ 👤 Alex  │ Sep 01  │    ││
│  │  GS1 GTIN-12         │           │         │ PM       │         │    ││
│  │  ───────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  ISRC Codes          │ ○ Pending │ —       │ 👤 Alex  │ Sep 01  │    ││
│  │  Per-track           │           │         │ PM       │         │    ││
│  │  ───────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  Metadata Sheet      │ ○ Pending │ —       │ 👤 Alex  │ Sep 10  │    ││
│  │  Genre, credits,     │           │         │ PM       │         │    ││
│  │  copyright            │           │         │          │         │    ││
│  │  ───────────────────┼───────────┼─────────┼──────────┼─────────│    ││
│  │  DSP Assets          │ ○ Pending │ —       │ —        │ Sep 15  │    ││
│  │  Spotify Canvas etc  │           │         │          │         │    ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                                                           │
│  ─── Summary ──────────────────────────────────────────────────────────  │
│  Required: 9    Granted: 1    Submitted: 1    Pending: 5    Optional: 2  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Grouping Definitions

### Artwork
| Deliverable | Template | Required | Format | Notes |
|-------------|----------|----------|--------|-------|
| Cover Art | All | Yes | JPG, PNG, 3000×3000px | Must be square |
| Booklet | Album | Optional | PDF, JPG, PNG | Multi-page |
| Alternate Cover | All | Optional | JPG, PNG, 3000×3000px | Deluxe/reissue |

### Audio
| Deliverable | Template | Required | Format | Notes |
|-------------|----------|----------|--------|-------|
| Raw Stems | All | Yes | WAV, AIFF, 24/48 | Per track |
| Stereo Mix | All | Yes | WAV, AIFF, 24/48 | Per track |
| Master File | All | Yes | WAV, FLAC, 16/44.1 | Per track |
| Instrumental | Single, EP, Album | Optional | WAV, 16/44.1 | Backing track |

### Video
| Deliverable | Template | Required | Format | Notes |
|-------------|----------|----------|--------|-------|
| Music Video | All | Optional | .mov, .mp4, 1080p/4K | |
| Lyric Video | Single, EP | Optional | .mp4, 1080p | Per track if desired |
| Behind the Scenes | Album | Optional | .mp4, 1080p | Documentary |

### Marketing
| Deliverable | Template | Required | Format | Notes |
|-------------|----------|----------|--------|-------|
| Social Media Kit | All | Optional | JPG, PNG, MP4 | Square + Story + Banner |
| Press Photos | All | Optional | JPG, 3000×3000px | Per artist |
| Press Release | All | Optional | PDF, markdown | |

### Distribution
| Deliverable | Template | Required | Format | Notes |
|-------------|----------|----------|--------|-------|
| UPC Code | All | Yes | GS1 GTIN-12 | Validates check digit |
| ISRC Codes | All | Yes | 12-char, uppercase | Per track |
| Metadata Sheet | All | Yes | Internal | Genre, credits, copyright |
| DSP Assets | All | Optional | Per DSP spec | Spotify Canvas, Apple Motion |

---

## Statuses

| Status | Icon | Meaning | UI Treatment |
|--------|------|---------|-------------|
| Required | ○ Pending | Must be provided per template | Neutral row, amber border-left if overdue |
| Submitted | ◐ Submitted | File uploaded, awaiting review | Purple row, "Review" button visible |
| Granted | ● Granted | Reviewed and approved | Green row, checkmark, version number shown |
| Rejected | ✕ Rejected | Reviewed and rejected | Red row, strikethrough on version, reason tooltip |
| Optional | ◐ Optional | Nice-to-have, not required | Muted row, dashed border |

### Status Lifecycle

```
  ○ Pending  →  ◐ Submitted  →  ● Granted
                     │                │
                     │                │ (if resubmitted after changes)
                     ▼                ▼
                  ┌───────┐      ◐ Submitted
                  │Rejected│           │
                  └───────┘           ▼
                            (re-uploads → new version)
```

- Pending → Submitted: when a contributor uploads the first version.
- Submitted → Granted: when a reviewer approves.
- Submitted → Rejected: when a reviewer rejects with feedback.
- Rejected → Submitted: when the contributor re-uploads a new version.

---

## Interactions

| Interaction | Behavior |
|-------------|----------|
| Click row | Open deliverable detail panel (preview + version history + review actions) |
| Hover row | Highlight + show quick actions (Download if file, Edit if metadata) |
| Click status badge | Filter view: show only deliverables with this status |
| "+ Add deliverable" | Open form: select type, description, required flag, owner, due date |
| Drag group header | Reorder groupings (persistent per release) |
| Collapse group | Click header chevron to collapse/expand |

## Group Header

Each grouping has a header with:

```
┌─── Artwork ──────────────────────────────── 2/3 complete ───┐
│   ████████████████████░░░░░░░░░░  67%                       │
│                                                             │
│   [Group content]                                           │
└─────────────────────────────────────────────────────────────┘
```

The header shows:
- Grouping name and icon
- Completion count: "2/3 complete" (Granted or Optional with files ÷ Required)
- Progress mini-bar at 6px showing completion percentage

## Add Deliverable Modal

```
┌──────────────────────────────────────────────────┐
│  + Add Deliverable                           [×]  │
│                                                    │
│  Deliverable type  *                                │
│  ┌──────────────────────────────────────────┐      │
│  │ Select type...                     ▼      │      │
│  │ ─────────────────────────────────────── │      │
│  │ 🎨 Artwork                               │      │
│  │   Cover Art                              │      │
│  │   Booklet                                │      │
│  │   Alternate Cover                        │      │
│  │ ─────────────────────────────────────── │      │
│  │ 🔊 Audio                                 │      │
│  │   Raw Stems                              │      │
│  │   Stereo Mix                             │      │
│  │   Master File                            │      │
│  │ ─────────────────────────────────────── │      │
│  │ 🎬 Video                                 │      │
│  │ ...                                      │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  Description                                       │
│  ┌──────────────────────────────────────────┐      │
│  │ 3000x3000 JPG or PNG, front cover only.  │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  Required: [◉] Yes  ○ No                           │
│                                                    │
│  Owner                                             │
│  ┌──────────────────────────────────────────┐      │
│  │ Search team members...                   │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  Due date                    📅                    │
│                                                    │
│  ┌──────────────────────────────────────────┐      │
│  │  Save Deliverable                        │      │
│  └──────────────────────────────────────────┘      │
└──────────────────────────────────────────────────┘
```

## Responsive

| Breakpoint | Layout |
|------------|--------|
| ≥1024px | Groups as sections, table layout within each |
| 768–1023px | Groups as sections, card layout within each (row → card) |
| <768px | Stacked list, group headers as expandable accordions |

## Data Model

```typescript
interface Deliverable {
  id: string;
  releaseId: string;
  group: DeliverableGroup;
  type: DeliverableType;
  label: string;               // "Cover Art", "Stereo Mix", etc.
  description: string;         // Format requirements, notes
  required: boolean;           // true = required by template, false = optional
  status: DeliverableStatus;
  owner?: { id: string; name: string };
  dueDate?: Timestamp;
  currentVersionId?: string;   // FK to latest Asset version (TASK-1403)
  stageId: string;             // Which stage this deliverable belongs to
}

type DeliverableGroup = 'artwork' | 'audio' | 'video' | 'marketing' | 'distribution';
type DeliverableStatus = 'pending' | 'submitted' | 'granted' | 'rejected';
type DeliverableType = 'cover_art' | 'booklet' | 'alt_cover' | 'raw_stems'
  | 'stereo_mix' | 'master_file' | 'instrumental' | 'music_video'
  | 'lyric_video' | 'behind_scenes' | 'social_kit' | 'press_photos'
  | 'press_release' | 'upc_code' | 'isrc_codes' | 'metadata_sheet'
  | 'dsp_assets';
```
