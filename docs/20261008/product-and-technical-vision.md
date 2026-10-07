# Vendorse — End-to-End Product and Technical Vision

**Status:** canonical planning document  
**Date:** 2026-10-08  
**Repository baseline:** `main@7ee67ae382b1b03c8bdfcd98daf079651af5438a`

This document defines what Vendorse should become, where its product boundary should sit, the procurement-domain concepts that must be modeled explicitly, and the architecture required to get there without turning the codebase into a generic CRUD suite.

It supersedes the idea that Vendorse is merely "a tender + bid + evaluation app". The existing implementation is a useful sourcing-workbench foundation, but the end product needs a coherent procurement operating model.

---

## 1. Product thesis

Vendorse should become an **auditable procurement orchestration and Source-to-Contract workspace** for organizations that need structured purchasing decisions without adopting a heavyweight enterprise suite.

The core job is:

> Turn a business need into an approved supplier commitment with a complete, explainable, auditable trail.

Vendorse should own the upstream procurement lifecycle:

1. procurement request / intake;
2. sourcing project setup;
3. supplier discovery, onboarding, and qualification;
4. RFx / tender / competitive event;
5. clarifications and amendments;
6. sealed supplier submissions;
7. controlled opening;
8. evaluation and consensus;
9. approval and award;
10. contract handoff / execution metadata;
11. supplier performance and renewal context.

Vendorse should **not** initially try to replace:

- ERP general ledger;
- accounts payable;
- treasury/payments;
- warehouse/inventory;
- full purchase-order execution;
- tax engines;
- public-procurement marketplaces already mandated by a jurisdiction.

Those systems should integrate with Vendorse.

### Why this boundary

The mature procurement market has converged around connected upstream modules: intake, supplier management, sourcing, contracts, risk, and analytics. Enterprise suites such as SAP Ariba, Coupa, Oracle, and Ivalua extend further into P2P and AP. Newer procurement-orchestration products such as Zip focus on becoming the "front door" and workflow layer across existing systems.

Vendorse should take the useful middle path:

- own upstream procurement deeply;
- provide a great requester, procurement, evaluator, and supplier UX;
- produce a clean contract/award handoff;
- integrate downstream rather than rebuilding finance first.

That gives Vendorse a credible wedge instead of becoming a shallow "everything procurement" demo.

---

## 2. Primary target user

The strongest initial target is a **mid-market or institutional procurement team** that currently runs sourcing through email, spreadsheets, shared drives, chat, and ad-hoc approval forms.

Typical characteristics:

- procurement team is small relative to company size;
- many stakeholders participate in buying decisions;
- supplier documents are scattered;
- evaluation rules are inconsistently applied;
- status visibility is poor;
- procurement is asked "where is this request?" constantly;
- award decisions are difficult to reconstruct later;
- the company may already have accounting/ERP software and does not want a second ERP.

Potential organizations:

- private companies;
- universities;
- NGOs / foundations;
- multi-entity groups;
- professional-services organizations;
- construction / design / engineering organizations;
- regulated internal procurement teams.

### Indonesia-specific positioning

If Vendorse is initially launched in Indonesia, do **not** position it as a replacement for the national public-procurement rails.

As of 2026:

- SPSE is an official provider-selection service for Indonesian government procurement;
- Katalog Elektronik V6 / INAPROC is an official government e-purchasing platform;
- 2026 LKPP rules continue to expand catalogue/e-purchasing governance and integrations.

Vendorse can still be useful in Indonesia as:

- private-sector procurement software;
- internal procurement orchestration;
- a sourcing/evaluation workspace around organizational policy;
- a preparation, audit, supplier-management, or analytics layer;
- an integration/export layer where public-sector rules permit.

Government-specific procedure support should be implemented as policy/configuration packs only after legal and operational requirements are explicitly scoped.

---

## 3. Product principles

### 3.1 Procurement decisions are records, not page states

A high-consequence procurement action must create a durable record:

- publication;
- amendment;
- clarification answer;
- bid submission;
- bid withdrawal;
- opening;
- conflict declaration;
- scorecard submission;
- consensus;
- approval;
- award;
- cancellation;
- contract signature;
- contract amendment.

Do not compress important decisions into a single status enum.

### 3.2 Workflow must be explicit

Every state transition should answer:

