# Deliverables Tab v2 — Visual Spec

## Route

`/releases/[id]/deliverables`

## Focus Areas

1. **Version History** — Full version timeline per deliverable
2. **Approval Status** — Review lifecycle with SLA tracking
3. **Asset Preview** — Inline preview for audio, image, video
4. **Review Actions** — Approve / Request Changes / Reject inline

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  release workspace · Content area                                         │
│                                                                           │
│  Deliverables · Lua – The Fading Light                                   │
│  ────────────────────────────────────────────────────────────────────     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ Group [Audio ▼]  Status [All ▼]  Sort [Due Date ▼]  🔍 Search    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ─── Audio ──────────────────────────────────── 4 of 5 met ────────────   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ● Granted · Stereo mix                      v1 · T1-T5 · 👤 Sam W  │ │
│  │   WAV 24/48 · per track · Aug 20                                   │ │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐                           │ │
│  │   │ Preview  │ │ History  │ │ Download │  → hover actions          │ │
│  │   └──────────┘ └──────────┘ └──────────┘                           │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ ◐ Submitted · Master file                    v3 · T1-T4 · 👤 Sam W │ │
│  │   WAV 16/44.1 · Track 5 pending · Aug 25 🔴 Overdue               │ │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │ │
│  │   │ Preview  │ │ History  │ │  Review  │ │ Download │             │ │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘             │ │
│  │   ⏳ Awaiting A&R review · SLA Aug 27 · ██████░░░░  50%           │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ ○ Pending · Instrumental                     — · —       · 👤 ProdZ│ │
│  │   WAV 16/44.1 · optional · Sep 05 🟢 Future                       │ │
│  │   ┌──────────┐                                                      │ │
│  │   │ Upload   │                                                      │ │
│  │   └──────────┘                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Artwork ───────────────────────────────────── 1 of 2 met ─────────   │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ● Granted · Cover art                          v3 · 👤 Taylor       │ │
│  │   JPG 3000×3000 · 4.2 MB · Sep 01                                   │ │
│  │   ┌──────────┐ ┌──────────┐ ┌──────────┐                           │ │
│  │   │ Preview  │ │ History  │ │ Download │                           │ │
│  │   └──────────┘ └──────────┘ └──────────┘                           │ │
│  │   ┌──────────────────────────────────────────────────────────────┐ │ │
│  │   │ [Cover Art · Thumbnail preview · 240×240px · click for full]│ │ │
│  │   └──────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Version History Panel (opens on "History" click) ──────────────────  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Version History · Cover Art · Lua                        [×]       │ │
│  │  ──────────────────────────────────────────────────────────────────  │ │
│  │                                                                      │ │
│  │  ┌────┬──────────┬──────────┬──────────┬───────────┬──────────────┐ │ │
│  │  │ v# │ Status   │ Date     │ Author   │ Size      │ Actions      │ │ │
│  │  ├────┼──────────┼──────────┼──────────┼───────────┼──────────────┤ │ │
│  │  │ v3 │ ● Current│ Aug 14   │ Taylor   │ 4.2 MB    │ [Preview]    │ │ │
│  │  │    │ ◐ Submit │          │          │           │ [Compare]    │ │ │
│  │  │    │          │          │          │           │ [Download]   │ │ │
│  │  ├────┼──────────┼──────────┼──────────┼───────────┼──────────────┤ │ │
│  │  │ v2 │ ✅ Apprvd│ Aug 10   │ Taylor   │ 4.0 MB    │ [Preview]    │ │ │
│  │  │    │          │          │          │           │ [Compare w/v3│ │ │
│  │  │    │          │          │          │           │ [Download]   │ │ │
│  │  ├────┼──────────┼──────────┼──────────┼───────────┼──────────────┤ │ │
│  │  │ v1 │ ✕ Rejectd│ Aug 05   │ Taylor   │ 3.8 MB    │ [Preview]    │ │ │
│  │  │    │          │          │          │           │ [Compare w/v2│ │ │
│  │  │    │          │          │          │           │ [Download]   │ │ │
│  │  │    │          │          │          │           │              │ │ │
│  │  │    │ ── Review Feedback ──────────────────────────────────────│ │ │
│  │  │    │ 🔄 Sam A&R requested changes · Aug 06                     │ │ │
│  │  │    │ "Too dark overall. Lighten the shadows in the             │ │ │
│  │  │    │  bottom-left corner. Artist wants more saturation         │ │ │
│  │  │    │  in the midnight blue tones."                             │ │ │
│  │  └────┴──────────────────────────────────────────────────────────┘ │ │
│  │                                                                      │ │
│  │  ┌──────────────────────────────────────────────────────────────┐   │ │
│  │  │  Upload v4                                                   │   │ │
│  │  └──────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Asset Preview Panel (opens on "Preview" click) ────────────────────  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Cover Art v3 · Lua                                   [Compare] [×]│ │
│  │  ──────────────────────────────────────────────────────────────────  │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────────────┐ │ │
│  │  │                                                                │ │ │
│  │  │                                                                │ │ │
│  │  │               [Cover Art · full resolution]                    │ │ │
│  │  │               pinch-to-zoom · click for 100%                   │ │ │
│  │  │                                                                │ │ │
│  │  │                                                                │ │ │
│  │  └────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                      │ │
│  │  Format: JPG · 3000×3000px · sRGB · 300 DPI · 4.2 MB              │ │
│  │  Uploaded: Aug 14 by Taylor · Status: ◐ Submitted for review       │ │
│  │                                                                      │ │
│  │  ─── Review Decision ──────────────────────────────────────────────  │ │
│  │                                                                      │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │ │
│  │  │ ✅ Approve   │ │ 🔄 Request   │ │ ✕ Reject    │                 │ │
│  │  │              │ │    Changes   │ │              │                 │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                 │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Compare View (opens on "Compare" click) ────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Compare · Cover Art v2 vs v3                           [×]         │ │
│  │  ──────────────────────────────────────────────────────────────     │ │
│  │                                                                      │ │
│  │  ┌──────────────┬──────────────┐                                    │ │
│  │  │ Side by Side │ Overlay      │ Difference    │                    │ │
│  │  └──────────────┴──────────────┴───────────────┘                    │ │
│  │                                                                      │ │
│  │  ┌────────────────────────┐  ┌────────────────────────┐             │ │
│  │  │                        │  │                        │             │ │
│  │  │     Cover Art v2       │  │     Cover Art v3       │             │ │
│  │  │     3000×3000 JPG      │  │     3000×3000 JPG      │             │ │
│  │  │     4.0 MB · ✅ Apprvd │  │     4.2 MB · ◐ Submit │             │ │
│  │  │                        │  │                        │             │ │
│  │  └────────────────────────┘  └────────────────────────┘             │ │
│  │                                                                      │ │
│  │  Opacity slider: ████████████░░░░░░░░  (overlay mode)               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Focus 1: Version History

### Panel: 560px slide-out from right

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Version History · Cover Art                                  [×]        │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  ─── Current Version ──────────────────────────────────────────────────  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  [Thumbnail 240×240]   v3 · ◐ Submitted · Aug 14 · Taylor         │ │
│  │                        4.2 MB · JPG · 3000×3000 · sRGB · 300 DPI │ │
│  │                                                                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │ │
│  │  │ Preview  │ │ Download │ │ Set as   │ │ Submit   │              │ │
│  │  │          │ │          │ │ Current  │ │ for Review│              │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ─── All Versions (3) ──────────────────────────────────────────────────  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ v3 │ ◐ Submitted  │ Aug 14 │ Taylor  │ 4.2 MB │ [⋮]               │ │
│  │    │              │        │         │         │                    │ │
│  │    │ Notes: "Adjusted contrast. Lightened shadows."                │ │
│  │    │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │
│  │    │ │ Preview  │ │ Compare  │ │ Download │ │ Set as   │          │ │
│  │    │ │          │ │ w/ v2    │ │          │ │ Current  │          │ │
│  │    │ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │ v2 │ ✅ Approved  │ Aug 10 │ Taylor  │ 4.0 MB │ [⋮]               │ │
│  │    │              │        │         │         │                    │ │
│  │    │ Approved by Sam A&R · Aug 10                                  │ │
│  │    │ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │ │
│  │    │ │ Preview  │ │ Compare  │ │ Download │                       │ │
│  │    │ │          │ │ w/ v1    │ │          │                       │ │
│  │    │ └──────────┘ └──────────┘ └──────────┘                       │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │ v1 │ ✕ Rejected   │ Aug 05 │ Taylor  │ 3.8 MB │ [⋮]               │ │
│  │    │              │        │         │         │                    │ │
│  │    │ Rejected by Sam A&R · Aug 06                                 │ │
│  │    │ "Too dark overall. Lighten bottom-left."                     │ │
│  │    │ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │ │
│  │    │ │ Preview  │ │ Compare  │ │ Download │                       │ │
│  │    │ │          │ │ w/ base  │ │          │                       │ │
│  │    │ └──────────┘ └──────────┘ └──────────┘                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Upload v4                                                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Version Row Colors

```
Status      │ Row Background
────────────┼────────────────
Current     │ #F5F3FF · left border 3px #7C3AED
Approved    │ #F0FDF4
Rejected    │ #FEF2F2
Submitted   │ #F5F3FF
Uploaded     │ transparent
```

---

## Focus 2: Approval Status

### Per-Deliverable Approval Badge

```
Status      │ Badge CSS                                    │ Icon
────────────┼──────────────────────────────────────────────┼──────
Granted     │ bg-[#DCFCE7] text-[#16A34A]                 │ ●
Submitted   │ bg-[#EDE9FE] text-[#7C3AED]                 │ ◐
Rejected    │ bg-[#FEE2E2] text-[#DC2626]                 │ ✕
Pending     │ bg-[#F4F4F5] text-[#52525B]                 │ ○
```

### SLA Progress Bar (Submitted Deliverables)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⏳ Awaiting A&R review · SLA Aug 27 · ████████████░░░░░░  50% · 2d    │
│                                                                          │
│  submitted  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  sla deadline               │
│  Aug 25                                    Aug 27                       │
│  ─────────────────────────────────────────────────────────────────────── │
│                                                                          │
│  SLA bar: h 4px · radius 2px · track #F4F4F5 · fill #7C3AED           │
│  0-50%: fill green · 51-99%: fill amber · 100%+: fill red              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Approval Timeline (Within Version History Panel)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Approval Timeline                                                       │
│                                                                          │
│  📤 Aug 25 · Submitted by Sam W                                         │
│     "Master file v3 for Lua. T1-T4 done. T5 pending."                  │
│                                                                          │
│  ⏳ Aug 25 · Awaiting review by Sam A&R · SLA: Aug 27                  │
│                                                                          │
│  🔄 Aug 26 · Requested Changes by Sam A&R                               │
│     "Track 4 hi-hat too bright — tame 2dB. Track 5 vocal               │
│      buried in verse 2 — raise 2dB."                                    │
│                                                                          │
│  📤 Aug 26 · Resubmitted v4 by Sam W                                    │
│     "Hi-hat tamed 2dB. Vocal raised 2dB in verse 2."                   │
│                                                                          │
│  ✅ Aug 27 · Approved by Sam A&R                                        │
│     "Levels are clean. Cleared for distribution."                       │
│                                                                          │
│  ──────────────────────────────────────────────────────────────────────  │
│  Total cycle: 3 days · 2 submissions · 1 revision                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Focus 3: Asset Preview

### Audio Preview (Master File, Mix, Stems)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Preview · Master File v3                                     [×]        │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │   ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁   │ │
│  │   ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁   │ │
│  │   ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁   │ │
│  │   ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████████▁▁▁▁▁▁▁▁▁▁   │ │
│  │   ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████████████▁▁▁▁▁▁   │ │
│  │                     ▲                                              │ │
│  │                   0:46                                              │ │
│  │                                                                      │ │
│  │  ◀◀   ▶/⏸   ⏭   00:46 / 03:42                                      │ │
│  │                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Technical Metadata ────────────────────────────────────────────────  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Format      │ WAV                         │ 16-bit / 44.1kHz      │  │
│  │  Channels    │ Stereo                      │ 48.2 MB               │  │
│  │  LUFS        │ -14.2 integrated            │ True peak: -0.8 dB    │  │
│  │  DR          │ 12                          │ Codec: PCM            │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ─── Track Breakdown ───────────────────────────────────────────────────  │
│                                                                           │
│  T1 · Lua (3:42)           ▶        ✓ Mastered                          │
│  T2 · Pulse (4:15)          ▶        ✓ Mastered                          │
│  T3 · Eclipse (3:28)        ▶        ✓ Mastered                          │
│  T4 · Horizon (5:01)        ▶        ✓ Mastered                          │
│  T5 · The Fading Light (4:50) ▶      ⚠ Pending                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Image Preview (Cover Art)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Preview · Cover Art v3                                       [×]        │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │                                                                      │ │
│  │                     [Full resolution image]                          │ │
│  │                     Pinch to zoom · Click for 100%                   │ │
│  │                                                                      │ │
│  │                                                                      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ─── Image Metadata ────────────────────────────────────────────────────  │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  Format      │ JPG                          │ 3000 × 3000 px       │  │
│  │  Color space │ sRGB                         │ 300 DPI              │  │
│  │  File size   │ 4.2 MB                       │ < 20MB ✓            │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  ─── DSP Validation ────────────────────────────────────────────────────  │
│                                                                           │
│  ✓ Resolution: 3000×3000 (meets 3000×3000 minimum)                      │
│  ✓ Format: JPG (accepted by all DSPs)                                    │
│  ✓ Color space: sRGB (RGB)                                               │
│  ✓ File size: 4.2 MB (≤ 20 MB)                                           │
│  ⚠ Text safe zone: manual check recommended                              │
│  ⚠ No URLs/watermarks: manual check recommended                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Focus 4: Review Actions

### Inline Review Bar (Submitted Deliverables)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ◐ Submitted · Master file                                Aug 25 🔴     │
│  ⏳ Awaiting Sam A&R · SLA Aug 27 · ██████░░░░  50%                    │
│                                                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                      │
│  │ ✅ Approve   │ │ 🔄 Request   │ │ ✕ Reject    │   → btns M 40px     │
│  │              │ │    Changes   │ │              │                      │
│  └──────────────┘ └──────────────┘ └──────────────┘                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Approve Dialog

```
┌──────────────────────────────────────────────────┐
│  Approve Master File v3?                           │
│                                                    │
│  This will mark the deliverable as Granted and     │
│  update the release's distribution readiness.      │
│                                                    │
│  ── Add a note (optional) ──                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Levels are clean. Dynamic range is solid.    │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────┐ ┌──────────┐                │
│  │  ✅ Approve      │ │  Cancel  │                │
│  └──────────────────┘ └──────────┘                │
└──────────────────────────────────────────────────┘
```

### Request Changes Dialog

```
┌──────────────────────────────────────────────────┐
│  Request Changes to Master File v3                │
│                                                    │
│  The submitter will need to revise and upload     │
│  a new version before resubmitting.               │
│                                                    │
│  ── What needs to change? (required) ──           │
│  ┌──────────────────────────────────────────────┐  │
│  │ Track 4: hi-hat tame 2dB around 8kHz.       │  │
│  │ Track 5: vocal raise 2dB in verse 2 (0:45). │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────┐ ┌──────────┐            │
│  │  🔄 Request Changes  │ │  Cancel  │            │
│  └──────────────────────┘ └──────────┘            │
└──────────────────────────────────────────────────┘
```

### Reject Dialog

```
┌──────────────────────────────────────────────────┐
│  Reject Master File v3?                            │
│                                                    │
│  This is the strongest signal. The current         │
│  submission is fundamentally wrong.                │
│  Status will revert to Pending.                    │
│                                                    │
│  ── Why is this rejected? (required) ──           │
│  ┌──────────────────────────────────────────────┐  │
│  │ Multiple tracks peak above 0dB with audible  │  │
│  │ clipping. Re-master from source stems.       │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────┐ ┌──────────┐                │
│  │  ✕ Reject       │ │  Cancel  │                │
│  └──────────────────┘ └──────────┘                │
└──────────────────────────────────────────────────┘
```

### Post-Decision States

**After Approve:**
```
┌──────────────────────────────────────────────────────┐
│  ● Granted · Master file · v3 · 👤 Sam W             │
│  Approved by Sam A&R · Aug 27 · "Levels are clean."  │
│  ┌──────────┐ ┌──────────┐                            │
│  │ Preview  │ │ History  │                            │
│  └──────────┘ └──────────┘                            │
└──────────────────────────────────────────────────────┘
```

**After Request Changes:**
```
┌──────────────────────────────────────────────────────┐
│  ◐ Submitted · Master file · v3 · 👤 Sam W           │
│  Changes requested by Sam A&R · Aug 26               │
│  "Track 4 hi-hat tame. Track 5 vocal raise."         │
│  ┌──────────┐ ┌──────────┐                            │
│  │ Preview  │ │ History  │                            │
│  └──────────┘ └──────────┘                            │
└──────────────────────────────────────────────────────┘
```

**After Reject:**
```
┌──────────────────────────────────────────────────────┐
│  ✕ Rejected · Master file · v3 · 👤 Sam W            │
│  Rejected by Sam A&R · Aug 26                        │
│  "Multiple tracks peaking above 0dB."                │
│  ┌──────────┐ ┌──────────┐                            │
│  │ Preview  │ │ History  │                            │
│  └──────────┘ └──────────┘                            │
└──────────────────────────────────────────────────────┘
```

---

## Spacing & Typography

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Element                    │ Token         │ Size / Weight     │ Color  │
│────────────────────────────┼───────────────┼───────────────────┼────────│
│ Deliverable name           │ Body · 600    │ 14px / 600        │ #18181B│
│ Deliverable spec           │ Body Small    │ 12px / 400        │ #A1A1AA│
│ Version number             │ Caption       │ 11px / 400        │ #52525B│
│ Approval status badge      │ Label         │ 12px / 500        │ status │
│ SLA text                   │ Body Small    │ 12px / 400        │ #52525B│
│ SLA bar                    │ h 4px         │ —                 │ #7C3AED│
│ Row hover actions          │ gap 8px       │ buttons S 32px    │ —      │
│ Version row                │ p 10px 12px   │ mb 4px            │ —      │
│ Version actions            │ gap 8px       │ above row divider │ —      │
│ Panel title                │ H3            │ 16px / 600        │ #18181B│
│ Audio waveform             │ h 120px       │ bg #F4F4F5       │ —      │
│ Image preview              │ max-h 400px   │ centered          │ —      │
│ Review actions bar         │ p 8px 0       │ btns M 40px       │ —      │
│ Dialog textarea            │ min-h 80px    │ Body 14px         │ —      │
│ Post-decision metadata     │ Body Small    │ 12px / 400        │ #52525B│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## CSS Implementation

```css
.deliverable-row {
  display: grid;
  grid-template-columns: 2fr 1fr 0.5fr 1fr 1fr;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #F1F5F9;
  cursor: pointer;
  position: relative;

  &:hover { background: #F5F3FF; }
  &.granted { background: #F0FDF4; }
  &.submitted { background: #F5F3FF; }
  &.rejected { background: #FEF2F2; }
  &.pending { background: #FFFFFF; }

  .sla-bar {
    height: 4px;
    border-radius: 2px;
    background: #F4F4F5;
    margin-top: 4px;
    .sla-fill {
      height: 100%;
      border-radius: 2px;
      background: #7C3AED;
      transition: width 300ms ease;
      &.green { background: #16A34A; }
      &.amber { background: #D97706; }
      &.red { background: #DC2626; }
    }
  }

  .hover-actions {
    display: none;
    position: absolute;
    right: 12px;
    gap: 8px;
  }
  &:hover .hover-actions { display: flex; }
}

.version-history-panel {
  position: fixed;
  right: 0;
  top: 0;
  width: 560px;
  height: 100vh;
  background: #FFFFFF;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow-y: auto;
  padding: 24px;
  transform: translateX(100%);
  transition: transform 300ms ease-in-out;
  &.open { transform: translateX(0); }
}

.version-row {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 4px;

  &.current { background: #F5F3FF; border-left: 3px solid #7C3AED; }
  &.approved { background: #F0FDF4; }
  &.rejected { background: #FEF2F2; }
  &.submitted { background: #F5F3FF; }

  .version-meta { font: var(--text-body-sm); color: #52525B; }
  .version-notes { font: var(--text-body-sm); font-style: italic; color: #A1A1AA; }
  .version-actions { display: flex; gap: 8px; margin-top: 8px; }

  .review-feedback {
    margin-top: 8px;
    padding: 8px;
    background: #FEF3C7;
    border-radius: 4px;
    font: var(--text-body-sm);
  }
}

.asset-preview-panel {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 200;
  display: flex;
  flex-direction: column;

  .preview-header {
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    color: #FFFFFF;
    font: var(--text-h3);
  }

  .preview-body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    img { max-width: 90vw; max-height: 70vh; object-fit: contain; }
  }

  .preview-metadata {
    padding: 16px 24px;
    background: #18181B;
    color: #A1A1AA;
    font: var(--text-body-sm);
    display: flex;
    gap: 24px;
  }

  .review-actions {
    padding: 16px 24px;
    background: #18181B;
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}

.compare-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 24px;

  .compare-mode-tabs {
    grid-column: 1 / -1;
    display: flex;
    gap: 0;
    margin-bottom: 16px;
    .mode-tab {
      padding: 6px 16px;
      font: var(--text-label);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      &.active { color: #7C3AED; border-color: #7C3AED; }
    }
  }

  .compare-pane {
    text-align: center;
    img { max-width: 100%; max-height: 50vh; object-fit: contain; }
    .pane-label {
      margin-top: 8px;
      font: var(--text-body-sm);
      color: #52525B;
    }
  }
}
```
