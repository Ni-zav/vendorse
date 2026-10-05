# Vendorse product, procurement, UX, and engineering audit

**Audit date:** 2026-10-04  
**Continuation/integration pass:** 2026-10-05  
**Working branch:** `refactor/procurement-workbench-20261004`

## Executive summary

Vendorse had a useful monorepo foundation, but the product behaved more like a generic CRUD proof-of-concept than a procurement system. The biggest problems were not only visual:

- workflow state and access control did not consistently represent real sourcing responsibilities;
- a few duplicate TypeScript modules silently shadowed the intended implementation;
- public registration trusted a client-supplied role;
- reviewers could reach proposal material before the submission deadline even though scoring was blocked;
- award logic allowed a buyer to move forward without every active bid being evaluated;
- supplier submissions were modeled partly at user level and partly at organization level;
- document upload controls were mostly browser-side and a generic download URL route was not resource-authorized;
- the UI was inconsistent: the redesigned workbench pages sat beside prototype login, registration, landing, and admin pages;
- the public landing page claimed encryption/digital-signature capabilities that the code did not implement.

This branch changes the product direction from **generic tender CRUD** to a **role-aware procurement workbench**. It improves responsive behavior and information hierarchy, but also fixes workflow integrity and security boundaries so visual polish is not hiding misleading behavior.

The branch is intentionally **not** presented as production-ready or legally compliant. Procurement rules vary by organization, sector, and jurisdiction. OCDS, OECD, World Bank procurement guidance, and OWASP are used here as reference models for product architecture and control design.

---

## 1. Scope and audit method

The pass covered:

1. repository/module structure;
2. Next.js application shell and responsive behavior;
3. buyer, supplier, reviewer, and administrator journeys;
4. tender/bid/evaluation/award state transitions;
5. authentication and authorization;
6. proposal document upload flow;
7. Prisma schema alignment with TypeScript/API contracts;
8. admin account management;
9. CI/build/test reliability;
10. procurement-domain gaps and future data-model needs.

The audit treated source code as authoritative. Where the interface suggested a capability but the backend did not support it, the interface was changed rather than preserving an inaccurate claim.

---

## 2. Product direction

### Previous shape

The original experience was largely:

- dashboard counters;
- generic lists and forms;
- CRUD-oriented detail pages;
- role labels without enough role-specific workflow behavior;
- desktop-first layouts;
- prototype public/auth/admin screens;
- documents used as a substitute for structured procurement data.

That can demonstrate a stack, but it does not yet communicate why Vendorse exists.

### Refactored direction

The branch now uses a procurement-workbench model:

- **Buyer:** draft -> publish -> monitor submission window -> review evaluated bids -> award.
- **Vendor:** browse eligible published tenders -> submit a proposal package -> track organization bids.
- **Reviewer:** see only tenders whose submission deadline has passed -> independently score eligible bids -> leave rationale and recommendation.
- **Admin:** monitor platform activity -> manage accounts/access -> support the workflow without becoming the default buyer or reviewer.

The user interface now emphasizes:

- current lifecycle state;
- next valid action;
- deadlines;
- queue-based work;
- role scope;
- evidence/rationale;
- explicit empty/error/loading states;
- responsive layouts rather than desktop tables squeezed onto mobile.

---

## 3. High-severity findings and disposition

| Severity | Finding | Disposition |
| --- | --- | --- |
| Critical | `Form.tsx` shadowed the newer `Form/` module, breaking the UI package declaration build | **Fixed** |
| Critical | Placeholder `TenderDetailClient.ts` shadowed the real `TenderDetailClient.tsx` | **Fixed** |
| Critical | Public registration accepted a client-provided role, allowing attempted self-registration as privileged roles | **Fixed** |
| High | JWT strategy had a hard-coded fallback secret | **Fixed** |
| High | Reviewer could retrieve bid material before the submission deadline | **Fixed** |
| High | Reviewer could evaluate a bid from their own organization | **Fixed** |
| High | Award could proceed while other active bids had no evaluation | **Fixed for current MVP rules** |
| High | Winning bid did not require an accept recommendation | **Fixed for current MVP rules** |
| High | Vendor duplicate prevention was organization-level but visibility was submitter-user-level | **Fixed** |
| High | Proposal upload presign accepted arbitrary file metadata and download URL was generic | **Partially fixed; deeper content verification remains** |
| High | Landing page claimed end-to-end encryption and digital signatures that were not implemented | **Fixed** |
| Medium | Login page failed Next.js 15 production prerender because of unnecessary `useSearchParams` | **Fixed** |
| Medium | Admin “Edit” opened a read-only user page | **Fixed** |
| Medium | Admin user updates were loosely spread into Prisma and not audit logged | **Fixed** |
| Medium | CI passed an extra argument separator, causing Jest to treat `--runInBand` as a file pattern | **Fixed** |
| Medium | Test coverage was effectively Hello World only | **Improved, still insufficient** |

