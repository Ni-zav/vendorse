# AGENTS.md — Vendorse Engineering and Procurement Rules

This file applies to the entire repository unless a nested `AGENTS.md` explicitly narrows or extends it.

Vendorse is procurement software. Changes that look like ordinary CRUD can alter confidentiality, fairness, commercial outcomes, or auditability. Treat domain rules as security rules.

## Canonical planning references

Read these before implementing material product/domain changes:

1. `docs/20261008/product-and-technical-vision.md`
2. `docs/20261008/delivery-plan.md`
3. `docs/20261008/research-notes.md`
4. `docs/20261004/audit-and-refactor.md`

When older feature files conflict with these documents, prefer the dated 2026-10-08 vision unless current code/tests prove a newer decision.

---

## Product boundary

Vendorse is primarily:

- procurement intake/orchestration;
- supplier lifecycle;
- competitive sourcing;
- evaluation/award;
- contract handoff and contract metadata;
- procurement audit/analytics.

Do not casually expand into:

- accounting/general ledger;
- payment execution;
- inventory/warehouse;
- arbitrary CRM;
- marketplace;
- generic project management.

Integrate with those systems.

---

## Mandatory procurement invariants

Do not violate these to simplify implementation.

1. Published event rules are versioned.
2. Material published changes become amendments.
3. Supplier final submissions are immutable versions.
4. Proposal content stays unavailable until opening policy permits access.
5. A role name alone must not grant evaluator access.
6. Evaluator assignment is required.
7. Conflict-of-interest policy is checked before evaluation.
8. Independent scorecards remain independently reconstructable.
9. Evaluation criteria are persisted and tied to a version.
10. Award references a specific supplier response/version.
11. Award and Contract are separate concepts.
12. Money uses decimal + currency, never binary float.
13. High-consequence transitions create an audit record.
14. File access is checked against the parent procurement resource at request time.
15. Client-declared file metadata/hash is never sufficient verification.
16. Tenant/org isolation is enforced server-side.
17. Important retryable mutations must be idempotent or safely reject duplicates.
18. AI suggestions never silently become final procurement decisions.

If a requested change conflicts with these invariants, stop and make the conflict explicit in the PR/commit notes.

---

## Modeling guidance

Prefer first-class records over status-only modeling for:

- amendments;
- clarifications;
- opening;
- conflict declarations;
- scorecards;
- approvals;
- awards;
- contracts;
- contract amendments;
- supplier qualifications.

Do not encode major procurement history only in JSON audit messages.

Avoid generic JSON blobs for stable domain concepts.

---

## Authorization

Treat authorization as a combination of:

- authenticated identity;
- tenant;
- organization;
- role/capability;
- resource ownership;
- assignment;
- workflow state;
- deadline/opening state;
- conflict policy.

Do not duplicate subtly different authorization conditionals across controllers.

Add centralized/testable policy functions.

Every new sensitive action needs negative tests.

---

## Database

Use one managed/shared database client lifecycle.

Never instantiate a new Prisma client per request/service as a convenience.

All schema changes require committed migrations before production use.

For destructive/semantic migrations:

- write forward migration;
- preserve old values long enough for rollback/reconciliation where practical;
- include data migration;
- add migration tests/verification;
- never rely on `db push` for production evolution.

---

## Money

Use a value shape equivalent to:

- amount: decimal;
- currency: ISO 4217 code.

For conversions, persist:

- source amount/currency;
- target amount/currency;
- rate;
- rate source;
- rate timestamp.

Never silently convert currencies.

---

## Documents

Required lifecycle:

`PENDING_UPLOAD -> UPLOADED -> VERIFYING -> VERIFIED | QUARANTINED | REJECTED`

A business record should only depend on a verified/finalized file unless the workflow explicitly says otherwise.

Store:

- original filename;
- object key;
- content type;
- bytes;
- server hash;
- uploader;
- timestamps;
- verification/scan state;
- category/purpose.

Never expose a generic endpoint that signs an arbitrary storage key for download.

---

## Evaluation

Evaluation configuration belongs to the event/version, not frontend constants.

Independent scorecards must be stored separately from consensus.

Scoring formulas must be reproducible.

Do not introduce AI-generated evaluator scores.

AI can surface evidence and draft notes only when the evaluator remains responsible for the score.

---

## Audit

Application audit events are append-only.

Audit at least:

- auth/security changes;
- supplier qualification state;
- event create/publish/amend/cancel;
- clarification answer;
- submission finalization/withdrawal;
- opening;
- evaluator assignment/COI;
- scorecard submission/reopen;
- approval;
- award/reversal;
- contract execution/amendment;
- admin permission changes.

Audit logging must be part of the same committed business operation when practical.

---

## Architecture

Default to a modular monolith.

Do not create a new network service unless:

- the module has a clear independent operational need;
- cross-transaction consistency is understood;
- observability/deployment overhead is justified.

Prefer explicit internal module boundaries first.

Use asynchronous jobs for slow side effects, not microservices by reflex.

---

## Async side effects

Email, webhooks, scanning, AI processing, exports, and reminders should not be the only record of a business transition.

Commit domain state first.

Prefer transactional outbox + worker for external side effects.

Workers must be retry-safe.

---

## API contracts

All external request payloads need runtime validation.

Unknown privileged fields should be rejected or explicitly ignored according to the endpoint contract.

Generate/maintain OpenAPI.

Avoid manually duplicating domain/API types in frontend code when a generated/shared contract can be used.

---

## Testing expectations

For every important workflow change, test at least:

- happy path;
- wrong tenant;
- wrong org;
- wrong role/capability;
- wrong state;
- duplicate/retry;
- deadline boundary;
- assignment/conflict where relevant.

High-priority browser E2E flow:

request -> sourcing event -> supplier response -> opening -> evaluation -> approval -> award -> contract.

---

## UX rules

Vendorse is a workbench, not an admin theme.

Prioritize:

- "what needs my action?";
- visible next step;
- deadline/state clarity;
- evidence/history;
- compact enterprise information density;
- mobile-safe workflows.

Do not prioritize decorative dashboard charts over operational queues.

Never hide a material procurement state transition behind an unlabeled icon or silent auto-update.

---

## AI rules

AI features must record provenance sufficient to understand:

- source records/documents;
- task/prompt version;
- output;
- human confirmation.

Use AI for:

- drafting;
- extraction;
- summarization;
- evidence retrieval;
- anomaly flagging.

Do not let AI autonomously:

- submit a bid;
- alter submitted evidence;
- qualify/disqualify a supplier;
- score a bid;
- approve an award;
- execute a contract.

---

## Indonesia/public procurement

Do not claim that Vendorse is compliant with Indonesian government procurement merely because it supports tenders.

Current government procurement uses official LKPP/INAPROC/SPSE/Katalog systems and is governed by specific regulations.

If an Indonesia public-procurement feature is requested:

1. identify the exact procurement method;
2. cite the current rule;
3. implement jurisdiction-specific behavior as policy/configuration;
4. keep the core domain reusable.

---

## Documentation

When implementation changes behavior:

- update the canonical dated docs or add a newer dated decision;
- update README feature claims;
- add/adjust acceptance tests.

Do not leave aspirational README claims that are not backed by code/tests.

---

## Change discipline

Prefer incremental commits that each leave the repository buildable.

For large domain refactors:

1. add new schema/model;
2. migrate data;
3. add compatibility layer;
4. move reads;
5. move writes;
6. remove legacy model only after coverage exists.

Avoid "rewrite everything" branches when a staged migration is possible.
