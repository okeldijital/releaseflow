# Contributor Taxonomy

## Overview

Contributors represent people credited with creative or technical work
on a Release or Track. Each contributor is assigned a role from the
taxonomy below. Roles map to industry-standard credit types used by
DSPs, PROs, and metadata registries.

---

## Core Contributor Roles (V1)

### 1. Artist

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Primary Artist                                 |
| Scope         | Release-level, Track-level                     |
| DSP Mapping   | ddex:Artist                                    |
| PRO Mapping   | — (not a writer role)                          |
| Multiplicity  | 1+ (solo, duo, group)                          |
| Visibility    | Displayed as primary performer                 |

**Usage:** The main performing act. For compilations, each track may
have a different artist.

---

### 2. Featured Artist

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Featured Guest                                 |
| Scope         | Track-level                                    |
| DSP Mapping   | ddex:IndirectResourceContributor               |
| PRO Mapping   | —                                               |
| Multiplicity  | 0+                                              |
| Display       | "feat. [Name]" in title                        |

**Usage:** Guest performer on a specific track. Not the primary
artist of the release.

---

### 3. Remixer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Remixer                                        |
| Scope         | Track-level                                    |
| DSP Mapping   | ddex:Remixer                                   |
| PRO Mapping   | May also be writer/composer                    |
| Multiplicity  | 1+                                              |
| Display       | "[Track] ([Remixer] Remix)"                    |

**Usage:** Created an alternate version of an existing track.

---

### 4. Producer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Producer                                       |
| Scope         | Track-level                                    |
| DSP Mapping   | ddex:Producer                                  |
| PRO Mapping   | May receive producer royalty                   |
| Multiplicity  | 1+                                              |
| Sub-types     | Vocal Producer, Beat Producer, Executive Prod. |

**Usage:** Responsible for creative direction of a recording
session. Not a songwriting credit unless also a writer.

---

### 5. Co-Producer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Co-Producer                                    |
| Scope         | Track-level                                    |
| DSP Mapping   | ddex:Producer (secondary)                      |
| PRO Mapping   | May share producer royalty                     |
| Multiplicity  | 0+                                              |

**Usage:** Shared production credit. Typically implies equal or
specified percentage of production work.

---

### 6. Writer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Writer / Songwriter                            |
| Scope         | Track-level                                    |
| DSP Mapping   | ddex:Writer                                    |
| PRO Mapping   | Receives writer royalties                      |
| Multiplicity  | 1+                                              |
| IPI Required  | Yes (for royalty registration)                 |

**Usage:** Composed the lyrics, melody, or chord structure. This
is a publishing credit, distinct from performance.

---

### 7. Composer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Composer                                       |
| Scope         | Track-level                                    |
| DSP Mapping   | ddex:Composer                                  |
| PRO Mapping   | Receives composition royalties                 |
| Multiplicity  | 0+                                              |

**Usage:** Created the musical composition (instrumental).
Distinct from lyricist. In some genres, Composer = Writer.

---

### 8. Mix Engineer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Mixing Engineer                                |
| Scope         | Track-level                                    |
| DSP Mapping   | ddex:Mixer                                     |
| PRO Mapping   | — (technical credit)                           |
| Multiplicity  | 1+                                              |

**Usage:** Blends and balances individual recorded tracks into
a final stereo mix. Technical credit.

---

### 9. Mastering Engineer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Mastering Engineer                             |
| Scope         | Track-level, Release-level                     |
| DSP Mapping   | ddex:MasteringEngineer                         |
| PRO Mapping   | — (technical credit)                           |
| Multiplicity  | 1+                                              |

**Usage:** Prepares final mixed audio for distribution.
Technical credit.

---

### 10. Artwork Designer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Design / Art Direction                         |
| Scope         | Release-level                                  |
| DSP Mapping   | ddex:Designer                                  |
| PRO Mapping   | — (visual credit)                              |
| Multiplicity  | 1+                                              |

**Usage:** Created cover art, booklet, or visual assets for the
release.

---

### 11. Photographer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Photography                                    |
| Scope         | Release-level                                  |
| DSP Mapping   | ddex:Photographer                              |
| PRO Mapping   | — (visual credit)                              |
| Multiplicity  | 1+                                              |

**Usage:** Provided photography used in release visuals
(cover, promo, booklet).

---

### 12. Videographer

| Property      | Value                                          |
|---------------|------------------------------------------------|
| Credit Type   | Videographer / Video Director                  |
| Scope         | Release-level, Track-level                     |
| DSP Mapping   | ddex:VideoDirector                             |
| PRO Mapping   | — (visual credit)                              |
| Multiplicity  | 1+                                              |

**Usage:** Directed or filmed music video / visual content
associated with the release.

---

## Role Classification

```
Role                │ Type        │ Royalty │ DSP Credit │ Track/Release
────────────────────┼─────────────┼─────────┼────────────┼──────────────
Artist              │ Performance │ No      │ Yes        │ Both
Featured Artist     │ Performance │ No      │ Yes        │ Track
Remixer             │ Performance │ No      │ Yes        │ Track
Producer            │ Production  │ Yes     │ Yes        │ Track
Co-Producer         │ Production  │ Yes     │ Yes        │ Track
Writer              │ Publishing  │ Yes     │ Yes        │ Track
Composer            │ Publishing  │ Yes     │ Yes        │ Track
Mix Engineer        │ Technical   │ No      │ Yes        │ Track
Mastering Engineer  │ Technical   │ No      │ Yes        │ Both
Artwork Designer    │ Visual      │ No      │ No         │ Release
Photographer        │ Visual      │ No      │ No         │ Release
Videographer        │ Visual      │ No      │ No         │ Both
```