---

## 4. Implemented refactor

### 4.1 Module and build integrity

Removed two resolution hazards:

- legacy `packages/ui/src/components/Form.tsx`;
- placeholder `apps/web/src/app/tenders/[id]/TenderDetailClient.ts`.

These files had the same module stem as the intended implementations. Importing `./Form` or `./TenderDetailClient` could resolve to stale code even though the correct code existed in the repository.

The evaluation component now imports the explicit form barrel.

### 4.2 Application shell and responsive system

The workbench shell now has:

- role-filtered navigation;
- mobile disclosure navigation;
- desktop account menu;
- clearer product identity and role context;
- consistent page width and spacing;
- keyboard-visible focus states;
- touch-sized actions;
- responsive primary actions.

Shared form controls and buttons were standardized around:

- minimum interaction height;
- clear focus rings;
- responsive widths;
- error states;
- hints/help text;
- consistent border/radius/spacing hierarchy.

### 4.3 Dashboard

The dashboard is no longer one generic summary for every role.

It now provides:

- buyer/admin tender portfolio and active-sourcing metrics;
- supplier submitted-bid context;
- reviewer pending-scorecard context;
- closing-soon calculation;
- role-specific hero copy and primary actions;
- queue-oriented tender cards;
- responsive stat/card grids;
- skeleton and error states.

### 4.4 Tender register and creation

The tender register was rebuilt for procurement scanning:

- search;
- lifecycle filters;
- clearer status presentation;
- deadline/budget/response context;
- responsive cards and controls.

Tender creation now behaves as a draft-first sourcing workflow rather than a plain form. Server logic validates:

- positive budget;
- valid future deadline;
- draft state on creation.

### 4.5 Tender detail

The tender detail is now the core sourcing workspace, with role-aware controls for:

- publishing;
- supplier proposal submission;
- reviewer scorecards;
- buyer award selection.

The real implementation is no longer shadowed by a placeholder module.

### 4.6 Supplier bid handling

Supplier bids now behave consistently at organization level:

- duplicate bid prevention remains per organization/tender;
- existing bids are visible to other users in the same supplier organization;
- vendor-facing API responses do not expose evaluation internals.

This is a better fit for procurement because the bidder is normally an organization, even if one individual performs the submission.

### 4.7 Reviewer controls

Current MVP guardrails now include:

- reviewer queue only includes tenders whose deadline has passed;
- direct tender-detail access is also blocked before the deadline;
- reviewers cannot score a bid from their own organization;
- a reviewer cannot submit a second evaluation for the same bid through the normal service path;
- evaluation requires score values in range, written rationale, and a recommendation;
- submitted bid and tender states move into review.

This is still **not** a full reviewer-assignment or probity model; see the roadmap.

### 4.8 Award guardrails

For the current MVP, award now requires:

- tender status `UNDER_REVIEW`;
- selected bid belongs to the tender;
- selected bid is still active/eligible;
- every active bid has at least one evaluation;
- winning bid has at least one `ACCEPT` recommendation.

On award:

- tender becomes awarded;
- winning bid becomes accepted;
- other active bids become rejected;
- notifications are created;
- an audit log entry is written.

This is safer than the previous behavior, but it is still only a minimal award model. A mature system needs a separate Award entity, approval authority, award notice, standstill/complaint handling where applicable, and a later Contract stage.

### 4.9 Registration and authentication

Public registration is now explicitly **vendor-only**.

Server changes:

- role is no longer accepted from public signup;
- user role is hard-coded to `VENDOR`;
- email is normalized;
- minimum password length is enforced server-side;
- bcrypt cost was increased for newly set passwords;
- organization and user creation occur in one transaction;
- duplicate email returns a conflict instead of leaving an orphan organization;
- JWT startup requires `JWT_SECRET` instead of falling back to a repository-known secret.

Client changes:

