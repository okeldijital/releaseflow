# ADR-007 — Product Boundaries

| Field | Value |
|---|---|
| **Status** | Accepted |
| **Date** | 2026-06-24 |
| **Deciders** | ReleaseFlow engineering |
| **Supersedes** | None |

## Context

ReleaseFlow is a music release management platform. There exist adjacent domains in the music industry — royalties, publishing administration, accounting, and streaming analytics — that are closely related to the release lifecycle but are distinct product verticals with their own regulatory, contractual, and operational complexity.

During Sprint 003 architecture planning, stakeholder discussions surfaced the question of where to draw the line between what ReleaseFlow owns and what it integrates with.

## Decision

The following domains are **explicitly out of scope** for ReleaseFlow v1 and beyond:

### Royalty & Publishing

| Domain | Description |
|---|---|
| **Royalty Calculations** | Computation of mechanical, performance, or synchronization royalties owed to rights holders based on usage data, statutory rates, or contractual splits |
| **Publishing Administration** | Registration, management, and enforcement of songwriting copyrights; collection of publishing income from PROs, sub-publishers, and direct licensing |
| **PRO Registration** | Submission of works to Performing Rights Organizations (ASCAP, BMI, SESAC, SOCAN, PRS, etc.) |
| **Mechanical Royalties** | Calculation and payment of mechanical royalties (reproduction rights) per statutory or negotiated rates |
| **Neighbouring Rights** | Collection and distribution of royalties for master recording owners and performers (SoundExchange, PPL, Re:Sound, etc.) |

### Financial

| Domain | Description |
|---|---|
| **Accounting** | General ledger, double-entry bookkeeping, financial statements |
| **Bookkeeping** | Transaction categorization, reconciliation, expense tracking |
| **Payments** | Disbursement of funds to rights holders, artists, or collaborators; payment processor integration |
| **Invoicing** | Generation, delivery, and tracking of invoices to labels, artists, or clients |
| **Tax** | Tax calculation, withholding, reporting (1099, VAT, etc.), or compliance |

### Analytics

| Domain | Description |
|---|---|
| **Streaming Revenue Analytics** | Revenue-per-stream analysis, DSP payout aggregation, trend analysis across platforms |
| **Distribution Revenue Reports** | Aggregation and reconciliation of revenue data from digital distributors (DistroKid, TuneCore, CD Baby, etc.) |

## Consequences

### What ReleaseFlow Does

- Manages release metadata, tracks, contributors (including IPI, role, and split percentages for informational purposes), workflows, assets, and distribution readiness
- Contributor split percentages are stored as metadata (e.g., 50% to Writer A) — **no financial calculation is performed on these values**
- IPI numbers and PRO affiliations for contributors are stored as reference data only

### What ReleaseFlow Does Not Do

- Does not compute royalties from split percentages and usage data
- Does not submit works to PROs
- Does not send or receive payments
- Does not generate invoices
- Does not reconcile streaming revenue

### Integration Boundaries

ReleaseFlow may integrate with external platforms via API in these categories (future consideration, out of scope for v1):

| Category | Example Integration Targets |
|---|---|
| Royalty Accounting | Royalty Exchange, Curve, Mogul, Music Maestro |
| Publishing Admin | Songtrust, TuneCore Publishing, Kobalt |
| PRO Registration | ASCAP, BMI, SESAC APIs |
| Payments | Stripe, PayPal, Wise |
| Accounting | QuickBooks, Xero |
| Distribution | DistroKid, TuneCore, CD Baby, LANDR |

### Rationale

1. **Regulatory complexity** — Royalties and publishing involve jurisdiction-specific laws, statutory rates, and compliance requirements that would require dedicated legal and accounting expertise
2. **Domain depth** — Each out-of-scope domain is a standalone product category with established incumbents; building them in-house would dilute focus from the core release management value proposition
3. **Build vs. integrate** — ReleaseFlow's strategy is to be the best release management layer and integrate with best-of-breed tools in adjacent domains rather than compete with them
4. **Clear API boundaries** — Explicitly defining what is out of scope enables clean integration contracts with third-party platforms and prevents scope creep