- who can perform it;
- under what conditions;
- what evidence is required;
- whether it is reversible;
- what immutable event is recorded;
- who becomes able to see what afterward.

### 3.3 Supplier data is organization-level data

The supplier is not merely the user who clicked Submit.

A supplier has:

- legal/business identity;
- contacts;
- memberships;
- qualifications;
- category coverage;
- evidence/documents;
- eligibility status;
- risk/compliance facts;
- performance history;
- contracts and prior sourcing outcomes.

### 3.4 Published rules are versioned and frozen

Once an event is published:

- evaluation criteria cannot silently change;
- requested supplier documents cannot silently change;
- line items cannot silently change;
- deadlines cannot silently change.

A change becomes an **amendment** with a new version and audit record.

### 3.5 Auditability beats automation

Automation may route, calculate, summarize, and recommend.

It must not erase the human decision trail.

### 3.6 AI is an assistant, not the authority

AI may:

- draft an RFx from an approved request;
- summarize supplier documents;
- extract compliance evidence;
- compare response text to requirements;
- identify missing fields;
- summarize clarifications;
- draft negotiation questions;
- flag unusual commercial terms;
- draft a decision memo.

AI must not silently:

- qualify/disqualify a supplier;
- alter a submitted bid;
- submit an evaluator's score;
- approve an award;
- alter a contract;
- make a final award decision.

Every AI output used in a material decision should preserve provenance: source documents, model/action metadata where relevant, user confirmation, and final human-authored/approved state.

---

## 4. Canonical user roles

Roles should become **capabilities + resource policies**, not a single global enum that tries to express every relationship.

### Internal

**Requester**
- creates procurement request;
- sees own requests;
- answers procurement questions;
- receives status.

**Procurement Owner / Buyer**
- triages request;
- creates sourcing project;
- configures RFx;
- invites suppliers;
- manages event;
- coordinates evaluation;
- prepares recommendation.

**Category Manager**
- owns category strategy, supplier pool, templates, benchmarks.

**Evaluator**
- sees only assigned evaluation material;
- declares conflicts;
- submits independent scorecard.

**Evaluation Chair / Moderator**
- monitors completion;
- facilitates consensus if configured;
- cannot overwrite independent scores.

**Approver**
- approves request, sourcing strategy, award, or contract based on workflow policy.

**Finance Reviewer**
- verifies budget/commercial terms.

**Legal Reviewer**
- reviews contractual/legal terms.

**Risk / Security Reviewer**
- reviews third-party risk, privacy, security, compliance.

**Auditor**
- read-only access to authorized history/evidence.

**Tenant Administrator**
- membership, roles, policy configuration, integrations.

### Supplier-side

**Supplier Organization Admin**
- manages supplier profile and members.

**Supplier Contributor**
- contributes responses and documents.

**Supplier Submitter**
- authorized to submit/finalize a response.

A user may hold multiple contextual capabilities.

---

## 5. End-to-end product journey

## 5.1 Intake

A user should be able to start with plain business intent:

> "We need an architecture visualization vendor for a 6-month project with an estimated budget of IDR 450m."

The requester should not need to understand procurement taxonomy.

The system collects:

- business need;
- requested-by;
- cost center / entity;
- estimated value + currency;
- desired date;
- category;
- incumbent / existing supplier if any;
- attachments / statement of work;
- data/security/legal implications;
- whether competitive sourcing is required.

The intake result is a **ProcurementRequest**, not a Tender.

The request passes configurable approvals/triage.

Possible triage outcomes:

- reject / return for more info;
- buy from existing contract;
- direct award / exception workflow;
- lightweight RFQ;
- full RFP/tender;
- renewal;
- catalog / downstream P2P handoff.

This intake layer is what makes Vendorse useful to the whole organization, not only procurement specialists.

---

## 5.2 Sourcing project

An approved request becomes a **SourcingProject**.

A sourcing project contains:

- owner;
- stakeholders;
- category;
- sourcing method;
- procurement strategy;
- target timeline;
- budget;
- confidentiality;
- supplier strategy;
- tasks/milestones;
- linked requests;
- linked event(s);
- decision record;
- linked award/contract.

One project may contain multiple sourcing events.

Example:

- RFI to narrow market;
- RFP to 5 suppliers;
- BAFO/final-offer round to 2 suppliers.

Do not equate "project" with "tender".

---

## 5.3 Supplier lifecycle

Supplier management should be reusable across sourcing events.