- registration no longer sends a role;
- debug logging was removed;
- onboarding messaging explains that buyer/reviewer/admin access must be provisioned through controlled administration;
- login and registration were rebuilt as responsive product surfaces.

### 4.10 Client session handling

The auth context now:

- checks HTTP response status when validating a stored token;
- removes invalid tokens instead of treating an error response as a user object;
- verifies profile retrieval after login;
- clears a newly issued token if profile loading fails;
- uses replacement navigation after authentication/logout.

**Remaining:** bearer tokens are still stored in `localStorage`. For a production web application, migrate to an appropriate server-managed secure, HttpOnly, SameSite session/cookie design and add the corresponding CSRF strategy.

### 4.11 Proposal document upload

The previous direct-to-object-storage flow trusted too much upload metadata.

The presign boundary now:

- requires authenticated vendor role;
- allows only PDF, DOC, and DOCX business file types;
- requires extension/content-type consistency;
- enforces a 10 MB declared size limit;
- requires positive integer size;
- sanitizes and length-limits filenames;
- creates application-controlled storage keys;
- scopes keys under a proposal path/user namespace;
- shortens presigned URL lifetime;
- signs expected content length;
- passes file size from the web client.

The generic download-URL endpoint was removed because it had no tender/bid ownership authorization.

**Important remaining controls:**

The direct-upload model still does not prove that the stored object content matches its claimed MIME type. The client-generated SHA-256 stored as `signatureHash` is also not a digital signature and is not independently verified server-side. A production design should add an upload-finalization step that inspects object metadata/content, calculates the digest server-side, performs malware/content scanning as appropriate, and only then marks the document usable.

### 4.12 Landing page

The landing page was rebuilt to:

- match the workbench design system;
- work cleanly on mobile through desktop;
- describe actual implemented capabilities;
- remove claims of end-to-end encryption/digital signatures;
- distinguish current foundation from roadmap;
- communicate buyer/supplier/reviewer workflow rather than generic “global tender management” language.

### 4.13 Admin user management

The admin area now includes:

- responsive mobile account cards;
- desktop table;
- role/status filtering;
- pagination states;
- real account editing;
- name/email/role/status/password update;
- self-demotion/self-suspension protection;
- duplicate-email and input validation;
- audit logging for account updates.

The service now explicitly constructs the Prisma update payload rather than spreading request data wholesale.

---

## 5. Procurement-domain model audit

### 5.1 Current model is still too compressed

The current schema has these primary concepts:

- User
- Organization
- Tender
- TenderDocument
- Bid
- BidDocument
- EvaluationScore
- Notification
- AuditLog

That is adequate for an MVP demonstration, but important procurement concepts are being compressed into status fields and uploaded documents.

A more durable model should distinguish the following stages/entities.

### Planning / sourcing definition

Potential entities/fields:

- procurement project / requisition;
- procurement category: goods, works, services;
- procurement method: open, selective, limited, direct where relevant;
- buyer/procuring entity;
- budget source;
- money amount + currency;
- structured line items;
- milestones;
- eligibility/qualification requirements;
- evaluation methodology.

### Tender

Needed beyond current title/description/budget/deadline:

- publication timestamp;
- opening timestamp;
- clarification period;
- amendment/version history;
- cancellation reason;
- tender documents with typed metadata;
- evaluation criteria frozen/versioned at publication;
- required submission documents;
- structured commercial requirements.

### Bid / proposal

Needed beyond uploaded files:

- organization bidder identity snapshot;
- submission version;
- submitted-at/opened-at;
- structured price/value/currency;
- line-item responses;
- compliance declarations;
- qualifications;
- withdrawal/supersession rules;
- immutable submission receipt;
- document verification state.

### Evaluation

The current `EvaluationScore` table is too granular and overloaded. It repeats notes and recommendation on every criterion row and does not create a first-class scorecard.

Recommended structure:

- `Evaluation`
  - id
  - tenderId / bidId
  - reviewerId
  - assignmentId
  - submittedAt
  - overall recommendation
  - overall rationale
  - status
  - criteriaVersion
- `EvaluationScore`
  - evaluationId
  - criterionId
  - score
  - criterion notes

Add database uniqueness around the reviewer/bid/evaluation relationship rather than relying only on an application pre-check.

### Award

Do not let `Tender.status = AWARDED` carry the complete award record.

Recommended `Award` data:

