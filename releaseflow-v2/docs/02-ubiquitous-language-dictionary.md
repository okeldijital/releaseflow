# Ubiquitous Language Dictionary

## Naming Conventions

- **Entities** are singular nouns (`Release`, `Track`, `User`)
- **Value Objects** are descriptive nouns (`EmailAddress`, `ISRC`, `Duration`)
- **Domain Events** are past-tense verb phrases (`ReleaseCreated`, `StageApproved`)
- **Commands** are imperative verb phrases (`SubmitRelease`, `ApproveStage`)
- **Enums / States** are uppercase snake case (`IN_PROGRESS`, `MASTERED`)

---

## A

### A&R (Artists & Repertoire)
The department or role responsible for talent scouting and creative oversight
of a release. Functions as the gatekeeper between `Idea` and `Production`.

### Activity
A timestamped record of a domain event within the system. Used for audit
logs and activity feeds.

### Approval
A decision record (approved / rejected) tied to a `Stage` or `Task`.
Requires one or more `Approver` roles to complete.

### Archive
The terminal state of a release lifecycle. No further edits allowed.
Data is retained for historical/royalty purposes.

### Artwork
A specialized `Asset` type containing cover art, booklet, and visual
metadata. Typically one of the final stages before publishing.

### Asset
A digital file managed by the system. Assets are versioned and can be
associated with `Releases`, `Tracks`, or `Tasks`.

### AssetVersion
A specific snapshot of an `Asset`. Tracks changes over time with
version numbering and uploader attribution.

---

## C

### Campaign
A marketing initiative tied to a `Release`. Owns timelines, budgets,
promotional assets, and distribution of marketing materials.

### Comment
A user-authored message attached to a domain entity (Release, Track,
Task, Asset). Supports mentions and threaded replies.

### Compilation
A `ReleaseTemplate` type. A collection of tracks from multiple artists,
typically curated by a label.

### Contributor
A person credited with work on a `Release` or `Track`. Includes role
designation (e.g., "Producer", "Writer", "Featured Artist") and
ownership percentage metadata.

---

## D

### Dashboard
The landing view in the application showing key metrics: active releases,
pending approvals, upcoming deadlines, and task summaries.

### Deluxe
A `ReleaseTemplate` type. A derivative release that extends an existing
album with bonus tracks, alternate versions, or enhanced media.

### Distribution
The process of delivering a `Release` to digital stores and streaming
platforms (Spotify, Apple Music, etc.). Includes metadata submission,
territory targeting, and release date scheduling.

### Distributor
A `Role` with permissions to submit, manage, and monitor distribution
channels for a release.

---

## E

### EP (Extended Play)
A `ReleaseTemplate` type. A collection of 3–6 tracks, shorter than an
album but longer than a single.

---

## I

### Idea
The initial concept for a release. Exists before any formal production
work. Must pass A&R approval to advance.

### ISRC (International Standard Recording Code)
A unique identifier for a sound recording. A value object on `Track`.

### ISWC (International Standard Musical Work Code)
A unique identifier for a musical composition. A value object on `Track`.

---

## M

### Marketing
A `Role` with permissions to create and manage `Campaigns`, schedule
promotional assets, and coordinate with distribution.

### Mastering
The final stage of audio production. Prepares the mixed stereo files for
distribution by applying final EQ, compression, and loudness normalization.

### Metadata
Structured information about a `Release` or `Track`: title, artist,
genre, release date, UPC, label, copyright, etc.

### Mix Engineer
A `Role` responsible for balancing and processing individual track
elements into a final stereo mix.

### Mixing
The stage where individual recorded tracks are blended, processed, and
balanced into a stereo (or surround) mix.

---

## N

### Notification
A system-generated message delivered to a user. Triggered by events
(stage approvals, task assignments, mentions).

---

## O

### Organization
A tenant-level entity representing a company or label within the system.

### Owner
The highest privileged `Role`. Has full system access including billing,
tenant configuration, and user management.

---

## P

### Permission
A granular access right (e.g., `release:create`, `task:approve`).
Assigned to `Roles`, not directly to `Users`.

### Post Release
The lifecycle phase after public release. Covers monitoring, royalty
reporting, and performance analytics.

### Producer
A `Role` responsible for creative direction of a recording session.

### Production
The first active stage of the release lifecycle where recording begins.

### PR (Public Relations)
A `Role` with permissions to manage press materials, media outreach,
and publicity campaigns.

### Project Manager
A `Role` responsible for coordinating cross-functional teams, timelines,
and deliverables for a release.

### Publisher
A `Role` or entity representing music publishing interests. Manages
composition rights and mechanical licenses.

### Publishing
The stage where composition metadata, copyright registration, and
publishing rights are finalized before distribution.

---

## R

### Recording
The stage where audio is captured (vocals, instruments) in a studio or
remote session.

### Reissue
A `ReleaseTemplate` type. A re-release of previously released material,
often with remastered audio or bonus content.

### Release
The central entity of the system. Represents a musical work (Single, EP,
Album, etc.) released to the public. Owns the lifecycle, metadata,
tracks, assets, and campaign.

### ReleaseTemplate
A classification of a `Release` that dictates the default workflow,
required stages, and available metadata fields. Examples: Single, EP,
Album, Remix, Compilation, Deluxe, Reissue.

### Remix
A `ReleaseTemplate` type. An alternate version of an existing track
created by a different producer or artist.

### Role
A named collection of `Permissions` assignable to `Users` within an
`Organization` or `Team`.

---

## S

### Single
A `ReleaseTemplate` type. A release containing one primary track, often
with B-side or instrumental.

### Specification
A formal document or structured data defining the requirements for a
`Release`: format specs (WAV 24-bit / 48kHz), track listing, metadata
fields, artwork dimensions, and delivery checklist.

### Stage
A named phase within a `Workflow` (e.g., "Recording", "Mixing"). Stages
are sequential and may require `Approval` before advancing.

### Store
A digital retail or streaming platform (Spotify, Apple Music, Tidal,
Amazon Music) that receives distributed `Release` content.

---

## T

### Task
A unit of work within a `Stage`. Assigned to a `User` or `Role`.
May reference required `Assets` and have a due date.

### Team
A group of `Users` within an `Organization`. Teams are used for
scoping permissions and assigning work.

### Tenant
The top-level entity in a multi-tenant architecture. Each tenant is an
independent instance with its own organizations, users, and data.

### Territory
A geographic region or country where a `Release` is distributed.
Manages rights, licensing, and release date variance per region.

### Track
A single musical composition or recording within a `Release`. Owns its
own metadata, contributors, ISRC, and audio assets.

---

## U

### UPC (Universal Product Code)
A barcode identifier for a `Release`. Used for retail and distribution.

### User
A person with authenticated access to the system. Belongs to one or more
`Organizations` and is assigned one or more `Roles`.

---

## V

### Viewer
A `Role` with read-only access. Can view releases, tasks, and reports
but cannot create or modify entities.

---

## W

### Workflow
A configurable sequence of `Stages` that defines the production pipeline
for a `Release`. Different `ReleaseTemplates` may map to different
workflows.

### Workflow Stage
Synonym for `Stage`. A step in the `Workflow` lifecycle.