### Supplier profile

Minimum durable data:

- legal name;
- display/trading name;
- legal entity type;
- country;
- registration/business identifier(s);
- tax identifier(s);
- addresses;
- domains;
- primary contacts;
- bank/payment data only when required and appropriately protected;
- categories/capabilities;
- certifications;
- insurance;
- licenses;
- beneficial ownership / sanctions data if a deployment needs it;
- diversity/local-content fields if a deployment needs it;
- risk tier;
- status.

### Supplier states

Recommended:

- PROSPECT;
- INVITED;
- REGISTRATION_IN_PROGRESS;
- PENDING_REVIEW;
- QUALIFIED;
- CONDITIONALLY_QUALIFIED;
- SUSPENDED;
- DISQUALIFIED;
- ARCHIVED.

Qualification is contextual.

A supplier may be qualified:

- for one category but not another;
- for one business unit but not another;
- until an expiry date;
- only under a risk threshold;
- only for opportunities below a threshold.

Model qualification as an assessment/result, not one boolean.

---

## 5.4 RFx / sourcing event

Vendorse should support a general **SourcingEvent** with event type:

- RFI;
- RFQ;
- RFP;
- TENDER;
- BAFO / FINAL_OFFER;
- later: REVERSE_AUCTION.

A published event contains frozen/versioned:

- title and instructions;
- schedule;
- lots;
- line items;
- requirements;
- questionnaires;
- pricing sheets;
- mandatory documents;
- eligibility rules;
- evaluation plan;
- terms/conditions;
- event documents;
- invited supplier set / openness policy.

### Lots and line items

Do not keep commercial response only in PDFs.

A sourcing event should support structured:

- quantity;
- unit;
- requested specification;
- target/delivery dates;
- price;
- currency;
- tax assumptions;
- optional alternatives.

This unlocks comparison, normalization, savings analytics, and downstream handoff.

---

## 5.5 Clarifications and amendments

Supplier questions must be first-class records.

**Clarification**
- supplier question;
- submitted timestamp;
- visibility policy;
- buyer answer;
- answered timestamp;
- linked event version;
- attachments.

Possible visibility:

- private answer;
- broadcast anonymized Q&A;
- published FAQ.

**Amendment**
- reason;
- changed fields/documents;
- previous version;
- new version;
- effective timestamp;
- acknowledgement requirement;
- deadline impact.

If a material change happens after a supplier submission, the policy should define whether suppliers must resubmit.

---

## 5.6 Supplier response and sealed submission

A response should support collaborative drafting but explicit final submission.

Recommended states:

- DRAFT;
- READY_TO_SUBMIT;
- SUBMITTED;
- SUPERSEDED;
- WITHDRAWN;
- OPENED;
- DISQUALIFIED;
- EVALUATED.

### Submission version

Each final submission should produce:

- immutable version number;
- supplier identity snapshot;
- submitted-by identity;
- submitted-at server timestamp;
- event version;
- structured answers;
- structured prices;
- referenced document versions;
- server-computed digest/manifest;
- receipt identifier.

The supplier receives a **submission receipt**.

A later permitted resubmission does not mutate the old response. It supersedes it.

### Sealed-bid semantics

Before the authorized opening event:

- evaluators cannot read proposal content;
- buyer visibility should follow configured procedure;
- file download policy must enforce the same state;
- pre-signed URLs alone are not authorization.

---

## 5.7 Opening

Opening must be a first-class controlled event, not merely "deadline has passed".

**OpeningEvent**
- event;
- openedAt;
- openedBy;
- procedure;
- witnesses if required;
- submissions opened;
- exceptions;
- audit metadata.

Possible procedures:

- automatic opening at deadline;
- manual opening by authorized buyer;
- dual-control opening;
- technical envelope first;
- commercial envelope later.

This design allows specialized procurement procedures without rewriting the whole platform.

---

## 5.8 Evaluation

Evaluation should be modeled around a versioned plan.

### EvaluationPlan

Contains:

- methodology;
- criteria;
- weights;
- scoring scale;
- pass/fail gates;
- required evaluator count;
- aggregation rules;
- moderation/consensus policy;
- price normalization formula where applicable;
- version.

### Criterion

Examples:

- technical capability;
- methodology;
- project team;
- implementation plan;
- commercial price;
- service levels;
- ESG/local-content requirements;
- mandatory compliance gates.

