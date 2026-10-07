# Vendorse Delivery Plan — From Current Workbench to End-to-End Product

**Date:** 2026-10-08  
**Companion:** `product-and-technical-vision.md`

This plan is intentionally sequenced around domain correctness and release gates. The goal is to avoid adding attractive features on top of an unstable procurement model.

---

## 0. Current baseline

The current repository already has a useful foundation:

- Next.js web app;
- NestJS API;
- PostgreSQL + Prisma;
- user roles;
- organization ownership;
- tender creation/publication;
- supplier bid submission;
- evaluator scoring;
- award transition;
- object-storage upload flow;
- audit/notification primitives;
- responsive procurement workbench UI;
- CI build + API unit tests;
- several important authorization fixes from the October 4 refactor.

But it is still a **prototype-level sourcing workflow**, not an end-to-end procurement product.

### Current structural gaps

The highest-impact gaps visible in the repository are:

- `Tender.budget` is binary `Float`;
- evaluation criteria are not persisted/versioned;
- `EvaluationScore` is being used as both score line and scorecard;
- no reviewer assignment model;
- no conflict declaration model;
- no explicit opening event;
- no first-class award;
- no contract;
- no intake/request;
- supplier organization lifecycle is only a boolean `verified`;
- no migration history;
- services instantiate Prisma clients directly;
- browser session strategy is not production-grade;
- request validation is largely manual;
- document finalization/verification remains incomplete;
- no resource-aware document download service;
- no transactional outbox;
- no workflow/approval engine;
- no real multi-tenant model;
- no browser E2E suite;
- the root README materially overstates current capabilities.

---

# Milestone A — Make the current core trustworthy

Do this before expanding product scope.

## A1. Database lifecycle and migrations

### Implement

- committed migration history;
- migration CI check;
- shared database client / lifecycle;
- remove per-service `new PrismaClient()`;
- seed/dev fixtures separate from migrations.

### Acceptance gate

A clean database can be created only from migrations and the application can boot without `prisma db push`.

---

## A2. Runtime request contracts

### Implement

Use one runtime validation strategy across API payloads.

Cover at least:

- auth;
- organization registration;
- tender/event creation;
- date ranges;
- money;
- scoring;
- pagination;
- files;
- admin updates.

### Acceptance gate

Malformed fields, unknown privileged fields, invalid enums, NaN/Infinity, bad dates, and oversized nested payloads are rejected consistently before business logic.

---

## A3. Money model

### Replace

- `Float budget`

with:

- decimal amount;
- ISO 4217 currency.

Prepare the same value object for:

- response price;
- award;
- contract;
- later savings/baseline.

### Acceptance gate

No material commercial value is represented as binary floating point.

---

## A4. Session/auth hardening

### Implement

- secure browser session;
- HttpOnly cookie;
- expiry;
- revocation/rotation design;
- login rate limiting;
- CSRF strategy appropriate to cookie auth;
- active/suspended-user enforcement;
- normalized auth policy middleware.

### Acceptance gate

No reusable bearer credential needs to be readable by browser JavaScript for normal web use.

---

## A5. Central authorization policies

Replace scattered controller/service conditions with testable policy functions.

Examples:

- canViewEvent;
- canEditDraftEvent;
- canSubmitResponse;
- canOpenSubmission;
- canEvaluateResponse;
- canApproveAward;
- canDownloadDocument.

Inputs should include:

- actor;
- tenant;
- org;
- resource;
- state;
- assignments.

### Acceptance gate

Every sensitive API operation has positive and negative authorization tests.

---

## A6. Document lifecycle

### Implement

- upload intent;
- controlled object key;
- upload finalization;
- object existence/size check;
- server-computed digest;
- file status;
- resource-aware download;
- optional scanning hook;
- download audit for sensitive material.

### Acceptance gate

No business record trusts only client-declared path, MIME, size, or hash.

---

# Milestone B — Correct sourcing domain

This milestone turns the existing "Tender" CRUD into a defensible competitive sourcing engine.

## B1. Introduce SourcingProject + SourcingEvent

Keep backward compatibility during migration if needed.

### SourcingProject

Add:

- tenant;
- owner;
- category;
- method;
- status;
- estimated amount/currency;
- stakeholders;
- project code;
- linked request nullable initially.

### SourcingEvent

Add:

- project;
- event type;
- event status;
- publication/open/close timestamps;
- current version;
- visibility;
- instructions.

### Acceptance gate

A project and an event are no longer the same entity.

---

## B2. Event versioning

Create immutable published versions.

Version content should include at least:

- instructions;
- schedule;
- requirements;
- documents;
- evaluation plan;
- lots/line items.

Editing a published event creates an amendment/new version.

### Acceptance gate

The application can prove exactly what suppliers were asked to respond to at any submission timestamp.

