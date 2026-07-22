# BUILD-011B — Align Add Track Wizard with Approved Remix Metadata Model

> **Superseded for UI layout by [BUILD-011C](./BUILD-011C-FINAL-UI-ALIGNMENT-CONTRACT.md).**  
> Where this document conflicts with BUILD-011C, follow BUILD-011C.

**Classification:** Feature Correction  
**Status:** Superseded (UI) by BUILD-011C  
**Reference implementation:** Edit Track (`track-workspace.tsx`)  
**Surface of change:** Add Track Wizard only (`apps/web/src/app/(app)/tracks/new/page.tsx`)

This is not a new feature. It corrects the Add Track Wizard so that it implements the already-approved Remix metadata model. No new functionality is to be introduced.

---

## Background

The Edit Track page implements the approved Remix metadata model. The Add Track Wizard must match it for Remix metadata.

The approved Remix metadata model is **Original Work** only:

| Field | Required |
|-------|----------|
| Original Song Title | Yes |
| Original Primary Artist | Yes |
| Original Featured Artists | No (0..n) |

The model does **not** contain “Original Artists” or “Remix Artists” as Original Work fields. Those names must not be invented as substitutes for Original Work.

---

## Primary objective

When **Recording Type = Remix**, the Add Track Wizard must display the same Original Work section as Edit Track with no differences in:

- section headings
- descriptive text
- field names
- field order
- field visibility
- field behaviour
- validation messages
- data binding shape (`track.originalWork.*`)

Reuse existing components. Do not redesign, simplify, or extend.

---

## Required layout (Recording Type = Remix)

Order only:

1. Track Title  
2. Recording Type  
3. **Original Work**  
   - Helper: `Information about the original song being remixed.`  
   - Original Song Title  
   - Original Primary Artist  
   - Original Featured Artists  
4. Existing track metadata (continue after Original Work; not redesigned as Remix metadata):  
   - Version  
   - Featured Artists  
   - Display title / publishing / etc.  

**Not present in the Add Track Wizard** (acceptance): sections named **Original Artists** or **Remix Artists**. Track-level original/remix credits remain editable on Edit Track.

When **Recording Type = Original**: hide the entire Original Work section (do not render, no validation, no reserved spacing).

---

## Original Work — field contract

### Heading

Exactly: `Original Work`

### Helper text

Exactly: `Information about the original song being remixed.`

### Field 1 — Original Song Title

- Type: text input  
- Required: yes (remix only)  
- Placeholder: `e.g. Dreams`  
- No autocomplete, generated, or calculated value  

### Field 2 — Original Primary Artist

- Reuse `ArtistFieldPicker`  
- Required: yes (remix only)  

### Field 3 — Original Featured Artists

- Reuse `ArtistRelationshipList` / featured artist component  
- Optional: 0..n  

---

## Forbidden inventiveness

Do **not** introduce inside Original Work (or as a substitute for it):

- Original Artists  
- Remix Artists  
- Artist Relationships *(as a heading inside Original Work)*  
- Source Artist / Parent Artist / Original Recording Artist  
- Any alternate terminology  

Do **not** bind through intermediate state such as:

- `originalArtists`  
- `remixArtists`  
- `artistRelationships`  

as stand-ins for Original Work.

Bind directly to:

```
track.originalWork.title
track.originalWork.primaryArtistId
track.originalWork.featuredArtistIds
```

---

## Validation (remix only)

Required:

- Original Song Title — message: `Original Song Title is required for remix tracks.`  
- Original Primary Artist — message: `Original Primary Artist is required for remix tracks.`  

Optional:

- Original Featured Artists  

Messages must match Edit Track.

---

## Forbidden changes

Do **not** modify:

- Edit Track page  
- Track Details page  
- Repository / Service / Firestore model  
- Validation helpers outside the wizard UI  
- Release Wizard / Release pages  
- Artwork, Publishing, Credits, Assignments, Artist management  

Only the Add Track Wizard may change for this task.

---

## Acceptance criteria

- [ ] Add Track Wizard and Edit Track present the same Remix metadata (Original Work) UI  
- [ ] Exactly one Original Work section on remix  
- [ ] Original Work contains exactly three fields (labels above)  
- [ ] No “Original Artists” section used as Remix metadata / on remix path in place of Original Work  
- [ ] No invented Original Work terminology  
- [ ] Existing components reused (ArtistFieldPicker, ArtistRelationshipList)  
- [ ] Firestore `originalWork` shape unchanged  
- [ ] No functionality outside the Add Track Wizard modified  
- [ ] Screenshots: Original type (no section), Remix wizard, Edit Track, side-by-side parity  

---

## Implementation notes (this codebase)

| Item | Location |
|------|----------|
| Reference Original Work edit UI | `apps/web/src/components/track-workspace.tsx` |
| Wizard surface | `apps/web/src/app/(app)/tracks/new/page.tsx` |
| Shared artist picker | `ArtistFieldPicker` |
| Shared featured list | `ArtistRelationshipList` (`role="featured"`, label override for Original Featured Artists) |
| Persist / hydrate | `track-repository` `originalWork` (do not change) |
| Domain validation helper | `validateOriginalWorkForRecordingType` (do not change) |
