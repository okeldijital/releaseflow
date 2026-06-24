# TASK-1801 — Approval UX

## Concept

Approvals are the mechanism that gates progress. Work is submitted, a
reviewer evaluates it, and work either advances, returns for revision, or
is rejected. This document defines the full approval workflow — the
submitter experience, the reviewer experience, delegation, SLA tracking,
and multi-approver scenarios.

The review panel and decision dialogs are detailed in TASK-1402 (Review
Experience). This document focuses on the approval system around it.

---

## Approval Flow

```
Submitter                    System                       Approver
  │                            │                             │
  │  1. Submits work           │                             │
  │  (stage / deliverable)     │                             │
  ├───────────────────────────►│                             │
  │                            │                             │
  │                            │  2. Creates approval        │
  │                            │     request                 │
  │                            │                             │
  │                            │  3. Notifies approver       │
  │                            ├────────────────────────────►│
  │                            │                             │
  │                            │                             │  4. Reviews work
  │                            │                             │     (TASK-1402 panel)
  │                            │                             │
  │                            │  5a. Approve                │
  │                            │◄─────────────────────────────┤
  │                            │                             │
  │  6a. Notified: approved    │                             │
  │◄───────────────────────────┤                             │
  │                            │                             │
  │                            │  5b. Request Changes        │
  │                            │◄─────────────────────────────┤
  │                            │                             │
  │  6b. Notified: revise      │                             │
  │◄───────────────────────────┤                             │
  │                            │                             │
  │  7b. Revises + resubmits   │                             │
  ├───────────────────────────►│  → back to step 2          │
  │                            │                             │
  │                            │  5c. Reject                 │
  │                            │◄─────────────────────────────┤
  │                            │                             │
  │  6c. Notified: rejected    │                             │
  │◄───────────────────────────┤                             │
```

---

## Submitter Experience

### Before Submission

The submitter sees their work (stage, deliverable, or task) with a
"Submit for Approval" button:

```
┌──────────────────────────────────────────────────────────┐
│  Mastering Stage · In Progress                           │
│                                                           │
│  All 4 tracks mastered. Master files uploaded.           │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Submit for Approval                             │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
│  ⚠ After submission, you cannot edit until the review    │
│     is complete or changes are requested.                 │
└──────────────────────────────────────────────────────────┘
```

### Submission Confirmation

```
┌──────────────────────────────────────────────────┐
│  Submit Mastering Stage for Approval?              │
│                                                    │
│  Approver: Sam Wilson (A&R)                        │
│  Submit for: This stage + all deliverables         │
│                                                    │
│  Add a note for the reviewer:                      │
│  ┌────────────────────────────────────────────┐   │
│  │ All tracks mastered at -14 LUFS. True peak │   │
│  │ at -1dB across all four tracks.            │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  ┌──────────────────┐  ┌──────────┐               │
│  │  Submit          │  │  Cancel  │               │
│  └──────────────────┘  └──────────┘               │
└──────────────────────────────────────────────────┘
```

### After Submission: Pending State

```
┌──────────────────────────────────────────────────────────┐
│  Mastering Stage · ◐ Submitted for Approval              │
│                                                           │
│  Submitted Aug 15, 2026 · 3 hours ago                    │
│  Waiting on: Sam Wilson (A&R)                            │
│                                                           │
│  ⏳ Approval pending. You'll be notified when a decision  │
│     is made. You cannot edit while the review is pending. │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Cancel Submission (withdraw)                    │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

The submitter can withdraw the submission if they realize they need to
make changes before the reviewer acts. Withdrawal reverts to the previous
state (IN_PROGRESS for stages, Uploaded for deliverables).

---

## Approval Queue

The approver's dashboard shows items awaiting their review:

```
┌────────────────────────────────────────────────────────────┐
│  Awaiting Your Approval                                     │
│                                                             │
│  ─── Overdue (2) ──────────────────────────────────────    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🔴 Mastering Stage                                     │ │
│  │     Midnight Sessions · Submitted 3d ago by Sam       │ │
│  │     You were due to review by Aug 13 · 3d overdue    │ │
│  │     ┌────────────────┐                                 │ │
│  │     │  Review Now    │                                 │ │
│  │     └────────────────┘                                 │ │
│  ├───────────────────────────────────────────────────────┤ │
│  │  🔴 Cover Art v3                                        │ │
│  │     Summer EP · Submitted 5d ago by Taylor            │ │
│  │     You were due to review by Aug 11 · 5d overdue    │ │
│  │     ┌────────────────┐                                 │ │
│  │     │  Review Now    │                                 │ │
│  │     └────────────────┘                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ─── Due Soon (1) ─────────────────────────────────────    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🟡 Stereo Mix — Track 2                                │ │
│  │     Summer EP · Submitted 1h ago by Sam               │ │
│  │     Review by Aug 17 · 1 day remaining                │ │
│  │     ┌────────────────┐                                 │ │
│  │     │  Review Now    │                                 │ │
│  │     └────────────────┘                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ─── On Track (3) ─────────────────────────────────────    │
│  ...                                                        │
└────────────────────────────────────────────────────────────┘
```

---

## SLA (Approval Deadlines)

Each approval request has a deadline. The SLA depends on the context:

| Context | SLA | Rationale |
|---------|-----|-----------|
| Stage review | 3 business days | Stage has the most scope |
| Deliverable review | 2 business days | Single deliverable |
| Task review | 1 business day | Smallest unit of work |
| Rush (release date < 7 days) | 1 business day | All contexts |

When an approval is overdue:
- The item moves to the "Overdue" section in the approver's queue.
- The approver gets a reminder notification (push + email).
- After 2× SLA, the request is escalated to the approver's manager
  (Admin or PM).
- After 3× SLA without response, auto-approval is NOT applied. The item
  remains overdue and the PM/Admin is notified.

---

## Delegation

### Setting a Delegate

Approvers can delegate their approval duties when unavailable:

```
┌──────────────────────────────────────────────────┐
│  Delegate Approvals                                │
│                                                    │
│  Delegate to:                                      │
│  ┌────────────────────────────────────────────┐   │
│  │ 👤 Alex Taylor · Project Manager           │   │
│  └────────────────────────────────────────────┘   │
│                                                    │
│  For period:                                       │
│  ○ Until I return    ◉ Specific dates              │
│  Start: Aug 15    End: Aug 22                      │
│                                                    │
│  Scope:                                            │
│  ◉ All my approvals                               │
│  ○ Specific releases: [Select...]                  │
│                                                    │
│  ┌────────────────────────────────────────────┐   │
│  │  Set Delegate                              │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

