# Vendorse Research Notes — Market, Standards, Indonesia Context

**Date:** 2026-10-08  
**Purpose:** evidence behind the product/technical vision.  
**Important:** vendor product pages are used to understand market capability patterns, not as neutral proof that one product is superior.

---

## 1. What the current procurement market says Vendorse is competing with

### Ivalua: connected Source-to-Contract / Source-to-Pay

Current Ivalua positioning connects:

- intake;
- supplier management;
- sourcing;
- contract management;
- spend analysis;
- P2P/AP/payments in the broader suite.

The relevant lesson is not "copy every module". It is that modern procurement data is expected to flow across the supplier, sourcing, contract, and purchasing lifecycle instead of stopping at award.

Sources:

- https://www.ivalua.com/solutions/process/source-to-contract/
- https://www.ivalua.com/solutions/process/source-to-pay-platform/
- https://www.ivalua.com/solutions/process/strategic-sourcing/sourcing/
- https://www.ivalua.com/blog/source-contract-process/

### SAP Ariba: sourcing + contracts + supplier lifecycle

SAP's current strategic-sourcing documentation treats sourcing, contracts, spend analysis, supplier lifecycle, qualification, preferred/disqualified status, and performance as connected functions.

Important implication for Vendorse:

A reusable supplier master + qualification/performance model is more durable than treating each bid submitter as the supplier record.

Sources:

- https://www.sap.com/products/spend-management/strategic-sourcing-and-contracts.html
- https://www.sap.com/sea/products/spend-management/supplier-lifecycle.html
- https://help.sap.com/docs/ARIBA_SOURCING

### Coupa: supplier portal is a persistent collaboration surface

Coupa's supplier documentation exposes a useful product principle: suppliers do not only "submit a bid". A supplier portal can become a long-lived place to:

- participate in sourcing;
- manage customer interactions;
- view contracts;
- transact downstream where enabled.

Sources:

- https://docs.coupa.com/en/supplier-documentation/coupa-for-suppliers
- https://docs.coupa.com/en/supplier-documentation/coupa-for-suppliers/the-coupa-supplier-portal-or-csp
- https://docs.coupa.com/en/supplier-documentation/coupa-for-suppliers/the-coupa-supplier-portal-or-csp/features-and-processes-in-the-coupa-supplier-portal/sourcing/a-suppliers-guide-to-coupa-sourcing

### Oracle: supplier eligibility is contextual and reassessed

Oracle's current sourcing qualification model is a strong reference for avoiding a single `Organization.verified` boolean. Supplier sourcing eligibility can depend on qualification criteria and can change after onboarding.

Source:

- https://docs.oracle.com/en/cloud/saas/procurement/26b/oaprc/supplier-eligibility-for-sourcing.html

### Zip: procurement is increasingly an orchestration/front-door problem

Zip's modern procurement model emphasizes:

- one requester front door;
- automated routing;
- supplier onboarding;
- contract/risk/legal/finance collaboration;
- integration with the existing ERP/P2P stack;
- visibility before the spend is committed.

This is especially relevant to Vendorse because it suggests a credible expansion path beyond tenders without requiring Vendorse to own AP/payments.

Sources:

- https://zip.com/products/intake-to-procure
- https://zip.com/solutions/procurement
- https://zip.com/blog/procurement-orchestration
- https://zip.com/blog/intake-vs-procurement-orchestration

---

## 2. Procurement data model reference: OCDS

The Open Contracting Data Standard is designed for public contracting disclosure, so Vendorse should not blindly clone it.

It is still a valuable semantic reference because it explicitly separates:

- tender;
- award;
- contract;
- implementation.

It also models:

- tender notices;
- specifications;
- line items;
- enquiries;
- bidder information;
- evaluation;
- values;
- contract amendments;
- payments/progress in implementation.

The critical product lesson:

> Award is not the contract, and contract is not implementation.

Source:

- https://standard.open-contracting.org/latest/en/primer/how/
- https://standard.open-contracting.org/latest/en/
- https://www.open-contracting.org/data-standard/