- selected bid/supplier;
- award value + currency;
- award decision timestamp;
- approval state/authority;
- rationale;
- award notice;
- unsuccessful-bid notification/debrief state;
- complaint/standstill state where applicable;
- cancellation/reversal history.

### Contract

Award and contract should be separate. A selected supplier is not the same thing as an executed legal contract.

Recommended contract layer:

- contract identifier;
- related award;
- signed date;
- effective period;
- value/currency;
- signed documents;
- amendments;
- milestones/deliverables;
- implementation/payment/progress later.

This separation follows the general OCDS model of tender -> award -> contract -> implementation.

---

## 6. Data-model findings

### 6.1 Money

`Tender.budget` is currently a `Float`.

Avoid binary floating point for procurement money. Use a fixed/decimal type and explicit currency, for example:

- `budgetAmount Decimal`
- `budgetCurrency String` using an ISO 4217 code

Bid/award/contract values need the same treatment.

### 6.2 Evaluation criteria are hard-coded in the web client

The current scorecard uses a static set of criteria and weights in the tender detail client.

This means:

- criteria are not tender-specific;
- criteria are not versioned;
- the backend cannot prove what rules were published to suppliers;
- changing UI code can change the scorecard for old tenders.

Move criteria into persisted tender data and freeze a criteria version at publication. Validate the total weight and criterion scoring scale server-side.

### 6.3 Bid document hash is misnamed

`signatureHash` is a client-calculated SHA-256 digest. It is **not** a digital signature.

Rename/migrate toward something like:

- `sha256`;
- `verificationStatus`;
- `verifiedAt`;
- optional true signature/signing fields only if cryptographic signing is later implemented.

### 6.4 Tender and bid document metadata are insufficient

Add metadata such as:

- original filename;
- storage key;
- content type;
- size;
- server-computed digest;
- uploader;
- uploaded/finalized timestamps;
- scan/verification status;
- document category/version.

### 6.5 Organization verification is too weak

Public signup can create a supplier organization by name/address, but no real ownership/identity verification exists.

A production supplier model should add some combination of:

- verified email/domain;
- organization identifier/tax/business number depending on market;
- admin invitation flow;
- organization membership/invitations;
- verification status/evidence;
- duplicate organization resolution.

### 6.6 Audit log is too sparse

Current audit events are only a partial record.

High-value events to record:

- login/security-sensitive changes;
- tender create/edit/publish/amend/cancel;
- tender document changes;
- bid submission/withdrawal;
- document finalization;
- bid opening;
- reviewer assignment/conflict declaration;
- evaluation submission;
- award intent/approval/finalization;
- admin access changes.

Audit records should include enough immutable context to investigate who did what, to which resource, when, and under what request/session context.

---

## 7. Procurement integrity and confidentiality

### Current improvement

Reviewer access is now deadline-gated and vendor evaluation data is hidden from vendor/reviewer responses in the current flow.

### Remaining gap: true bid opening

The system currently treats “deadline passed” as the opening control.

A mature design should create an explicit opening event:

1. submissions accepted until deadline;
2. deadline closes submission;
3. authorized opening occurs/records a timestamp;
4. eligible proposal metadata becomes available to assigned evaluators;
5. evaluation begins;
6. evaluation details remain restricted to authorized participants.

For two-envelope or more specialized procurement procedures, technical and financial opening can require separate states and controls.

### Remaining gap: reviewer assignment and conflicts

Any user with the REVIEWER role can currently reach eligible post-deadline tenders, subject to the own-organization conflict check.

Add:

- tender/review-panel assignment;
- conflict-of-interest declaration;
- recusal;
- reviewer quorum/minimum count;
- independent scorecard locking;
- optional moderation/consensus workflow.

---

## 8. UX and responsive audit

### What is now coherent

The branch brings these surfaces into one design language:

- application shell/navigation;
- dashboard;
- tender register;
- tender creation;
- tender detail;
- bid tracking;
- reviewer queue;
- evaluation scorecard;
- login;
- supplier registration;
- landing page;
- admin user list;
- admin user detail/edit.

Patterns include:

- `max-w-7xl` content shells;
- compact but readable typography;
- slate/white neutral workbench surfaces;
- strong state badges;
- mobile-first stacking;
- desktop enhancements instead of desktop dependencies;
- scroll tables only where a table is actually useful;
- mobile card alternatives for admin user management;
- primary action positioning;
- empty/error/loading states;
- responsive buttons/forms.

### Still worth adding

