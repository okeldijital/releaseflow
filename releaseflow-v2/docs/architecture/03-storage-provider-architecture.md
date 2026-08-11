# Storage Provider Architecture (BUILD-301A)

## Summary

ReleaseFlow **does not own the external binary**. ReleaseFlow owns domain metadata and references to binaries stored in external systems.

**Provider identity is not ReleaseFlow asset identity.**

```text
Domain Asset (artwork | media_asset | assets catalogue | …)
        ↓
Storage Reference (providerId + providerFileId + …)
        ↓
Storage Provider (interface)
        ↓
CloudinaryStorageProvider | DropboxStorageProvider | OneDriveStorageProvider
        ↓
External storage system
```

## Components

### `StorageProvider`

Location: `apps/web/src/lib/storage/storage-provider.ts`

Provider-neutral operations:

| Operation | Purpose |
|-----------|---------|
| `upload` | Store a binary |
| `delete` | Remove external binary |
| `getDownloadUrl` | Resolve delivery URL |
| `move` | Provider-native move (contract only) |
| `list` | External discovery (contract only) |
| `exists` | Reconciliation (contract only) |
| `getMetadata` | Sync (contract only) |

No Cloudinary terminology appears on this interface.

### Capabilities

Each provider declares `StorageProviderCapabilities`. Unsupported operations throw `StorageError` with code `UNSUPPORTED_OPERATION` — they must not return empty success results.

### StorageObject / StorageReference

- `domainAssetId` — optional RF domain id (never the provider file id)
- `providerId` — stable id e.g. `cloudinary`
- `providerFileId` — external id (Cloudinary `publicId` maps here)
- `providerPath` — optional folder/path
- `downloadUrl` — cached delivery URL (not permanent identity)

### Provider resolution

```ts
getStorageProvider('cloudinary')  // default
getStorageProvider('dropbox')
getStorageProvider('onedrive')
getDefaultStorageProvider(orgConfig?)  // still cloudinary by default
```

Registry includes `cloudinary`, `dropbox`, and `onedrive`.

### Organization storage config

Code-only model (`OrganizationStorageConfig`):

- `organizationId`
- `enabledProviders`
- `defaultProviderId`

Defaults to Cloudinary only. No Settings UI in BUILD-301A.

## Cloudinary mapping

| Cloudinary concept | Storage abstraction |
|--------------------|---------------------|
| `publicId` | `providerFileId` |
| secure URL | `downloadUrl` |
| folder `releaseflow/{orgId}/…` | internal to adapter |
| signed upload | `upload` |
| destroy API | `delete` |

Folder paths remain hard-coded inside `CloudinaryStorageProvider` until BUILD-301E (policies/templates).

### Unsupported on Cloudinary adapter (explicit)

- `move`
- `list`
- `exists`
- `getMetadata`

## Existing transport façade

`uploadFile()` / `destroyFile()` in `lib/media/media-upload.ts` keep their public contracts and delegate to:

```text
getDefaultStorageProvider → CloudinaryStorageProvider
```

Artwork, media, avatar, and person image flows continue to work unchanged.

## Domain models left intact

Do **not** treat any of these as the universal storage model:

- `assets` (Media Files catalogue)
- `asset_references`
- `media_assets` (+ versions/reviews)
- `artworks`
- `track_assets`

## BUILD-301B — Dropbox

### Provider

| Field | Value |
|-------|--------|
| Class | `DropboxStorageProvider` |
| `providerId` | `dropbox` |
| Client entry | `apps/web/src/lib/storage/providers/dropbox-storage-provider.ts` |
| Server API | `/api/storage/dropbox/{upload,delete,download-url}` |
| Server REST | `apps/web/src/lib/server/dropbox/*` (credentials never imported client-side) |

### Capabilities

| Operation | Status |
|-----------|--------|
| upload | **supported** |
| delete | **supported** |
| getDownloadUrl | **supported** (temporary link; not permanent identity) |
| move | **unsupported** |
| list | **unsupported** |
| exists | **unsupported** |
| getMetadata | **unsupported** |

### Identity mapping

```text
ReleaseFlow domainAssetId
        ≠
Dropbox providerFileId   (Dropbox file id, e.g. id:…)
        ≠
Dropbox providerPath     (Dropbox path)
        ≠
Dropbox download URL     (temporary delivery link)
```