Each criterion defines:

- type;
- weight;
- min/max score;
- guidance;
- evidence expected;
- whether supplier can see it;
- whether it is scored individually or automatically calculated.

### Evaluator assignment

An evaluator only gains access when:

- assigned to event/bid/criterion as policy allows;
- submission is open;
- required conflict-of-interest declaration is complete;
- evaluator is active.

### Independent scorecard

Each evaluator creates one first-class scorecard:

- evaluator;
- response;
- plan version;
- criterion scores;
- criterion notes;
- overall rationale;
- recommendation;
- submittedAt;
- lockedAt.

Submitted scorecards should be immutable except through an explicit reopen workflow.

### Consensus

If consensus is required, create a separate **ConsensusEvaluation**.

Never overwrite independent scores with the consensus score.

That distinction is crucial for auditability.

---

## 5.9 Commercial normalization and comparison

Vendorse should provide a comparison workbench, not automatically choose a winner.

Functions:

- comparable line-item grid;
- alternate-offer handling;
- currency normalization using explicit rate snapshot;
- tax/inclusion assumptions;
- total-cost fields;
- technical pass/fail;
- weighted score;
- price score formula;
- variance/outlier flags;
- scenario analysis.

All formulas must be:

- explicit;
- versioned;
- reproducible;
- visible to authorized users.

---

## 5.10 Negotiation and final offer

After evaluation, procurement may negotiate.

Model:

- negotiation round;
- invited suppliers;
- scope;
- questions / requested changes;
- commercial offer version;
- deadline;
- outcome.

Do not silently edit the submitted bid.

If a final offer changes the commercial position, it becomes a new governed response/offer record.

---

## 5.11 Recommendation, approvals, and award

The procurement team prepares a **DecisionPackage**:

- project summary;
- participants;
- evaluation outcome;
- commercial comparison;
- risks;
- exceptions;
- recommendation;
- supporting documents;
- evaluator completion evidence;
- approval history.

### Approval

Approvals should be generic workflow tasks attached to a business object.

Approval policy may depend on:

- value;
- category;
- legal entity;
- risk tier;
- sourcing method;
- exception;
- geography.

### Award

Award is a first-class record:

- selected supplier/response;
- value + currency;
- decision timestamp;
- rationale;
- approving authority;
- award status;
- notice documents;
- unsuccessful-supplier communications;
- reversal/cancellation history.

Award is not the same as Contract.

---

## 5.12 Contract

Initial Vendorse contract scope should be pragmatic.

**Contract**
- contract ID;
- award;
- supplier;
- internal entity;
- title;
- value/currency;
- start/end;
- renewal terms;
- owner;
- status;
- signed document;
- signature timestamps;
- obligations/milestones;
- amendments;
- key metadata.

Recommended states:

- DRAFT;
- INTERNAL_REVIEW;
- SUPPLIER_REVIEW;
- APPROVED;
- SENT_FOR_SIGNATURE;
- EXECUTED;
- ACTIVE;
- EXPIRING;
- EXPIRED;
- TERMINATED.

Do not attempt full Microsoft-Word clause authoring in the first contract milestone.

Instead:

1. metadata;
2. document versioning;
3. approval;
4. e-sign integration;
5. obligation/renewal tracking.

Advanced clause library/redlining can come later.

---

## 5.13 Supplier performance and renewal

After award, sourcing history should improve the next decision.

Performance review dimensions can include:

- quality;
- delivery;
- responsiveness;
- SLA performance;
- commercial adherence;
- safety/compliance;
- innovation;
- stakeholder satisfaction.

Reviews must store:

- period;
- reviewer;
- evidence;
- score;
- notes;
- remediation actions.

Renewal flow should surface:

- contract expiry;
- performance;
- incidents;
- spend;
- open obligations;
- sourcing options;
- recommended start date for renewal process.

---

## 6. End-product UX

Vendorse should feel like an operational workspace, not an admin dashboard template.

### Home: "My work"

Default home should prioritize:

- approvals waiting for me;
- evaluations due;
- supplier registrations needing review;
- sourcing milestones at risk;
- expiring contracts;
- clarification questions;
- requests blocked on me.

Charts are secondary.

### Requester workspace

Requester sees:

- request status;
- next step;
- owner;
- timeline;
- questions requiring response;
- resulting supplier/contract where allowed.

