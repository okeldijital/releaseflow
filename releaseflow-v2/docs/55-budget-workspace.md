# TASK-2601 — Budget Workspace

## Concept

Every release costs money before it earns a cent. The Budget Workspace
tracks the operational cost of making a release: studio time, mixing,
mastering, artwork, advertising, and vendor fees. Five sections:
Overview, Budget, Costs, Forecast, Vendors.

This is about execution costs — money spent to GET the release out. Not
royalties. Not revenue. Not post-release accounting.

---

## Product Owner Constraint

The moment a feature tracks money after release, it is outside
ReleaseFlow. This workspace covers:

| In Scope | Out of Scope |
|----------|-------------|
| Budget allocated per release | Royalties |
| Costs incurred (mixing, artwork, ads) | Publishing revenue |
| Approval and status flows for expenses | Streaming/sales revenue |
| Vendor management | Accounting / ledger |
| Cost forecasting | Payments / invoicing |
| | Post-release income |

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back    Budget · Midnight Sessions                                     │
│                                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │●Overview │ │○Budget   │ │○Costs    │ │○Forecast │ │○Vendors  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                                           │
│  ─── Overview ────────────────────────────────────────────────────────   │
│                                                                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                 │
│  │  💰 Budget    │  │  📉 Spent    │  │  📊 Remaining │                 │
│  │  $8,500       │  │  $3,200      │  │  $5,300       │                 │
│  │  Allocated    │  │  37.6% used  │  │  62.4% left   │                 │
│  └───────────────┘  └───────────────┘  └───────────────┘                 │
│                                                                           │
│  ─── Cost Breakdown ──────────────────────────────────────────────────   │
│                                                                           │
│  Studio & Recording      $2,000   ████████████░░░░░░░░░░░░  62.5%        │
│  Mixing                  $1,500   ████████████████████░░░░  75.0%        │
│  Mastering               $800     ████████████░░░░░░░░░░░░  50.0%        │
│  Artwork & Design        $500     ████████████████████████  100%  ✓      │
│  Advertising             $4,000   ░░░░░░░░░░░░░░░░░░░░░░░░  0%           │
│  Contingency             $700     ░░░░░░░░░░░░░░░░░░░░░░░░  0%           │
│  ─────────────────────────────────────────                              │
│  Total                   $9,500                                         │
│                                                                           │
│  ─── Recent Costs ────────────────────────────────────────────────────   │
│                                                                           │
│  Aug 15   Artwork — Cover art design              $500      ✕ Rejected  │
│  Aug 12   Mixing — Stereo mix revision             $450      ✓ Approved  │
│  Aug 08   Studio — Vocal recording session         $800      ✓ Approved  │
│  Aug 05   Mastering — Initial master               $800      ✓ Approved  │
│  Jul 28   Studio — Drum tracking session           $650      ✓ Approved  │
│                                                                           │
│  ─── Status ──────────────────────────────────────────────────────────   │
│                                                                           │
│  🟡 Over budget by $1,000. Budget: $8,500. Planned: $9,500.              │
│  Advertising category exceeds allocation by $3,000.                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Section 2: Budget

```
┌─ Budget ──────────────────────────────────────────────────────────────┐
│                                                                         │
│  Total allocated: $8,500                                                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Category              │ Allocated │ Spent   │ Remaining│ Status │  │
│  │────────────────────────┼───────────┼─────────┼──────────┼────────│  │
│  │  Studio & Recording    │ $2,000    │ $1,250  │ $750     │ 🟢     │  │
│  │  Mixing                │ $1,500    │ $1,125  │ $375     │ 🟢     │  │
│  │  Mastering             │ $800      │ $400    │ $400     │ 🟢     │  │
│  │  Artwork & Design      │ $500      │ $500    │ $0       │ 🟢     │  │
│  │  Advertising            │ $1,000    │ $0      │ $1,000   │ 🟢     │  │
│  │  Contingency (10%)     │ $850      │ $0      │ $850     │ 🟢     │  │
│  │  ──────────────────────┼───────────┼─────────┼──────────┼────────│  │
│  │  Total                  │ $6,650    │ $3,275  │ $3,375   │ 🟡     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  🟡 Advertising: planned costs ($4,000) exceed budget ($1,000)        │
│     by $3,000. Adjust allocation or reduce planned spend.              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  + Add Category    ⚙ Edit Allocations                        │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Section 3: Costs

```
┌─ Costs ───────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Date      │ Description              │ Category│ Amount│ Status │  │
│  │────────────┼──────────────────────────┼─────────┼───────┼────────│  │
│  │  Aug 15    │ Cover art design         │ Artwork │ $500  │ ◐ Subm │  │
│  │  Aug 12    │ Stereo mix revision      │ Mixing  │ $450  │ ✓ Appr │  │
│  │  Aug 08    │ Vocal recording session  │ Studio  │ $800  │ ✓ Appr │  │
│  │  Aug 05    │ Initial master           │Mastering│ $800  │ ✓ Appr │  │
│  │  Jul 28    │ Drum tracking session    │ Studio  │ $650  │ ✓ Appr │  │
│  │  Jul 20    │ Reference monitors rent  │ Studio  │ $200  │ ✓ Appr │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  + Add Cost                                                  │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cost Item States

