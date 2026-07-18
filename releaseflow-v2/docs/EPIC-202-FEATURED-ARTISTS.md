# EPIC-202 / EPIC-202A — Featured Artists

**Status:** Implemented (domain + create/wizard + Track Workspace read/edit surfaces)  
**Priority:** High  

## Summary

Featured Artists are first-class **Artist entity relationships**, not free text in titles.

Roles (independent):

- Original / Primary  
- Featured  
- Remix  

EPIC-202 delivered data entry (Release Wizard + Track Creation).  
**EPIC-202A** completes integration across the Track Workspace and every display surface.

## Storage

| Layer | Representation |
|-------|----------------|
| `tracks` document | `originalArtistIds[]`, `featuredArtistIds[]`, `remixArtistIds[]` (+ legacy singular fields) |
| `track_artists` | Role rows: `ORIGINAL_ARTIST` / `PRIMARY_ARTIST`, `FEATURED_ARTIST`, `REMIX_ARTIST` with ordered `position` |

Missing arrays load as `[]` (`normalizeArtistIdArray`).

Sync on edit: `syncTrackArtistCredits()` in `track-service.ts` updates both layers and logs activity.

## Display title

`lib/display-title.ts` — **single shared utilities**

| Function | Use |
|----------|-----|
| `generateSuggestedDisplayTitle` | Full rules: `Original – Title feat. Featured (Remix Artists Remix)` |
| `resolveTrackDisplayTitle` | Prefer edited `displayTitle`; else generate. `includeOriginalPrefix: false` for list rows |
| `formatArtistCreditLines` | Card credit lines (`feat. …`, `(… Remix)`) |
| `findDuplicateArtistId` | Same-role duplicate guard |

- Always `feat.`  
- Featured before remix  
- Manual `displayTitleEdited` stops auto-regeneration  

## UI surfaces (EPIC-202A)

| Surface | Implementation |
|---------|----------------|
| Track header | Structured Original / Featured / Remix credits with artist links |
| Overview tab | **Artist Credits** card |
| Credits tab | Canonical **Artist Credits** (performance) + publishing credit roles |
| Edit tab | Shared `ArtistRelationshipList` for all three roles + display title |
| Standalone track create | `ArtistRelationshipList` |
| Release wizard | Same shared component |
| Track library cards | `resolveTrackDisplayTitle` / stored `displayTitle` |
| Release track lists | Display title + feat. line from resolved names |
| Assignment workspace | Track display title + Original / Featured / Remix |
| Activity | `track.featured_artist_added` / `_removed` / `_reordered` |
| Global search | Tracks by title, display title, or any credited artist name (+ Role) |
| Artist workspace | Tracks grouped by Original / Featured / Remix |
| Readiness | Artists complete when originals valid; remix requires remix artists |

## Shared component

`components/artists/artist-relationship-list.tsx` — used by:

- Release Wizard  
- Track Creation  
- Track Edit (Track Workspace)  

## Activity actions

| Action | Example message |
|--------|-----------------|
| `track.featured_artist_added` | added Lungiswa Plaatjies as Featured Artist |
| `track.featured_artist_removed` | removed … as Featured Artist |
| `track.featured_artists_reordered` | reordered Featured Artists |

## Queries

```
getTracksAsOriginalArtist()
getTracksAsFeaturedArtist()
getTracksAsRemixArtist()
getAllArtistTracks()
fetchArtistTracksByRole()
syncTrackArtistCredits()
areTrackArtistsReady()
```

## Tests

- `__tests__/epic-202-featured-artists.test.ts`  
- `__tests__/epic-202a-track-workspace.test.ts`  