### Authentication

Server-side only environment variables (not Cloudinary names):

- `DROPBOX_APP_KEY`
- `DROPBOX_APP_SECRET`
- `DROPBOX_REFRESH_TOKEN`

Refresh → short-lived access token happens only on the server. Never returned to the browser, never written to Firestore by this build.

### Path handling

Optional `metadata.providerPath` may supply a pre-resolved path. Otherwise a provisional path
`/ReleaseFlow/{orgId}/{entityType}/{entityId}/{filename}` is used. This is **not** Storage Policy
or Folder Templates (BUILD-301E).

### Scope exclusions (BUILD-301B)

Does **not** implement: discovery, listing, Drafts Folder, Potential Tracks, routing, storage policy,
folder templates, organisation settings UI, synchronization, reconciliation, migration from Cloudinary,
or any product UI changes. Default provider remains **cloudinary**.

## BUILD-301C — OneDrive

### Provider

| Field | Value |
|-------|--------|
| Class | `OneDriveStorageProvider` |
| `providerId` | `onedrive` |
| Client entry | `apps/web/src/lib/storage/providers/onedrive-storage-provider.ts` |
| Server API | `/api/storage/onedrive/{upload,delete,download-url}` |
| Server REST | `apps/web/src/lib/server/onedrive/*` (Microsoft credentials never client-side) |

### Capabilities

| Operation | Status |
|-----------|--------|
| upload | **supported** |
| delete | **supported** |
| getDownloadUrl | **supported** (`@microsoft.graph.downloadUrl`; ephemeral) |
| move | **unsupported** |
| list | **unsupported** |
| exists | **unsupported** |
| getMetadata | **unsupported** |

### Identity mapping

```text
ReleaseFlow domainAssetId
        ≠
OneDrive providerFileId   (Graph drive item id)
        ≠
OneDrive providerPath     (path under /ReleaseFlow/{orgId}/…)
        ≠
OneDrive downloadUrl      (ephemeral Graph download URL)
```

Upload responses set `downloadUrl: null`; callers must use `getDownloadUrl()` for delivery.

### Authentication

Server-side only:

- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_REFRESH_TOKEN`
- `MICROSOFT_TENANT_ID` (optional; default `common`)

Refresh → short-lived Graph access token is server-only. Never returned to the browser. No token cache in 301C. No Firestore persistence of credentials.

### Organisation authorization

Every OneDrive route:

1. Verifies Firebase ID token  
2. Requires active membership for `organizationId`  
3. Checks `media.upload` / `media.delete` / `media.read`  
4. Only then invokes Graph  

Cross-organisation denial is covered by automated route tests (User A / Org B → 403; Graph not called).

### Path handling (transitional)

- Prefer `metadata.providerPath` when supplied **and** org-bound  
- Else provisional `/ReleaseFlow/{organizationId}/{entityType}/{entityId}/{filename}`  
- Server validates path is under `/ReleaseFlow/{organizationId}/` before upload  
- **Not** Storage Policy / Folder Templates (BUILD-301E)  

### Shared-provider isolation limitation

OneDrive uses a single Microsoft app identity (refresh token). RF enforces org membership and path prefix; this does **not** replace multi-tenant Storage Location policy (301D/E).

### Scope exclusions (BUILD-301C)

Same product non-goals as 301B: no UI, discovery, settings, routing, templates, sync, reconciliation, or Cloudinary default changes.

## BUILD-301D — Organization Storage Settings

### Model

```text
Organization
    └── Storage Locations (many)
            ├── name
            ├── providerId   → registry (cloudinary | dropbox | onedrive)
            ├── rootPath     (configuration root, not folder template)
            ├── status       (active | disabled | error)
            └── isDefault    (config only; not wired into uploads)
