# Bounded Context Map

## Overview

ReleaseFlow is decomposed into seven bounded contexts. Each context owns a distinct
subdomain and communicates with others via events or shared kernels.

```
┌─────────────────────────────────────────────────────────────────┐
│                        RELEASEFLOW SYSTEM                        │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Identity    │  │   Release    │  │  Production   │           │
│  │    & Access   │◄─┤  Management  │◄─┤   Pipeline    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                     │
│         ▼                 ▼                 ▼                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │    Asset      │  │  Marketing   │  │ Distribution  │           │
│  │   Catalog     │  │   Campaign   │  │   Gateway     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   Collaboration                           │    │
│  │          (Comments, Approvals, Notifications)             │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Context Definitions

### 1. Identity & Access (IAC)
**Core subdomain**

Owns authentication, authorization, multi-tenant org hierarchy, and RBAC.

**Entities:** `Tenant`, `Organization`, `Team`, `User`, `Role`, `Permission`

**Relationships:**
- Consumed by every other context (user identity, permission checks)
- Publishes: `UserInvited`, `RoleAssigned`, `PermissionChanged`

**Important:** All cross-context calls must pass a verified identity token.

---

### 2. Release Management (RLM)
**Core subdomain**

Owns the release as the central aggregate. Manages metadata, tracks,
specifications, and the release-level lifecycle state.

**Entities:** `Release`, `Track`, `Specification`, `ReleaseTemplate`

**Relationships:**
- Reads from IAC (who owns the release)
- Sends commands to Production Pipeline (start stage)
- Sends commands to Asset Catalog (attach assets)
- Publishes: `ReleaseCreated`, `ReleaseStateChanged`, `TrackAdded`

---

### 3. Production Pipeline (PRP)
**Core subdomain**

Owns configurable workflows, stages, tasks, and stage-level approvals.
Implements the release lifecycle state machine.

**Entities:** `Workflow`, `Stage`, `Task`, `Approval`

**Relationships:**
- Receives commands from Release Management
- Reads assets from Asset Catalog (for task completion)
- Publishes: `StageCompleted`, `StageApproved`, `TaskAssigned`

---

### 4. Asset Catalog (ASC)
**Supporting subdomain**

Owns file storage, versioning, and asset metadata.

**Entities:** `Asset`, `AssetVersion`

**Relationships:**
- Consumed by Production Pipeline (attach deliverables to tasks)
- Consumed by Distribution Gateway (package final assets)
- Publishes: `AssetUploaded`, `AssetVersioned`

---

### 5. Marketing Campaign (MKC)
**Supporting subdomain**

Owns campaign planning, execution, and analytics for a release.

**Entities:** `Campaign`, `CampaignAsset`

**Relationships:**
- References a Release (campaign belongs to a release)
- Consumed by Distribution Gateway (coordinated launch)
- Publishes: `CampaignLaunched`, `CampaignEnded`

---

### 6. Distribution Gateway (DST)
**Generic subdomain**

Owns delivery to stores/streaming platforms, territory management, and
publishing metadata.

**Entities:** `Distribution`, `Territory`, `Store`, `Publishing`

**Relationships:**
- Reads final assets from Asset Catalog
- Reads release metadata from Release Management
- Reads campaign dates from Marketing Campaign
- Publishes: `DistributionSubmitted`, `DistributionApproved`, `StoreLive`

---

### 7. Collaboration (COL)
**Supporting subdomain**

Owns all cross-cutting communication: comments, approvals, notifications,
and activity feeds.

**Entities:** `Comment`, `Notification`, `Activity`, `Contributor`

**Relationships:**
- Attaches to entities in any context (polymorphic comments/activities)
- Consumed by every context (in-app notifications, audit log)
- Publishes: `CommentPosted`, `MentionTriggered`

---

## Context Map Summary

| Context        | Type        | Language (Primary) | Events Published                 |
|----------------|-------------|-------------------|----------------------------------|
| IAC            | Core        | English           | UserInvited, RoleAssigned        |
| RLM            | Core        | English           | ReleaseCreated, TrackAdded       |
| PRP            | Core        | English           | StageCompleted, TaskAssigned     |
| ASC            | Supporting  | English           | AssetUploaded, AssetVersioned    |
| MKC            | Supporting  | English           | CampaignLaunched                 |
| DST            | Generic     | English           | DistributionSubmitted, StoreLive |
| COL            | Supporting  | English           | CommentPosted, MentionTriggered  |

## Integration Patterns

| Relationship        | Pattern               | Mechanism              |
|---------------------|-----------------------|------------------------|
| IAC → every context | Shared Kernel         | Token / API middleware |
| RLM → PRP           | Event-Driven          | Domain events          |
| PRP → ASC           | Anti-Corruption Layer | Service interface      |
| RLM → DST           | Event-Driven          | Domain events          |
| MKC → DST           | Shared Kernel         | Campaign date fields   |
| COL → every context | Anti-Corruption Layer | Polymorphic references |