As of October 2026, the published OCDS documentation is 1.1.5 and the Open Contracting Partnership notes that work on a future 1.2 release is underway.

---

## 3. Downstream interoperability: Peppol / UBL

Vendorse should not own invoice/payment workflow initially.

If a future Source-to-Pay expansion requires electronic business documents, prefer interoperability standards over a proprietary invoice/order schema.

Peppol's 2026 BIS releases show maintained, machine-validated business document specifications with:

- UBL syntax;
- code lists;
- ISO 4217 currencies;
- order and invoice-related processes;
- validation artifacts.

Sources:

- https://docs.peppol.eu/poacc/billing/3.0/
- https://docs.peppol.eu/poacc/billing/3.0/release-notes/
- https://docs.peppol.eu/poacc/upgrade-3/upcoming/release-notes/

This is a future integration consideration, not a requirement for the current sourcing product.

---

## 4. Indonesia public-procurement reality in 2026

### SPSE / INAPROC

INAPROC's July 2026 terms describe SPSE as the provider-selection service for Indonesian government procurement, including e-tender and non-tender methods.

Source:

- https://bantuan.inaproc.id/hc/id-id/articles/16594955307023-Syarat-dan-Ketentuan-SPSE-Versi-5

An August 2026 INAPROC guide shows a current flow where a contracted tender winner in SPSE continues transaction processing into Katalog Elektronik V6 for the relevant use case.

Source:

- https://bantuan.inaproc.id/hc/id-id/articles/12048194238095-Panduan-Transaksi-Pemenang-Tender

### Katalog Elektronik V6

LKPP has continued to develop Katalog Elektronik V6 as a government procurement/e-purchasing platform, including:

- product master-data controls;
- payment/system integrations;
- monitoring;
- e-audit;
- central/sektoral/lokal catalog governance.

Important 2026 references:

- Peraturan LKPP No. 2 Tahun 2026:
  https://jdih.lkpp.go.id/regulation/peraturan-lkpp/peraturan-lkpp-nomor-2-tahun-2026

- Master product / data governance:
  https://www.lkpp.go.id/read/bu/master-data-produk-cegah-produk-tak-resmi-dan-anomali-harga-di-katalog-elektronik-v6

- Integration with SIPD and government purchasing:
  https://www.lkpp.go.id/read/bu/siaran-pers-lkpp-luncurkan-master-produk-dan-integrasi-sipd-ri-dorong-belanja-pemerintah-berkualitas

### Current core public-procurement regulation

Perpres No. 46 Tahun 2025 amended Indonesia's government procurement framework and remains in force.

Source:

- https://jdih.lkpp.go.id/regulation/peraturan-presiden/peraturan-presiden-nomor-46-tahun-2025

### Product conclusion

If Vendorse launches in Indonesia, the most credible first market is **private/internal procurement**, not "replacement SPSE/Katalog".

If government-specific workflow is later required:

- scope the exact procurement method;
- map the current rule set;
- separate jurisdiction policy from core domain logic;
- do not claim legal compliance based only on generic tender features.

---

## 5. Current open-source landscape

There are open-source projects exploring pieces of procurement:

### OpenProcurement / Prozorro ecosystem

OpenProcurement has a large repository ecosystem and long-running public-procurement APIs/tender procedure modules.

Reference:

- https://github.com/orgs/openprocurement/repositories

Lesson:

Complex procurement procedure rules benefit from explicit policy/procedure modules.

### OpenSourcingOS

OpenSourcingOS focuses heavily on sourcing-project value/savings traceability and supplier records.

Reference:

- https://github.com/gruvyo/opensourcingos

Lesson:

Analytics such as savings should be traceable to commercial anchors and methodology, not calculated as dashboard decoration.

### Tender Platform (alex-frolov/tender)

A recent API-first competitive-procurement project explicitly uses:

- sealed bids;
- reverse auctions;
- contracts;
- execution;
- transactional outbox;
- idempotent mutations;
- policy plugins.

Reference:

- https://github.com/alex-frolov/tender