```

**Provider ≠ Storage Location.** A provider is an implementation; a location is an org-owned destination that *references* a `providerId`. Multiple locations may share the same providerId (e.g. two Dropbox destinations once multi-account credentials exist).

Path: `organizations/{organizationId}/storage_locations/{id}`

### API

| Method | Path | Permission |
|--------|------|------------|
| GET | `/api/storage/locations` | `storage.read` |
| POST | `/api/storage/locations` | `storage.manage` |
| GET | `/api/storage/locations/{id}` | `storage.read` |
| PATCH | `/api/storage/locations/{id}` | `storage.manage` |
| DELETE | `/api/storage/locations/{id}` | `storage.manage` |
| GET | `/api/storage/providers` | `storage.read` |

Permissions are provider-neutral. Credentials never appear in responses. Provider catalog reports **envConfigured** booleans only (server env for Dropbox/OneDrive; Cloudinary treated as platform-connected).

### UI

Administration → Storage (`/administration/storage`): connected providers + storage locations CRUD.

### What 301D does **not** do

- Does **not** change `uploadFile` / `destroyFile` or Cloudinary default product path  
- Does **not** route assets by location (301E)  
- Does **not** implement Folder Templates / Storage Policy  
- Does **not** solve shared-account `providerFileId` ownership (still residual)  
- Does **not** persist Dropbox/Microsoft OAuth tokens in Firestore (still env-backed)  

### Residual risks (carried forward)

1. Shared Dropbox/OneDrive app credentials (env) — not multi-tenant OAuth yet  
2. `providerFileId` not bound to Storage Location / RF Storage Reference until later persistence work  
3. Provisional upload paths remain transitional for direct provider uploads until routing is wired into upload workflows  

## BUILD-301E — Asset Routing Engine

### Principle

**ReleaseFlow owns the routing decision. The external provider owns the physical file.**

The routing engine answers: *Given this organisation, asset type and release context, where should this asset be stored?*

It does **not** upload. It does **not** call Dropbox, OneDrive, or Cloudinary APIs. It returns a provider-neutral `StorageRoute` consumable later by the `StorageProvider` abstraction.

### Authoritative chain

```text
Organization
    ↓
Asset Type          (reuses existing AssetType: audio | artwork | video | document | other)
    ↓
Storage Policy      (first-class routing object)
    ↓
Storage Location    (configured destination — 301D)
    ↓
Storage Provider    (registry only — no domain branching on provider id)
    ↓
Folder Template     (logical structure + variables)
    ↓
Resolved Destination  (rootPath + resolved template path)
```

**Storage Location is the policy destination abstraction.**  
**Provider is interchangeable infrastructure** referenced by `location.providerId`.  
Policies do **not** store `providerId` as the authoritative edge.

### Storage Policy

Path: `organizations/{organizationId}/storage_policies/{policyId}`

| Field | Notes |
|-------|--------|
| organizationId | Owning org (mandatory isolation) |
| name | Admin label |
| assetType | Existing domain `AssetType` |
| storageLocationId | → Storage Location |
| folderTemplateId | → Folder Template |
| versioningEnabled | Metadata flag (no sync in 301E) |
| autoCreateFolders | Metadata flag (no provider folder create in 301E) |
| active | Only active policies participate in routing |

### Folder Template

Path: `organizations/{organizationId}/folder_templates/{id}`

Logical structure only, e.g. `/{Artist}/{Release}/{AssetType}`.

Supported variables: `{Organization}`, `{Artist}`, `{Release}`, `{Track}`, `{Year}`, `{Month}`, `{AssetType}`, `{Version}`.

Resolver: replaces known variables; rejects missing values (no empty substitution); rejects `..` traversal; rejects malformed / provider-URI templates; deterministic output.

### Routing algorithm

```text
resolveAssetRoute(context)
  → validate organization
  → resolve Asset Type
  → find active Storage Policy (org + assetType)
  → resolve Storage Location (same org)
  → validate location status = active
  → resolve provider via getStorageProvider / registry
  → resolve Folder Template (same org, active)
  → resolve template variables
  → combine location.rootPath + resolved template path
  → validate final destination (under root, no traversal)
  → return StorageRoute