| Status | Icon | Meaning |
|--------|------|---------|
| Submitted | ◐ | Cost reported, awaiting approval |
| Approved | ✓ | Cost approved, counted against budget |
| Rejected | ✕ | Cost rejected with reason |
| Paid | ✅ | Cost marked as paid (informational only — no payment processing) |

### Add Cost Modal

```
┌──────────────────────────────────────────────────┐
│  + Add Cost                                   [×] │
│                                                    │
│  Description *                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Studio session — vocal tracking              │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  Category *                  Amount *               │
│  ┌─────────────────────┐    ┌──────────┐           │
│  │ Studio & Recording ▼│    │ $800.00  │           │
│  └─────────────────────┘    └──────────┘           │
│                                                    │
│  Vendor                    Date                     │
│  ┌─────────────────────┐  ┌──────────┐             │
│  │ SoundLab Studios ▼  │  │ Aug 15   │             │
│  └─────────────────────┘  └──────────┘             │
│                                                    │
│  Reference / Notes                                  │
│  ┌──────────────────────────────────────────────┐  │
│  │ Invoice #INV-2026-0815                       │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Submit for Approval                         │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

---

## Section 4: Forecast

```
┌─ Forecast ───────────────────────────────────────────────────────────┐
│                                                                        │
│  Projected total: $9,500  |  Budget: $8,500  |  Variance: +$1,000    │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  Category              │ Budget  │ Actual │ Planned│ Variance   │ │
│  │────────────────────────┼─────────┼────────┼────────┼────────────│ │
│  │  Studio & Recording    │ $2,000  │ $1,250 │ $750   │ $0         │ │
│  │  Mixing                │ $1,500  │ $1,125 │ $375   │ $0         │ │
│  │  Mastering             │ $800    │ $400   │ $400   │ $0         │ │
│  │  Artwork & Design      │ $500    │ $500   │ $0     │ $0         │ │
│  │  Advertising            │ $1,000  │ $0     │ $4,000 │ +$3,000 🔴 │ │
│  │  Contingency            │ $850    │ $0     │ $875   │ $0         │ │
│  │  ──────────────────────┼─────────┼────────┼────────┼────────────│ │
│  │  Total                  │ $6,650  │ $3,275 │ $6,400 │ +$3,000 🔴│ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  🔴 Advertising is $3,000 over allocation. Reduce planned spend or     │
│     increase category budget by pulling from contingency ($850).       │
│                                                                        │
│  Remaining contingency: $850 · Covers 28% of advertising overage      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Section 5: Vendors

```
┌─ Vendors ────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Vendor               │ Category │ Cost   │ Status │ Contact    │  │
│  │───────────────────────┼──────────┼────────┼────────┼────────────│  │
│  │  SoundLab Studios     │ Studio   │ $2,000 │ ✓ Conf │ 555-0100  │  │
│  │  3 sessions booked    │          │        │        │            │  │
│  │  ────────────────────┼──────────┼────────┼────────┼────────────│  │
│  │  Sam Wilson (Mix Eng)│ Mixing   │ $1,125 │ ✓ Conf │ sam@...   │  │
│  │  Per-track rate       │          │        │        │            │  │
│  │  ────────────────────┼──────────┼────────┼────────┼────────────│  │
│  │  Taylor Design       │ Artwork  │ $500   │ ✓ Conf │ taylor@.. │  │
│  │  Cover art            │          │        │        │            │  │
│  │  ────────────────────┼──────────┼────────┼────────┼────────────│  │
│  │  Meta Ads            │ Ads      │ $4,000 │ ◐ Pend │ —         │  │
│  │  Campaign budget      │          │        │        │            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  + Add Vendor                                                │      │
│  └──────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

```typescript
interface BudgetWorkspace {
  releaseId: string;
  totalBudget: number;           // Total allocated by label
  categories: BudgetCategory[];
  costs: CostItem[];
  forecast: BudgetForecast;
  vendors: Vendor[];
}

interface BudgetCategory {
  id: string;
  name: string;                  // "Studio & Recording", "Mixing", etc.
  allocated: number;             // Budget amount
  spent: number;                 // Sum of approved costs
  remaining: number;             // allocated - spent
  status: 'on_track' | 'over_budget' | 'exhausted';
}

interface CostItem {
  id: string;
  description: string;
  categoryId: string;
  vendorId?: string;
  amount: number;
  date: Timestamp;
  status: 'submitted' | 'approved' | 'rejected' | 'paid';
  reference?: string;            // Invoice number or tracking ref
  submittedBy: { id: string; name: string };
  approvedBy?: { id: string; name: string };
  rejectedReason?: string;
}

interface BudgetForecast {
  projectedTotal: number;        // Sum of actual + planned costs
  variance: number;              // projectedTotal - totalBudget
  perCategory: CategoryForecast[];
}

interface CategoryForecast {
  categoryId: string;
  budget: number;
  actual: number;                // Already spent
  planned: number;               // Remaining planned spend
  variance: number;              // (actual + planned) - budget
}

interface Vendor {
  id: string;
  name: string;
  categoryId: string;
  cost: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  contact?: string;
  notes?: string;
}
```