---

## B3. Evaluation plan

Create:

- EvaluationPlan;
- EvaluationCriterion;
- scoring scale;
- weight;
- mandatory/pass-fail;
- guidance;
- visibility.

Validate:

- weights;
- scales;
- publication freeze.

### Acceptance gate

No scoring criterion is defined only in frontend code.

---

## B4. Reviewer assignment and COI

Create:

- EvaluationAssignment;
- ConflictDeclaration;
- recusal state.

Policies:

- unassigned evaluators see no proposal;
- unresolved conflict blocks scoring;
- own-supplier-organization conflict remains enforced;
- assignment scope can later support criterion-level assignments.

### Acceptance gate

Role alone never grants evaluation access.

---

## B5. First-class scorecard

Replace the overloaded evaluation-row model.

Create:

- Scorecard;
- CriterionScore.

Scorecard stores:

- evaluator;
- response;
- plan version;
- overall rationale;
- recommendation;
- submitted/locked timestamps.

### Acceptance gate

One evaluator/response evaluation can be uniquely identified and reconstructed independently from criterion rows.

---

## B6. Clarifications and amendments

Create:

- Clarification;
- ClarificationAnswer;
- Amendment;
- supplier acknowledgement if configured.

### Acceptance gate

Material communication no longer lives only in email/chat.

---

## B7. Structured response

Response should store:

- event version;
- organization snapshot;
- structured questionnaire answers;
- line-item pricing;
- required documents;
- draft/final state.

### Acceptance gate

A bid can be compared without parsing a PDF for all commercial facts.

---

## B8. Submission receipt and supersession

Finalize submission through one transactional command.

Write:

- immutable response version;
- server submission timestamp;
- document manifest;
- receipt identifier;
- audit event;
- notification/outbox event.

Allow configured resubmission by creating a new version.

### Acceptance gate

A final response is immutable and a supplier can prove what was submitted and when.

---

## B9. Opening event

Create explicit opening.

Policies:

- submission closes at deadline;
- opening is separately authorized;
- evaluators only access after opening;
- technical/commercial staged opening can be supported by policy later.

### Acceptance gate

"The deadline passed" is not the only security boundary controlling proposal visibility.

---

# Milestone C — Decision and contract handoff

## C1. Comparison workbench

Provide:

- supplier-by-supplier criteria;
- line-item price comparison;
- weighted scores;
- pass/fail;
- variance;
- comments;
- attachments/evidence links.

Do not auto-rank unless the methodology explicitly permits it.

---

## C2. Decision package

Create a generated but reviewable decision record:

- sourcing summary;
- participants;
- disqualifications;
- evaluator completion;
- commercial comparison;
- risks/exceptions;
- recommendation;
- evidence.

### Acceptance gate

An approver does not need to inspect raw database rows to understand the recommendation.

---

## C3. Generic approvals

Create workflow primitives:

- WorkflowDefinition;
- WorkflowInstance;
- ApprovalTask;
- ApprovalRecord.

Initial rules can be code/config driven.

Do not build a drag-and-drop workflow designer yet.

### Acceptance gate

Award cannot become final unless required approvals complete.

---

## C4. First-class Award

Create:

- selected response/version;
- supplier;
- amount/currency;
- rationale;
- status;
- approvedBy;
- awardedAt;
- reversal/cancellation metadata;
- notices.

### Acceptance gate

Award history survives independently of mutable event status.

---

## C5. Contract

Create pragmatic contract record:

- award;
- supplier;
- title;
- value/currency;
- dates;
- owner;
- status;
- executed document;
- metadata;
- amendments;
- obligations.

### Acceptance gate

Vendorse can hand off a signed/approved supplier commitment to downstream systems.

---

# Milestone D — Intake and procurement orchestration

This is the milestone that moves Vendorse from a sourcing tool to a procurement product.

## D1. Procurement request

Create a requester-friendly intake form.

Fields should be dynamic by:

- category;
- amount;
- supplier/new supplier;
- legal/security/data flags.

### Acceptance gate

A non-procurement employee can start a buying process without creating a Tender.

---

## D2. Triage

Procurement can route request to:

- reject/return;
- existing contract;
- direct purchase/exception;
- RFQ;
- RFP/tender;
- renewal;
- downstream catalog/P2P.

Store triage rationale.

---

## D3. Cross-functional review

Approval/review tasks can include:

- budget;
- finance;
- legal;
- IT/security;
- privacy;
- risk;
- procurement.

### Acceptance gate

The request timeline is a single source of truth for who is blocking the purchase.

---

## D4. "My Work" home

Replace dashboard-first thinking with work queues.

Role-specific tasks:

- requester questions;
- approvals;
- supplier qualification;
- clarifications;
- evaluations;
- award approval;
- expiring contracts.

---