---

## Industry Contributor Model (Relationships)

The following diagram formalizes how contributor roles relate to each
other in the music industry value chain. These relationships will
influence future rights, royalty, and licensing modules.

```
                     ┌──────────────┐
                     │   ARTIST     │
                     │ (performer)  │
                     └──────┬───────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                   │
          ▼                 ▼                   ▼
  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
  │  PRODUCER     │  │   WRITER     │  │   ENGINEER       │
  │ (creative)    │  │ (publishing) │  │ (technical)      │
  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘
         │                 │                  │
         │        ┌────────┘                  │
         │        │                           │
         ▼        ▼                           ▼
  ┌──────────────────────┐           ┌──────────────────┐
  │     PUBLISHER        │           │   DESIGNER       │
  │ (rights admin)       │           │ (visual)         │
  └──────────┬───────────┘           └──────────────────┘
             │
             ▼
  ┌──────────────────────┐
  │    DISTRIBUTOR       │
  │ (delivery)           │
  └──────────────────────┘
```

### Relationship Rules

| Relationship                    | Type       | Description                                      |
|---------------------------------|------------|--------------------------------------------------|
| Artist → Producer               | Engages    | Artist hires Producer to shape recording         |
| Artist → Writer                 | Collaborates| Artist co-writes or performs written work       |
| Artist → Engineer               | Engages    | Artist hires Engineer for mix/master             |
| Artist → Publisher              | Assigns    | Artist assigns publishing rights to Publisher    |
| Producer → Writer               | Overlaps   | Producer may also be a Writer (dual credit)      |
| Writer → Publisher              | Licenses   | Writer licenses composition to Publisher         |
| Publisher → Distributor         | Contracts  | Publisher engages Distributor for delivery       |
| Artist → Designer               | Engages    | Artist hires Designer for visual assets          |
| Producer → Engineer             | Supervises | Producer directs Engineer workflow               |

### Data Model Impact

```
Contributor
  ├── role (enum: Artist, Producer, Writer, Engineer, Designer)
  ├── publisherId (FK → Publisher, nullable)  ← only for Writers
  ├── ipi (string, nullable)                   ← only for Writers
  └── split (percentage, nullable)             ← only for Writers

Publisher
  ├── id
  ├── name
  ├── pro (ASCAP, BMI, SOCAN, PRS, etc.)
  └── territories (string[])

Distributor
  ├── id
  ├── name
  ├── stores (string[])   ← connected stores
  └── apiKey (encrypted)
```

### Royalty Flow (Future)

```
  Revenue → Distributor → Label → Artist
                                    ├── Producer (production royalty)
                                    ├── Writer (mechanical royalty) → Publisher
                                    └── Engineer (work-for-hire, no royalty)
                                              Designer (work-for-hire, no royalty)
```

**V1 note:** Royalty calculations are out of scope for Sprint 003. The
contributor model is designed to support them in Sprint 005+.

---

## Credit Display Format (DSP)

Standard DSP credit block:

```
  Written by [Writer 1], [Writer 2]
  Produced by [Producer 1]
  Mixed by [Mix Engineer]
  Mastered by [Mastering Engineer]
  ℗ [Year] [Label]
```

---

## UI: Contributor Assignment

```
  ┌──────────────────────────────────────────────────────────────┐
  │  Contributors — Midnight Sessions              ✚ Add Person │
  │  ─────────────────────────────────────────────────────────── │
  │                                                               │
  │  ┌──────┬────────────────┬──────────────┬─────────┬────────┐ │
  │  │ Role │ Name            │ Scope        │ IPI     │ Split  │ │
  │  ├──────┼────────────────┼──────────────┼─────────┼────────┤ │
  │  │ Art. │ Artist X       │ Release      │ —       │ —      │ │
  │  │ Writ.│ Artist X       │ Track 1,2,3  │ 123..   │ 50%    │ │
  │  │ Writ.│ Alex Taylor    │ Track 1      │ 456..   │ 25%    │ │
  │  │ Writ.│ Sam Wilson     │ Track 1      │ 789..   │ 25%    │ │
  │  │ Prod.│ Producer Z     │ Track 1,2    │ —       │ —      │ │
  │  │ Mix  │ Mix Eng A      │ Track 1,2,3  │ —       │ —      │ │
  │  │ Mast.│ Mast Eng B     │ Release      │ —       │ —      │ │
  │  │ Des. │ Design C       │ Release      │ —       │ —      │ │
  │  └──────┴────────────────┴──────────────┴─────────┴────────┘ │
  │                                                               │
  │  ┌────────────────────────────────────────────────────────┐   │
  │  │  💡 Writers and Composers require IPI for PRO          │   │
  │  │     registration. Other roles are optional.           │   │
  │  └────────────────────────────────────────────────────────┘   │
  └──────────────────────────────────────────────────────────────┘
```

---

## Validation Rules

| Rule                                    | Enforcement                          |
|-----------------------------------------|--------------------------------------|
| At least one Artist per release         | Block distribution without artist    |
| Writer split percentages sum to 100%    | Warning on >100%, error on >110%     |
| IPI required for Writer/Composer roles  | Warning field, not blocking          |
| Unique (role + person + scope) combos   | Prevent duplicate assignment         |
| Max one primary Artist per track        | Single-select for primary artist     |
