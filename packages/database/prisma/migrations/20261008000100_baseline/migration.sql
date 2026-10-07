-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VENDOR', 'BUYER', 'REVIEWER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('GOVERNMENT', 'BUSINESS', 'NON_PROFIT');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('NOT_APPLICABLE', 'PROSPECT', 'PENDING_REVIEW', 'QUALIFIED', 'CONDITIONALLY_QUALIFIED', 'SUSPENDED', 'DISQUALIFIED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'AWARDED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ProcurementRequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'IN_SOURCING', 'CONTRACTED');

-- CreateEnum
CREATE TYPE "SourcingProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SourcingMethod" AS ENUM ('DIRECT', 'RFQ', 'RFP', 'OPEN_TENDER', 'SELECTIVE_TENDER');

-- CreateEnum
CREATE TYPE "SourcingEventType" AS ENUM ('RFI', 'RFQ', 'RFP', 'TENDER', 'BAFO');

-- CreateEnum
CREATE TYPE "SourcingEventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'OPENED', 'EVALUATING', 'AWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupplierInvitationStatus" AS ENUM ('INVITED', 'VIEWED', 'RESPONDED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ClarificationVisibility" AS ENUM ('PRIVATE', 'SHARED_ANONYMIZED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "SourcingResponseStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'SUPERSEDED', 'WITHDRAWN', 'OPENED', 'DISQUALIFIED', 'EVALUATED');

-- CreateEnum
CREATE TYPE "FileVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'QUARANTINED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OpeningProcedure" AS ENUM ('AUTOMATIC', 'MANUAL', 'DUAL_CONTROL');

-- CreateEnum
CREATE TYPE "ConflictDeclarationStatus" AS ENUM ('PENDING', 'CLEAR', 'CONFLICT');

-- CreateEnum
CREATE TYPE "EvaluationAssignmentStatus" AS ENUM ('ASSIGNED', 'BLOCKED', 'READY', 'SUBMITTED', 'RECUSED');

-- CreateEnum
CREATE TYPE "EvaluationRecommendation" AS ENUM ('ACCEPT', 'REJECT', 'REQUEST_CLARIFICATION');

-- CreateEnum
CREATE TYPE "AwardStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'INTERNAL_REVIEW', 'APPROVED', 'SENT_FOR_SIGNATURE', 'EXECUTED', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "QualificationStatus" AS ENUM ('PENDING', 'QUALIFIED', 'CONDITIONALLY_QUALIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TENDER_PUBLISHED', 'BID_SUBMITTED', 'BID_EVALUATED', 'TENDER_AWARDED', 'PROCUREMENT_REQUEST', 'EVALUATION_ASSIGNED', 'AWARD_APPROVAL', 'CONTRACT_CREATED', 'SYSTEM_NOTIFICATION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "orgId" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL,
    "address" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "legalName" TEXT,
    "registrationNumber" TEXT,
    "taxId" TEXT,
    "countryCode" VARCHAR(2),
    "domain" TEXT,
    "supplierStatus" "SupplierStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenders" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budget" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "deadline" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" "TenderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_documents" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tender_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "status" "BidStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_documents" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bid_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_scores" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_requests" (
    "id" TEXT NOT NULL,
    "workspaceOrgId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "estimatedAmount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "desiredDate" TIMESTAMP(3),
    "status" "ProcurementRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "decisionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_projects" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "workspaceOrgId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "method" "SourcingMethod" NOT NULL,
    "estimatedAmount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" "SourcingProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sourcing_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_events" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" "SourcingEventType" NOT NULL,
    "status" "SourcingEventStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sourcing_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_event_versions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sourcing_event_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_criteria" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" DECIMAL(5,2) NOT NULL,
    "minScore" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_line_items" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_invitations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "status" "SupplierInvitationStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "supplier_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clarifications" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "askedById" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "answeredById" TEXT,
    "visibility" "ClarificationVisibility" NOT NULL DEFAULT 'SHARED_ANONYMIZED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "clarifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_amendments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_responses" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "status" "SourcingResponseStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sourcing_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_response_versions" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "eventVersion" INTEGER NOT NULL,
    "submittedById" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "narrative" TEXT,
    "receiptCode" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sourcing_response_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response_line_items" (
    "id" TEXT NOT NULL,
    "responseVersionId" TEXT NOT NULL,
    "eventLineItemId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "totalPrice" DECIMAL(18,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "response_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response_answers" (
    "id" TEXT NOT NULL,
    "responseVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "response_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_objects" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT,
    "verificationStatus" "FileVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "file_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response_documents" (
    "id" TEXT NOT NULL,
    "responseVersionId" TEXT NOT NULL,
    "fileObjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "response_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opening_events" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "procedure" "OpeningProcedure" NOT NULL DEFAULT 'MANUAL',
    "note" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opening_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_assignments" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "conflictStatus" "ConflictDeclarationStatus" NOT NULL DEFAULT 'PENDING',
    "conflictNote" TEXT,
    "status" "EvaluationAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declaredAt" TIMESTAMP(3),

    CONSTRAINT "evaluation_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scorecards" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "responseVersionId" TEXT NOT NULL,
    "recommendation" "EvaluationRecommendation" NOT NULL,
    "rationale" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criterion_scores" (
    "id" TEXT NOT NULL,
    "scorecardId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "criterion_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awards" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "responseVersionId" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "recommendedById" TEXT NOT NULL,
    "approvedById" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "AwardStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "recommendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "awardId" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "signedDocumentKey" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_performance_reviews" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "quality" DECIMAL(5,2) NOT NULL,
    "delivery" DECIMAL(5,2) NOT NULL,
    "responsiveness" DECIMAL(5,2) NOT NULL,
    "commercial" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_qualifications" (
    "id" TEXT NOT NULL,
    "supplierOrgId" TEXT NOT NULL,
    "status" "QualificationStatus" NOT NULL,
    "scopeCategory" TEXT,
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "reviewedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_orgId_role_status_idx" ON "users"("orgId", "role", "status");

-- CreateIndex
CREATE INDEX "organizations_supplierStatus_idx" ON "organizations"("supplierStatus");

-- CreateIndex
CREATE INDEX "tenders_status_idx" ON "tenders"("status");

-- CreateIndex
CREATE INDEX "bids_status_idx" ON "bids"("status");

-- CreateIndex
CREATE INDEX "procurement_requests_workspaceOrgId_status_idx" ON "procurement_requests"("workspaceOrgId", "status");

-- CreateIndex
CREATE INDEX "procurement_requests_createdById_status_idx" ON "procurement_requests"("createdById", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sourcing_projects_requestId_key" ON "sourcing_projects"("requestId");

-- CreateIndex
CREATE INDEX "sourcing_projects_workspaceOrgId_status_idx" ON "sourcing_projects"("workspaceOrgId", "status");

-- CreateIndex
CREATE INDEX "sourcing_events_projectId_status_idx" ON "sourcing_events"("projectId", "status");

-- CreateIndex
CREATE INDEX "sourcing_events_closeAt_status_idx" ON "sourcing_events"("closeAt", "status");

-- CreateIndex
CREATE INDEX "sourcing_event_versions_eventId_createdAt_idx" ON "sourcing_event_versions"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sourcing_event_versions_eventId_version_key" ON "sourcing_event_versions"("eventId", "version");

-- CreateIndex
CREATE INDEX "event_criteria_eventId_sortOrder_idx" ON "event_criteria"("eventId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "event_criteria_eventId_key_key" ON "event_criteria"("eventId", "key");

-- CreateIndex
CREATE INDEX "event_line_items_eventId_sortOrder_idx" ON "event_line_items"("eventId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "event_line_items_eventId_code_key" ON "event_line_items"("eventId", "code");

-- CreateIndex
CREATE INDEX "supplier_invitations_supplierOrgId_status_idx" ON "supplier_invitations"("supplierOrgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_invitations_eventId_supplierOrgId_key" ON "supplier_invitations"("eventId", "supplierOrgId");

-- CreateIndex
CREATE INDEX "clarifications_eventId_createdAt_idx" ON "clarifications"("eventId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_amendments_eventId_version_key" ON "event_amendments"("eventId", "version");

-- CreateIndex
CREATE INDEX "sourcing_responses_eventId_status_idx" ON "sourcing_responses"("eventId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sourcing_responses_eventId_supplierOrgId_key" ON "sourcing_responses"("eventId", "supplierOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "sourcing_response_versions_receiptCode_key" ON "sourcing_response_versions"("receiptCode");

-- CreateIndex
CREATE INDEX "sourcing_response_versions_responseId_submittedAt_idx" ON "sourcing_response_versions"("responseId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sourcing_response_versions_responseId_version_key" ON "sourcing_response_versions"("responseId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "response_line_items_responseVersionId_eventLineItemId_key" ON "response_line_items"("responseVersionId", "eventLineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "response_answers_responseVersionId_key_key" ON "response_answers"("responseVersionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "file_objects_storageKey_key" ON "file_objects"("storageKey");

-- CreateIndex
CREATE INDEX "file_objects_ownerId_verificationStatus_idx" ON "file_objects"("ownerId", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "response_documents_fileObjectId_key" ON "response_documents"("fileObjectId");

-- CreateIndex
CREATE INDEX "response_documents_responseVersionId_idx" ON "response_documents"("responseVersionId");

-- CreateIndex
CREATE INDEX "opening_events_eventId_openedAt_idx" ON "opening_events"("eventId", "openedAt");

-- CreateIndex
CREATE INDEX "evaluation_assignments_reviewerId_status_idx" ON "evaluation_assignments"("reviewerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_assignments_responseId_reviewerId_key" ON "evaluation_assignments"("responseId", "reviewerId");

-- CreateIndex
CREATE UNIQUE INDEX "scorecards_assignmentId_key" ON "scorecards"("assignmentId");

-- CreateIndex
CREATE INDEX "scorecards_reviewerId_submittedAt_idx" ON "scorecards"("reviewerId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "criterion_scores_scorecardId_criterionId_key" ON "criterion_scores"("scorecardId", "criterionId");

-- CreateIndex
CREATE UNIQUE INDEX "awards_eventId_key" ON "awards"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "awards_responseVersionId_key" ON "awards"("responseVersionId");

-- CreateIndex
CREATE INDEX "awards_supplierOrgId_status_idx" ON "awards"("supplierOrgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_awardId_key" ON "contracts"("awardId");

-- CreateIndex
CREATE INDEX "contracts_supplierOrgId_status_idx" ON "contracts"("supplierOrgId", "status");

-- CreateIndex
CREATE INDEX "contracts_endDate_status_idx" ON "contracts"("endDate", "status");

-- CreateIndex
CREATE INDEX "supplier_performance_reviews_contractId_periodEnd_idx" ON "supplier_performance_reviews"("contractId", "periodEnd");

-- CreateIndex
CREATE INDEX "supplier_performance_reviews_supplierOrgId_periodEnd_idx" ON "supplier_performance_reviews"("supplierOrgId", "periodEnd");

-- CreateIndex
CREATE INDEX "outbox_events_status_nextAttemptAt_idx" ON "outbox_events"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "outbox_events_aggregateType_aggregateId_createdAt_idx" ON "outbox_events"("aggregateType", "aggregateId", "createdAt");

-- CreateIndex
CREATE INDEX "supplier_qualifications_supplierOrgId_status_expiresAt_idx" ON "supplier_qualifications"("supplierOrgId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_timestamp_idx" ON "audit_logs"("targetType", "targetId", "timestamp");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tender_documents" ADD CONSTRAINT "tender_documents_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_scores" ADD CONSTRAINT "evaluation_scores_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_workspaceOrgId_fkey" FOREIGN KEY ("workspaceOrgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_projects" ADD CONSTRAINT "sourcing_projects_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "procurement_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_projects" ADD CONSTRAINT "sourcing_projects_workspaceOrgId_fkey" FOREIGN KEY ("workspaceOrgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_projects" ADD CONSTRAINT "sourcing_projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_events" ADD CONSTRAINT "sourcing_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "sourcing_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_events" ADD CONSTRAINT "sourcing_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_event_versions" ADD CONSTRAINT "sourcing_event_versions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_criteria" ADD CONSTRAINT "event_criteria_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_line_items" ADD CONSTRAINT "event_line_items_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invitations" ADD CONSTRAINT "supplier_invitations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_invitations" ADD CONSTRAINT "supplier_invitations_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarifications" ADD CONSTRAINT "clarifications_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarifications" ADD CONSTRAINT "clarifications_askedById_fkey" FOREIGN KEY ("askedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarifications" ADD CONSTRAINT "clarifications_answeredById_fkey" FOREIGN KEY ("answeredById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_amendments" ADD CONSTRAINT "event_amendments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_amendments" ADD CONSTRAINT "event_amendments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_responses" ADD CONSTRAINT "sourcing_responses_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_responses" ADD CONSTRAINT "sourcing_responses_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_response_versions" ADD CONSTRAINT "sourcing_response_versions_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "sourcing_responses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_response_versions" ADD CONSTRAINT "sourcing_response_versions_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_line_items" ADD CONSTRAINT "response_line_items_responseVersionId_fkey" FOREIGN KEY ("responseVersionId") REFERENCES "sourcing_response_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_line_items" ADD CONSTRAINT "response_line_items_eventLineItemId_fkey" FOREIGN KEY ("eventLineItemId") REFERENCES "event_line_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_responseVersionId_fkey" FOREIGN KEY ("responseVersionId") REFERENCES "sourcing_response_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_objects" ADD CONSTRAINT "file_objects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_documents" ADD CONSTRAINT "response_documents_responseVersionId_fkey" FOREIGN KEY ("responseVersionId") REFERENCES "sourcing_response_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_documents" ADD CONSTRAINT "response_documents_fileObjectId_fkey" FOREIGN KEY ("fileObjectId") REFERENCES "file_objects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_events" ADD CONSTRAINT "opening_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_events" ADD CONSTRAINT "opening_events_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "sourcing_responses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorecards" ADD CONSTRAINT "scorecards_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "evaluation_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorecards" ADD CONSTRAINT "scorecards_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scorecards" ADD CONSTRAINT "scorecards_responseVersionId_fkey" FOREIGN KEY ("responseVersionId") REFERENCES "sourcing_response_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterion_scores" ADD CONSTRAINT "criterion_scores_scorecardId_fkey" FOREIGN KEY ("scorecardId") REFERENCES "scorecards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criterion_scores" ADD CONSTRAINT "criterion_scores_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "event_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sourcing_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_responseVersionId_fkey" FOREIGN KEY ("responseVersionId") REFERENCES "sourcing_response_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_recommendedById_fkey" FOREIGN KEY ("recommendedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "awards" ADD CONSTRAINT "awards_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_awardId_fkey" FOREIGN KEY ("awardId") REFERENCES "awards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_performance_reviews" ADD CONSTRAINT "supplier_performance_reviews_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_performance_reviews" ADD CONSTRAINT "supplier_performance_reviews_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_performance_reviews" ADD CONSTRAINT "supplier_performance_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_qualifications" ADD CONSTRAINT "supplier_qualifications_supplierOrgId_fkey" FOREIGN KEY ("supplierOrgId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_qualifications" ADD CONSTRAINT "supplier_qualifications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Supplier legal identity uniqueness
CREATE UNIQUE INDEX "organizations_countryCode_registrationNumber_key" ON "organizations"("countryCode", "registrationNumber");
