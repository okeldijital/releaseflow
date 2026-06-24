# Entity Relationship Diagram (Conceptual)

This document describes the conceptual data model. Attributes are
limited to identity, key relationships, and state-bearing fields.
Implementation details (timestamps, foreign keys, indexes) are omitted.

---

## 1. Identity & Access Context

```
Tenant 1───* Organization 1───* Team *───* User
                                  │
                                  │
                                  * Role 1───* Permission
```

### Tenant
- `id` (UUID, PK)
- `name`
- `slug`
- `settings` (JSON)
- `billingPlan`

### Organization
- `id` (UUID, PK)
- `tenantId` (FK → Tenant)
- `name`
- `slug`

### Team
- `id` (UUID, PK)
- `organizationId` (FK → Organization)
- `name`
- `description`

### User
- `id` (UUID, PK)
- `email`
- `name`
- `authProviderId` (external identity)

### Role
- `id` (UUID, PK)
- `organizationId` (FK → Organization) — roles are tenant-scoped
- `name`
- `type` (enum: SYSTEM, CUSTOM)

### Permission
- `id` (UUID, PK)
- `action` (e.g., `release:create`)
- `resource` (e.g., `release`, `task`, `asset`)

---

## 2. Release Management Context

```
ReleaseTemplate 1───* Release 1───* Track
                              │
                              │
                              1───* Specification
```

### ReleaseTemplate
- `id` (UUID, PK)
- `name` (Single, EP, Album, Remix, Compilation, Deluxe, Reissue)
- `defaultWorkflowId` (FK → Workflow)

### Release
- `id` (UUID, PK)
- `organizationId` (FK → Organization)
- `templateId` (FK → ReleaseTemplate)
- `title`
- `artist`
- `label`
- `upc`
- `state` — release-level lifecycle state
- `releaseDate` (nullable)
- `coverArtAssetId` (FK → Asset, nullable)

### Track
- `id` (UUID, PK)
- `releaseId` (FK → Release)
- `title`
- `trackNumber`
- `isrc`
- `iswc`
- `duration`
- `explicit`
- `state` — track-level publishing state

### Specification
- `id` (UUID, PK)
- `releaseId` (FK → Release)
- `type` (TECHNICAL, METADATA, DELIVERY)
- `content` (JSON schema document)

---

## 3. Production Pipeline Context

```
Workflow 1───* Stage 1───* Task *───* User
                │
                │
                * Approval *───* Role
```

### Workflow
- `id` (UUID, PK)
- `name`
- `releaseTemplateId` (FK → ReleaseTemplate, nullable)
- `stageOrder` (ordered list of stage IDs)

### Stage
- `id` (UUID, PK)
- `workflowId` (FK → Workflow)
- `name` (Recording, Mixing, Mastering, etc.)
- `order`
- `requiredApprovalCount`
- `state` (PENDING, IN_PROGRESS, COMPLETED, SKIPPED)

### Task
- `id` (UUID, PK)
- `stageId` (FK → Stage)
- `assigneeId` (FK → User, nullable)
- `title`
- `description`
- `dueDate`
- `state` (TODO, IN_PROGRESS, REVIEW, DONE)
- `requiredAssets` (JSON — list of asset type requirements)

### Approval
- `id` (UUID, PK)
- `stageId` (FK → Stage)
- `approverId` (FK → User)
- `roleId` (FK → Role)
- `decision` (APPROVED, REJECTED, PENDING)
- `comment`

---

## 4. Asset Catalog Context

```
Asset 1───* AssetVersion
```

### Asset
- `id` (UUID, PK)
- `releaseId` (FK → Release, nullable)
- `trackId` (FK → Track, nullable)
- `fileName`
- `fileType` (WAV, AIFF, MP3, JPG, PNG, PDF)
- `category` (STEM, MIX, MASTER, ARTWORK, METADATA, DOCUMENT)
- `currentVersionId` (FK → AssetVersion)

