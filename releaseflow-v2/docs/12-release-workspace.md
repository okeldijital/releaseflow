# Release Workspace

## Concept

Each release is its own workspace — a focused environment with its own
navigation, tabs, and context. The sidebar switches from org-level nav
to release-level nav when viewing a release.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ◐ ReleaseFlow    ◆ Dashboard    Releases ▼          🔔  👤    │
│                                                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ◀ Back to Releases                                              │
│                                                                   │
│  Midnight Sessions      Single · Artist X   ┌────────────┐      │
│                                             │ PRODUCTION  │      │
│                                             └────────────┘      │
│  ┌──────────┬────────┬────────────┬──────────┬──────────┐       │
│  │    ◆     │   ☰    │     👥      │    ⚙     │   ⚙     │       │
│  │ Overview │ Tracks │ Contributors│ Workflow │ Settings │       │
│  └──────────┴────────┴────────────┴──────────┴──────────┘       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │  [Content for active tab]                                     │ │
│  │                                                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tab Bar States

```
                                          Active
  ┌──────────┐  ┌────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐
  │    ◆     │  │   ☰    │  │     👥      │  │    ⚙     │  │   ⚙     │
  │ Overview │  │ Tracks │  │ Contributors│  │ Workflow │  │ Settings │
  └──────────┘  └────────┘  └────────────┘  └──────────┘  └──────────┘
```

---

## Status Badge

A persistent status badge is displayed in the release header, adjacent
to the release title and metadata. It reflects the current release state
and is always visible regardless of which tab is active.

### Badge States

| Status      | Style                    | Background    |
|-------------|--------------------------|---------------|
| DRAFT       | Border only, muted text  | Transparent   |
| PLANNING    | Blue text, blue border   | #DBEAFE       |
| PRODUCTION  | Purple text              | #EDE9FE       |
| ON HOLD     | Amber text               | #FEF3C7       |
| READY       | Green text               | #DCFCE7       |
| RELEASED    | Green text, filled       | #16A34A solid |
| ARCHIVED    | Stone text               | #F4F4F5       |
| CANCELLED   | Red text, strikethrough  | #FEE2E2       |

---

### Tab States

| State      | Style                                      |
|------------|--------------------------------------------|
| Active     | Bottom border Primary, icon + text Primary |
| Inactive   | Icon + text Text Secondary                 |

---

## Tab Contents (Sprint 003)

### 1. Overview
Release dashboard with status, progress, recent activity, and quick
actions. See `14-release-dashboard.md` for details.

### 2. Tracks
Track listing table with metadata fields.

```
┌────┬──────────────────────┬──────────┬──────────┬──────────┐
│  # │ Title                 │ Duration  │ ISRC     │ Status   │
├────┼──────────────────────┼──────────┼──────────┼──────────┤
│  1 │ Midnight (Original)   │ 03:45     │ TBD      │ Draft    │
│  2 │ Sunrise               │ 03:12     │ TBD      │ Draft    │
└────┴──────────────────────┴──────────┴──────────┴──────────┘

✚ Add track
```

### 3. Contributors
Contributor assignment table.

```
┌──────────────┬──────────────────┬──────────┬──────────┐
│ Role         │ Name             │ Scope    │ Status   │
├──────────────┼──────────────────┼──────────┼──────────┤
│ Artist       │ Artist X         │ Release  │ Confirmed│
│ Writer       │ Alex Taylor      │ Track 1  │ Pending  │
│ Producer     │ Producer Z       │ Track 1  │ Confirmed│
└──────────────┴──────────────────┴──────────┴──────────┘

✚ Add contributor
```

### 4. Workflow
Stage pipeline with task breakdown per stage.

```
  Planning ── [████░░░░░░]  40%    ☑ 2/5 tasks complete
  Production ── [░░░░░░░░░░]  0%   ☐ 0/3 tasks
  Mixing ── [░░░░░░░░░░]  0%      ☐ 0/2 tasks
  Mastering ── [░░░░░░░░░░]  0%   ☐ 0/2 tasks
  Artwork ── [░░░░░░░░░░]  0%     ☐ 0/2 tasks
  Distribution ── [░░░░░░░░░░] 0%  ☐ 0/3 tasks
  Release ── [░░░░░░░░░░]  0%     ☐ 0/1 tasks
```

### 5. Settings
Release-level configuration: metadata overrides, template change,
archival.

---

## Mobile View

```
┌──────────────────────┐
│ ◐ RF         🔔  👤  │
├──────────────────────┤
│ ◀ Midnight Sessions  │
│                      │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐│
│ │◆ │ │☰ │ │👥│ │⚙ ││
│ └──┘ └──┘ └──┘ └──┘│
│ ─── ─── ─── ─── ── │
│ [More tab...] >     │
│                      │
│ [Tab content]        │
└──────────────────────┘
```

---

## Tab Permissions

| Tab         | Owner | Admin | PM  | A&R | Artist | Producer | Engineer | Designer | Mkt | PR  | Viewer |
|-------------|-------|-------|-----|-----|--------|----------|----------|----------|-----|-----|--------|
| Overview    | ●     | ●     | ●   | ●   | ◐      | ◐        | ◐        | ◐        | ●   | ●   | ○      |
| Tracks      | ●     | ●     | ●   | ●   | ◐      | −        | −        | −        | ○   | ○   | ○      |
| Contributors| ●     | ●     | ●   | ●   | ◐      | −        | −        | −        | −   | −   | ○      |
| Workflow    | ●     | ●     | ●   | ●   | ○      | ○        | ○        | ○        | ○   | ○   | ○      |
| Settings    | ●     | ●     | ◐   | ◐   | ◐      | −        | −        | −        | −   | −   | −      |
