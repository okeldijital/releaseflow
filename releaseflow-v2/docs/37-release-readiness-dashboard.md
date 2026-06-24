# TASK-1601 — Release Readiness Dashboard

## Concept

Release Readiness answers one question: *"Can this release go live?"*

It is distinct from:
- **Release Health** (TASK-803): "Is execution on track?" (overdue/blocked stages)
- **Release Progress** (TASK-804): "How many stages are done?"
- **Release Status** (Doc 16): "What lifecycle phase are we in?"

Readiness is the gate before distribution. It evaluates whether every
requirement is met, every deliverable is approved, and nothing is blocking
the release from shipping on the street date.

---

## Visual

```
┌──────────────────────────────────────────────────────────────────┐
│  ◀ Midnight Sessions                         🟢 READY           │
│                                                                   │
│  ─── Release Readiness ────────────────────────────────────────  │
│                                                                   │
│  Release date: Oct 01, 2026   (14 days)                          │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ 🎵       │  │ 🎨       │  │ 📋       │  │ 📡       │        │
│  │ Audio    │  │ Artwork  │  │ Metadata │  │ Distrib..│        │
│  │          │  │          │  │          │  │          │        │
│  │ ✅ Ready │  │ ✅ Ready │  │ 🔴 Miss..│  │ 🔴 Miss..│        │
│  │          │  │          │  │          │  │          │        │
│  │ 4/4      │  │ 1/1      │  │ 1/3      │  │ 0/4      │        │
│  │ approved │  │ approved │  │ complete │  │ complete │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
│  ─── Blockers ──────────────────────────────────────────────────  │
│                                                                   │
│  🔴 Metadata incomplete — 2 of 3 requirements pending             │
│  🔴 Distribution not ready — UPC and ISRC codes missing           │
│                                                                   │
│  Overall: 🔴 BLOCKED · 2 blockers · Earliest clear: Sep 05       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Readiness Dimensions

Four dimensions are evaluated. Each gets a Ready / At Risk / Blocked rating.

### Dimension 1: Audio

| Condition | Rating |
|-----------|--------|
| All audio deliverables approved | 🟢 Ready |
| All submitted, some awaiting review, date > 7 days out | 🟡 At Risk |
| Missing deliverables or rejected, date < 7 days out | 🔴 Blocked |

Evaluates: Raw stems, stereo mix files, and master files per track.
Tracks audio deliverable status from the Deliverable Workspace (TASK-1401).

### Dimension 2: Artwork

| Condition | Rating |
|-----------|--------|
| Cover art approved | 🟢 Ready |
| Cover art submitted, awaiting review | 🟡 At Risk |
| Cover art missing or rejected | 🔴 Blocked |

Evaluates: Cover art (required) + booklet and alternate covers (optional).

### Dimension 3: Metadata

| Condition | Rating |
|-----------|--------|
| Title, genre, label, copyright, contributors, language all set | 🟢 Ready |
| Critical metadata set (title, genre, label, copyright) but contributors or language missing | 🟡 At Risk |
| Title, genre, or label missing | 🔴 Blocked |

Evaluates:
- Title, version, genre, subgenre (release metadata)
- Label, copyright (org metadata mapped to release)
- Contributors: at least Artist + Producer assigned
- Track metadata: title, duration, ISRC per track

### Dimension 4: Distribution

| Condition | Rating |
|-----------|--------|
| UPC assigned + ISRC per track + metadata sheet complete | 🟢 Ready |
| UPC or ISRC partial (some assigned, some pending) | 🟡 At Risk |
| UPC missing or no ISRC codes assigned | 🔴 Blocked |

Evaluates:
- UPC code (GS1 GTIN-12, validated)
- ISRC codes per track (12-char, uppercase)
- Metadata sheet (genre, credits, copyright)
- DSP-specific assets (Spotify Canvas, Apple Motion — optional)
- DSP connections active (Spotify, Apple Music, etc.)

---

## Overall Readiness

```
Readiness = WORST(audioScore, artworkScore, metadataScore, distributionScore)
```

| Worst Dimension | Overall Readiness |
|-----------------|-------------------|
| All Ready | 🟢 READY |
| Any At Risk | 🟡 AT RISK |
| Any Blocked | 🔴 BLOCKED |

---

## Blocker Display

When overall is AT RISK or BLOCKED, the dashboard shows exactly what's
blocking the release:

```
┌──────────────────────────────────────────────────────────────┐
│  🟡 AT RISK · 3 issues                                       │
│                                                               │
│  ⚠ Cover art submitted Jul 14 — pending A&R review for 3d   │
│  ⚠ UPC not yet assigned — awaiting GS1 registration         │
│  ⚠ ISRC codes for Track 4 missing                            │
│                                                               │
│  Estimated clear date: Jul 18 (if review completed)          │
└──────────────────────────────────────────────────────────────┘
```

Each blocker line shows:
- Icon + severity color
- What is wrong
- When it was last updated (or how long it has been pending)
- Who owns the resolution (derived from owner on the deliverable/requirement)

---

## Compute Rules

Readiness is computed on load (not stored). The backend evaluates against
the release's template requirements:

```typescript
function computeReadiness(release: Release): ReadinessResult {
  const audio = evaluateAudio(release);
  const artwork = evaluateArtwork(release);
  const metadata = evaluateMetadata(release);
  const distribution = evaluateDistribution(release);

  const blockers = collectBlockers(audio, artwork, metadata, distribution);
  const overall = worstOf(audio.rating, artwork.rating, metadata.rating, distribution.rating);

  return {
    overall,
    dimensions: { audio, artwork, metadata, distribution },
    blockers,
    estimatedClearDate: blockers.length === 0 ? null : computeEstimate(blockers),
    computedAt: new Date(),
  };
}
```

---

## Display Locations

| Location | What It Shows |
|----------|---------------|
| Release header | Overall readiness badge next to status badge |
| Release Overview tab | Full readiness dashboard (main content) |
| Release card (release list) | Compact readiness dot |
| Dashboard stat card | Readiness score + blocker count |

### Release Header

```
┌──────────────────────────────────────────────────────┐
│  ◀ Back to Releases                                   │
│                                                       │
│  Midnight Sessions  Single · Artist X                 │
│  ┌────────────┐  ┌────────────┐                       │
│  │ PRODUCTION  │  │ 🔴 BLOCKED │                       │
│  └────────────┘  └────────────┘                       │
└──────────────────────────────────────────────────────┘
```

Status and readiness shown together — the lifecycle state and the shipping
readiness are independent signals.

### Release Card (Compact)

```
┌─────────────────────────────────────────┐
│  Midnight Sessions             🔴 BLOCKED│
│  Single · Artist X                      │
│  ──[████████░░░░░░]── 57%               │
│  2 blockers · Earliest clear: Sep 05    │
└─────────────────────────────────────────┘
```

---

## Readiness vs Health — Side by Side

| Aspect | Release Health (TASK-803) | Release Readiness (TASK-1601) |
|--------|--------------------------|-------------------------------|
| Question | "Is execution on track?" | "Can we release?" |
| Evaluates | Overdue stages, blocked stages, date proximity | Deliverable approvals, metadata completeness, distribution readiness |
| Factors | 3 factors, stage-focused | 4 dimensions, deliverable/requirement-focused |
| Labels | 🟢 Green / 🟡 Amber / 🔴 Red | 🟢 Ready / 🟡 At Risk / 🔴 Blocked |
| Visibility | Release card, dashboard stat, header | Release header, overview tab, release card |
| Computation | Worst of 3 | Worst of 4 |
| Audience | PM, Admin — tracking | PM, Admin, Owner — go/no-go decision |
