# Artist Workspace Blueprint

**Screen:** `/artists/[id]`
**Purpose:** Answer "which releases matter and what needs attention for this artist?"

---

## Core Questions

| # | Question | Answered By |
|---|----------|-------------|
| 1 | Which releases matter most right now? | Active Releases section (hero, below header) |
| 2 | What work is waiting on this artist? | Context Rail — attention items |
| 3 | Are there rights or assets missing? | Profile completeness + readiness indicators |
| 4 | Is this artist operationally healthy? | OperationalSummary + Context Rail |
| 5 | What's the full catalog? | Releases tab — discography |

---

## Fixed Layout

```
┌──────────────────────────────────────────────────────────┬──────────┐
│  ◀ Back to artists                                       │          │
│                                                          │          │
│  ┌────┐  Kinn Timo                         Add Release  │ Context  │
│  │ 🎤 │  Original Artist · South Africa                 │ Rail     │
│  └────┘  🟢 In Progress 85% · 3 active · 2 completed   │          │
│          Instagram · Spotify · Website                   │ Health   │
│                                                          │ Ring     │
│  ─── Operational Summary ────────────────────────────   │          │
│  3 active releases. Profile 85% complete.              │ Readin-  │
│                                                          │ ess      │
│  ─── Tabs ──────────────────────────────────────────   │ Stack    │
│  Overview │ Releases │ Credits │ Assets │ Activity │    │          │
│                                        Press Kit        │ Context  │
│  ─── Tab Content ───────────────────────────────────   │ Rail     │
│  Profile · Bio · Genres · Social Links [Edit]          │          │
│                                                          │          │
│  Active Releases (2)                                    │          │
│  Lua · EP · Producer · 🟡 Attention                     │          │
│  Mid Sess · Single · Producer · 🟢 Healthy              │          │
│                                                          │          │
│  Completed Releases (1)                                 │          │
│  Summer EP · EP · Producer · ✓ Complete                 │          │
└──────────────────────────────────────────────────────────┴──────────┘
```

---

## Layer Order

| Layer | Zone | Content |
|-------|------|---------|
| Decision | Hero top-right | + Add Release (primary) |
| Operational | Hero | Name, type, country, genres, profile completeness pill, stats |
| Operational | Below hero | OperationalSummary |
| Context | Content area | Tabs + active tab content |
| Context | Context Rail | HealthRing, ReadinessStack, attention items |
| History | Activity tab | Chronological feed |

---

## Tab Content Hierarchy

| Tab | Purpose | Priority |
|-----|---------|----------|
| Overview | Profile + Active Releases + Completed Releases | P1 |
| Releases | Full discography table | P2 |
| Credits | Track credits across all releases | P2 |
| Assets | Artist photos, logos, press assets | P3 |
| Press Kit | Auto-generated EPK content | P4 |
| Activity | Chronological activity feed | P5 |

---

## Content Rules

### What must appear in the hero
- Artist avatar (or placeholder)
- Artist name (editorial, dominant)
- Artist type badge
- Country
- Genres (as pills)
- Profile completeness pill (% + label)
- Active / Completed / Credits stats inline
- Social links (compact)
- Primary action: + Add Release

### What must appear in the Context Rail
- Health Ring (profile completeness)
- Readiness Stack (photo, bio, genres, social links, releases)
- Attention items (missing profile fields, missing rights)

### What must not appear
- Workflow stage advancement controls
- Task assignment
- Distribution package generation
- Release creation form (CTA only)
- CRM-style contact management fields
- Organization settings

### Anti-pattern: CRM record
The Artist Workspace must not resemble a CRM contact page. It must communicate the artist's creative identity and operational context. Social links, genre tags, and release relationships should dominate over administrative metadata.

### Empty states
- No releases → "Not linked to any releases yet" with "Add Release" CTA
- No credits → "No track credits recorded yet"
- No assets → "Artist assets will appear here"
- No activity → "Activity will appear when releases are updated"
