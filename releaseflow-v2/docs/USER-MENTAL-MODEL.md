# User Mental Model — ReleaseFlow

**Version:** 1.0
**Date:** 2026-06-28

---

## The Core Mental Model

```
Organisations
    │
    ├── contain Artists
    │       │
    │       └── create Releases
    │               │
    │               ├── progress through Workflows
    │               │       │
    │               │       └── contain Stages
    │               │               │
    │               │               └── generate Tasks
    │               │                       │
    │               │                       └── produce Deliverables
    │               │                               │
    │               │                               └── satisfy Requirements
    │               │
    │               ├── have Assets (files)
    │               ├── have Rights (ownership)
    │               └── receive Distribution Packages
    │
    └── have People (team members with roles)
```

---

## The Operational Loop

Every release follows the same cycle:

```
Create → Plan → Produce → Verify → Distribute → Release → Archive
```

At every stage, ReleaseFlow answers:

| Question | Answered by |
|----------|------------|
| Where are we? | Current Stage, Workflow Board |
| Is this healthy? | Health Ring, Operational Summary |
| What blocks shipping? | Attention Panel, Blockers |
| What changed? | Activity Feed, Timeline |
| What happens next? | Next Stage, Primary Action |
| Who needs to act? | Owner, Assignee |

---

## The Decision Hierarchy

Users come to ReleaseFlow to make decisions, not to operate software.

The platform surfaces decisions in this order:

```
1. Attention (what requires action now?)
       ↓
2. Health (is the release on track?)
       ↓
3. Readiness (can the release move forward?)
       ↓
4. Work (what needs to be done?)
       ↓
5. History (what happened?)
```

This maps directly to the screen layout:

```
Operations Center → Attention
Release Workspace → Health + Readiness
Workflow Board    → Work
Activity Feed     → History
```

---

## Role-Based Mental Models

### Release Manager / Owner

| Question | Screen |
|----------|--------|
| What needs my attention right now? | Operations Center |
| Is this release healthy? | Release Workspace — Hero |
| What blocks shipping? | Release Workspace — Context Rail |
| Are the rights cleared? | Release Workspace — Rights tab |
| Can I distribute? | Release Workspace — Distribution tab |
| Who's overloaded? | People |
| What's the org pulse? | Operations Center — Org Pulse |

### Contributor / Artist

| Question | Screen |
|----------|--------|
| What do I work on next? | Work |
| What's my deadline? | Work |
| Which releases am I on? | Artist Workspace |
| What credits do I have? | Artist Workspace — Credits tab |
| What's my profile look like? | Artist Workspace — Profile |

---

## The Five-Second Principle

Every primary screen must answer its purpose within five seconds:

| Screen | Five-Second Answer |
|--------|-------------------|
| Operations Center | "5 active, 2 blocked, 3 overdue" |
| Release Workspace | "Healthy · Mastering · 68% ready · 1 blocker" |
| Artist Workspace | "Kinn Timo · 85% complete · 3 active releases" |
| Work | "4 tasks · 1 overdue · Next: EQ drum stems" |

---

## Anti-Patterns

What ReleaseFlow is NOT:

| Not this | Because |
|----------|---------|
| A project management tool | Releases are not projects. Workflows are not Gantt charts. |
| A CRM | Artists are creators, not contacts. Relationships matter, not pipelines. |
| An ERP | Budgets exist but are not the primary lens. |
| A ticketing system | Tasks exist but are always contextual to a release. |
| A file manager | Assets exist but are always contextual to a release or artist. |

ReleaseFlow is a **music release operations platform**. Every screen, every term, every interaction should reinforce that identity.
