# TASK-2602 — Cost Tracking UX

## Concept

Every expense incurred during a release's production is tracked as a cost
item. Costs flow through an approval pipeline: Submitted → Approved OR
Rejected. Once approved, the cost counts against the budget. Once paid,
it's marked as Paid (informational — no payment processing).

Examples: Mixing Invoice, Artwork Cost, Advertising Spend.

---

## Product Owner Constraint

Cost tracking covers money spent to EXECUTE a release. It does NOT track:

- Royalties earned after release
- Publishing income
- Streaming/sales revenue
- Accounting / profit & loss
- Payment processing (remitting money to vendors)
- Invoicing (generating invoices for services sold)

Tracking what was spent and whether it was approved is in scope. Moving
money is not.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Costs · Midnight Sessions                                                │
│                                                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                            │
│  │◉ All (6)   │ │○ Pending(1)│ │○ Approved(4│ │○ Rejected(1)│            │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘            │
│                                                                           │
│  ─── All Costs ────────────────────────────────────────────────────────  │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  ◐ Cover art design                                     $500.00     │ │
│  │     Artwork & Design · Submitted Aug 15 by Alex                    │ │
│  │     Vendor: Taylor Design · Ref: INV-TD-042                        │ │
│  │     ┌──────────┐ ┌──────────┐ ┌──────────┐                        │ │
│  │     │  Approve  │ │  Reject  │ │  View    │                        │ │
│  │     └──────────┘ └──────────┘ └──────────┘                        │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  ✓ Stereo mix revision                                  $450.00     │ │
│  │     Mixing · Approved Aug 13 by Sam A&R                            │ │
│  │     Approved by Sam Wilson · Aug 13                                │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  View    │                                                    │ │
│  │     └──────────┘                                                    │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  ✓ Vocal recording session                             $800.00     │ │
│  │     Studio & Recording · Approved Aug 09 by Sam A&R                │ │
│  │     Vendor: SoundLab Studios · Ref: INV-SL-118                     │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  View    │                                                    │ │
│  │     └──────────┘                                                    │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  ✓ Initial master                                       $800.00     │ │
│  │     Mastering · Approved Aug 06 by Sam A&R                         │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  View    │                                                    │ │
│  │     └──────────┘                                                    │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  ✓ Drum tracking session                                $650.00     │ │
│  │     Studio & Recording · Approved Jul 29 by Alex                   │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  View    │                                                    │ │
│  │     └──────────┘                                                    │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │  ✕ Reference monitors rental                            $200.00     │ │
│  │     Studio & Recording · Rejected Aug 02 by Sam A&R                │ │
│  │     Reason: "Not in scope. Use in-house monitors."                 │ │
│  │     ┌──────────┐                                                    │ │
│  │     │  View    │                                                    │ │
│  │     └──────────┘                                                    │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  + Add Cost                                                       │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Cost Item Detail Panel

```
┌──────────────────────────────────────────────────────────────────┐
│  Cost Detail                                                [×]   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Cover art design                           ◐ Submitted    │  │
│  │  Artwork & Design · $500.00                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ─── Details ─────────────────────────────────────────────────   │
│                                                                   │
│  Description:    Cover art design for "Midnight Sessions"        │
│  Category:       Artwork & Design                                │
│  Vendor:         Taylor Design                                   │
│  Reference:      INV-TD-042                                      │
│  Submitted by:   Alex Taylor · Aug 15, 2026                      │
│                                                                   │
│  ─── Approval ──────────────────────────────────────────────────  │
│                                                                   │
│  Status: ◐ Submitted                                             │
│  Submitted: Aug 15 · Awaiting Sam Wilson (A&R)                   │
│  SLA: 2 business days · 0 days elapsed                           │
│  ████████████████████████████████░░  0% SLA                      │
│                                                                   │
│  ─── Notes ────────────────────────────────────────────────────  │
│                                                                   │
│  Alex Taylor: "Quoted $500 for front + back cover.                │
│  Includes 3 revision rounds."                                     │
│                                                                   │
│  ─── Actions ──────────────────────────────────────────────────  │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                          │
│  │  Approve  │ │  Reject  │ │  Edit    │                          │
│  └──────────┘ └──────────┘ └──────────┘                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Approval Flow

```
  Submitted ──→ Approved ──→ [Paid]
      │             │
      └──→ Rejected
```

| Transition | Who | Effect |
|------------|-----|--------|
| Create → Submitted | PM, Admin | Cost appears in Cost list |
| Submitted → Approved | A&R, Admin, Owner | Amount deducted from budget category |
| Submitted → Rejected | A&R, Admin, Owner | Cost does not count against budget. Reason required. |
| Approved → Paid | PM, Admin | Informational — marks cost as processed (no money moves) |
| Rejected → Submitted | PM | Re-submit after revision |
| Any → Deleted | Admin, Owner | Removes cost record (only if not Paid) |

---

## Rejection Dialog

```
┌──────────────────────────────────────────────────┐
│  Reject Cost: Cover art design                    │
│                                                    │
│  This cost will not count against the budget.      │
│                                                    │
│  Reason for rejection *                             │
│  ┌──────────────────────────────────────────────┐  │
│  │ Quote exceeds allocated amount.              │  │
│  │ Budget for Artwork is $500. Invoice is       │  │
│  │ $500 — approve this version but note the     │  │
│  │ allocation is fully consumed.                │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────┐ ┌──────────┐                │
│  │  Reject Cost     │ │  Cancel  │                │
│  └──────────────────┘ └──────────┘                │
└──────────────────────────────────────────────────┘
```

---

## Cost Status Flow by Type

### Mixing Invoice

```
Aug 05: Submitted  "Stereo mix — $1,125 for 2 tracks"
Aug 06: Approved   "Approved by Sam A&R. Within budget."
Aug 15: Paid       "Marked as paid by Alex. Cashflow noted."
```

### Artwork Cost

```
Aug 10: Submitted  "Cover art design — $500"
Aug 13: Rejected   "Oversized quote. Budget for artwork is $300."
Aug 14: Submitted  "Revised quote — $300. 1 revision round."
Aug 14: Approved   "Approved by Sam A&R."
```

### Advertising Spend

```
Sep 01: Submitted  "Meta Ads campaign — $4,000"
Sep 02: Rejected   "Exceeds advertising budget ($1,000) by $3,000.
                    Adjust allocation first."
Sep 02: (Budget adjusted: Advertising $1,000 → $5,000,
                    pulled from contingency)
Sep 03: Submitted  "Meta Ads campaign — $4,000 (re-submitted)"
Sep 03: Approved   "Approved by Admin."
```

---

## Data Model

```typescript
interface CostTracking {
  id: string;
  releaseId: string;
  items: CostItem[];
  filters: {
    status: 'all' | 'submitted' | 'approved' | 'rejected' | 'paid';
    category?: string;
  };
}

interface CostItem {
  id: string;
  description: string;
  categoryId: string;
  categoryName: string;         // Denormalized
  vendorId?: string;
  vendorName?: string;
  amount: number;
  currency: string;             // Default: "USD"
  date: Timestamp;
  status: CostStatus;
  reference?: string;           // Invoice number
  submittedBy: { id: string; name: string };
  approvedBy?: { id: string; name: string };
  approvedAt?: Timestamp;
  rejectedBy?: { id: string; name: string };
  rejectedAt?: Timestamp;
  rejectedReason?: string;
  paidAt?: Timestamp;
  notes?: string;
  createdAt: Timestamp;
}

type CostStatus = 'submitted' | 'approved' | 'rejected' | 'paid';
```