When delegation is active:
- The delegate receives all approval requests in their queue.
- Each item shows "Delegated from [original approver]" in the header.
- The original approver's name still appears on the audit trail as the
  "assigned approver" but the delegate's decision is recorded as "acting
  on behalf of."
- Delegation ends automatically when the period expires.

---

## Multi-Approver Scenarios

### Sequential (V1)

```
  Submitter → Approver 1 → Approver 2 → Approved
```

Work must be approved by Approver 1 before Approver 2 sees it.
Use case: Mix Engineer → Artist → A&R (Artist approves creative,
A&R approves quality).

### Parallel (V2+)

```
                    ┌→ Approver 1 ─┐
  Submitter ────────┤              ├──→ Approved (all must approve)
                    └→ Approver 2 ─┘
```

All approvers receive the request simultaneously. Work is approved when
ALL approve. If any one requests changes, the submitter revises and all
approvers re-review.

### Any-One (V2+)

```
                    ┌→ Approver 1 ─┐
  Submitter ────────┤              ├──→ Approved (any one)
                    └→ Approver 2 ─┘
```

Either approver can approve. If the first to act approves, the request
is resolved and the second approver is notified.

---

## Approval History

Every approval action is recorded:

```
┌────────────────────────────────────────────────────────┐
│  Approval Timeline — Mastering Stage                   │
│                                                        │
│  📤 Aug 15 · Submitted by Sam Wilson                   │
│    "All tracks mastered at -14 LUFS."                  │
│                                                        │
│  ⏳ Aug 15 · Waiting on Sam Wilson (A&R) · Target: Aug 18│
│                                                        │
│  🔄 Aug 17 · Requested Changes by Sam Wilson            │
│    "Track 2: raise vocal by ~2dB. Hi-hat too bright."  │
│                                                        │
│  📤 Aug 17 · Resubmitted by Sam Wilson                 │
│    "Vocals raised +2dB, hi-hat tamed."                 │
│                                                        │
│  ✅ Aug 18 · Approved by Sam Wilson                    │
│    "Levels are perfect. Cleared for release."          │
│                                                        │
│  Total cycle: 3 days · 1 revision · 2 submissions     │
└────────────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface ApprovalRequest {
  id: string;
  resourceType: 'stage' | 'deliverable' | 'task';
  resourceId: string;
  releaseId: string;
  releaseName: string;
  submitterId: string;
  submitterNote?: string;
  submittedAt: Timestamp;
  status: ApprovalStatus;
  approvers: ApprovalSlot[];
  slaDeadline: Timestamp;       // submittedAt + SLA days
  escalatedAt?: Timestamp;       // When escalation was triggered
  delegateId?: string;           // If delegated
}

interface ApprovalSlot {
  approverId: string;
  approverName: string;
  role: 'primary' | 'secondary'; // For sequential chains
  order: number;                  // Approval order
  decision?: 'approve' | 'request_changes' | 'reject';
  feedback?: string;
  decidedAt?: Timestamp;
}

type ApprovalStatus = 'pending' | 'in_review' | 'approved' | 'changes_requested' | 'rejected' | 'withdrawn' | 'escalated';
```
