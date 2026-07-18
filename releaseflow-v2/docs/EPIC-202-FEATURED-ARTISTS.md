# EPIC-202 — Featured Artists

**Status:** Implemented (core domain + track create + wizard + artist workspace)  
**Priority:** High  

## Summary

Featured Artists are first-class **Artist entity relationships**, not free text in titles.

Roles (independent):

- Original / Primary  
- Featured  
- Remix  

## Storage

| Layer | Representation |
|-------|----------------|
| `tracks` document | `originalArtistIds[]`, `featuredArtistIds[]`, `remixArtistIds[]` (+ legacy singular fields) |
| `track_artists` | Role rows: `ORIGINAL_ARTIST` / `PRIMARY_ARTIST`, `FEATURED_ARTIST`, `REMIX_ARTIST` with ordered `position` |

Missing arrays load as `[]` (`normalizeArtistIdArray`).

## Display title

`lib/display-title.ts` → `generateSuggestedDisplayTitle`

```
Original – Title feat. Featured (Remix Artists Remix)
```

- Always `feat.`  
- Featured before remix  
- Manual `displayTitleEdited` stops auto-regeneration  

## UI

| Surface | Implementation |
|---------|----------------|
| Standalone track create | `ArtistRelationshipList` for featured (+ original/remix) |
| Release wizard | Same shared component |
| Shared component | `components/artists/artist-relationship-list.tsx` |

Inline create-artist remains via existing `ArtistFieldPicker` / add panel.

## Artist workspace

Tracks grouped by role: Original / Featured / Remix (from `track_artists` links).

## Queries

```
getTracksAsOriginalArtist()
getTracksAsFeaturedArtist()
getTracksAsRemixArtist()
getAllArtistTracks()
fetchArtistTracksByRole()
```

## Tests

`__tests__/epic-202-featured-artists.test.ts`