- browser-level responsive smoke tests at ~360/390, 768, 1024, and 1440 px;
- accessibility audit with axe;
- keyboard-only flow test;
- reduced-motion consideration;
- proper product illustration/screenshots only after the product state stabilizes;
- consistent toast/notification system instead of per-page notices;
- confirmation flows for destructive/high-consequence actions such as award, suspension, cancellation, and future bid withdrawal.

---

## 9. Security audit

### Fixed in this branch

- public privileged-role injection;
- known fallback JWT secret;
- reviewer pre-deadline proposal access;
- reviewer own-org conflict;
- broad proposal-upload role access;
- basic file metadata/size/path constraints;
- generic unscoped download URL endpoint;
- admin update request spreading;
- invalid stored-token profile handling.

### High-priority remaining

#### Session storage

Move browser bearer credentials away from `localStorage` for a production web deployment.

#### Upload content verification

Declared MIME type is user-controlled. Add server/object-processing validation using content signatures where useful and malware scanning appropriate to deployment risk.

#### Download authorization

Reintroduce downloads only behind a resource-aware API:

- identify document;
- resolve parent tender/bid;
- check role + ownership + workflow state;
- issue a short-lived URL only when authorized;
- audit sensitive downloads if required.

#### Rate limiting and abuse controls

Add rate limits for:

- login;
- registration;
- upload presign;
- proposal submission;
- admin mutation.

#### Secrets/configuration

Production startup should fail for other security-critical missing configuration too, not silently use development credentials such as default object-storage credentials.

#### Authorization model

RBAC is present, but many decisions also depend on resource ownership, organization, tender state, reviewer assignment, and deadline. Consolidate these rules into explicit policy functions/services rather than scattering conditional checks across controllers/services.

---

## 10. Architecture findings

### Prisma client lifecycle

Multiple services/controllers instantiate `new PrismaClient()` independently.

Create a shared injectable database/Prisma service with application lifecycle management so connection behavior is centralized and testable.

### Runtime validation

TypeScript annotations are not runtime request validation.

Adopt DTO/schema validation for API inputs, including:

- strict allowed fields;
- string lengths;
- numeric ranges;
- dates;
- enum membership;
- nested arrays;
- upload metadata.

### API proxy duplication

The Next application has multiple thin proxy routes with repeated auth/error forwarding patterns.

Create shared server proxy helpers for:

- backend base URL;
- Authorization forwarding;
- safe JSON parsing;
- upstream error propagation;
- request ID/trace context;
- timeout behavior.

Avoid forwarding all incoming headers unnecessarily.

### Database migrations

The repository currently centers on `schema.prisma`; maintain committed migration history before schema changes become production data.

### Status machine

Tender and bid state transitions are currently enforced through service conditionals.

As the workflow grows, define an explicit state transition policy/table and test every allowed/forbidden transition.

---

## 11. CI and test audit

### CI corrections in this branch

A workspace quality workflow now:

1. installs from the lockfile;
2. generates the Prisma client;
3. builds the full workspace;
4. runs API unit tests.

The initial workflow incorrectly invoked:

`pnpm --filter api test -- --runInBand`

which became `jest -- --runInBand`, so Jest treated `--runInBand` as a pattern. It now invokes Jest correctly.

### Tests added

A registration regression test verifies that:

- a public payload attempting to include `role: ADMIN` does not pass privileged role data into vendor registration;
- short passwords are rejected.

### Required next tests

#### Tender service

- vendor cannot submit after deadline;
- org cannot submit duplicate active bid;
- reviewer cannot view before deadline;
- reviewer cannot evaluate own organization;
- reviewer cannot evaluate twice;
- scores outside 0–100 rejected;
- buyer cannot award another buyer's tender;
- award blocked until all active bids evaluated;
- award requires accepted recommendation;
- statuses/notifications/audit updates are atomic.

#### File service

- allowed type/extension pairs;
- MIME mismatch;
- double/unsafe names;
- zero/negative/oversized sizes;
- key sanitization;
- presign authorization.

#### Admin

- invalid role/status rejected;
- admin cannot suspend/demote self;
- duplicate email rejected;
- update produces audit record.

#### Web

Use Playwright (or equivalent) for:

- auth redirect;
- mobile navigation;
- buyer create/publish;
- vendor submit;
- reviewer post-deadline queue;
- admin edit;
- critical responsive breakpoints.

---

## 12. Recommended roadmap

### P0 — release blockers

