# BUILD-011C — Final UI Alignment Contract (Authoritative)

**Status:** **Canonical permanent contract** for remix metadata UI.  
Supersedes BUILD-011 / BUILD-011A / BUILD-011B UI instructions where they conflict.

**Surface of change (implementation history):** Add Track Wizard (`apps/web/src/app/(app)/tracks/new/page.tsx`)  
**Reference:** Edit Track Original Work section (`track-workspace.tsx`) — do not modify Edit Track for BUILD-011 alignment.

No interpretation is permitted. Follow this document exactly.

**Defect rule:** From the date this document is canonical, any future implementation that diverges from this contract is a **defect against the contract**, not a design discussion.

---

## Core principle

A Remix track contains **two distinct metadata groups**. They must never be merged.

| Group | Name | Describes |
|-------|------|-----------|
| **A** | **Original Work** | The song that existed before the remix was created |
| **B** | **Remix Recording** (existing Track metadata) | The remix recording that will be released |

These represent different recordings. They must remain visually separate.

The Add Track Wizard is **not** a simplified screen. Creating and editing a Remix must expose the same business information for Original Work. The wizard must not omit Original Work fields because they can be edited later.

---

## Recording Credit Rules (Authoritative)

The **Primary Artist** field under Group B (Remix Recording / existing Track metadata) always represents the **artist credit of the recording being released**, never the original work.

This rule applies to **every** Recording Type.

### Same UI field ≠ same business meaning

Group B uses the **same UI control and the same track binding** (`track.primaryArtistId`) for Original and Remix.

That does **not** mean “Primary Artist always means the same artist.”

It means:

| Recording Type | UI field | Business meaning |
|----------------|----------|------------------|
| Original Recording | Primary Artist | Performer(s) credited on the recording being released |
| Remix | Primary Artist | Performer(s) credited on the **remix** recording being released |

It never means the original song’s performer when Recording Type is Remix. That role is **Original Primary Artist** under Group A only.

---

### Original Recording

**Recording Type = Original Recording**

- Primary Artist represents the performer(s) credited on the recording being released.
- There is **no** Original Work section.

**Example**

| | |
|--|--|
| Song | Alive |
| Primary Artist | Artist A |

---

### Remix

**Recording Type = Remix**

Two separate artist concepts now exist. They are intentionally different. They must **never** share the same binding.

#### Original Work — Original Primary Artist

Represents the performer credited on the **original song before the remix existed**.

**Example**

| | |
|--|--|
| Original Song | Dreams |
| Original Primary Artist | Fleetwood Mac |

#### Remix Recording — Primary Artist

Represents the performer credited on the **remix recording being released**.

**Example**

| | |
|--|--|
| Track Title | Dreams (DJ X Remix) |
| Primary Artist | DJ X |

---

### Domain rule — two recordings

Think of the Remix Track as containing metadata for **two** recordings:

```
Original Work
----------------------------
Dreams
Fleetwood Mac
----------------------------
Remix Recording
Dreams (DJ X Remix)
DJ X
```

The two recordings are **related**. They are **not** the same recording. Their metadata must **never** be merged.

---

## Binding contract (mandatory)

### Original Work (Group A)

```
track.originalWork.title
track.originalWork.primaryArtistId
track.originalWork.featuredArtistIds
```

### Remix Recording / Track (Group B)

Continue using existing Track bindings only:

```
track.primaryArtistId
track.featuredArtistIds
track.version
track.displayTitle
…
```

### Hard separation

| Must NOT | Forbidden merge |
|----------|-----------------|
| Do **not** bind Remix Recording Primary Artist to | `track.originalWork.primaryArtistId` |
| Do **not** bind Original Primary Artist to | `track.primaryArtistId` |

These represent different recordings.

Do **not** create intermediate state named `originalArtists`, `remixArtists`, or `artistRelationships` as stand-ins for either group.  
Do not create adapter DTOs. Do not duplicate state for the same binding.

