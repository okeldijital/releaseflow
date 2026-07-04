# RFDS-004 — Typographic Hierarchy

**Status:** Active
**Version:** 1.0

---

## Principle

Not font sizes. Communication hierarchy.

Each text role defines: semantic purpose, visual weight, maximum line length, tracking, leading, and permitted frequency.

No page invents new text roles.

---

## Text Roles

| Role | Size | Weight | Line | Max Width | Tracking | Frequency |
|------|------|--------|------|-----------|----------|-----------|
| **Display** | 40px | 500 | 1.1 | 640px | -0.01em | Once per page |
| **Headline** | 28px | 600 | 1.2 | 640px | -0.01em | Once per page |
| **Statement** | 15px | 400 | 1.5 | 640px | 0 | Unlimited |
| **Assessment** | 24px value / 10px label | 500 value / 600 label | 1.1 | 320px per column | 0 / 0.08em | Per page |
| **Recommendation** | 15px | 500 | 1.5 | 640px | 0 | Max 3 per page |
| **Evidence** | 14px | 400 | 1.3 | 960px | 0 | Unlimited |
| **Metadata** | 11px | 400 | 1.1 | Inline | 0 | Unlimited |
| **Annotation** | 10px | 600 | 1.0 | Inline | 0.08em | Unlimited |

---

## Role Definitions

### Display (40px)
The page identity. One per page. The user's first eye contact.

| Page | Display Text |
|------|-------------|
| Operations Center | Date ("MONDAY, JUNE 29, 2026") |
| Release Workspace | Release title |
| Artist Workspace | Artist name |

### Headline (28px)
Used only when Display is insufficient. Modal headers, drawer titles, onboarding screens.

### Statement (15px)
Operational narrative. The briefing. Answers "what is happening?" in plain language.

### Assessment (24px value / 10px label)
Health %, readiness %, stage. Two-column grid. Each cell pairs a value with a label.

### Recommendation (15px, 500)
One sentence. Present tense. Right-aligned timestamp (10px, 600, NOW).

### Evidence (14px)
Table cells, list items, activity entries. The default text role for operational content.

### Metadata (11px)
Secondary values. IDs, timestamps, technical data. Never in the primary reading flow.

### Annotation (10px, 600, tracking-widest)
Section headers, tab labels, button text. Always uppercase.

---

## Permitted Frequency

| Role | Per Page | Per Section |
|------|----------|-------------|
| Display | 1 | 1 |
| Headline | 1 | 1 |
| Statement | 3 | 1 |
| Assessment | 4 pairs | 4 pairs |
| Recommendation | 3 | 3 |
| Evidence | Unlimited | Unlimited |
| Metadata | Unlimited | Unlimited |
| Annotation | Unlimited | Unlimited |

---

## Weight and Tracking Rules

| Weight | Use |
|--------|-----|
| 400 | Body, evidence, metadata — default |
| 500 | Display, recommendation, labels — slightly heavier |
| 600 | Headline, assessment labels, annotation — semibold |

Never use 700 (bold) in body text. Reserve for Display at 40px or larger. Never use 300 (light). It disappears on dark backgrounds.

---

## Line Length

65–80 characters per line for reading text. This maps to ~640px at 15px body size. Evidence (tables) may exceed this.

---

## Anti-Patterns

| Anti-Pattern | Why |
|-------------|-----|
| Display role used twice | Two competing page identities |
| Statement at 12px | Too small to feel like an operational statement |
| Assessment at body size | Assessment is not body text — it is scannable pairs |
| Body at annotation size | Annotations support body — body never at 10px |
| Three font weights in one paragraph | Typographic noise |
| Center-aligned body text | Center is for display only |
