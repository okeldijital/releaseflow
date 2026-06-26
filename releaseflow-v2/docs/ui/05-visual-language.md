# 05 — Visual Language

## Identity

ReleaseFlow is an operations platform. It feels like a tool, not a
website. Every visual decision serves one purpose: helping a label ship
releases on time.

---

## Design Principles

### 1. Operational

**What it means:** The interface communicates what needs to happen next.
Every screen has a clear action point. Nothing is decorative.

**Visual expression:**
- White dominates — the background recedes so data comes forward.
- Color is used only to signal state — never for decoration.
- Density is acceptable. A PM scanning 10 releases needs to see them at once.
- Loading states show skeletons, not spinners. The UI is present before the data arrives.

**Anti-patterns:** Hero images, animated backgrounds, empty space for
breathing room, large illustrations, "onboarding tours."

### 2. Professional

**What it means:** The interface respects the user's expertise. Labels,
A&Rs, and PMs know music. The UI should never feel like it's teaching
them their job.

**Visual expression:**
- Language is direct. Buttons say what they do: "Submit to DSPs," not "Let's go!"
- No wizards longer than 3 steps. Power users work fast.
- Confirmation dialogs explain consequences, not just "Are you sure?"
- Terminology uses industry standards: ISRC, UPC, DDEX, PRO, IPI, LUFS.
- No gamification. No streaks. No badges for "completing 5 tasks."

**Anti-patterns:** Marketing copy in the UI, emoji in system messages,
gamification elements, tutorials that block the interface.

### 3. Calm

**What it means:** The interface does not create urgency. Alerts are
precise, not alarming. A blocked stage is shown, not screamed.

**Visual expression:**
- Alert colors are muted, not saturated. Red is `#DC2626`, not `#FF0000`.
- Critical alerts show severity through size and position, not flashing.
- Transitions are subtle: 150ms on hover, 300ms on panel open.
- Toast notifications appear and disappear without demanding attention.
- Empty states are reassuring, not accusatory: "No releases yet" not "You haven't created anything."

**Anti-patterns:** Flashing elements, aggressive red, "URGENT" labels,
popup modals that interrupt workflow, countdown timers on non-critical
actions.

### 4. Reliable

**What it means:** The interface behaves predictably. The same action in
the same place always does the same thing. The user builds muscle memory.

**Visual expression:**
- Primary actions are always in the same position (bottom-right on
  desktop, bottom-center on mobile).
- Navigation structure is consistent: sidebar for org-level, tab bar for
  release-level.
- Terminology is consistent: a "stage" is always a "stage," never a
  "phase" or "step" or "milestone."
- Status colors are consistent: green always means complete/approved/ready.
- Forms autosave. There is no "Save" button on simple forms — data is
  persisted on blur.

**Anti-patterns:** Inconsistent labeling, actions moving between screens,
different patterns for the same interaction, loss of unsaved work.

### 5. Information Dense

**What it means:** The interface shows as much relevant information as
possible without overwhelming. A PM should see the state of every release
without clicking.

**Visual expression:**
- Tables are compact: 14px text, 12px column headers, 1px horizontal
  borders, no zebra stripes.
- The Release Pulse matrix (doc 60) puts 6 dimensions in one row.
- Tooltips exist but are never the only way to access information.
- Color is backed by text. A red dot without a label is ambiguous.
- Progressive disclosure: show the summary, offer the detail. Don't make
  the user click to see the summary.

**Anti-patterns:** Cards with one data point, excessive whitespace,
"dashboard widgets" that require scrolling to see all information,
collapsed sections that hide critical data.

---

## What ReleaseFlow Is Not

| Is Not | Why |
|--------|-----|
| **Social** | No feeds, no likes, no follower counts, no social graph. The activity feed is an audit log, not a timeline. |
| **Entertainment** | No background music, no video autoplay, no immersive transitions. Audio playback exists only for review purposes. |
| **Consumer** | This is B2B software. The primary user is a professional managing releases, not a fan discovering music. |
| **Playful** | No confetti on release day (a toast is enough). No animations on checkbox completion. No personality in the copy. |

---

## Color Philosophy

Color exists to signal state. Four rules:

1. **Color is never decorative.** Every color on screen means something
   about the state of an entity.
2. **Color is always backed by text or icon.** A red dot without a label
   is not accessible. A green bar without a percentage is ambiguous.
3. **One meaning per color.** Green means complete/approved/ready in
   every context. It never means "selected" or "active."
4. **Muted, not saturated.** Background tints for status badges are at
   10–15% opacity of the base color. Full saturation is reserved for
   text on the badge.

---

## Spacing Philosophy

The 4px grid is the foundation. Every spacing value is a multiple of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-text gap, badge padding |
| sm | 8px | Inline element gap, section padding |
| md | 12px | Card padding, form field gap |
| lg | 16px | Section margin, modal padding |
| xl | 24px | Page section gap |
| 2xl | 32px | Major section separation |

---

## Motion Philosophy

Animation exists to orient, not to delight.

| Duration | Easing | Usage |
|----------|--------|-------|
| 100ms | ease-out | Hover, active states |
| 150ms | ease | Card hover shadow, button press |
| 200ms | ease-in-out | Toggle, open/close, route change |
| 300ms | ease-in-out | Panel slide, modal open/close |

No animation exceeds 300ms. No animation delays content. No animation
plays on initial page load — the content appears immediately.
