# TASK-1103 — Contributor Experience

## Premise

ReleaseFlow must become role-aware. When a Mix Engineer, Designer, or
Producer logs in, they should not see the same interface as a Project
Manager or Admin. The app must adapt to their role — showing only what
matters and hiding everything else.

Technical contributors log in to **complete work**, not to manage. Every
element that doesn't serve that mandate is noise.

---

## Universal Principles

These apply to all three roles:

1. **Task-first layout.** The dashboard shows tasks, not releases. Tasks
   are the atomic unit of work for contributors.
2. **No org-level navigation.** No sidebar with Dashboard, Marketing,
   Distribution, Reports, Settings. These roles see only their work.
3. **Immediate action.** The most important action (upload, download,
   submit) is no more than one click away.
4. **Context always visible.** Every view includes the release name,
   stage, and deadline — no hunting for context.
5. **Inbox mentality.** Unread notifications = open tasks = inbox count.
   Clearing tasks is the core loop.
6. **No admin chrome.** No "+ New Release" FAB, no org switcher (single-
   org is the common case), no settings gear (settings are in user menu
   only).
7. **Mobile-native.** Producers, engineers, and designers are often on
   mobile when receiving delivery requests or checking status.

---

## Navigation Structure (All Three Roles)

```
┌──────────────────────────────────────────┐
│  ◐ ReleaseFlow                  🔔  👤  │  ← Top bar: logo, bell, avatar
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────────┐  ┌──────────────────┐ │
│  │  ○ My Tasks  │  │  ○ Assigned      │ │  ← Two primary tabs
│  └──────────────┘  └──────────────────┘ │
│                                          │
│  [Active tab content]                    │
│                                          │
└──────────────────────────────────────────┘
```

- **My Tasks:** Active task list — tasks in TODO, IN_PROGRESS, REVIEW
  where this user is the assignee.
- **Assigned:** All tasks + releases where this user is a named
  contributor. Completed tasks are here too.

No sidebar. Two tabs. The header is minimal. The notification bell shows
the count of unread items (new tasks, comments, deadlines).

---

## Mix Engineer Experience

### Who they are
Mix engineer (or mastering engineer). Assigned to a specific release for
the Mixing and/or Mastering stages. Their deliverables are stereo mix
files (WAV 24/48) and master files (WAV 16/44.1).

### What they need
- Download source stems and reference tracks
- Upload mix files for review
- See comments from A&R, Artist, PM
- Know deadline and mark work complete
- Nothing else

### Dashboard (Login State)

```
┌────────────────────────────────────────────────────────────┐
│  ◐ ReleaseFlow                                   🔔 (2)  👤 │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────────┐│
│  │  ● My Tasks (3)  │  │  ○ Assigned                      ││
│  └──────────────────┘  └──────────────────────────────────┘│
│                                                             │
│  ─── Open Tasks ────────────────────────────────────────   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ◉ Mix "Lead Vocal"                                  │  │
│  │     Midnight Sessions · Mixing                      │  │
│  │     Due: Jun 28, 2026  🔴 Overdue                    │  │
│  │     ┌──────────┐  ┌──────────┐                       │  │
│  │     │ + Upload  │  │ Mark Done│                       │  │
│  │     └──────────┘  └──────────┘                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ○ Set up reverb bus                                  │  │
│  │     Midnight Sessions · Mixing                      │  │
│  │     Due: Jul 05, 2026  🟡 This week                  │  │
│  │     ┌──────────┐                                      │  │
│  │     │ Start    │                                      │  │
│  │     └──────────┘                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ○ EQ drum stem                                       │  │
│  │     Summer EP · Mixing                               │  │
│  │     Due: Jul 10, 2026  🟢 On track                   │  │
│  │     ┌──────────┐                                      │  │
│  │     │ Start    │                                      │  │
│  │     └──────────┘                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ─── Recently Completed ────────────────────────────────   │
│                                                             │
│  ✓ Import stems              Midnight Sessions · Jun 14   │
│  ✓ Set up session            Midnight Sessions · Jun 12   │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Task Detail (Clicking a task opens this panel)

```
┌──────────────────────────────────────────────┐
│  ← Back to Tasks                              │
│                                               │
│  ◉ Mix "Lead Vocal"                           │
│  Midnight Sessions · Mixing                   │
│  Due: Jun 28, 2026  🔴 Overdue                │
│                                               │
│  ── Description ──                            │
│  Set up vocal EQ chain using reference        │
│  provided by Artist. Focus on clarity         │
│  in the 2-5kHz range.                         │
│                                               │
│  ── Source Files ──                           │
│  📁 lead-vocal-stem.wav    152.3 MB  [Download]│
│  📁 vocal-reference.mp3      8.4 MB  [Download]│
│                                               │
│  ── Your Uploads ──                           │
│  📁 lead-vocal-mix-v1.wav   94.2 MB  [Delete] │
│                                               │
│  ┌───────────────────────────────┐            │
│  │  + Upload new mix / revision  │            │
│  └───────────────────────────────┘            │
│                                               │
│  ── Comments ──                               │
│  💬 Sam W: "Looking at reference now."        │
│  💬 Artist X: "Keep the warmth in 200-400Hz." │
│                                               │
│  ┌────────────────────────────────────────┐   │
│  │  Write a comment...              [Send]│   │
│  └────────────────────────────────────────┘   │
│                                               │
│  ┌──────────────────┐ ┌────────────────────┐  │
│  │  Submit for Review│ │  Mark as Done      │  │
│  └──────────────────┘ └────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Release View (if they navigate to a release)