### Procurement workspace

Procurement sees:

- request pipeline;
- sourcing projects;
- active events;
- supplier onboarding;
- evaluation progress;
- approvals;
- contract handoffs.

### Supplier portal

Supplier sees:

- invitations;
- registration tasks;
- active events;
- requirements checklist;
- clarification center;
- draft responses;
- submission receipt;
- award/result notices;
- contracts shared with them.

### Evaluation room

Evaluator sees only:

- assigned events/responses;
- conflict declaration;
- published evaluation guidance;
- evidence viewer;
- scorecard;
- completion status.

Avoid procurement-side noise.

### Event room

One sourcing event page should consolidate:

- overview;
- schedule;
- suppliers;
- requirements;
- Q&A;
- amendments;
- submissions;
- opening;
- evaluation;
- decision;
- audit timeline.

---

## 7. Domain model blueprint

The existing schema is intentionally small. The target model should evolve toward the following modules.

### Identity / tenancy

- Tenant
- LegalEntity
- User
- Membership
- Team
- Role
- Permission / policy assignment
- IdentityProvider

### Intake / workflow

- ProcurementRequest
- RequestAttachment
- RequestDecision
- WorkflowDefinition
- WorkflowInstance
- WorkflowStep
- ApprovalTask

### Supplier

- Supplier
- SupplierIdentifier
- SupplierContact
- SupplierMembership
- SupplierCategory
- SupplierDocument
- QualificationProgram
- QualificationAssessment
- QualificationAnswer
- QualificationResult
- SupplierRisk
- PerformanceReview

### Sourcing

- SourcingProject
- ProjectStakeholder
- SourcingEvent
- EventVersion
- EventSchedule
- Lot
- LineItem
- Requirement
- Questionnaire
- Question
- EventDocument
- SupplierInvitation
- Clarification
- Amendment

### Submission

- Response
- ResponseVersion
- ResponseAnswer
- PriceResponse
- ResponseDocument
- SubmissionReceipt
- OpeningEvent

### Evaluation

- EvaluationPlan
- EvaluationCriterion
- EvaluationAssignment
- ConflictDeclaration
- Scorecard
- CriterionScore
- ConsensusEvaluation

### Decision / award

- DecisionPackage
- ApprovalRecord
- Award
- AwardNotice

### Contract

- Contract
- ContractVersion
- ContractDocument
- ContractAmendment
- Obligation
- Milestone

### Platform

- FileObject
- FileVersion
- Notification
- AuditEvent
- OutboxEvent
- IntegrationConnection
- WebhookEndpoint
- WebhookDelivery

Not all models need to land at once. The important point is to preserve these distinctions.

---

## 8. Mandatory data invariants

These should become tests, not merely documentation.

1. Money is fixed-point decimal plus ISO 4217 currency.
2. Every tenant-scoped business record has explicit tenant ownership.
3. Published event versions are immutable.
4. Evaluation plan version used for a submission can always be reconstructed.
5. Submission finalization is server-authoritative.
6. A submission receipt references an immutable submission version.
7. Proposal content is inaccessible until the applicable opening rule permits it.
8. Evaluators require assignment.
9. Evaluators must satisfy conflict-of-interest policy.
10. Independent submitted scorecards cannot be silently edited.
11. Award references a specific response/version.
12. Contract references an award or an explicitly documented exception source.
13. High-consequence state transitions write an audit event atomically.
14. Files transition through explicit verification state.
15. Download authorization is resource-aware at request time.
16. Side effects (mail/webhooks/jobs) are dispatched from committed state using an outbox/job pattern.
17. Retried commands are idempotent where external clients can reasonably retry them.
18. AI-generated material never replaces the source evidence or human decision record.

---

## 9. Recommended architecture

## 9.1 Keep a modular monolith

Do **not** split Vendorse into microservices now.

The current NestJS + Next.js + PostgreSQL monorepo is a good shape for the product stage.

Use one API deployment with internal modules:

- identity;
- tenants;
- suppliers;
- intake;
- workflow;
- sourcing;
- submissions;
- evaluations;
- decisions;
- contracts;
- files;
- notifications;
- audit;
- integrations;
- reporting.

Reasons:

- procurement workflows are transaction-heavy and cross-domain;
- premature services make state consistency harder;
- a small team benefits from one deployable backend;
- module boundaries can later become service boundaries if evidence demands it.