```

### StorageRoute (result)

Provider-neutral decision object:

- `organizationId`, `storagePolicyId`, `storageLocationId`, `providerId`
- `rootPath`, `resolvedPath`, `folderTemplateId`
- `autoCreateFolders`, `versioningEnabled`, `assetType`

Never includes OAuth tokens, SDK clients, or provider response types.

### Behaviour rules

| Situation | Result |
|-----------|--------|
| No active policy for org + assetType | Controlled `MISSING_POLICY` error |
| Multiple active policies for same org + assetType | Controlled `DUPLICATE_POLICY` error |
| Disabled / non-active location | Fail (`LOCATION_DISABLED`) |
| Inactive template | Fail (`TEMPLATE_INACTIVE`) |
| Unknown providerId | Fail via registry (`UNKNOWN_PROVIDER`) |
| Cross-org policy / location / template | Fail (`*_ORG_MISMATCH`) |
| Missing template variable | Fail (`TEMPLATE_RESOLUTION`) |
| Path traversal / root escape | Fail (`PATH_SECURITY`) |
| `isDefault` on location | **Not used** for routing |

No fallback to Cloudinary, default location, or the provisional 301C path  
`/ReleaseFlow/{organizationId}/{entityType}/{entityId}/{filename}` as the **canonical** routing result. That path remains transitional infrastructure for direct provider uploads only.

### API

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/api/storage/policies` | `storage.read` / `storage.manage` |
| GET/PATCH/DELETE | `/api/storage/policies/{id}` | same |
| GET/POST | `/api/storage/folder-templates` | same |
| GET/PATCH/DELETE | `/api/storage/folder-templates/{id}` | same |
| POST | `/api/storage/routing/preview` | `storage.read` |

Firebase auth → org membership → permission → org-scoped operation. Permissions remain provider-neutral (`storage.read` / `storage.manage`).

### UI

Administration → Storage extended with Folder Templates, Storage Policies, and Routing Preview. No separate admin subsystem. No provider credentials exposed.

### What 301E does **not** do

- BUILD-301F (versioning / metadata synchronization)  
- Drafts Folder / Potential Tracks / discovery / provider-native move  
- Automatic upload routing across the application  
- Changing `uploadFile()` / Cloudinary product default  
- Provider folder creation / health monitoring  
- Solving `providerFileId` durable binding to RF Storage Reference (carried-forward residual risk)  

### Residual risks (still open after 301E)

1. Shared Dropbox/OneDrive env credentials — not multi-tenant OAuth  
2. `providerFileId` not yet durably bound to organisation-scoped Storage Reference  
3. Upload workflows still use existing Cloudinary / provisional provider paths until explicitly integrated with `resolveAssetRoute`  

## BUILD-301F — Versioning & Metadata Synchronization Foundation

### Principle

Establish durable identity and controlled metadata/version state between RF and an external provider object — **not** a general synchronization engine, discovery system, or multi-tenant provider account solution.

```text
ReleaseFlow (domainAssetId)
    ↓
StorageReference (org-scoped durable binding)
    ↓
StorageLocation
    ↓
StorageProvider (registry)
    ↓
External provider object (providerFileId)
```

### Architecture assessment (pre-implementation)

| Question | Decision |
|----------|----------|
| A. Durable RF identity | `organizations/{organizationId}/storage_references/{id}` — not inside provider adapters |
| B. Asset relationship | `domainAssetId` + existing `AssetType`; no parallel asset model |
| C. Provider identity | Composite: `organizationId + storageLocationId + providerId + providerFileId`; path is metadata only; download URLs never identity |
| D. Provider capabilities | `getMetadata` enabled for Dropbox/OneDrive (known object only); Cloudinary remains unsupported; list/move/exists still false |

### StorageReference schema

Path: `organizations/{organizationId}/storage_references/{referenceId}`

| Field | Role |
|-------|------|
| organizationId | Mandatory isolation boundary |
| domainAssetId | RF asset id (≠ providerFileId) |
| assetType | Existing domain type |
| storageLocationId | Configured destination (authoritative provider edge) |
| providerId | Denormalized from location; must match location.providerId |
| providerFileId | External object id (not globally unique alone) |
| providerPath | Location metadata only |
| status | `active` \| `missing` \| `error` \| `detached` |
| versioningEnabled | RF policy flag — does not invent provider versions |
| currentVersion | RF version number |
| providerVersionId / providerETag / providerModifiedAt | Provider → RF when available |
| lastSyncedAt / syncStatus | Sync bookkeeping |
| versions[] | Bounded RF version snapshots |