Lesson:

These are sound architectural patterns to study, but jurisdiction-specific behavior should not be copied blindly.

### OpenS2P

OpenS2P is attempting a broad open-source Source-to-Pay platform.

Reference:

- https://opens2p.org/

Lesson:

"Build the whole suite" is possible as a long-term vision, but Vendorse should avoid breadth before its core sourcing semantics are strong.

---

## 6. Current repository technical condition

Observed from `main@7ee67ae...`:

### Stack

- Next.js 15.3.1;
- React 19;
- NestJS 11;
- PostgreSQL;
- Prisma 6.6-era dependency line;
- pnpm/Turborepo;
- S3-compatible file integration through AWS SDK;
- JWT auth.

### Good recent work

The October 4 refactor improved:

- role-aware workbench UI;
- reviewer pre-deadline restrictions;
- own-organization conflict guard;
- public registration role boundary;
- upload metadata constraints;
- admin mutation safety;
- audit actions;
- workspace build + API-test workflow.

### Structural tech debt

1. `TenderService` constructs its own `PrismaClient`.
2. Other services/controllers need one database lifecycle.
3. No committed migration directory is present.
4. README still instructs `prisma db push`.
5. `Tender.budget` is `Float`.
6. `EvaluationScore` is an overloaded model.
7. Shared TypeScript domain types are manually duplicated from database concepts.
8. Runtime API validation is inconsistent/manual.
9. CI builds and runs API unit tests but does not yet run:
   - lint;
   - database integration tests;
   - migrations;
   - web E2E;
   - browser accessibility;
   - security checks.
10. `packages/ui/tsconfig.tsbuildinfo` is checked in.
11. README feature/security claims do not match the latest audit/code.

---

## 7. Prisma version strategy

Vendorse currently uses an older Prisma generation.

Current Prisma guidance in 2026 is important:

- Prisma 7 is the recommended production generation;
- Prisma 8 is a major new architecture that is still presented as the next evolution / early-access direction in Prisma's 2026 material.

Sources:

- https://www.prisma.io/blog/the-next-evolution-of-prisma-orm
- https://www.prisma.io/blog/series/prisma-8
- https://www.prisma.io/blog/prisma-orm-manifesto-2026

Recommendation:

Do not migrate the procurement domain and ORM architecture simultaneously.

First:

- add safe migration history;
- centralize Prisma;
- correct the domain model.

Then upgrade the production ORM line deliberately.

---

## 8. Competitive feature map for Vendorse

| Capability | Current Vendorse | End-state priority |
| --- | --- | --- |
| Request/intake | Missing | High |
| Supplier master | Minimal organization | High |
| Qualification | Boolean verification only | High |
| Sourcing event | Tender | High |
| Structured requirements | Minimal | High |
| Lots/line items | Missing | High |
| Clarifications | Missing | High |
| Amendments/versioning | Missing | High |
| Sealed submissions | Partial deadline gate | High |
| Submission receipt/version | Missing | High |
| Opening | Implicit deadline | High |
| Evaluation plan | Frontend/static | Critical |
| Evaluator assignment | Missing | Critical |
| COI declaration | Missing | Critical |
| Scorecard | Overloaded score rows | Critical |
| Consensus | Missing | Medium |
| Award | Status mutation | High |
| Approval workflow | Missing | High |
| Contract | Missing | High |
| Supplier performance | Missing | Medium |
| Operational analytics | Basic | Medium |
| Strategic spend analytics | Missing | Later |
| ERP/P2P integration | Missing | High after contract |
| E-sign | Missing | Medium |
| AI assistance | Missing | Later, after structure |
| Native mobile | Missing | Low |

---

## 9. Strategic conclusion

The strongest Vendorse roadmap is:

**Tender workbench → sourcing engine → Source-to-Contract → procurement orchestration → supplier intelligence → integrations/analytics → AI-assisted procurement.**

The weakest roadmap would be:

**Tender CRUD → more dashboards → mobile app → random enterprise features.**

The first creates a product. The second creates a larger prototype.
