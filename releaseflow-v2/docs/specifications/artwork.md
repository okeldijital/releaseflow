# BUILD-039 — Artwork Module Technical Specification

| Field | Value |
|---|---|
| **Status** | Architecture Freeze |
| **Date** | 2026-07-12 |
| **Build** | BUILD-039 |
| **Next Builds** | BUILD-040 (Repository), BUILD-041 (Service), BUILD-042 (UI Integration) |
| **Supersedes** | All prior artwork implementations |

---

## Table of Contents

1. [Purpose](#section-1--purpose)
2. [Design Principles](#section-2--design-principles)
3. [Domain Model](#section-3--domain-model)
4. [Relationships](#section-4--relationships)
5. [Cloudinary](#section-5--cloudinary)
6. [Firestore](#section-6--firestore)
7. [Repository Contract](#section-7--repository-contract)
8. [Service Contract](#section-8--service-contract)
9. [UI Contract](#section-9--ui-contract)
10. [Sequence Diagrams](#section-10--sequence-diagrams)
11. [Error Behaviour](#section-11--error-behaviour)
12. [Display Rules](#section-12--display-rules)
13. [Performance Rules](#section-13--performance-rules)
14. [Security](#section-14--security)
15. [Explicit Non-Requirements](#section-15--explicit-non-requirements)
16. [Acceptance Criteria](#section-16--acceptance-criteria)

---

## Section 1 — Purpose

The artwork module provides a single visual identity for a release throughout the ReleaseFlow platform.

Artwork is the cover image that represents a release in every surface — dashboard, calendar, workflow board, client portal, approval views, and all other contexts where a release is displayed.

The artwork module is not a digital asset management system. It stores exactly one image per release, enforces no version history, and provides no library browsing, tagging, or search features beyond lookup by release.

---

## Section 2 — Design Principles

### Principle 1 — One Artwork Per Release

A release owns exactly one artwork. Never multiple.

There is no support for alternate covers, variant crops, or multiple versions. If a user wants to change the artwork, they replace it. The previous image is destroyed.

### Principle 2 — Artwork Is Optional

A release may exist without artwork.

All display surfaces must handle the absence of artwork gracefully (placeholder, initials, or fallback).

### Principle 3 — Only Uploadable Asset

Artwork is the only uploadable binary asset in ReleaseFlow.

Every other production asset (audio files, stems, videos, contracts, project files) is represented as an external URL. No other endpoint accepts file uploads.

### Principle 4 — Consistent Display Everywhere

Artwork must display consistently everywhere a release appears.

The release page is not special. No surface receives preferential treatment. Image rendering (aspect ratio, sizing, fallback behaviour) is governed by a single display component.

### Principle 5 — Storage Split

Artwork metadata is stored in Firestore.

Binary image data is stored in Cloudinary.

No binary data is written to Firestore and no metadata is encoded in Cloudinary public IDs beyond the folder/naming convention.

### Principle 6 — Release Is Source of Truth

The Release entity is the source of truth for artwork existence.

No page, component, or store owns artwork. The artwork is always derived from the Release entity. If a Release is deleted, its artwork is deleted. If a Release is fetched, its artwork metadata is fetched alongside it.

---

## Section 3 — Domain Model

### Artwork Entity

```
Artwork {
  id:            string    // Firestore document ID (auto-generated)
  organizationId: string   // Parent organization
  releaseId:     string    // Parent release
  publicId:      string    // Cloudinary public_id
  secureUrl:     string    // Cloudinary secure_url (HTTPS)
  width:         number    // Original image width in pixels
  height:        number    // Original image height in pixels
  format:        string    // Image format (jpeg, png, webp)
  createdAt:     Timestamp // Firestore server timestamp
  updatedAt:     Timestamp // Firestore server timestamp
}
```

### Constraints

- `releaseId` is unique across the `artworks` subcollection (enforced by repository).
- `publicId` is globally unique (enforced by Cloudinary).
- `width`, `height`, and `format` are read from the Cloudinary upload response, not user-supplied.
- `createdAt` and `updatedAt` are Firestore `FieldValue.serverTimestamp()`.
- No field may be null after successful creation.
- No additional fields may be added to this entity without a new BUILD and architecture review.

---

## Section 4 — Relationships

```
Organization (1) ──→ (N) Release (1) ──→ (0..1) Artwork
```

### Rules

1. **Artwork belongs to exactly one Release.** An artwork document always has a `releaseId` referencing an existing release.
2. **Release belongs to exactly one Organization.** Release already carries `organizationId`.
3. **Artwork cannot exist without a Release.** If a Release is deleted, all associated artwork documents in the `artworks` subcollection must be deleted (images from Cloudinary, documents from Firestore). This is the responsibility of the service layer.
4. **Artwork is optional.** A Release may have zero or one artwork documents in its `artworks` subcollection.
5. **No direct Organization-to-Artwork relationship.** Artwork is always accessed through its Release.

---

## Section 5 — Cloudinary

### Folder Structure

```
releaseflow/
  {organizationId}/
    releases/
      {releaseId}/
```

Example:

```
releaseflow/
  org_abc123/
    releases/
      release_xyz789/
        artwork_abc.jpg
```

### Naming Convention

The filename is the artwork `id` (Firestore document ID).

```
{artworkId}.{format}
```

Example:

```
abc123def456.jpg
```

### Rules

- `public_id` is always `releaseflow/{organizationId}/releases/{releaseId}/{artworkId}`.
- Overwrite is disabled (`invalidate: true` on replace).
- Resource type is always `image`.
- No transformation is stored or applied at upload time. Transformations (crop, resize) are applied at display time via URL parameters.
- Upload preset is used to enforce file type restrictions (images only).
- Allowed formats: `jpeg`, `png`, `webp`.
- Maximum file size is enforced at upload preset level (10 MB).
- No unsigned uploads. Every upload requires a server-generated signature.

---

## Section 6 — Firestore

### Collection Layout

```
organizations/
  {organizationId}/
    artworks/
      {artworkId}
```

Artwork is stored in a subcollection under the organization (not under the release document), to avoid document growth limits and allow independent security rules.

### Document Fields

| Field | Type | Example | Notes |
|---|---|---|---|
| `id` | `string` | `"abc123def456"` | Document ID (auto-generated) |
| `organizationId` | `string` | `"org_abc123"` | References parent organization |
| `releaseId` | `string` | `"release_xyz789"` | References parent release |
| `publicId` | `string` | `"releaseflow/org_abc123/releases/release_xyz789/abc123def456.jpg"` | Full Cloudinary public_id |
| `secureUrl` | `string` | `"https://res.cloudinary.com/..."` | Cloudinary secure URL |
| `width` | `number` | `3000` | Original image width |
| `height` | `number` | `3000` | Original image height |
| `format` | `string` | `"jpeg"` | One of: jpeg, png, webp |
| `createdAt` | `Timestamp` | `serverTimestamp` | Firestore server timestamp |
| `updatedAt` | `Timestamp` | `serverTimestamp` | Firestore server timestamp |

### Indexes

A composite index is required:

- **Collection:** `organizations/{organizationId}/artworks`
- **Field 1:** `releaseId` (ascending)
- **Field 2:** `createdAt` (descending)

This supports `getArtworkByRelease()` which queries for a single artwork by `releaseId` and takes the most recent (enforcing the one-per-release constraint at query time, though uniqueness should be enforced at write time).

No other indexes are required.

---

## Section 7 — Repository Contract

### Interface

```
ArtworkRepository {
  createArtwork(data)
  getArtwork(artworkId)
  replaceArtwork(artworkId, data)
  deleteArtwork(artworkId)
  getArtworkByRelease(releaseId)
}
```

### createArtwork

| Aspect | Detail |
|---|---|
| **Inputs** | `organizationId`, `releaseId`, `publicId`, `secureUrl`, `width`, `height`, `format` |
| **Outputs** | Created `Artwork` entity (with `id`, `createdAt`, `updatedAt`) |
| **Failure cases** | Firestore write fails; releaseId already has an artwork (enforce uniqueness at repository level) |

**Behaviour:** Creates a new artwork document in `organizations/{organizationId}/artworks/` with a generated document ID. Returns the created document data.

### getArtwork

| Aspect | Detail |
|---|---|
| **Inputs** | `artworkId` |
| **Outputs** | `Artwork` entity or `null` |
| **Failure cases** | Firestore read fails |

### replaceArtwork

| Aspect | Detail |
|---|---|
| **Inputs** | `artworkId`, updated fields (`publicId`, `secureUrl`, `width`, `height`, `format`) |
| **Outputs** | Updated `Artwork` entity |
| **Failure cases** | Firestore write fails; document not found |

**Behaviour:** Updates the artwork document in place. Updates `updatedAt` to current server timestamp. Does not delete the old Cloudinary image — that is the service's responsibility.

### deleteArtwork

| Aspect | Detail |
|---|---|
| **Inputs** | `artworkId` |
| **Outputs** | `void` |
| **Failure cases** | Firestore delete fails; document not found |

### getArtworkByRelease

| Aspect | Detail |
|---|---|
| **Inputs** | `releaseId` |
| **Outputs** | `Artwork` entity or `null` |
| **Failure cases** | Firestore read fails |

**Behaviour:** Queries the artworks subcollection for a document where `releaseId` equals the input. Orders by `createdAt` descending, limits to 1. Returns the artwork or null.

---

## Section 8 — Service Contract

### Responsibilities

The artwork service orchestrates three layers:

```
Client / Hook
    ↓
ArtworkService  ← orchestrates
    ├── CloudinaryAdapter  ← binary upload/download
    └── ArtworkRepository  ← metadata CRUD
```

### Operations

| Operation | Service Behaviour |
|---|---|
| **uploadArtwork** | 1. Accepts file + `organizationId` + `releaseId` as input. 2. Uploads to Cloudinary with correct folder structure. 3. Creates artwork document in Firestore via repository. 4. On Cloudinary failure: aborts, no Firestore write. 5. On Firestore failure: deletes Cloudinary image (rollback). 6. Returns created Artwork entity. |
| **replaceArtwork** | 1. Accepts file + `organizationId` + `releaseId` as input. 2. Uploads new image to Cloudinary. 3. Replaces artwork document in Firestore via repository. 4. Deletes old Cloudinary image. 5. On failure at any step: rolls back (deletes new Cloudinary image on Firestore failure). 6. Returns updated Artwork entity. |
| **deleteArtwork** | 1. Deletes artwork document from Firestore via repository. 2. Deletes image from Cloudinary. 3. On Firestore failure: abort, no Cloudinary delete. 4. On Cloudinary failure: log warning, operation considered successful (metadata is already removed). |
| **getArtworkByRelease** | Delegates directly to repository. No Cloudinary interaction. |

### Service Does NOT

- Own UI state.
- Manage upload progress events (that is the hook/layer).
- Cache artwork data (that is the client).
- Validate file types (that is the Cloudinary upload preset + client).
- Resize or transform images (that is the display layer via Cloudinary URL params).

---

## Section 9 — UI Contract

### States

The UI surface must handle exactly these states:

```
No artwork       ← No artwork document exists for this release
Selecting        ← User has opened the file picker
Uploading        ← File is being uploaded; show indeterminate progress
Upload success   ← Upload completed; display new artwork
Upload failed    ← Upload returned an error; keep previous state (or empty if was empty)
Removing         ← Delete is in progress
Remove failed    ← Delete returned an error; keep current artwork displayed
```

### State Machine

```
[No artwork] ──Selecting── [Selecting] ──file chosen── [Uploading]
[Uploading] ──success── [Upload success]
[Uploading] ──failure── [Upload failed] ──dismiss── [No artwork] or [Previous state]
[Upload success] ──remove action── [Removing]
[Removing] ──success── [No artwork]
[Removing] ──failure── [Remove failed] ──dismiss── [Upload success]
```

### Rules

- No polling. All state transitions are event-driven.
- The UI never shows "Uploading" while also showing the prior artwork — it may show a ghost/placeholder in the artwork slot during upload.
- "Selecting" is a transient state that ends when the file picker dialog opens.
- Error states require explicit user dismissal (toast, snackbar, or inline message).
- The artwork display component accepts an `artwork` prop (nullable) and a `status` prop that maps to the states above.

---

## Section 10 — Sequence Diagrams

### 10.1 Upload

```
Caller               Hook                Service              Cloudinary          Firestore
  │                    │                    │                    │                    │
  │──file + releaseId─>│                    │                    │                    │
  │                    │──uploadArtwork()──>│                    │                    │
  │                    │                    │──upload image────>│                    │
  │                    │                    │<──publicId, url───│                    │
  │                    │                    │                    │                    │
  │                    │                    │──createArtwork()──────────────────────>│
  │                    │                    │<──Artwork entity───────────────────────│
  │                    │                    │                    │                    │
  │                    │<──Artwork entity───│                    │                    │
  │<──update state────│                    │                    │                    │
```

### 10.2 Replace

```
Caller               Hook                Service              Cloudinary          Firestore
  │                    │                    │                    │                    │
  │──file + releaseId─>│                    │                    │                    │
  │                    │──replaceArtwork()─>│                    │                    │
  │                    │                    │──upload image────>│                    │
  │                    │                    │<──new publicId────│                    │
  │                    │                    │                    │                    │
  │                    │                    │──replaceArtwork()────────────────────>│
  │                    │                    │<──updated entity──────────────────────│
  │                    │                    │                    │                    │
  │                    │                    │──delete old image─>│                    │
  │                    │                    │<──ok──────────────│                    │
  │                    │                    │                    │                    │
  │                    │<──Artwork entity───│                    │                    │
  │<──update state────│                    │                    │                    │
```

### 10.3 Delete

```
Caller               Hook                Service              Cloudinary          Firestore
  │                    │                    │                    │                    │
  │──delete artwork───>│                    │                    │                    │
  │                    │──deleteArtwork()──>│                    │                    │
  │                    │                    │──deleteArtwork()─────────────────────>│
  │                    │                    │<──void────────────────────────────────│
  │                    │                    │                    │                    │
  │                    │                    │──delete image─────>│                    │
  │                    │                    │<──ok──────────────│                    │
  │                    │                    │                    │                    │
  │                    │<──void────────────│                    │                    │
  │<──update state────│                    │                    │                    │
```

### 10.4 Display

```
Caller               Hook                Service              Cloudinary          Firestore
  │                    │                    │                    │                    │
  │──render release───>│                    │                    │                    │
  │                    │──getArtworkByRelease()─>│               │                    │
  │                    │                    │──getArtworkByRelease()───────────────>│
  │                    │                    │<──Artwork│null────────────────────────│
  │                    │<──Artwork│null─────│                    │                    │
  │                    │                    │                    │                    │
  │  if artwork:       │                    │                    │                    │
  │  render image using│                    │                    │                    │
  │  artwork.secureUrl │                    │                    │                    │
  │                    │                    │                    │                    │
  │  if null:          │                    │                    │                    │
  │  render placeholder│                    │                    │                    │
```

---

## Section 11 — Error Behaviour

### Upload Failure

| Aspect | Detail |
|---|---|
| **User behaviour** | User selects a file. Upload begins. Upload fails (network, timeout, server error). |
| **UI behaviour** | Transition to `Upload failed` state. Show inline error message: "Upload failed. Try again." Keep prior artwork visible if exists. If no prior artwork, show placeholder. |
| **Retry behaviour** | User may retry by selecting the file again. No automatic retry. No exponential backoff. |

### Cloudinary Failure

| Aspect | Detail |
|---|---|
| **User behaviour** | Same as upload failure from user perspective. |
| **UI behaviour** | Same as upload failure. |
| **Retry behaviour** | Same as upload failure. |

### Firestore Failure

| Aspect | Detail |
|---|---|
| **User behaviour** | Upload shows success to Cloudinary but Firestore write fails. |
| **UI behaviour** | Transition to `Upload failed` state. Show error message: "Could not save artwork. The image was uploaded but could not be saved. Please try again." |
| **Retry behaviour** | Service deletes the orphaned Cloudinary image on retry. User retries by selecting file again. |

### Authentication Failure

| Aspect | Detail |
|---|---|
| **User behaviour** | User session expires during upload. |
| **UI behaviour** | Transition to `Upload failed`. Show: "Session expired. Please refresh and try again." |
| **Retry behaviour** | User must refresh the page or re-authenticate. |

### Permission Failure

| Aspect | Detail |
|---|---|
| **User behaviour** | User without write access attempts to upload/replace/delete. |
| **UI behaviour** | The upload/replace/delete action should not be offered to users without permission. If a permission boundary is crossed, show: "You don't have permission to modify artwork." |
| **Retry behaviour** | No retry. User must request access. |

### Delete Failure

| Aspect | Detail |
|---|---|
| **User behaviour** | User clicks remove, delete fails. |
| **UI behaviour** | Transition to `Remove failed` state. Show: "Could not remove artwork. Try again." Keep current artwork displayed. |
| **Retry behaviour** | User may retry the delete action. |

### Replacement Failure

| Aspect | Detail |
|---|---|
| **User behaviour** | User selects a replacement file. The new upload succeeds but the metadata update fails. |
| **UI behaviour** | Transition to `Upload failed`. Show: "Could not replace artwork. The new image was uploaded but could not be applied. The previous artwork will remain." |
| **Retry behaviour** | Service cleans up the new orphaned Cloudinary image. User retries by selecting file again. |

---

## Section 12 — Display Rules

### Display Surfaces

Artwork shall appear in every location where a release identity is shown and layout permits:

| Surface | Artwork Size | Notes |
|---|---|---|
| Dashboard — release card | 40×40 – 56×56 px | Thumbnail |
| Dashboard — release row (table) | 32×32 – 40×40 px | Thumbnail |
| Releases — list view | 40×40 – 56×56 px | Thumbnail |
| Releases — grid view | 100×100 – 200×200 px | Card cover |
| Calendar — event | 24×24 – 32×32 px | Icon-sized dot or thumbnail |
| Workflow — board card | 40×40 – 56×56 px | Thumbnail |
| Workflow — detail panel | 56×56 – 80×80 px | Small artwork |
| Activity — feed item | 32×32 – 40×40 px | Thumbnail |
| Notifications — item | 24×24 – 32×32 px | Icon-sized |
| Search — result | 40×40 – 56×56 px | Thumbnail |
| Client Portal — release card | 100×100 – 200×200 px | Card cover |
| Client Portal — detail | 200×200 – 400×400 px | Display size |
| Approval Views — release card | 40×40 – 56×56 px | Thumbnail |
| Release Workspace — hero | 200×200 – 400×400 px | Primary display |
| Any future release card | Follow existing thumbnail pattern | |

### Rule

> If a Release is displayed, its artwork should be displayed whenever layout permits.

### Fallback

When no artwork exists, display a placeholder with:
- Release title initials (first letter or first two letters)
- Background colour derived from release title (deterministic hash)
- Icon fallback (musical note icon)

The fallback component is governed by the design system and shared across all surfaces.

### Image Rendering

- All artwork is rendered via a shared `ArtworkImage` component.
- The component applies Cloudinary transformation parameters (`w_`, `h_`, `c_fill`, `f_auto`) to serve appropriately sized images.
- Aspect ratio is always 1:1 (square). Cropping uses `c_fill` (centre-focused).
- No surface loads the original full-resolution image.
- `loading="lazy"` is applied to all artwork below the fold.

---

## Section 13 — Performance Rules

1. **No duplicate Firestore reads.** If artwork metadata is already loaded as part of a release, do not fetch it again from the artworks subcollection. Cache it alongside the release data.
2. **No duplicate Cloudinary requests.** The browser's HTTP cache handles this, but the application must not trigger duplicate image URL construction or unnecessary re-renders.
3. **No unnecessary workspace reloads.** Uploading or deleting artwork should update the artwork in place without reloading the entire release workspace.
4. **Artwork loaded only once per release.** After the artwork entity is fetched for a release session, it is not fetched again unless explicitly invalidated (e.g., after a replace or delete).
5. **Lazy loading.** Use native `loading="lazy"` for artwork images that are not in the initial viewport.
6. **Cloudinary transformations.** Always specify `w_` and `h_` parameters to request the exact display size. Never use the original image URL directly.
7. **No polling.** Artwork state is updated via direct mutation after upload/replace/delete, not via polling or Firestore onSnapshot for the artwork document (the release's own snapshot handles invalidation).

---

## Section 14 — Security

### Authentication

All artwork operations require an authenticated user. Anonymous access is denied.

### Organization Isolation

Artwork is stored under `organizations/{organizationId}/artworks/`. Firestore rules must enforce that a user can only read/write artwork in organizations they belong to.

### Firestore Rules

```
match /organizations/{orgId}/artworks/{artworkId} {
  allow read: if request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/organizations/$(orgId)).data.members;
  allow create: if request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/organizations/$(orgId)).data.members
    && request.resource.data.releaseId is string
    && request.resource.data.organizationId == orgId;
  allow update: if request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/organizations/$(orgId)).data.members;
  allow delete: if request.auth != null
    && request.auth.uid in get(/databases/$(database)/documents/organizations/$(orgId)).data.members;
}
```

### Cloudinary Authentication

- Uploads require a signed upload preset. No unsigned uploads.
- API keys and secrets are stored server-side, never in client code.
- Cloudinary URL signatures are used for deletion endpoints.

### No Public Modification Endpoints

There are no publicly accessible endpoints that allow modifying artwork. All operations go through the authenticated service layer.

---

## Section 15 — Explicit Non-Requirements

ReleaseFlow will not upload or manage the following as binary assets:

| Asset | How Represented |
|---|---|
| Audio files (masters, mixes) | External URL reference |
| Stems | External URL reference |
| Videos (lyric videos, promos) | External URL reference |
| Project files (DAW sessions, Logic, Ableton) | External URL reference |
| Contracts and legal documents | External URL reference |
| ZIP archives or delivery bundles | External URL reference |
| Any other non-artwork file | External URL reference |

**Artwork remains the only uploadable binary asset in ReleaseFlow.**

No future build may introduce upload functionality for any other asset type without a new architecture review and BUILD specification.

---

## Section 16 — Acceptance Criteria

This specification is complete when:

1. A future implementation agent can implement BUILD-040 (Repository) using Section 7 alone, without guessing field names, types, or query patterns.
2. BUILD-041 (Service) can be implemented using Section 8 alone, with no ambiguity about which operation does what.
3. BUILD-042 (UI Integration) can be implemented using Section 9 and Section 12 alone, with no ambiguity about states, transitions, or display rules.
4. The Cloudinary folder structure in Section 5 matches exactly what the upload service will construct. No deviation.
5. The Firestore layout in Section 6 matches exactly what the repository will query. No deviation.
6. Error states in Section 11 are exhaustive — no implementation agent needs to ask "what about this error case?"
7. Every display surface in Section 12 is enumerated — no implementation agent needs to ask "where else should artwork appear?"
8. If a behaviour is not described in this document, it must not be implemented.