---

## Canonical layout

### Recording Type = Original Recording

Display only existing Track fields. **No Original Work section.**

### Recording Type = Remix

Mandatory sequence:

```
Track Title
↓
Recording Type
↓
Original Work
    Information about the original song being remixed.
    Original Song Title
    Original Primary Artist
    Original Featured Artists
────────────────────────────
(existing Track metadata — not a new section title)
    Primary Artist
    Featured Artists
    Version
    Suggested Display Title
    … then later wizard steps: Mixed, Mastered, Publishing, etc.
```

---

## Group A — Original Work

Exactly **three** fields. No more. No less.

| # | Label | Required | Component | Bind |
|---|--------|----------|-----------|------|
| 1 | Original Song Title | Yes | Text input | `track.originalWork.title` |
| 2 | Original Primary Artist | Yes | `ArtistFieldPicker` | `track.originalWork.primaryArtistId` |
| 3 | Original Featured Artists | No (0..n) | Featured selector (`ArtistRelationshipList` role featured) | `track.originalWork.featuredArtistIds` |

**Heading (exact):** `Original Work`  
**Helper (exact):** `Information about the original song being remixed.`  
**Placeholder (title):** `e.g. Dreams`

Nothing else belongs in Original Work.

When Recording Type ≠ Remix: do not render Original Work (no hidden fields, no validation, no reserved spacing).

---

## Group B — Remix Recording / existing Track metadata

This is **not** a new section and must not introduce a new section heading for inventiveness.

It is the existing Track metadata, continuing after Original Work (or alone when type is Original).

Includes (unchanged concepts):

- **Primary Artist** → `track.primaryArtistId` — always credit of the **recording being released** (see Recording Credit Rules)
- Featured Artists → `track.featuredArtistIds`
- Version
- Suggested Display Title
- Mixed / Mastered / Publishing / all later wizard steps

---

## Absolutely forbidden (anywhere in Add Track Wizard)

Remove entirely — do not rename or invent equivalents:

- Original Artists  
- Remix Artists  
- Artist Relationships *(as a heading inside Original Work)*  
- Source Artist  
- Parent Artist  
- Original Recording Artist  

---

## Existing components (reuse only)

- `ArtistFieldPicker`
- `ArtistRelationshipList` (featured)
- Existing validation messages for Original Work (match Edit Track)
- Existing wizard styling / spacing / typography patterns

Do not duplicate components. Do not modify Edit Track, repository, service, Firestore schema, or unrelated pages solely to “reinterpret” this contract.

---

## Validation (remix only)

| Field | Rule | Message (match Edit) |
|-------|------|----------------------|
| Original Song Title | Required | `Original Song Title is required for remix tracks.` |
| Original Primary Artist | Required | `Original Primary Artist is required for remix tracks.` |
| Original Featured Artists | Optional | — |

---

## Completion criteria

- [ ] Exactly one Original Work section (remix only)
- [ ] Original Work has exactly three fields with the labels above
- [ ] Existing Track metadata follows immediately (Primary Artist, Featured Artists, Version, Display Title, …)
- [ ] Primary Artist and Original Primary Artist use **separate** bindings (never crossed)
- [ ] No Original Artists section
- [ ] No Remix Artists section
- [ ] No Artist Relationships section inside Original Work
- [ ] Wizard Original Work matches Edit Track (heading, helper, labels, order, components)
- [ ] Firestore schema unchanged
- [ ] No repos / services / unrelated pages modified for this alignment
- [ ] Side-by-side screenshots prove Original Work visual parity

---

## Mandatory screenshots

1. Original Recording selected — no Original Work  
2. Remix selected — Original Work + then Primary Artist / Featured / Version / Display Title  
3. Edit Track — same Original Work section  
4. Side-by-side of 2 and 3 — identical heading, helper, field names, order, spacing, typography, control sizing  