### AssetVersion
- `id` (UUID, PK)
- `assetId` (FK → Asset)
- `versionNumber`
- `fileUrl` (storage path)
- `fileHash`
- `fileSize`
- `uploadedById` (FK → User)
- `notes`

---

## 5. Marketing Campaign Context

```
Campaign 1───* CampaignAsset
│
1
│
Release (reference)
```

### Campaign
- `id` (UUID, PK)
- `releaseId` (FK → Release)
- `name`
- `startDate`
- `endDate`
- `budget`
- `state` (DRAFT, ACTIVE, COMPLETED)

### CampaignAsset
- `id` (UUID, PK)
- `campaignId` (FK → Campaign)
- `assetId` (FK → Asset)
- `purpose` (SOCIAL, PRESS, ADS, PROMO)

---

## 6. Distribution Gateway Context

```
Distribution *───* Territory
│                │
│                │
1                *
│                │
Release         Store
```

### Distribution
- `id` (UUID, PK)
- `releaseId` (FK → Release)
- `storeId` (FK → Store)
- `territoryId` (FK → Territory)
- `releaseDate`
- `state` (DRAFT, SUBMITTED, APPROVED, REJECTED, LIVE, TAKEDOWN)

### Territory
- `id` (UUID, PK)
- `code` (ISO 3166-1 alpha-2)
- `name`

### Store
- `id` (UUID, PK)
- `name` (Spotify, Apple Music, Tidal, Amazon, etc.)
- `slug`

---

## 7. Collaboration Context

```
Contributor     Comment     Notification     Activity
    │               │             │              │
    │               │             │              │
    └───────────────┴─────────────┴──────────────┘
                        │
                    Polymorphic
                   (entityType +
                    entityId)
```

### Contributor
- `id` (UUID, PK)
- `releaseId` (FK → Release, nullable)
- `trackId` (FK → Track, nullable)
- `userId` (FK → User)
- `roleId` (FK → Role)
- `creditPercent` (for royalty splits)

### Comment
- `id` (UUID, PK)
- `authorId` (FK → User)
- `entityType` (polymorphic target)
- `entityId` (UUID)
- `parentCommentId` (FK → Comment, nullable — for threading)
- `body`

### Notification
- `id` (UUID, PK)
- `userId` (FK → User)
- `type` (TASK_ASSIGNED, STAGE_APPROVED, MENTION, COMMENT)
- `entityType`
- `entityId`
- `read`

### Activity
- `id` (UUID, PK)
- `userId` (FK → User)
- `action`
- `entityType`
- `entityId`
- `metadata` (JSON — action-specific payload)

---

## Summary of Key Relationships

| Entity A            | Relation | Entity B           | Cardinality |
|---------------------|----------|--------------------|-------------|
| Tenant              | has      | Organization       | 1:N         |
| Organization        | has      | Team               | 1:N         |
| Organization        | has      | User               | M:N (via Team) |
| Organization        | has      | Role               | 1:N         |
| Role                | has      | Permission         | M:N         |
| User                | has      | Role               | M:N         |
| ReleaseTemplate     | defines  | Release            | 1:N         |
| Release             | contains | Track              | 1:N         |
| Release             | has      | Specification      | 1:N         |
| Release             | has      | Asset              | 1:N         |
| Release             | has      | Campaign           | 1:N         |
| Release             | has      | Distribution       | 1:N         |
| Release             | has      | Contributor        | 1:N         |
| Track               | has      | Contributor        | 1:N         |
| Workflow            | contains | Stage              | 1:N         |
| Stage               | contains | Task               | 1:N         |
| Stage               | has      | Approval           | 1:N         |
| Asset               | has      | AssetVersion       | 1:N         |
| Comment             | —        | (polymorphic)      | M:N         |
| Notification        | —        | (polymorphic)      | M:N         |
| Activity            | —        | (polymorphic)      | M:N         |
