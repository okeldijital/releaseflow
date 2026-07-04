# Typography System — ReleaseFlow

**Version:** 1.0
**Source:** PDS-13 tokens, extended with rules and constraints

---

## Typeface

**Primary:** Inter (Geist Sans fallback) — clean, modern, highly legible at small sizes.

**Mono:** Geist Mono — for UPC, ISRC, catalog numbers, and code contexts only.

---

## Hierarchy

### Display XL — 48px / 3.5rem line / 700 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Major landing pages, onboarding, rare editorial moments |
| Maximum usage | Once per page |
| Tracking | -0.01em |

### Display L — 36px / 2.75rem line / 700 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Workspace titles on primary screens |
| Maximum usage | Once per page |

### Display M — 30px / 2.375rem line / 700 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Modal titles, drawer headers |
| Maximum usage | Once per overlay |

### Heading 1 — 24px / 2rem line / 600 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Primary page title |
| Maximum usage | Once per page |
| Current implementation | `text-[1.75rem] font-semibold tracking-tight` (~28px equivalent) |

### Heading 2 — 20px / 1.75rem line / 600 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Major section titles, card headers |
| Maximum usage | Multiple per page |

### Heading 3 — 18px / 1.625rem line / 600 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Subsection titles, panel headers |
| Maximum usage | Multiple per page |

### Heading 4 — 16px / 1.5rem line / 600 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Context Rail section headers, tab labels |
| Maximum usage | Multiple per page |

### Body Large — 16px / 1.5rem line / 400 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Primary reading text, OperationalSummary narrative |
| Maximum usage | Multiple per page |

### Body — 14px / 1.25rem line / 400 weight

| Attribute | Value |
|-----------|-------|
| Purpose | General UI text, table cells, card content |
| Maximum usage | Unlimited — default text size |

### Body Small — 12px / 1.125rem line / 400 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Metadata, timestamps, secondary labels |
| Maximum usage | Unlimited |

### Caption — 11px / 1rem line / 400 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Footer text, refresh timestamps, fine print |
| Maximum usage | Unlimited |

### Label — 12px / 1rem line / 500 weight

| Attribute | Value |
|-----------|-------|
| Purpose | Badges, button text, table headers, controls |
| Maximum usage | Unlimited |

### Overline — 10px / 0.875rem line / 600 weight / 0.08em tracking

| Attribute | Value |
|-----------|-------|
| Purpose | Section overlines ("ACTIVE RELEASES", "ATTENTION") |
| Maximum usage | Once per section |

---

## Forbidden Practices

| Practice | Why |
|----------|-----|
| Two H1s on one page | Destroys hierarchy. One primary identity per screen. |
| Metadata larger than operational content | Captions should never outrank body text. |
| Mixed heading weights within a section | All headings within a section share the same weight. |
| Bold body text as a heading substitute | Bold body is emphasis, not hierarchy. Use headings. |
| Center-aligned body text | Left-aligned body text scans faster. Center only for hero moments. |
| Typography as decoration | Font weight, size, and style always communicate meaning. |
| More than three font weights per screen | 400 (body), 500 (label), 600 (heading), and occasionally 700 (display) are the maximum. |
