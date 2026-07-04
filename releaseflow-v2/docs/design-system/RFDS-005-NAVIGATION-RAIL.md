# RFDS-005 — Navigation Rail

**Status:** Active
**Version:** 1.0

---

## Principle

The navigation rail is the primary spatial navigation system. It is always present on desktop, always available on mobile, and always visually quieter than content.

VH: 40. Never higher.

---

## Anatomy

```
┌──────────────────┐
│ Brand (R logo)    │  64px tall, center-aligned in collapsed
│                   │
├──────────────────┤
│ Sections          │
│                   │
│ Operations        │  Section header (10px, text-300/70)
│   Home            │  Nav item (13px, text-400)
│   Releases        │  Nav item (13px, text-400)
│                   │
│ Resources         │  Section header
│   Artists         │  Nav item (active: text-900)
│   Assets          │  Nav item
│                   │
│ System            │  Section header
│   Admin           │  Nav item
│                   │
├──────────────────┤
│ User              │  Avatar + email (minimal)
│ Sign out          │  Quiet text link
└──────────────────┘
```

---

## Dimensions

| State | Width | Visible |
|-------|------:|---------|
| Expanded | 256px | Icons + labels + section headers |
| Collapsed | 72px | Icons only + tooltips |
| Mobile overlay | 256px | Same as expanded, dismiss on nav |

---

## States

### Nav Item

| State | Appearance |
|-------|-----------|
| Idle | `text-text-400`, 13px normal, rounded-md |
| Hover | `text-text-700`, no background |
| Active | `text-text-900`, 13px normal, no background, active dot (1.5px primary-500, right-aligned) |
| Focus (keyboard) | `focus-visible:ring-2 outline-primary-500/30` |

### Section Header

| State | Appearance |
|-------|-----------|
| All states | `text-[10px] font-medium uppercase tracking-[0.1em] text-text-300/70` |

### Collapse Toggle

| State | Appearance |
|-------|-----------|
| Idle | Rounded button at right edge |
| Hover | Subtle background |
| Focus | Focus ring |

---

## Behaviour

### Desktop
- Expanded: 256px, shows labels + section headers
- Collapsed: 72px, shows icons only, tooltips on hover (150ms delay)
- Toggle: Button at right edge, ⌘\ shortcut

### Mobile
- Overlay drawer
- Opens: slide from left, 200ms
- Closes: slide to left, 200ms, or dismiss on backdrop tap
- Escape closes
- Swipe right to open (80px threshold)
- Auto-close after navigation
- Backdrop: `bg-surface-900/40 backdrop-blur-sm`

---

## Content Rules

- Maximum 3 sections
- Maximum 10 nav items total
- Active item: darker text, no background, subtle indicator dot
- No badges or counts on nav items (navigation is not a notification centre)
- User section at bottom: minimal, no border separating it from nav

---

## Accessibility

- `role="navigation" aria-label="Main navigation"`
- Section headers: `role="heading" aria-level="2"`
- Each nav item: `aria-current="page"` when active
- Tab order: Brand → nav items (top to bottom) → user → sign out
- Keyboard: Arrow keys navigate between items