### Internal rule

Cross-module business behavior should go through explicit application services/ports, not directly query another module's tables from arbitrary controllers.

---

## 9.2 PostgreSQL remains the system of record

Use PostgreSQL for:

- relational workflow state;
- transactional invariants;
- audit/event metadata;
- reporting;
- JSON only where the structure is genuinely deployment-configurable.

Do not put core procurement semantics in opaque JSON blobs.

### Search

Start with:

- PostgreSQL full-text search;
- trigram indexes;
- structured filters.

Do not introduce Elasticsearch/OpenSearch until real search scale or document-search requirements justify it.

---

## 9.3 Prisma direction

Current repository is on Prisma 6.6.

As of October 2026, Prisma 7 is the recommended production line while Prisma 8 is still an evolving new architecture / early-access direction.

Recommended path:

1. first introduce committed migration history on the current stack;
2. remove per-service `new PrismaClient()`;
3. centralize database lifecycle;
4. upgrade deliberately to the supported production Prisma major;
5. evaluate Prisma 8 only when its production recommendation and migration path are appropriate.

Do not combine a major domain-model rewrite with an experimental ORM migration.

---

## 9.4 Runtime schemas and generated clients

Current TypeScript interfaces do not validate requests.

Use a single runtime schema strategy.

Recommended options:

- Zod-based schemas shared between API/web; or
- Nest DTO + class-validator with generated OpenAPI client.

Preferred direction for this monorepo:

- Zod for shared payload contracts;
- OpenAPI generated from API;
- generated typed client used by web.

Avoid manually maintaining duplicate API DTO and frontend interfaces.

---

## 9.5 Authentication and session model

Move away from browser-accessible bearer tokens in localStorage.

Target:

- OIDC/OAuth2-compatible identity layer;
- secure HttpOnly SameSite cookies for browser session;
- short-lived access credentials;
- rotation/revocation;
- MFA capability;
- SSO later;
- explicit service/API tokens for integrations.

Authorization must combine:

- role/capability;
- tenant;
- organization;
- resource ownership;
- workflow state;
- assignment;
- conflict policy.

Create centralized policy functions and tests.

---

## 9.6 Multi-tenancy

If Vendorse becomes SaaS, tenant isolation must become structural.

Recommended initial pattern:

- shared database;
- tenantId on every tenant-owned record;
- tenant context resolved from authenticated membership;
- tenant filtering in repository/data-access layer;
- compound unique indexes include tenantId where required;
- policy tests for cross-tenant access.

Consider PostgreSQL RLS as defense-in-depth when the data-access design is mature.

Do not rely only on frontend filtering.

---

## 9.7 Files

Object storage is appropriate.

File lifecycle:

1. upload intent requested;
2. permission/purpose validated;
3. server creates controlled storage key;
4. client uploads;
5. finalization call references object;
6. server checks size/content signature and object existence;
7. malware/content scanning where risk warrants;
8. server computes hash;
9. file becomes VERIFIED or QUARANTINED;
10. business record references verified file version.

Store:

- original filename;
- normalized filename;
- object key;
- content type;
- byte size;
- SHA-256;
- uploader;
- createdAt;
- verifiedAt;
- scan status;
- purpose/document category.

---

## 9.8 Background jobs and events

Add a worker when needed for:

- email;
- document scanning;
- PDF/text extraction;
- reminders;
- webhook delivery;
- analytics materialization;
- AI tasks.

Recommended:

- transactional outbox table;
- job queue;
- retry policy;
- idempotency key;
- dead-letter visibility.

Redis/BullMQ is reasonable if operational simplicity is acceptable.

Do not introduce Kafka for the first production version.

---

## 9.9 Notifications

Model notification delivery separately from business events.

Channels:

- in-app;
- email;
- later Slack/Teams/WhatsApp only where appropriate.

A business event should emit one semantic event; delivery preferences determine channels.

Examples:

- `sourcing.event.published`
- `supplier.invited`
- `clarification.answered`
- `response.submitted`
- `evaluation.assigned`
- `award.approval_requested`
- `contract.expiring`

---

## 9.10 Audit

Audit must be append-only from application perspective.

Record:

- tenant;
- actor;
- action;
- resource type/id;
- timestamp;
- request/correlation ID;
- actor IP where appropriate;
- before/after summary for sensitive config mutations;
- reason/comment where required;
- source channel.