Mix engineers see a simplified release view. They see:
- Overview tab (with stage pipeline status ONLY for mixing/mastering)
- Assets tab (filtered to mixes/masters they have access to)
- Comments / activity related to their tasks

They do NOT see:
- Tracks tab (track CRUD is not for them)
- Contributors tab
- Settings tab
- The full workflow — only their assigned stages are visible

---

## Designer Experience

### Who they are
Artwork designer. Assigned to a release for the Artwork stage. Their
deliverable is cover art (3000×3000 JPG/PNG). May also handle booklet
design, social media assets, promo graphics.

### What they need
- Creative brief and reference materials
- Upload artwork versions
- See comments/feedback from A&R, PM
- Know deadline
- Nothing else

### Dashboard (Login State)

```
┌────────────────────────────────────────────────────────────┐
│  ◐ ReleaseFlow                                   🔔 (1)  👤 │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────────┐│
│  │  ● My Tasks (2)  │  │  ○ Assigned                      ││
│  └──────────────────┘  └──────────────────────────────────┘│
│                                                             │
│  ─── Open Tasks ────────────────────────────────────────   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ◉ Cover art design                                   │  │
│  │     Midnight Sessions · Artwork                     │  │
│  │     Due: Sep 01, 2026  🟢 On track                   │  │
│  │     Brief: Dark moody aesthetic, midnight blue       │  │
│  │            tones, artist silhouette in center.        │  │
│  │     ┌──────────┐  ┌──────────┐                       │  │
│  │     │ + Upload  │  │ Mark Done│                       │  │
│  │     └──────────┘  └──────────┘                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ○ Social media assets                                │  │
│  │     Summer EP · Artwork                              │  │
│  │     Due: Aug 15, 2026  🟢 On track                   │  │
│  │     ┌──────────┐                                      │  │
│  │     │ Start    │                                      │  │
│  │     └──────────┘                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ─── Reference Library ──────────────────────────────────   │
│                                                             │
│  🖼  artist-photos.zip         42.1 MB          [Download] │
│  📄  creative-brief.md          2.1 KB           [Download]│
│  🖼  logo-assets.zip            8.7 MB           [Download]│
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Key differences from Mix Engineer
- **Reference Library section** — designers often receive reference
  materials (photos, logos, briefs) as context for their work. These are
  shown prominently on the dashboard.
- **Creative brief inline** — the brief is shown directly in the task
  card (first 2-3 lines) so the designer doesn't need to click in to
  understand the ask.
- **Upload is version-aware** — "Upload new version" vs "Upload" because
  artwork iteration involves multiple revisions. Delete is available on
  own uploads.

### Task Detail

Same structure as Mix Engineer, with these differences:
- File preview thumbnails for uploaded artwork (120×120px)
- "Upload new version" creates v2, v3, etc. instead of separate files
- Source section shows reference images inline with thumbnails

---

## Producer Experience

### Who they are
Music producer. Assigned to a release for the Production stage. Their
deliverables include raw audio stems, session files, rough mixes, and
arrangement notes. May also be involved in Mixing and Mastering as a
reviewer.

### What they need
- See what needs recording / producing and by when
- Upload session files, stems, rough mixes
- See comments from Artist and A&R
- Know what the Artist has already uploaded
- Review mix/master versions (if they are reviewers)

### Dashboard (Login State)

```
┌────────────────────────────────────────────────────────────┐
│  ◐ ReleaseFlow                                   🔔 (3)  👤 │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────────────┐│
│  │  ● My Tasks (4)  │  │  ○ Assigned                      ││
│  └──────────────────┘  └──────────────────────────────────┘│
│                                                             │
│  ─── Open Tasks ────────────────────────────────────────   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ◉ Record guitar layers                               │  │
│  │     Midnight Sessions · Production                   │  │
│  │     Due: Jul 05, 2026  🟡 This week                   │  │
│  │     ┌──────────┐  ┌──────────┐                       │  │
│  │     │ + Upload  │  │ Mark Done│                       │  │
│  │     └──────────┘  └──────────┘                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ○ Arrange drum patterns                               │  │
│  │     Midnight Sessions · Production                   │  │
│  │     Due: Jul 12, 2026  🟢 On track                   │  │
│  │     ┌──────────┐                                      │  │
│  │     │ Start    │                                      │  │
│  │     └──────────┘                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ○ Vocal comp review                                   │  │
│  │     Summer EP · Production                            │  │
│  │     Due: Jul 20, 2026  🟢 On track                    │  │
│  │     ┌──────────┐                                      │  │
│  │     │ Start    │                                      │  │
│  │     └──────────┘                                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ◐ Review mix version (from Mix Eng)                  │  │
│  │     Summer EP · Mixing                               │  │
│  │     Due: Jul 25, 2026  🟢 On track                   │  │
│  │     ┌──────────┐                                      │  │
│  │     │ Review   │                                      │  │
│  │     └──────────┘                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ─── Recently Completed ────────────────────────────────   │
│                                                             │
│  ✓ Set up drum bus template   Midnight Sessions · Jun 20  │
│  ✓ Bass comp & arrangement    Midnight Sessions · Jun 18  │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### Key differences from Mix Engineer
- **Review tasks mixed in** — Producer may also be a reviewer on later
  stages. Review tasks show a different status badge (◐) and action
  button ("Review" instead of "Start").
