# Vendorse

Vendorse is an **e-procurement / competitive-sourcing workbench** that is being evolved into an auditable **Source-to-Contract + procurement-orchestration platform**.

The current codebase is a strong prototype foundation, not yet a production-ready end-to-end procurement suite.

## Current direction

The canonical product/technical plan is:

- [2026-10-08 vision package](./docs/20261008/README.md)
- [End-to-end product and technical vision](./docs/20261008/product-and-technical-vision.md)
- [Delivery plan](./docs/20261008/delivery-plan.md)
- [Market / standards / Indonesia research](./docs/20261008/research-notes.md)
- [2026-10-04 audit and refactor](./docs/20261004/audit-and-refactor.md)

The target product journey is:

```text
Procurement Request
  -> Sourcing Project
  -> Supplier Qualification
  -> RFx / Tender
  -> Clarifications + Amendments
  -> Sealed Submission
  -> Opening
  -> Evaluation
  -> Approval
  -> Award
  -> Contract
  -> Supplier Performance / Renewal
  -> ERP / P2P handoff
```

Vendorse should own the upstream procurement decision process and integrate with downstream accounting/ERP/P2P systems rather than trying to replace them immediately.

## Current implemented baseline

The current `main` baseline includes:

### Identity and administration

- user roles for ADMIN / BUYER / VENDOR / REVIEWER;
- organization membership;
- JWT authentication;
- admin user-management surfaces;
- user account status;
- partial audit logging.

### Tender / sourcing workbench

- create draft tender;
- publish tender;
- list/search/filter tenders;
- attach tender documents;
- responsive buyer/vendor/reviewer screens.

### Supplier response

- vendor proposal submission;
- proposal documents;
- organization-level duplicate active-bid guard;
- deadline enforcement.

### Evaluation

- post-deadline reviewer access;
- own-organization conflict guard;
- score submission;
- recommendation;
- status transitions.

### Award

- buyer/admin award action;
- active bids must have an evaluation;
- selected bid requires at least one ACCEPT recommendation;
- winning/losing bid status updates;
- award audit event.

### Platform

- S3-compatible upload integration;
- dashboard statistics;
- in-app notification records;
- pnpm/Turborepo monorepo;
- GitHub Actions build + API unit tests.

## Important limitations

Do not infer production/legal compliance from the feature list above.

The current baseline still needs, among other things:

- committed database migrations;
- fixed-point money + currency;
- runtime request schemas;
- production-grade browser sessions;
- centralized resource authorization policies;
- server-side file finalization/content verification;
- resource-aware document downloads;
- persisted/versioned evaluation criteria;
- reviewer assignments;
- conflict-of-interest declarations;
- explicit bid opening;
- immutable submission receipts/versions;
- first-class scorecards;
- first-class awards;
- contracts;
- procurement request/intake;
- supplier lifecycle/qualification;
- broader audit coverage;
- browser E2E tests;
- deployment/observability hardening.

See [delivery-plan.md](./docs/20261008/delivery-plan.md) for the required order.

## Tech stack

- **Frontend:** Next.js 15.3 + React 19 + TypeScript
- **Backend:** NestJS 11 + TypeScript
- **Database:** PostgreSQL + Prisma
- **Storage:** S3-compatible object storage
- **Auth:** JWT-based current implementation
- **Monorepo:** pnpm + Turborepo

## Repository layout

```text
apps/
  api/                 NestJS API
  web/                 Next.js web app

packages/
  database/            Prisma/database package
  shared/              shared types/utilities
  ui/                  reusable UI components

docs/
  20261004/            audit/refactor baseline
  20261008/            canonical product + architecture vision
```

Repository-wide coding/domain rules are in [AGENTS.md](./AGENTS.md).

## Local development

### Requirements

- Node.js 22 recommended for parity with CI;
- PostgreSQL;
- pnpm 10.9+.

### Install

```bash
pnpm install
```

### Configure

Copy the root environment example and provide required local values.

```bash
cp .env.example .env
```

Review the current app/package documentation for environment variables used by the API, database, and storage integration.

### Database

The current repository still uses the existing Prisma workflow.

```bash
pnpm --filter @vendorse/database db:generate
```

A committed migration history is a release blocker in the new delivery plan. Do not introduce new production schema evolution that relies only on `prisma db push`.

### Development

```bash
pnpm dev:all
```

### Build

```bash
pnpm build
```

### API tests

```bash
pnpm --filter api test --runInBand
```

## Product boundary

Vendorse is being designed for:

- procurement intake/orchestration;
- supplier lifecycle;
- sourcing / RFx;
- sealed responses;
- evaluation;
- approval and award;
- contract handoff/metadata;
- audit and procurement analytics.

It is **not** currently intended to become a general ledger, payment engine, inventory system, or full ERP.

## Indonesia / government procurement note

Vendorse should not be marketed as a replacement for Indonesian government procurement systems merely because it supports tenders.

Government procurement currently uses official LKPP/INAPROC/SPSE/Katalog infrastructure and procedure-specific regulation. Any government-specific Vendorse capability must be separately scoped, researched, and implemented as jurisdiction-specific policy.

## Security note

Vendorse contains commercially sensitive procurement data.

Security controls should be treated as product invariants, especially:

- tenant/organization isolation;
- proposal confidentiality;
- controlled opening;
- evaluator assignment/conflicts;
- file authorization;
- auditability;
- immutable submitted records.

Do not advertise certifications, legal compliance, cryptographic signatures, or other controls unless they are actually implemented and verified.
