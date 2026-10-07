# Vendorse

Vendorse is an auditable **procurement orchestration + Source-to-Contract workspace** built as a Next.js/NestJS/PostgreSQL modular monolith.

The implemented primary journey is:

```text
Procurement Request
  -> Approval / sourcing triage
  -> Sourcing Project
  -> Supplier onboarding + qualification
  -> RFx / Tender
  -> Clarifications + Amendments
  -> Versioned sealed response + receipt
  -> Authorized opening
  -> Reviewer assignment + COI
  -> Locked scorecards
  -> Buyer comparison + decision package
  -> Award recommendation + independent approval
  -> Contract
  -> Supplier performance
  -> ERP / P2P export
```

Vendorse owns the upstream procurement decision trail. It intentionally does not try to replace accounting, AP, treasury, inventory, or a full ERP.

## Product and architecture docs

The canonical product package is under [docs/20261008](./docs/20261008/README.md):

- [Product and technical vision](./docs/20261008/product-and-technical-vision.md)
- [Delivery plan](./docs/20261008/delivery-plan.md)
- [Implementation status](./docs/20261008/implementation-status.md)
- [Research notes](./docs/20261008/research-notes.md)

The earlier code/product audit remains in [docs/20261004](./docs/20261004/README.md).

## Implemented Source-to-Contract core

### Intake and work queues

- requester-friendly procurement request records;
- request submission and approval/rejection;
- sourcing project creation with sourcing method;
- role-aware `/procurement` workbench;
- admin request and award approval queues;
- operational procurement metrics.

### Supplier lifecycle

- stable supplier organization identity;
- legal name, registration number, country, tax ID and domain;
- duplicate legal-identity guard;
- qualification status/history;
- invitation to sourcing events;
- contract-linked supplier performance reviews.

### Sourcing

- first-class sourcing projects and events;
- RFIs, RFQs, RFPs, tenders and BAFO events;
- Decimal money + ISO currency;
- persisted evaluation criteria and structured line items;
- published event versions with immutable reconstructable snapshots;
- governed clarifications;
- explicit amendments/version history;
- supplier participation tracking.

### Submission integrity

- verified file-object lifecycle;
- controlled object keys;
- object existence / MIME / size verification;
- server-computed SHA-256;
- resource-aware document download authorization;
- structured line-item pricing and response answers;
- immutable response versions;
- server timestamps and receipt codes;
- superseding response versions instead of overwrite;
- proposal data hidden from buyers/reviewers until explicit opening.

### Evaluation and decision

- reviewer assignment;
- conflict-of-interest declaration / recusal;
- own-supplier-organization guard;
- locked scorecards;
- persisted criterion scores;
- frozen evaluation-plan weights;
- buyer comparison computed from locked scorecards;
- no automatic supplier ranking;
- reviewable/exportable decision package;
- award recommendation;
- independent administrator award approval.

### Contract and downstream handoff

- first-class award record;
- first-class contract record;
- contract execution state;
- request/project completion linkage;
- supplier performance history;
- expiring-contract analytics;
- versioned ERP/P2P JSON handoff payload.

### Platform integrity

- committed Prisma migration history;
- managed shared Prisma lifecycle;
- HttpOnly SameSite browser session cookie;
- fail-closed JWT configuration;
- active/suspended-user enforcement;
- strict runtime contracts for the new procurement mutation API;
- centralized procurement authorization policy primitives;
- append-oriented audit records for high-consequence procurement transitions;
- transactional outbox records written with audited procurement transitions;
- GitHub Actions schema validation, production builds, and API tests.

The original `Tender` workflow remains temporarily available as a compatibility path while the primary navigation points to Source-to-Contract.

## Deliberately later platform work

These are not required to claim the first end-to-end Source-to-Contract journey, and are intentionally not faked in this release:

- enterprise SSO / tenant-managed identity providers;
- generic drag-and-drop workflow designer;
- full supplier self-service membership administration;
- webhook endpoint/delivery worker and email worker;
- e-sign provider integration;
- browser Playwright matrix;
- full multi-tenant SaaS isolation/RLS architecture;
- OpenTelemetry/error-monitoring production stack;
- jurisdiction-specific public-procurement policy packs;
- AI procurement assistants.

See the delivery plan for their sequencing.

## Tech stack

- **Web:** Next.js 15.3, React 19, TypeScript
- **API:** NestJS 11, TypeScript
- **Database:** PostgreSQL, Prisma 6.6
- **Storage:** S3-compatible object storage
- **Monorepo:** pnpm + Turborepo
- **CI:** GitHub Actions

## Repository layout

```text
apps/
  api/                 NestJS API
  web/                 Next.js web app

packages/
  database/            Prisma schema + migrations
  shared/              shared types/utilities
  ui/                  reusable UI components

docs/
  20261004/            audit/refactor baseline
  20261008/            product vision, delivery plan, implementation status
```

Repository-wide engineering/domain rules are in [AGENTS.md](./AGENTS.md).

## Local development

### Requirements

- Node.js 22;
- pnpm 10.9+;
- PostgreSQL;
- S3-compatible object storage for document flows.

### Install

```bash
pnpm install
cp .env.example .env
```

Set at minimum a real `DATABASE_URL` and `JWT_SECRET`. Configure S3/MinIO values for upload flows.

### Database

Generate the client:

```bash
pnpm --filter @vendorse/database db:generate
```

Apply committed migrations:

```bash
pnpm --filter @vendorse/database db:migrate:deploy
```

For local migration development:

```bash
pnpm --filter @vendorse/database db:migrate:dev
```

Production schema evolution must use committed migrations, not `prisma db push`.

### Run

```bash
pnpm dev:all
```

The API defaults to port 3003. The web app uses server-side API proxies and the HttpOnly session cookie for browser authentication.

### Validate

```bash
pnpm --filter @vendorse/database db:validate
pnpm build
pnpm --filter api test --runInBand
```

The pull-request quality workflow runs these release checks automatically.

## Security / claims

Vendorse handles commercially sensitive supplier and proposal data. Treat confidentiality, opening rules, assignment, COI, file authorization, immutable submissions, and auditability as product invariants.

Do not advertise regulatory certifications, legal compliance, cryptographic signatures, or jurisdiction-specific procurement compliance unless those controls have actually been implemented and independently verified.