1. Add real runtime DTO/schema validation.
2. Move production sessions away from `localStorage`.
3. Add resource-aware document download authorization.
4. Add server-side object finalization/digest/content validation.
5. Add reviewer assignment + conflict declaration.
6. Persist/version tender evaluation criteria.
7. Use Decimal + currency for monetary values.
8. Add tender-service security/state regression tests.
9. Use a shared Prisma service.
10. Require production object-storage credentials/config rather than development defaults.

### P1 — procurement workflow maturity

1. Explicit close/opening event.
2. Tender amendments/versioning.
3. Clarification/questions workflow.
4. Structured pricing/line items.
5. First-class evaluation/scorecard entity.
6. First-class award entity.
7. Award approval / intent-to-award stage.
8. Cancellation reason/history.
9. Supplier organization membership/invitations/verification.
10. Broader audit trail and notifications.

### P2 — contract and delivery

1. Contract entity linked to award.
2. Signed contract documents.
3. Contract amendments.
4. milestones/deliverables;
5. implementation progress;
6. payment records;
7. supplier performance;
8. reporting/export/API aligned with a procurement data standard if that becomes a product requirement.

### P3 — platform maturity

1. saved filters/search;
2. notification center;
3. SLA/aging analytics;
4. procurement portfolio dashboards;
5. configurable approval matrices;
6. reusable sourcing templates;
7. structured supplier qualification;
8. debrief/complaint workflows;
9. multi-currency/localization;
10. external integrations and webhook/event model.

---

## 13. External domain/security references

These references informed the design review. They are not a declaration that Vendorse implements every control or is compliant with the referenced regimes.

### Open Contracting Data Standard (OCDS)

OCDS models a contracting process across tender, award, contract, and implementation stages. That supports the recommendation to avoid collapsing award and contract into one tender status.

- https://standard.open-contracting.org/latest/en/primer/how/
- https://standard.open-contracting.org/latest/en/guidance/map/awards_contracts/
- https://standard.open-contracting.org/latest/en/schema/codelists/

Useful product implications:

- tender, award, contract, and implementation are distinct information stages;
- award and legally binding contract should be representable separately;
- procurement documents have useful semantic categories;
- conflict-of-interest and submission documents are explicit document concepts in the standard.

### OECD public procurement integrity guidance

OECD procurement guidance emphasizes integrity safeguards and conflict-of-interest management through the procurement cycle. Vendorse should model these as workflow/data controls rather than relying on role names alone.

- https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/06/implementing-the-oecd-recommendation-on-public-procurement-in-oecd-and-partner-countries_dbc4aca7/02a46a58-en.pdf

### World Bank Procurement Framework

The current World Bank Project Procurement Framework links the September 2025 (7th Edition) Procurement Regulations. World Bank procurement materials are particularly useful as a reference for explicit bid/proposal opening, confidentiality, evaluation, rated criteria, complaints, and contract award stages.

- https://www.worldbank.org/ext/en/what-we-do/project-procurement/framework
- https://thedocs.worldbank.org/en/doc/c84273d1b230aeb2b0b8134de5dc8cd7-0290012025/original/Procurement-Regulations-7th-Edition-Sep-2025.pdf

This does **not** mean every Vendorse deployment should reproduce World Bank procedures. It demonstrates why a procurement platform should make submission close/opening/evaluation/award controls explicit and configurable.

### OWASP

OWASP's File Upload Cheat Sheet recommends defense in depth: allowed business extensions, not trusting Content-Type, application-controlled filenames, filename/size limits, authorized uploaders, and safe storage/serving.

- https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html

The branch implements part of this baseline at the upload authorization boundary, but content inspection and server-side finalization remain release work.

---

## 14. Definition of “good enough” for the next milestone

I would not call Vendorse production-ready merely because the UI is now polished and CI is green.

A defensible next milestone is:

- all key roles have a coherent responsive workflow;
- public signup cannot create privileged users;
- tenders cannot leak proposal content before close;
- reviewer conflicts/assignments are enforced;
- criteria and money are persisted correctly;
- submission files are finalized/verified server-side;
- award has a first-class record and controlled transition;
- major state rules have automated regression tests;
- audit coverage includes all material procurement decisions;
- deployment secrets/session design are production-safe.

The current refactor gets the repository much closer to that point by establishing the right workbench, access, workflow, and CI foundations instead of continuing to layer features on top of the original generic CRUD shape.
