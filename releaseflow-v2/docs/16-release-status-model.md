# Release Status Model

## Statuses

The release status model governs the `Release.state` field. A release is
in exactly one status at any time.

```
  ┌───────────┐
  │   DRAFT    │
  └─────┬─────┘
        │ begin planning
        ▼
  ┌────────────┐
  │  PLANNING   │
  └─────┬──────┘
        │ start production
        ▼
  ┌──────────────┐
  │  PRODUCTION   │
  └──────┬───────┘
      ┌──┴──┐
      │     │
      ▼     ▼
  ┌────────┐ ┌──────────┐
  │ON HOLD │ │  READY    │
  └────┬───┘ └─────┬────┘
      │            │ release
      │            ▼
      │       ┌───────────┐
      │       │  RELEASED  │
      │       └─────┬─────┘
      │             │ archive
      │             ▼
      │       ┌───────────┐
      └──────►│  ARCHIVED  │
              └───────────┘

  Any status except RELEASED and ARCHIVED may transition to CANCELLED.

  ┌────────────┐
  │ CANCELLED   │
  └────────────┘
```

---

## Status Definitions

| Status      | Description                                          |
|-------------|------------------------------------------------------|
| DRAFT       | Release created. Metadata editable. No work started. |
| PLANNING    | Scope, budget, and schedule being defined.           |
| PRODUCTION  | Active creative work: recording, mixing, mastering.  |
| ON HOLD     | Paused. Blocked by dependency or external decision.  |
| READY       | All deliverables complete. Awaiting street date.     |
| RELEASED    | Publicly available. Monitoring and reporting phase.  |
| ARCHIVED    | Terminal state. No further modifications.            |
| CANCELLED   | Terminal state. Release abandoned before release.    |

---

## Entry Criteria

| Status      | Entry Criteria                                      |
|-------------|-----------------------------------------------------|
| DRAFT       | Release creation form submitted with title + type   |
| PLANNING    | Release has minimum 1 track + 1 contributor         |
| PRODUCTION  | Planning phase complete (track list + schedule set) |
| ON HOLD     | Manual action by PM/Admin/A&R                       |
| READY       | All 7 workflow stages complete                      |
| RELEASED    | Street date reached + distribution confirmed live   |
| ARCHIVED    | 30+ days since release + no pending tasks           |
| CANCELLED   | Manual action by PM/Admin/Owner                     |

---

## Exit Criteria

| From        | To          | Exit Criteria                                    |
|-------------|-------------|--------------------------------------------------|
| DRAFT       | PLANNING    | User clicks "Begin Planning"                     |
| DRAFT       | CANCELLED   | User clicks "Discard"                            |
| PLANNING    | PRODUCTION  | Track list finalized + at least 1 contributor    |
| PLANNING    | DRAFT       | User reverts to draft (edit scope)               |
| PRODUCTION  | ON HOLD     | Manual hold (reason required)                    |
| PRODUCTION  | READY       | All stages complete                              |
| PRODUCTION  | PLANNING    | Scope change needed (revert)                     |
| ON HOLD     | PRODUCTION  | Hold resolved, work resumes                      |
| ON HOLD     | CANCELLED   | Hold escalated to cancellation                   |
| READY       | PRODUCTION  | Deliverable issue found (reopen)                 |
| READY       | RELEASED    | Publish action triggered                         |
| READY       | CANCELLED   | Release pulled before going live                 |
| RELEASED    | ARCHIVED    | Auto-archive after 30+ days (or manual)          |
| RELEASED    | READY       | Unpublish (rare, audit-logged)                   |
| ARCHIVED    | (none)      | No transitions from terminal state               |
| CANCELLED   | (none)      | No transitions from terminal state               |

---

## Allowed Transitions Matrix

```
From → To        │ DRA │ PLA │ PRO │ HLD │ RDY │ REL │ ARC │ CAN
─────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────
DRAFT            │  –  │  ✓  │  –  │  –  │  –  │  –  │  –  │  ✓
PLANNING         │  ✓  │  –  │  ✓  │  –  │  –  │  –  │  –  │  ✓
PRODUCTION       │  –  │  ✓  │  –  │  ✓  │  ✓  │  –  │  –  │  ✓
ON HOLD          │  –  │  –  │  ✓  │  –  │  –  │  –  │  –  │  ✓
READY            │  –  │  –  │  ✓  │  –  │  –  │  ✓  │  –  │  ✓
RELEASED         │  –  │  –  │  –  │  –  │  ✓  │  –  │  ✓  │  –
ARCHIVED         │  –  │  –  │  –  │  –  │  –  │  –  │  –  │  –
CANCELLED        │  –  │  –  │  –  │  –  │  –  │  –  │  –  │  –
```

---

## Status Badge Display

```
  ┌─────────────────┐
  │  PRODUCTION      │
  └─────────────────┘

  Styles:
    DRAFT:      Border gray, text muted
    PLANNING:   Blue
    PRODUCTION: Purple
    ON HOLD:    Amber
    READY:      Green
    RELEASED:   Green (filled)
    ARCHIVED:   Stone
    CANCELLED:  Red (strikethrough)
```

---

## Enforcement Rules

1. Status transitions are validated server-side. Client-side buttons
   are hidden for disallowed transitions.
2. CANCELLED and ARCHIVED are terminal — no edits, no stage changes,
   no new tasks.
3. RELEASED allows only status transitions and analytics reads.
   Metadata is locked.
4. ON HOLD requires a reason string (min 10 chars). Stored in the
   activity log.
5. RELEASED → READY transition requires Owner or Admin role.
6. Auto-archive runs as a scheduled function daily (checks releases
   with RELEASED status + 30 days + 0 pending tasks).

---

## UI States Per Status

| Status      | Editable | Stage Progress | Tasks     | Distribution |
|-------------|----------|----------------|-----------|--------------|
| DRAFT       | Full     | Locked         | Locked    | Hidden       |
| PLANNING    | Full     | Locked         | Create    | Hidden       |
| PRODUCTION  | Limited  | Active         | Full      | Hidden       |
| ON HOLD     | Read     | Frozen         | Frozen    | Hidden       |
| READY       | Read     | Complete       | Read-only | Visible      |
| RELEASED    | Locked   | Complete       | Read-only | Active       |
| ARCHIVED    | Locked   | Frozen         | Locked    | Locked       |
| CANCELLED   | Locked   | Frozen         | Locked    | Locked       |