- **Multiple instruments/stems per release** — Producer tasks tend to
  be more numerous (one per instrument/element) compared to the
  engineer's fewer, larger tasks.

---

## Cross-Role Comparison

| Aspect | Mix Engineer | Designer | Producer |
|--------|-------------|----------|----------|
| Primary stage | Mixing, Mastering | Artwork | Production |
| Task granularity | Few large tasks | One major task + optional sub-tasks | Many per-instrument tasks |
| Deliverables | WAV mix/master files | JPG/PNG artwork, PDFs | WAV stems, session files |
| Iterations | v1, v2, revisions | v1, v2, many revisions | Fewer revisions (usually v1 done) |
| Reference materials | Source stems | Photos, logos, briefs | Reference tracks, demos |
| Review duties | Rarely reviews others | Never reviews others | May review mixes/masters |
| Mobile behavior | Sound check, approve on phone | View designs on phone, approve | Quick task checks, comment |

---

## Mobile Experience (All Three)

```
┌──────────────────────────┐
│  ◐ ReleaseFlow  🔔 (2)   │
├──────────────────────────┤
│  ┌────────┐ ┌──────────┐ │
│  │● Tasks│ │○ Assigned│ │
│  └────────┘ └──────────┘ │
│                           │
│  ── Open (3) ──           │
│                           │
│  🔴 Mix Lead Vocal        │
│     Midnight Sessions      │
│     Mixing · Due Jun 28    │
│     [Upload]  [Done]      │
│                           │
│  🟡 Set up reverb bus     │
│     Midnight Sessions      │
│     Mixing · Due Jul 05    │
│     [Start]               │
│                           │
│  🟢 EQ drum stem           │
│     Summer EP              │
│     Mixing · Due Jul 10    │
│     [Start]               │
│                           │
│  ── Done ──               │
│  ✓ Import stems           │
│  ✓ Set up session         │
└──────────────────────────┘
```

On mobile, tasks stack vertically with urgent ones at top. Color-coded
left border (🔴 red, 🟡 amber, 🟢 green) gives immediate priority sense.
Two action buttons per active task — no hunting through menus.

---

## Notification Differences

What triggers a notification for each role:

| Event | Mix Engineer | Designer | Producer |
|-------|-------------|----------|----------|
| New task assigned | ✅ | ✅ | ✅ |
| Task due soon (24h) | ✅ | ✅ | ✅ |
| Comment on their task | ✅ | ✅ | ✅ |
| Mix/master ready for review | — | — | ✅ (if reviewer) |
| Artwork rejected | — | ✅ | — |
| Asset uploaded by Artist | ✅ (stems) | ✅ (photos) | ✅ (recordings) |
| Stage completed | ✅ | ✅ | ✅ |
| Release shipped | ✅ | ✅ | ✅ |

---

## Implementation Notes

### Role Detection

On login, the backend returns the user's role(s) and self-scoped
resources. The frontend switches the layout based on the highest-
permission role:

```
User roles    → Layout
─────────────────────────────────────
Owner/Admin   → Full org layout (sidebar, all nav items)
PM/A&R        → Management layout (sidebar, management nav)
Artist        → Artist layout (sidebar, my releases)
Mix Eng/Designer/Producer → Contributor layout (task-first, no sidebar)
Marketing/PR  → Campaign layout (sidebar, marketing nav)
Viewer        → Read-only org layout
```

### Scope Filtering

When a Mix Engineer requests `/api/tasks`, the backend filters:

```typescript
// Backend scope filter for technical roles
function filterTasksForContributor(
  tasks: Task[],
  user: User,
  role: 'ENGINEER' | 'PRODUCER' | 'DESIGNER'
): Task[] {
  return tasks.filter(task =>
    task.assigneeId === user.id ||
    task.stageId === getStageForRole(role, task.releaseId)
  );
}
```

The frontend has no awareness of other tasks — it only receives what it is
authorized to see. This prevents any client-side data leak.

### Layout Constants

| Property | Contributor Layout | Full Layout |
|----------|-------------------|-------------|
| Sidebar | Hidden | 240px |
| Top nav | Minimal: logo + bell + avatar | Full: logo + nav + search + bell + avatar |
| Primary nav | Two tabs (My Tasks, Assigned) | Sidebar (Dashboard, Releases, etc.) |
| Header | Flat, no breadcrumb | Breadcrumb + actions |
| FAB | Hidden | Visible |
| Org switcher | Hidden (single org) | Visible |
| Upgrade banner | Hidden | Visible |