Audit log is not the same as application log.

---

## 9.11 Observability

Production baseline:

- structured JSON logs;
- request/correlation IDs;
- OpenTelemetry traces;
- error reporting;
- database query observability;
- job metrics;
- auth failures;
- file-processing failures;
- webhook failures.

Key product metrics:

- request cycle time;
- sourcing cycle time;
- supplier response rate;
- evaluation completion time;
- award cycle time;
- contract renewal lead time;
- exception rate;
- percentage spend under governed process where downstream spend data is integrated.

---

## 9.12 Testing strategy

### Domain tests

Fast tests for:

- state transitions;
- permissions;
- evaluation formulas;
- eligibility;
- approvals;
- award constraints.

### Database/integration tests

Use real PostgreSQL in CI for:

- transactions;
- unique constraints;
- tenant isolation;
- migrations;
- outbox behavior.

### API authorization matrix

Every sensitive endpoint should have tests for:

- allowed role;
- wrong tenant;
- wrong organization;
- wrong resource owner;
- wrong state;
- unassigned evaluator;
- pre-opening access;
- suspended user.

### Browser E2E

Playwright scenarios:

1. requester submits request;
2. procurement approves/triages;
3. procurement publishes event;
4. supplier registers and submits;
5. submission stays sealed;
6. event opens;
7. evaluator declares COI and evaluates;
8. buyer produces recommendation;
9. approver approves award;
10. supplier receives result;
11. contract record is created.

Run critical journeys at desktop and mobile widths.

---

## 10. API and integration strategy

Vendorse should be API-first but not "public API everywhere" from day one.

### Internal API

REST is fine.

Requirements:

- OpenAPI;
- versioned externally exposed contracts;
- idempotency for important mutation endpoints;
- pagination consistency;
- correlation IDs;
- predictable error model.

### Webhooks

Expose signed webhook delivery for:

- request approved;
- supplier qualified;
- event published;
- response submitted;
- award approved;
- contract executed.

### Downstream handoff

Integrate rather than own the whole P2P lifecycle.

Common downstream targets:

- ERP;
- purchase-order system;
- AP;
- accounting;
- data warehouse.

Handoff object should include:

- legal entity;
- supplier ID;
- award/contract ID;
- line items;
- value/currency;
- cost center/project;
- tax/payment metadata as applicable.

### Future interoperability

If Vendorse later enters international P2P/e-invoicing, align exported order/invoice data with relevant standards such as UBL/Peppol rather than inventing proprietary document semantics.

---

## 11. Analytics

Do not start with a "BI dashboard" full of vanity charts.

First make the underlying data trustworthy.

### Operational analytics

- requests by stage;
- blocked requests;
- events near deadline;
- supplier response rate;
- evaluation completion;
- approvals aging;
- expiring contracts.

### Strategic analytics

After enough data exists:

- savings baseline vs award;
- incumbent vs awarded;
- category spend;
- sourcing cycle time;
- competition per event;
- supplier win rate;
- supplier performance trend;
- renewal risk;
- contract coverage;
- exception/direct-award rate.

Every savings number should have a traceable methodology.

---

## 12. AI roadmap

AI becomes valuable only after the procurement records are structured.

### Safe early features

**Request assistant**
- turns free text into structured intake draft;
- detects missing fields.

**RFx drafting assistant**
- drafts requirements/questionnaire from request + template;
- user must approve.

**Supplier-document extraction**
- extracts certificate number, expiry, policy number, legal ID;
- user confirms before profile becomes authoritative.

**Compliance matrix assistant**
- maps supplier response evidence to requirements;
- never marks final compliance without human confirmation.

**Evaluation evidence assistant**
- shows where in the response a criterion is addressed;
- summarizes evidence;
- does not write evaluator score.

**Contract metadata extraction**
- dates;
- value;
- renewal;
- termination notice;
- obligations;
- user confirms.

### Later

- negotiation preparation;
- benchmark analysis;
- anomaly detection;
- renewal recommendations;
- supplier-risk summarization.

### AI governance

Store:

- model/provider;
- prompt/task version;
- source references;
- output;
- reviewer confirmation;
- final accepted fields.

Sensitive supplier documents must obey deployment data-retention and model-provider policies.

---

## 13. Security and trust baseline

Vendorse will hold commercially sensitive bids and supplier records.

Minimum serious-production posture:

