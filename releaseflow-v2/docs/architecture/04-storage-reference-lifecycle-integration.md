# StorageReference Lifecycle Integration — EPIC-301

## Status

Implemented on `epic-301-storage-reference-lifecycle`.

## Purpose

BUILD-301A–301F established the storage architecture but production uploads did not yet create durable `StorageReference` records. This build closes that lifecycle gap for the existing Cloudinary-first artwork/media upload paths without changing the current upload or delivery contracts.

## Production chain after integration

```text
Production upload
    ↓
uploadFile()
    ↓
StorageProvider → CloudinaryStorageProvider
    ↓
Persist RF domain asset / version
    ↓
ensureCloudinaryStorageLocation()
    ↓
createReferenceSafe()
    ↓
StorageReference
    ↓
StorageLocation → providerId → StorageProvider registry
```

The existing `publicId`, `storageKey`, `secureUrl`, and thumbnail fields remain in place for backward compatibility.

## Cloudinary location resolution

`ensureCloudinaryStorageLocation(organizationId)`:

1. Lists the organization's `storage_locations`.
2. Selects an active Cloudinary location marked default when available.
3. Otherwise selects the first active Cloudinary location.
4. If no active Cloudinary location exists, creates `Cloudinary (Platform Default)` with:
   - `providerId = cloudinary`
   - `rootPath = /ReleaseFlow`
   - `status = active`
   - `isDefault = true`

This does not change upload routing. It creates the durable configuration node required by `StorageReference` while the product remains Cloudinary-first.

## Reference creation

`createProductionStorageReference()` creates a provider-neutral `StorageReference` containing:

- `organizationId`
- RF `domainAssetId`
- RF `assetType`
- `storageLocationId`
- `providerId`
- Cloudinary `providerFileId` (`publicId`)
- provider path metadata
- `status = active`
- `currentVersion = 1`

No download URL is persisted as storage identity.

## Production flows integrated

### Release artwork media flow

`uploadReleaseArtwork()` and `replaceReleaseArtwork()` now create a `StorageReference` after the RF media asset/version has been persisted.

The existing media version system remains the product version system. StorageReference version metadata is not being used as a second approval/version model.

### Artwork flow

`uploadArtwork()` creates a reference after the artwork record is persisted.

`replaceArtwork()` creates a new reference for the new binary and detaches previous active references before the previous binary is removed.

`removeArtwork()` detaches active references before removing the RF artwork record.

## Compatibility rules

The following are intentionally unchanged:

- Cloudinary remains the active production upload provider.
- `uploadFile()` retains its historical result contract.
- Existing `publicId` / `storageKey` fields remain populated.
- Existing persisted delivery URLs remain usable.
- Existing historical Cloudinary assets are not migrated.
- `resolveAssetRoute()` is not mandatory for these uploads yet.

## Explicit non-goals

This build does not implement:

- Dropbox/OneDrive production upload lifecycle binding
- mandatory Storage Policy routing
- Folder Template enforcement
- delivery through `StorageReference → getDownloadUrl`
- historical Cloudinary backfill
- discovery/DAM
- reconciliation or orphan scanning
- provider sync-all
- OAuth/account redesign
- provider-specific domain models
- a second product versioning system

## Failure behaviour

A new production upload now requires successful RF StorageReference creation before the service reports success. Existing upload/provider contracts are unchanged, but a reference-creation failure is surfaced through the existing service error path.

Artwork upload additionally attempts to remove the newly uploaded provider binary if RF artwork persistence or reference creation fails.

## Follow-on sequencing

1. Harden Dropbox/OneDrive provider operations by requiring StorageReference ownership.
2. Introduce soft production routing through `resolveAssetRoute()` where policies exist.
3. Move non-Cloudinary delivery to provider `getDownloadUrl()` through the reference chain.
4. Add storage lifecycle activity events to the existing activity model.
5. Consider historical reference backfill after production lifecycle stability is established.