**Effective identity:** `organizationId + storageLocationId + providerId + providerFileId`  
**Never** authorize on `providerFileId` alone.  
**Never** persist ephemeral `downloadUrl` as durable identity.

### Version model

- RF owns `versionNumber` / `currentVersion` / `versioningEnabled`
- Provider owns `providerVersionId`, `providerETag`, `providerModifiedAt` when exposed
- If a provider does not expose a version id, RF **does not invent** one
- `versioningEnabled` does not imply the provider can create versions

### Metadata synchronization

Direction is explicit:

| Direction | Examples |
|-----------|----------|
| RF → Provider | (not performed in 301F except future ops) |
| Provider → RF | modified time, ETag, version id when present |
| Shared/derived | lastSyncedAt, syncStatus |

Contract: known `StorageReference` → known `providerFileId` → `provider.getMetadata()` → update RF fields.

**Not implemented:** list, crawl, orphan scan, sync-all, automatic import, bidirectional merge.

### Sync pipeline

```text
Firebase auth → org membership → storage.manage
  → load StorageReference (org path)
  → validate location (same org, active)
  → providerId must match location.providerId
  → registry resolve provider
  → getMetadata(known providerFileId)
  → update version/sync fields
```

Provider is **never** called before authorization and ownership validation.

### Provider capability changes (301F)

| Provider | getMetadata |
|----------|-------------|
| cloudinary | **false** (still UNSUPPORTED_OPERATION) |
| dropbox | **true** (known object via `/api/storage/dropbox/metadata`) |
| onedrive | **true** (known object via `/api/storage/onedrive/metadata`) |

list / move / exists remain unsupported on all three.

### API

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/api/storage/references` | storage.read / storage.manage |
| GET/PATCH/DELETE | `/api/storage/references/{id}` | same |
| POST | `/api/storage/references/{id}/sync` | storage.manage |

### UI

Administration → Storage: Storage References list (status, path, version, last sync, Sync action). No file browser, discovery, or reconciliation UI.

### Activity / audit

`activity_service` entity types do not include `storage_reference`. 301F **does not invent** a second audit system. Meaningful storage_reference.* activity events remain a follow-up if product wants them on the existing activity model.

### Upload / routing integration (explicit)

- `uploadFile()` / Cloudinary product default **unchanged**
- `resolveAssetRoute()` (301E) is **not** auto-wired into uploads in 301F
- Creating a StorageReference is available via API for bindings; product upload paths may adopt it later

### What 301F does **not** claim

StorageReference + org isolation **does not** make the shared Dropbox/OneDrive account multi-tenant. Architecture remains:

```text
RF multi-tenant authorization
  + org-scoped StorageReference
  + org-scoped StorageLocation
  + provider identity
```

Shared env-backed provider credentials remain a known infrastructure limitation.

### Residual risks (after 301F)

1. Shared Dropbox/OneDrive env credentials  
2. Upload workflows not yet creating StorageReferences automatically  
3. Cloudinary assets not migrated into StorageReference model  
4. Activity events for references not wired  

## Future extension

1. ~~BUILD-301B — Dropbox provider~~  
2. ~~BUILD-301C — OneDrive provider~~  
3. ~~BUILD-301D — Organization Storage Settings~~  
4. ~~BUILD-301E — Asset Routing Engine / Storage Policy + Folder Templates~~  
5. ~~BUILD-301F — Versioning & Metadata Synchronization foundation~~  
6. Next build is **not assumed** — evidence-driven human review before any 301G  

## Explicit non-goals (historical 301A–C; see 301D/E for later scope)

- Additional providers beyond cloudinary/dropbox/onedrive  
- External discovery / Drafts / Potential Tracks  
- Unifying domain asset models  
- Migrating existing Cloudinary assets  

## Known follow-ups (not this build)

- Top-level Firestore `assets` / `asset_references` rules are auth-only (tenant isolation weakness documented in BUILD-301A-PRE).  
- Dual artwork paths (artwork-service vs media-service cover) remain; storage abstraction does not merge them.  
- Shared Dropbox/OneDrive account path-binding is transitional until multi-tenant credentials + Storage Reference binding.  
- Wire `resolveAssetRoute` into selected upload workflows without changing Cloudinary default until product decides.