- secure session cookies;
- MFA support;
- tenant isolation;
- centralized authorization policies;
- least-privilege object storage;
- server-side file finalization;
- encryption in transit and at rest;
- secrets manager;
- rate limiting;
- login abuse protection;
- audit logging;
- dependency scanning;
- secret scanning;
- signed releases/deploy provenance where practical;
- backups + restore tests;
- data retention/deletion policies;
- incident logging;
- security headers/CSP;
- CSRF protection appropriate to session strategy.

Never market compliance certifications until actually achieved.

---

## 14. Deployment model

Vendorse can support two deployment shapes without changing domain semantics.

### Hosted SaaS

- web;
- API;
- worker;
- managed PostgreSQL;
- object storage;
- Redis/queue;
- email provider;
- observability.

### Self-hosted / dedicated

For organizations with stronger data-control requirements:

- Docker images;
- Compose/Helm later;
- Postgres;
- S3-compatible storage;
- optional Redis;
- external OIDC provider.

Configuration should not fork the codebase.

---

## 15. Product packaging

Avoid pricing by arbitrary feature fragmentation too early.

A sensible eventual packaging model:

### Core Sourcing

- requests;
- sourcing projects;
- RFx;
- supplier portal;
- sealed submissions;
- evaluation;
- award;
- audit.

### Supplier Management

- qualification;
- profile;
- compliance documents;
- performance.

### Contracts

- contract repository;
- approval;
- e-sign integration;
- obligations;
- renewals.

### Enterprise Governance

- SSO;
- advanced RBAC/policies;
- multi-entity;
- configurable approvals;
- integrations;
- audit export;
- dedicated/self-hosted options.

AI capabilities can be usage-metered or plan-specific later, but should not be the product's identity.

---

## 16. Competitive differentiation

Vendorse cannot beat enterprise suites by copying their breadth.

It can differentiate through:

1. **Procurement-native UX without enterprise bloat.**
2. **Transparent audit and decision lineage.**
3. **Supplier experience that does not feel like an ERP portal.**
4. **API-first integration boundaries.**
5. **Deployability / self-hosting option.**
6. **Configurable procedures without losing domain integrity.**
7. **Open, inspectable workflow semantics.**
8. **Fast setup for mid-market teams.**
9. **AI that cites evidence and keeps humans accountable.**
10. **Jurisdiction/policy packs instead of hardcoding one country's procedure into the core.**

---

## 17. What should remain out of scope until evidence demands it

Do not build these simply because large suites have them:

- general ledger;
- payment execution;
- bank connectivity;
- inventory management;
- warehouse;
- travel/expense;
- corporate cards;
- full e-commerce marketplace;
- arbitrary no-code platform;
- huge custom report designer;
- microservice fleet;
- blockchain;
- autonomous AI award agent.

Each one can consume years of complexity while weakening the core sourcing product.

---

## 18. Definition of the first true end-to-end Vendorse release

Vendorse is end-to-end when a real organization can complete this flow without spreadsheets/email being the system of record:

1. requester submits purchase need;
2. appropriate approvals complete;
3. procurement creates sourcing project;
4. supplier(s) are selected/onboarded;
5. RFx is published with structured requirements and criteria;
6. suppliers ask questions and receive governed clarification;
7. amendments are versioned;
8. suppliers submit sealed, receipted responses;
9. authorized opening occurs;
10. assigned evaluators declare conflicts and submit scorecards;
11. comparison and recommendation are produced;
12. award approval completes;
13. award notice is recorded;
14. contract is executed/recorded;
15. renewal/performance context remains linked;
16. every material action is reconstructable from audit/history;
17. downstream ERP/P2P receives the approved supplier commitment through integration/export.

That is the product milestone Vendorse should optimize toward.

---

## 19. Immediate implications for the current repository

The October 4 refactor was the right direction. It hardened the existing tender workbench and identified many domain/security gaps.

The next development cycle should **not** start with notification polish, generic analytics, or native mobile apps.

The order should be:

1. make the current workflow structurally correct;
2. establish tenant/supplier/evaluation/event versions;
3. add controlled sourcing semantics;
4. add award/contract records;
5. add intake/orchestration;
6. add supplier lifecycle/performance;
7. add integrations/analytics;
8. add AI on top of trustworthy records.

See `delivery-plan.md` for the implementation sequence and release gates.