# Milestone E — Supplier lifecycle

## E1. Supplier master

Create stable supplier identity separate from event participation.

Add:

- identifiers;
- country;
- categories;
- contacts;
- domains;
- status;
- duplicate detection.

---

## E2. Supplier membership

Suppliers invite/manage their own users.

Separate:

- supplier admin;
- contributor;
- authorized submitter.

---

## E3. Qualification

Create configurable qualification programs.

Examples:

- legal/business registration;
- insurance;
- security;
- financial health;
- licenses;
- ESG;
- category-specific capability.

Results should expire/reassess.

---

## E4. Performance

Add period-based performance review linked to contracts/sourcing history.

### Acceptance gate

Future sourcing can use evidence from prior supplier performance.

---

# Milestone F — Integration platform

## F1. Outbox + webhooks

Create:

- OutboxEvent;
- WebhookEndpoint;
- WebhookDelivery.

Signed webhooks with retries.

---

## F2. Email

Transactional email driven by semantic business events.

Templates versioned.

---

## F3. SSO

Add OIDC/SAML through a supported identity layer.

Tenant-managed identity connections later.

---

## F4. ERP/P2P handoff

Start with:

- CSV;
- secure API;
- webhooks.

Then connectors based on real demand.

Do not build every ERP connector speculatively.

---

## F5. E-sign

Integrate with a signing provider rather than implementing cryptographic document signing UX from scratch.

Keep Vendorse contract state synchronized via webhook.

---

# Milestone G — Analytics

## G1. Operational metrics

- request aging;
- sourcing aging;
- supplier response rate;
- evaluator completion;
- approvals aging;
- contracts expiring.

## G2. Strategic metrics

After trustworthy baseline data exists:

- negotiated savings;
- realized savings when downstream spend arrives;
- supplier concentration;
- category activity;
- competition level;
- direct-award/exception rate;
- supplier performance.

---

# Milestone H — AI assistants

Only after the structured domain records exist.

Priority order:

1. intake structuring;
2. RFx draft;
3. supplier document extraction;
4. compliance evidence mapping;
5. evaluator evidence assistant;
6. contract metadata extraction;
7. negotiation brief;
8. renewal/risk summaries.

All material AI suggestions require human confirmation and source provenance.

---

# Cross-cutting engineering work

These are continuous requirements, not late cleanup.

## CI

Add:

- lint;
- typecheck;
- migration validation;
- API tests;
- integration tests;
- Playwright;
- dependency audit;
- secret scan.

## Deployment

Create reproducible:

- Docker images;
- production env schema;
- health/readiness endpoints;
- database migration step;
- web/API/worker process definitions.

## Observability

Add:

- structured logs;
- request IDs;
- traces;
- error monitoring;
- queue/job visibility.

## Accessibility

Target WCAG 2.2 AA patterns where practical.

Test:

- keyboard;
- focus;
- form errors;
- dialogs;
- table alternatives;
- screen-reader labels.

---

# Repository cleanup to do early

1. Rewrite root README so it describes current reality, not aspirational capabilities.
2. Remove checked-in generated build artifacts such as `*.tsbuildinfo`.
3. Add `AGENTS.md` domain/engineering rules.
4. Add architecture decision records for major irreversible choices.
5. Add conventional environment validation.
6. Create one canonical roadmap instead of `current-features.md` + `next-Features.md` drifting independently.
7. Convert feature claims into tests/acceptance criteria.

---

# Release gates

## Gate 1 — Defensible sourcing core

Must have:

- versioned criteria;
- Decimal money;
- reviewer assignment;
- COI;
- explicit opening;
- immutable submission receipt;
- document authorization/finalization;
- first-class scorecard;
- migration history;
- policy tests.

## Gate 2 — End-to-end Source-to-Contract

Must have:

- supplier master;
- structured RFx;
- clarifications/amendments;
- award;
- approvals;
- contract record;
- audit;
- E2E journey.

## Gate 3 — Procurement orchestration

Must have:

- requester intake;
- triage;
- cross-functional approvals;
- "My Work";
- supplier lifecycle;
- downstream handoff.

## Gate 4 — Platform maturity

Must have:

- SSO;
- webhooks;
- observability;
- backup/restore process;
- tenant isolation confidence;
- reporting;
- deployment documentation.

## Gate 5 — AI-assisted procurement

Must have:

- structured source data;
- provenance;
- human confirmation;
- prompt/task versioning;
- security/privacy controls.

---

# What not to prioritize next

Do **not** make the next major work item:

- native mobile apps;
- generic real-time charts;
- collaborative document editing;
- arbitrary workflow designer;
- microservices;
- payment execution;
- autonomous AI;
- blockchain signatures.

Those are downstream optimizations. The missing value today is domain integrity and a coherent procurement lifecycle.
