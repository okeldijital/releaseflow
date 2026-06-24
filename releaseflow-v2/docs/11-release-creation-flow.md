# Release Creation Flow

## Target: < 60 seconds

The entire creation flow fits in a single modal dialog with 3 steps.
Progressive disclosure — no page reloads until final submission.

---

## Flow Overview

```
  Step 1 of 3       Step 2 of 3       Step 3 of 3
  Basic Info         Workflow          Review & Create
  ┌──────────┐      ┌──────────┐      ┌──────────┐
  │ Title     │      │ Single   │      │ Summary  │
  │ Type      │ ──►  │ EP       │ ──►  │ Confirm  │
  │ Date      │      │ Album    │      │ Create   │
  │           │      │ Remix    │      │          │
  └──────────┘      └──────────┘      └──────────┘
```

---

## Step 1: Basic Information

```
┌──────────────────────────────────────────────────────────────┐
│  ✚ New Release                                          [×] │
│                                                              │
│  Step 1 of 3: Basic Information              ◉○○ ○○○  33%   │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  Release name  *                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Midnight Sessions                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Release type  *                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 🎵 Single│ │ 📀 EP    │ │ 💿 Album │ │ 🔄 Remix │       │
│  │ 1 track  │ │ 3-6 trks │ │ 7+ trks │ │ 1 track  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                              │
│  Target release date  *                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Sep 15, 2026                                    📅  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  No fixed date yet — remain in Draft                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │    Cancel    │    │  Continue     │                       │
│  └──────────────┘    └──────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Step 2: Workflow Template

```
┌──────────────────────────────────────────────────────────────┐
│  ✚ New Release                                          [×] │
│                                                              │
│  Step 2 of 3: Workflow Template             ◉◉○ ○○○  66%   │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  Template preview: Single                                     │
│                                                              │
│  Stage pipeline:                                              │
│                                                              │
│  Planning  →  Production  →  Mixing  →  Mastering             │
│  ┌──────┐    ┌──────────┐   ┌──────┐   ┌────────┐           │
│  │  ○   │    │    ○     │   │  ○   │   │   ○    │           │
│  └──────┘    └──────────┘   └──────┘   └────────┘           │
│                                                              │
│  Artwork  →  Distribution  →  Release                        │
│  ┌──────┐    ┌────────────┐   ┌──────┐                      │
│  │  ○   │    │     ○      │   │  ○   │                      │
│  └──────┘    └────────────┘   └──────┘                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  7 stages · No approvals required in V1 · Manual task    ││
│  │  creation per stage. You can customize this later.       ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                        │
│  │    ← Back    │    │  Continue     │                        │
│  └──────────────┘    └──────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

### Template Quick Reference

| Template | Stages | Tracks |
|----------|--------|--------|
| Single   | 7      | 1      |
| EP       | 7      | 3-6    |
| Album    | 7      | 7+     |
| Remix    | 6      | 1      |

---

## Step 3: Review & Create

```
┌──────────────────────────────────────────────────────────────┐
│  ✚ New Release                                          [×] │
│                                                              │
│  Step 3 of 3: Review & Create               ◉◉◉ ○○○ 100%   │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  Summary                                                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Midnight Sessions                                       ││
│  │  ────────────────────────────────────────                 ││
│  │  Type:     Single (1 track)                              ││
│  │  Release:  Sep 15, 2026                                  ││
│  │  Workflow: Single Pipeline (7 stages)                    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  📌 A single track titled "Midnight Sessions" will be    ││
│  │     created automatically. You can add more tracks       ││
│  │     later from the release workspace.                    ││
│  └──────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌──────────────┐    ┌──────────────┐                        │
│  │    ← Back    │    │  🚀 Create   │                        │
│  └──────────────┘    └──────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Success → Redirect

```
On completion:
  Redirect to:  /releases/{id}/overview
  Toast:        "Midnight Sessions created"
  Duration:     ~1.5s loading, instant redirect
```

---

## Edge Cases

| Scenario                     | Handling                                   |
|------------------------------|--------------------------------------------|
| Title empty                  | Inline error: "Release name is required"   |
| No type selected             | Inline error: "Select a release type"      |
| Network failure              | Retry button; form state preserved         |
| Duplicate title detected     | Warning: "A release with this title exists"|
| User closes modal mid-flow   | Discard changes (short form, low risk)     |
