import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@vendorse/database';
import { randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';

type Actor = {
  id: string;
  role: string;
  orgId: string;
};

type CriterionInput = {
  key: string;
  name: string;
  description?: string;
  weight: number;
  minScore?: number;
  maxScore?: number;
  mandatory?: boolean;
};

type LineItemInput = {
  code: string;
  description: string;
  quantity: number;
  unit: string;
};

@Injectable()
export class ProcurementService {
  constructor(private readonly prisma: PrismaService) {}

  private money(value: unknown, field: string, allowZero = false) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || (allowZero ? numeric < 0 : numeric <= 0)) {
      throw new BadRequestException(field + ' must be a valid ' + (allowZero ? 'non-negative' : 'positive') + ' amount');
    }
    return new Prisma.Decimal(String(value));
  }

  private currency(value: string) {
    const normalized = String(value || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) {
      throw new BadRequestException('currency must be a 3-letter ISO 4217 code');
    }
    return normalized;
  }

  private assertWorkspace(actor: Actor, workspaceOrgId: string) {
    if (actor.role !== 'ADMIN' && actor.orgId !== workspaceOrgId) {
      throw new ForbiddenException('This record belongs to another procurement workspace');
    }
  }

  private async audit(
    tx: Prisma.TransactionClient,
    actorId: string,
    actionType: string,
    targetId: string,
    targetType: string,
    ipAddress: string,
  ) {
    await tx.auditLog.create({
      data: { actorId, actionType, targetId, targetType, ipAddress },
    });
    await tx.outboxEvent.create({
      data: {
        topic: actionType.toLowerCase().replaceAll('_', '.'),
        aggregateType: targetType,
        aggregateId: targetId,
        payload: {
          actorId,
          actionType,
          targetId,
          targetType,
        },
      },
    });
  }

  private eventSnapshot(event: {
    id: string;
    title: string;
    instructions: string;
    type: string;
    version: number;
    openAt: Date | null;
    closeAt: Date;
    criteria: Array<{
      id: string;
      key: string;
      name: string;
      description: string | null;
      weight: Prisma.Decimal;
      minScore: number;
      maxScore: number;
      mandatory: boolean;
      sortOrder: number;
    }>;
    lineItems: Array<{
      id: string;
      code: string;
      description: string;
      quantity: Prisma.Decimal;
      unit: string;
      sortOrder: number;
    }>;
  }) {
    return {
      eventId: event.id,
      version: event.version,
      type: event.type,
      title: event.title,
      instructions: event.instructions,
      openAt: event.openAt?.toISOString() || null,
      closeAt: event.closeAt.toISOString(),
      criteria: event.criteria.map((criterion) => ({
        id: criterion.id,
        key: criterion.key,
        name: criterion.name,
        description: criterion.description,
        weight: criterion.weight.toString(),
        minScore: criterion.minScore,
        maxScore: criterion.maxScore,
        mandatory: criterion.mandatory,
        sortOrder: criterion.sortOrder,
      })),
      lineItems: event.lineItems.map((item) => ({
        id: item.id,
        code: item.code,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        sortOrder: item.sortOrder,
      })),
    };
  }

  async listRequests(actor: Actor) {
    return this.prisma.procurementRequest.findMany({
      where:
        actor.role === 'ADMIN'
          ? undefined
          : actor.role === 'BUYER'
            ? { workspaceOrgId: actor.orgId }
            : { createdById: actor.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createRequest(
    actor: Actor,
    data: {
      title: string;
      description: string;
      category: string;
      estimatedAmount: number | string;
      currency: string;
      desiredDate?: string | Date;
    },
    ipAddress: string,
  ) {
    const title = data.title?.trim();
    const description = data.description?.trim();
    const category = data.category?.trim();
    if (!title || !description || !category) {
      throw new BadRequestException('title, description, and category are required');
    }
    const desiredDate = data.desiredDate ? new Date(data.desiredDate) : null;
    if (desiredDate && Number.isNaN(desiredDate.getTime())) {
      throw new BadRequestException('desiredDate is invalid');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.procurementRequest.create({
        data: {
          workspaceOrgId: actor.orgId,
          createdById: actor.id,
          title,
          description,
          category,
          estimatedAmount: this.money(data.estimatedAmount, 'estimatedAmount'),
          currency: this.currency(data.currency),
          desiredDate,
        },
      });
      await this.audit(tx, actor.id, 'PROCUREMENT_REQUEST_CREATED', request.id, 'PROCUREMENT_REQUEST', ipAddress);
      return request;
    });
  }

  async submitRequest(actor: Actor, id: string, ipAddress: string) {
    const request = await this.prisma.procurementRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Procurement request not found');
    if (request.createdById !== actor.id && actor.role !== 'ADMIN') {
      throw new ForbiddenException('Only the request owner can submit this request');
    }
    if (request.status !== 'DRAFT') {
      throw new ConflictException('Only draft requests can be submitted');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.procurementRequest.update({
        where: { id },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      });
      await this.audit(tx, actor.id, 'PROCUREMENT_REQUEST_SUBMITTED', id, 'PROCUREMENT_REQUEST', ipAddress);
      return updated;
    });
  }

  async decideRequest(
    actor: Actor,
    id: string,
    approved: boolean,
    reason: string,
    ipAddress: string,
  ) {
    if (actor.role !== 'ADMIN') {
      throw new ForbiddenException('Administrator approval is required');
    }
    const request = await this.prisma.procurementRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Procurement request not found');
    if (request.status !== 'SUBMITTED') {
      throw new ConflictException('Only submitted requests can be decided');
    }
    if (!approved && !reason?.trim()) {
      throw new BadRequestException('A rejection reason is required');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.procurementRequest.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          approvedAt: approved ? new Date() : null,
          decisionReason: reason?.trim() || null,
        },
      });
      await this.audit(
        tx,
        actor.id,
        approved ? 'PROCUREMENT_REQUEST_APPROVED' : 'PROCUREMENT_REQUEST_REJECTED',
        id,
        'PROCUREMENT_REQUEST',
        ipAddress,
      );
      return updated;
    });
  }

  async createProject(
    actor: Actor,
    requestId: string,
    data: { method: string; title?: string },
    ipAddress: string,
  ) {
    const request = await this.prisma.procurementRequest.findUnique({
      where: { id: requestId },
      include: { project: true },
    });
    if (!request) throw new NotFoundException('Procurement request not found');
    this.assertWorkspace(actor, request.workspaceOrgId);
    if (!['BUYER', 'ADMIN'].includes(actor.role)) {
      throw new ForbiddenException('Only procurement users can source an approved request');
    }
    if (request.status !== 'APPROVED') {
      throw new ConflictException('Request must be approved before sourcing begins');
    }
    if (request.project) {
      throw new ConflictException('A sourcing project already exists for this request');
    }
    const allowedMethods = ['DIRECT', 'RFQ', 'RFP', 'OPEN_TENDER', 'SELECTIVE_TENDER'];
    if (!allowedMethods.includes(data.method)) {
      throw new BadRequestException('Invalid sourcing method');
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.sourcingProject.create({
        data: {
          requestId,
          workspaceOrgId: request.workspaceOrgId,
          ownerId: actor.id,
          title: data.title?.trim() || request.title,
          category: request.category,
          method: data.method as never,
          estimatedAmount: request.estimatedAmount,
          currency: request.currency,
          status: 'ACTIVE',
        },
      });
      await tx.procurementRequest.update({
        where: { id: requestId },
        data: { status: 'IN_SOURCING' },
      });
      await this.audit(tx, actor.id, 'SOURCING_PROJECT_CREATED', project.id, 'SOURCING_PROJECT', ipAddress);
      return project;
    });
  }

  async createEvent(
    actor: Actor,
    projectId: string,
    data: {
      type: string;
      title: string;
      instructions: string;
      closeAt: string | Date;
      criteria: CriterionInput[];
      lineItems?: LineItemInput[];
    },
    ipAddress: string,
  ) {
    if (!['BUYER', 'ADMIN'].includes(actor.role)) {
      throw new ForbiddenException('Only procurement users can create sourcing events');
    }
    const project = await this.prisma.sourcingProject.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Sourcing project not found');
    this.assertWorkspace(actor, project.workspaceOrgId);

    const eventTypes = ['RFI', 'RFQ', 'RFP', 'TENDER', 'BAFO'];
    if (!eventTypes.includes(data.type)) throw new BadRequestException('Invalid event type');
    const closeAt = new Date(data.closeAt);
    if (Number.isNaN(closeAt.getTime()) || closeAt <= new Date()) {
      throw new BadRequestException('closeAt must be in the future');
    }
    if (!data.title?.trim() || !data.instructions?.trim()) {
      throw new BadRequestException('title and instructions are required');
    }
    if (!Array.isArray(data.criteria) || data.criteria.length === 0) {
      throw new BadRequestException('At least one evaluation criterion is required');
    }

    const keys = new Set<string>();
    let totalWeight = 0;
    for (const criterion of data.criteria) {
      const key = criterion.key?.trim();
      if (!key || keys.has(key)) throw new BadRequestException('Criterion keys must be unique and non-empty');
      keys.add(key);
      if (!criterion.name?.trim()) throw new BadRequestException('Criterion name is required');
      if (!Number.isFinite(Number(criterion.weight)) || Number(criterion.weight) <= 0) {
        throw new BadRequestException('Criterion weights must be positive');
      }
      totalWeight += Number(criterion.weight);
      const min = criterion.minScore ?? 0;
      const max = criterion.maxScore ?? 100;
      if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max <= min) {
        throw new BadRequestException('Criterion score range is invalid');
      }
    }
    if (Math.abs(totalWeight - 100) > 0.001) {
      throw new BadRequestException('Evaluation criterion weights must total 100');
    }

    const lineCodes = new Set<string>();
    for (const item of data.lineItems || []) {
      if (!item.code?.trim() || lineCodes.has(item.code.trim())) {
        throw new BadRequestException('Line item codes must be unique and non-empty');
      }
      lineCodes.add(item.code.trim());
      if (!item.description?.trim() || !item.unit?.trim() || Number(item.quantity) <= 0) {
        throw new BadRequestException('Line item description, unit, and positive quantity are required');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const event = await tx.sourcingEvent.create({
        data: {
          projectId,
          createdById: actor.id,
          type: data.type as never,
          title: data.title.trim(),
          instructions: data.instructions.trim(),
          closeAt,
          criteria: {
            create: data.criteria.map((criterion, index) => ({
              key: criterion.key.trim(),
              name: criterion.name.trim(),
              description: criterion.description?.trim() || null,
              weight: new Prisma.Decimal(String(criterion.weight)),
              minScore: criterion.minScore ?? 0,
              maxScore: criterion.maxScore ?? 100,
              mandatory: Boolean(criterion.mandatory),
              sortOrder: index,
            })),
          },
          lineItems: {
            create: (data.lineItems || []).map((item, index) => ({
              code: item.code.trim(),
              description: item.description.trim(),
              quantity: new Prisma.Decimal(String(item.quantity)),
              unit: item.unit.trim(),
              sortOrder: index,
            })),
          },
        },
        include: { criteria: true, lineItems: true },
      });
      await this.audit(tx, actor.id, 'SOURCING_EVENT_CREATED', event.id, 'SOURCING_EVENT', ipAddress);
      return event;
    });
  }

  async publishEvent(actor: Actor, eventId: string, ipAddress: string) {
    const event = await this.prisma.sourcingEvent.findUnique({
      where: { id: eventId },
      include: { project: true, criteria: true, lineItems: true },
    });
    if (!event) throw new NotFoundException('Sourcing event not found');
    this.assertWorkspace(actor, event.project.workspaceOrgId);
    if (!['BUYER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException();
    if (event.status !== 'DRAFT') throw new ConflictException('Only draft events can be published');
    if (event.closeAt <= new Date()) throw new ConflictException('Event close time has passed');
    const totalWeight = event.criteria.reduce((sum, c) => sum + Number(c.weight), 0);
    if (event.criteria.length === 0 || Math.abs(totalWeight - 100) > 0.001) {
      throw new ConflictException('Published events require a frozen 100% evaluation plan');
    }
    return this.prisma.$transaction(async (tx) => {
      const publishedAt = new Date();
      const updated = await tx.sourcingEvent.update({
        where: { id: eventId },
        data: { status: 'PUBLISHED', publishedAt },
        include: { criteria: true, lineItems: true },
      });
      await tx.sourcingEventVersion.create({
        data: {
          eventId,
          version: updated.version,
          snapshot: this.eventSnapshot(updated),
        },
      });
      await this.audit(tx, actor.id, 'SOURCING_EVENT_PUBLISHED', eventId, 'SOURCING_EVENT', ipAddress);
      return updated;
    });
  }

  async listReviewers() {
    return this.prisma.user.findMany({
      where: { role: 'REVIEWER', status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        orgId: true,
        organization: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async listSuppliers() {
    return this.prisma.organization.findMany({
      where: { supplierStatus: { not: 'NOT_APPLICABLE' } },
      select: {
        id: true,
        name: true,
        legalName: true,
        countryCode: true,
        registrationNumber: true,
        supplierStatus: true,
        verified: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async qualifySupplier(
    actor: Actor,
    supplierOrgId: string,
    data: { status: string; scopeCategory?: string; notes?: string; expiresAt?: string | Date },
    ipAddress: string,
  ) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Administrator access required');
    const allowed = ['PENDING', 'QUALIFIED', 'CONDITIONALLY_QUALIFIED', 'REJECTED', 'EXPIRED'];
    if (!allowed.includes(data.status)) throw new BadRequestException('Invalid qualification status');
    const supplier = await this.prisma.organization.findUnique({ where: { id: supplierOrgId } });
    if (!supplier) throw new NotFoundException('Supplier organization not found');
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new BadRequestException('expiresAt is invalid');

    const supplierStatus =
      data.status === 'QUALIFIED'
        ? 'QUALIFIED'
        : data.status === 'CONDITIONALLY_QUALIFIED'
          ? 'CONDITIONALLY_QUALIFIED'
          : data.status === 'REJECTED'
            ? 'DISQUALIFIED'
            : 'PENDING_REVIEW';

    return this.prisma.$transaction(async (tx) => {
      const qualification = await tx.supplierQualification.create({
        data: {
          supplierOrgId,
          reviewedById: actor.id,
          status: data.status as never,
          scopeCategory: data.scopeCategory?.trim() || null,
          notes: data.notes?.trim() || null,
          expiresAt,
        },
      });
      await tx.organization.update({
        where: { id: supplierOrgId },
        data: {
          supplierStatus: supplierStatus as never,
          verified: ['QUALIFIED', 'CONDITIONALLY_QUALIFIED'].includes(data.status),
        },
      });
      await this.audit(tx, actor.id, 'SUPPLIER_QUALIFICATION_RECORDED', qualification.id, 'SUPPLIER_QUALIFICATION', ipAddress);
      return qualification;
    });
  }

  async inviteSupplier(actor: Actor, eventId: string, supplierOrgId: string, ipAddress: string) {
    const event = await this.prisma.sourcingEvent.findUnique({
      where: { id: eventId },
      include: { project: true },
    });
    if (!event) throw new NotFoundException('Sourcing event not found');
    this.assertWorkspace(actor, event.project.workspaceOrgId);
    if (!['BUYER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException();
    if (!['DRAFT', 'PUBLISHED'].includes(event.status)) {
      throw new ConflictException('Suppliers can only be invited before the event closes');
    }
    const supplier = await this.prisma.organization.findUnique({ where: { id: supplierOrgId } });
    if (!supplier || supplier.supplierStatus === 'NOT_APPLICABLE') {
      throw new BadRequestException('Selected organization is not a supplier');
    }
    const invitation = await this.prisma.supplierInvitation.upsert({
      where: { eventId_supplierOrgId: { eventId, supplierOrgId } },
      create: { eventId, supplierOrgId },
      update: { status: 'INVITED', invitedAt: new Date() },
    });
    await this.prisma.auditLog.create({
      data: { actorId: actor.id, actionType: 'SUPPLIER_INVITED', targetId: invitation.id, targetType: 'SUPPLIER_INVITATION', ipAddress },
    });
    return invitation;
  }

  async askClarification(actor: Actor, eventId: string, question: string, ipAddress: string) {
    if (actor.role !== 'VENDOR') throw new ForbiddenException('Supplier access required');
    const event = await this.prisma.sourcingEvent.findUnique({ where: { id: eventId } });
    if (!event || event.status !== 'PUBLISHED' || event.closeAt <= new Date()) {
      throw new ConflictException('Clarifications are closed for this event');
    }
    const invitation = await this.prisma.supplierInvitation.findUnique({
      where: { eventId_supplierOrgId: { eventId, supplierOrgId: actor.orgId } },
    });
    if (!invitation) throw new ForbiddenException('Your organization was not invited to this event');
    if (!question?.trim()) throw new BadRequestException('question is required');
    return this.prisma.$transaction(async (tx) => {
      const clarification = await tx.clarification.create({
        data: { eventId, askedById: actor.id, question: question.trim() },
      });
      await this.audit(tx, actor.id, 'CLARIFICATION_ASKED', clarification.id, 'CLARIFICATION', ipAddress);
      return clarification;
    });
  }

  async answerClarification(actor: Actor, clarificationId: string, answer: string, ipAddress: string) {
    if (!['BUYER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException();
    const clarification = await this.prisma.clarification.findUnique({
      where: { id: clarificationId },
      include: { event: { include: { project: true } } },
    });
    if (!clarification) throw new NotFoundException('Clarification not found');
    this.assertWorkspace(actor, clarification.event.project.workspaceOrgId);
    if (!answer?.trim()) throw new BadRequestException('answer is required');
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.clarification.update({
        where: { id: clarificationId },
        data: { answer: answer.trim(), answeredById: actor.id, answeredAt: new Date() },
      });
      await this.audit(tx, actor.id, 'CLARIFICATION_ANSWERED', clarificationId, 'CLARIFICATION', ipAddress);
      return updated;
    });
  }

  async amendEvent(
    actor: Actor,
    eventId: string,
    data: { summary: string; closeAt?: string | Date },
    ipAddress: string,
  ) {
    const event = await this.prisma.sourcingEvent.findUnique({
      where: { id: eventId },
      include: { project: true, criteria: true, lineItems: true },
    });
    if (!event) throw new NotFoundException('Sourcing event not found');
    this.assertWorkspace(actor, event.project.workspaceOrgId);
    if (!['BUYER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException();
    if (event.status !== 'PUBLISHED') throw new ConflictException('Only published events can be amended');
    if (!data.summary?.trim()) throw new BadRequestException('summary is required');
    const closeAt = data.closeAt ? new Date(data.closeAt) : event.closeAt;
    if (Number.isNaN(closeAt.getTime()) || closeAt <= new Date()) {
      throw new BadRequestException('Amended closeAt must be in the future');
    }
    const nextVersion = event.version + 1;
    return this.prisma.$transaction(async (tx) => {
      const amendment = await tx.eventAmendment.create({
        data: { eventId, version: nextVersion, summary: data.summary.trim(), createdById: actor.id },
      });
      const updatedEvent = await tx.sourcingEvent.update({
        where: { id: eventId },
        data: { version: nextVersion, closeAt },
        include: { criteria: true, lineItems: true },
      });
      await tx.sourcingEventVersion.create({
        data: {
          eventId,
          version: nextVersion,
          snapshot: this.eventSnapshot(updatedEvent),
        },
      });
      await this.audit(tx, actor.id, 'SOURCING_EVENT_AMENDED', amendment.id, 'EVENT_AMENDMENT', ipAddress);
      return amendment;
    });
  }

  async submitResponse(
    actor: Actor,
    eventId: string,
    data: {
      currency: string;
      totalAmount?: number | string;
      narrative?: string;
      lineItems?: Array<{ eventLineItemId: string; unitPrice: number | string; notes?: string }>;
      answers?: Array<{ key: string; value: string }>;
      documentIds?: string[];
    },
    ipAddress: string,
  ) {
    if (actor.role !== 'VENDOR') throw new ForbiddenException('Supplier access required');
    const event = await this.prisma.sourcingEvent.findUnique({
      where: { id: eventId },
      include: { lineItems: true },
    });
    if (!event || event.status !== 'PUBLISHED') throw new ConflictException('Event is not open for responses');
    if (event.closeAt <= new Date()) throw new ConflictException('Submission deadline has passed');

    const [invitation, supplier] = await Promise.all([
      this.prisma.supplierInvitation.findUnique({
        where: { eventId_supplierOrgId: { eventId, supplierOrgId: actor.orgId } },
      }),
      this.prisma.organization.findUnique({ where: { id: actor.orgId } }),
    ]);
    if (!invitation) throw new ForbiddenException('Your organization was not invited');
    if (!supplier || !['QUALIFIED', 'CONDITIONALLY_QUALIFIED'].includes(supplier.supplierStatus)) {
      throw new ForbiddenException('Supplier qualification is required before submission');
    }

    const currency = this.currency(data.currency);
    const providedLines = data.lineItems || [];
    const lineMap = new Map(providedLines.map((line) => [line.eventLineItemId, line]));
    if (event.lineItems.length > 0 && event.lineItems.some((item) => !lineMap.has(item.id))) {
      throw new BadRequestException('Every event line item requires a price response');
    }

    let computedTotal = new Prisma.Decimal(0);
    const normalizedLines = event.lineItems.map((item) => {
      const line = lineMap.get(item.id)!;
      const unitPrice = this.money(line.unitPrice, 'unitPrice', true);
      const totalPrice = item.quantity.mul(unitPrice);
      computedTotal = computedTotal.add(totalPrice);
      return {
        eventLineItemId: item.id,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        notes: line.notes?.trim() || null,
      };
    });
    const totalAmount =
      event.lineItems.length > 0
        ? computedTotal
        : this.money(data.totalAmount, 'totalAmount');

    const documentIds = Array.from(new Set(data.documentIds || []));
    const files = documentIds.length
      ? await this.prisma.fileObject.findMany({
          where: {
            id: { in: documentIds },
            ownerId: actor.id,
            verificationStatus: 'VERIFIED',
            responseDocument: { is: null },
          },
        })
      : [];
    if (files.length !== documentIds.length) {
      throw new BadRequestException('All response documents must be server-verified and unused');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.sourcingResponse.findUnique({
        where: { eventId_supplierOrgId: { eventId, supplierOrgId: actor.orgId } },
      });
      const response =
        existing ||
        (await tx.sourcingResponse.create({
          data: { eventId, supplierOrgId: actor.orgId, status: 'DRAFT' },
        }));
      const nextVersion = response.currentVersion + 1;
      const receiptCode = 'VR-' + randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase();

      const version = await tx.sourcingResponseVersion.create({
        data: {
          responseId: response.id,
          version: nextVersion,
          eventVersion: event.version,
          submittedById: actor.id,
          totalAmount,
          currency,
          narrative: data.narrative?.trim() || null,
          receiptCode,
          lineItems: { create: normalizedLines },
          answers: {
            create: (data.answers || []).map((answer) => ({
              key: answer.key.trim(),
              value: answer.value.trim(),
            })),
          },
          documents: {
            create: files.map((file) => ({ fileObjectId: file.id })),
          },
        },
        include: {
          lineItems: true,
          answers: true,
          documents: { include: { fileObject: true } },
        },
      });

      await tx.sourcingResponse.update({
        where: { id: response.id },
        data: { currentVersion: nextVersion, status: 'SUBMITTED' },
      });
      await tx.supplierInvitation.update({
        where: { id: invitation.id },
        data: { status: 'RESPONDED', respondedAt: new Date() },
      });
      await this.audit(tx, actor.id, 'SOURCING_RESPONSE_SUBMITTED', version.id, 'SOURCING_RESPONSE_VERSION', ipAddress);
      return version;
    });
  }

  async openEvent(actor: Actor, eventId: string, note: string | undefined, ipAddress: string) {
    const event = await this.prisma.sourcingEvent.findUnique({
      where: { id: eventId },
      include: { project: true },
    });
    if (!event) throw new NotFoundException('Sourcing event not found');
    this.assertWorkspace(actor, event.project.workspaceOrgId);
    if (!['BUYER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException();
    if (event.status !== 'PUBLISHED') throw new ConflictException('Only published events can be opened');
    if (event.closeAt > new Date()) throw new ConflictException('Event cannot be opened before the submission deadline');

    return this.prisma.$transaction(async (tx) => {
      const opening = await tx.openingEvent.create({
        data: { eventId, openedById: actor.id, note: note?.trim() || null },
      });
      await tx.sourcingEvent.update({
        where: { id: eventId },
        data: { status: 'OPENED', openedAt: opening.openedAt },
      });
      await tx.sourcingResponse.updateMany({
        where: { eventId, status: 'SUBMITTED' },
        data: { status: 'OPENED' },
      });
      await this.audit(tx, actor.id, 'SOURCING_EVENT_OPENED', opening.id, 'OPENING_EVENT', ipAddress);
      return opening;
    });
  }

  async assignReviewer(actor: Actor, eventId: string, responseId: string, reviewerId: string, ipAddress: string) {
    const event = await this.prisma.sourcingEvent.findUnique({
      where: { id: eventId },
      include: { project: true },
    });
    if (!event) throw new NotFoundException('Sourcing event not found');
    this.assertWorkspace(actor, event.project.workspaceOrgId);
    if (!['BUYER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException();

    const [response, reviewer] = await Promise.all([
      this.prisma.sourcingResponse.findUnique({ where: { id: responseId } }),
      this.prisma.user.findUnique({ where: { id: reviewerId } }),
    ]);
    if (!response || response.eventId !== eventId) throw new BadRequestException('Response does not belong to this event');
    if (!reviewer || reviewer.role !== 'REVIEWER' || reviewer.status !== 'ACTIVE') {
      throw new BadRequestException('A valid active reviewer is required');
    }
    if (reviewer.orgId === response.supplierOrgId) {
      throw new ConflictException('Reviewer belongs to the supplier organization');
    }

    const assignment = await this.prisma.evaluationAssignment.upsert({
      where: { responseId_reviewerId: { responseId, reviewerId } },
      create: { eventId, responseId, reviewerId },
      update: { status: 'ASSIGNED', conflictStatus: 'PENDING', conflictNote: null, declaredAt: null },
    });
    await this.prisma.notification.create({
      data: {
        userId: reviewerId,
        type: 'EVALUATION_ASSIGNED',
        message: 'A sourcing response has been assigned to you for independent evaluation.',
      },
    });
    await this.prisma.auditLog.create({
      data: { actorId: actor.id, actionType: 'EVALUATION_ASSIGNED', targetId: assignment.id, targetType: 'EVALUATION_ASSIGNMENT', ipAddress },
    });
    return assignment;
  }

  async declareConflict(
    actor: Actor,
    assignmentId: string,
    data: { conflict: boolean; note?: string },
    ipAddress: string,
  ) {
    const assignment = await this.prisma.evaluationAssignment.findUnique({
      where: { id: assignmentId },
      include: { response: true },
    });
    if (!assignment) throw new NotFoundException('Evaluation assignment not found');
    if (assignment.reviewerId !== actor.id) throw new ForbiddenException('This assignment belongs to another reviewer');
    if (actor.orgId === assignment.response.supplierOrgId) {
      throw new ConflictException('Reviewer belongs to the supplier organization');
    }
    if (data.conflict && !data.note?.trim()) throw new BadRequestException('Conflict note is required');

    const updated = await this.prisma.evaluationAssignment.update({
      where: { id: assignmentId },
      data: {
        conflictStatus: data.conflict ? 'CONFLICT' : 'CLEAR',
        conflictNote: data.note?.trim() || null,
        declaredAt: new Date(),
        status: data.conflict ? 'RECUSED' : 'READY',
      },
    });
    await this.prisma.auditLog.create({
      data: {
        actorId: actor.id,
        actionType: data.conflict ? 'EVALUATOR_CONFLICT_DECLARED' : 'EVALUATOR_CONFLICT_CLEARED',
        targetId: assignmentId,
        targetType: 'EVALUATION_ASSIGNMENT',
        ipAddress,
      },
    });
    return updated;
  }

  async submitScorecard(
    actor: Actor,
    assignmentId: string,
    data: {
      recommendation: string;
      rationale: string;
      scores: Array<{ criterionId: string; score: number; notes?: string }>;
    },
    ipAddress: string,
  ) {
    const assignment = await this.prisma.evaluationAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        event: { include: { criteria: true } },
        response: { include: { versions: { orderBy: { version: 'desc' }, take: 1 } } },
        scorecard: true,
      },
    });
    if (!assignment) throw new NotFoundException('Evaluation assignment not found');
    if (assignment.reviewerId !== actor.id) throw new ForbiddenException();
    if (assignment.conflictStatus !== 'CLEAR' || assignment.status !== 'READY') {
      throw new ConflictException('A clear conflict declaration is required before scoring');
    }
    if (!['OPENED', 'EVALUATING'].includes(assignment.event.status)) {
      throw new ConflictException('Event has not been opened for evaluation');
    }
    if (assignment.scorecard) throw new ConflictException('Scorecard is already locked and submitted');
    if (!data.rationale?.trim()) throw new BadRequestException('rationale is required');
    if (!['ACCEPT', 'REJECT', 'REQUEST_CLARIFICATION'].includes(data.recommendation)) {
      throw new BadRequestException('Invalid recommendation');
    }
    const latestVersion = assignment.response.versions[0];
    if (!latestVersion) throw new ConflictException('Response has no submitted version');

    const scoreMap = new Map((data.scores || []).map((score) => [score.criterionId, score]));
    if (assignment.event.criteria.some((criterion) => !scoreMap.has(criterion.id))) {
      throw new BadRequestException('Every published criterion requires a score');
    }

    const normalized = assignment.event.criteria.map((criterion) => {
      const input = scoreMap.get(criterion.id)!;
      const numeric = Number(input.score);
      if (!Number.isFinite(numeric) || numeric < criterion.minScore || numeric > criterion.maxScore) {
        throw new BadRequestException('Score is outside the published criterion range');
      }
      return {
        criterionId: criterion.id,
        score: new Prisma.Decimal(String(input.score)),
        notes: input.notes?.trim() || null,
      };
    });

    return this.prisma.$transaction(async (tx) => {
      const scorecard = await tx.scorecard.create({
        data: {
          assignmentId,
          reviewerId: actor.id,
          responseVersionId: latestVersion.id,
          recommendation: data.recommendation as never,
          rationale: data.rationale.trim(),
          scores: { create: normalized },
        },
        include: { scores: true },
      });
      await tx.evaluationAssignment.update({ where: { id: assignmentId }, data: { status: 'SUBMITTED' } });
      await tx.sourcingEvent.update({
        where: { id: assignment.eventId },
        data: { status: 'EVALUATING' },
      });
      const remaining = await tx.evaluationAssignment.count({
        where: { responseId: assignment.responseId, status: { in: ['ASSIGNED', 'READY'] } },
      });
      if (remaining === 0) {
        await tx.sourcingResponse.update({ where: { id: assignment.responseId }, data: { status: 'EVALUATED' } });
      }
      await this.audit(tx, actor.id, 'SCORECARD_SUBMITTED', scorecard.id, 'SCORECARD', ipAddress);
      return scorecard;
    });
  }

  async recommendAward(actor: Actor, eventId: string, responseId: string, rationale: string, ipAddress: string) {
    const event = await this.prisma.sourcingEvent.findUnique({
      where: { id: eventId },
      include: { project: true, award: true },
    });
    if (!event) throw new NotFoundException('Sourcing event not found');
    this.assertWorkspace(actor, event.project.workspaceOrgId);
    if (!['BUYER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException();
    if (!['OPENED', 'EVALUATING'].includes(event.status)) throw new ConflictException('Event is not ready for award recommendation');
    if (event.award) throw new ConflictException('An award already exists for this event');
    if (!rationale?.trim()) throw new BadRequestException('Award rationale is required');

    const response = await this.prisma.sourcingResponse.findUnique({
      where: { id: responseId },
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
        assignments: { include: { scorecard: true } },
      },
    });
    if (!response || response.eventId !== eventId) throw new BadRequestException('Response does not belong to this event');
    if (response.assignments.length === 0 || response.assignments.some((a) => a.status !== 'SUBMITTED')) {
      throw new ConflictException('All assigned evaluators must submit locked scorecards before award');
    }
    if (!response.assignments.some((a) => a.scorecard?.recommendation === 'ACCEPT')) {
      throw new ConflictException('Selected response requires at least one ACCEPT recommendation');
    }
    const version = response.versions[0];
    if (!version) throw new ConflictException('Selected response has no submitted version');

    return this.prisma.$transaction(async (tx) => {
      const award = await tx.award.create({
        data: {
          eventId,
          responseVersionId: version.id,
          supplierOrgId: response.supplierOrgId,
          recommendedById: actor.id,
          amount: version.totalAmount,
          currency: version.currency,
          rationale: rationale.trim(),
        },
      });
      const admins = await tx.user.findMany({ where: { role: 'ADMIN', status: 'ACTIVE' }, select: { id: true } });
      if (admins.length) {
        await tx.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'AWARD_APPROVAL',
            message: 'An award recommendation is waiting for approval.',
          })),
        });
      }
      await this.audit(tx, actor.id, 'AWARD_RECOMMENDED', award.id, 'AWARD', ipAddress);
      return award;
    });
  }

  async approveAward(actor: Actor, awardId: string, approved: boolean, ipAddress: string) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException('Administrator approval is required');
    const award = await this.prisma.award.findUnique({ where: { id: awardId } });
    if (!award) throw new NotFoundException('Award not found');
    if (award.status !== 'PENDING_APPROVAL') throw new ConflictException('Award has already been decided');
    if (award.recommendedById === actor.id) {
      throw new ConflictException('Award recommender cannot approve their own recommendation');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.award.update({
        where: { id: awardId },
        data: {
          status: approved ? 'APPROVED' : 'REJECTED',
          approvedById: actor.id,
          approvedAt: approved ? new Date() : null,
        },
      });
      if (approved) {
        await tx.sourcingEvent.update({ where: { id: award.eventId }, data: { status: 'AWARDED' } });
      }
      await this.audit(tx, actor.id, approved ? 'AWARD_APPROVED' : 'AWARD_REJECTED', awardId, 'AWARD', ipAddress);
      return updated;
    });
  }

  async createContract(
    actor: Actor,
    awardId: string,
    data: { title: string; startDate: string | Date; endDate: string | Date; signedDocumentKey?: string },
    ipAddress: string,
  ) {
    const award = await this.prisma.award.findUnique({
      where: { id: awardId },
      include: { event: { include: { project: true } }, contract: true },
    });
    if (!award) throw new NotFoundException('Award not found');
    this.assertWorkspace(actor, award.event.project.workspaceOrgId);
    if (!['BUYER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException();
    if (award.status !== 'APPROVED') throw new ConflictException('Award must be approved before contract creation');
    if (award.contract) throw new ConflictException('Contract already exists for this award');
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (!data.title?.trim() || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      throw new BadRequestException('Valid title and contract date range are required');
    }

    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          awardId,
          supplierOrgId: award.supplierOrgId,
          ownerId: actor.id,
          title: data.title.trim(),
          amount: award.amount,
          currency: award.currency,
          startDate,
          endDate,
          status: data.signedDocumentKey ? 'EXECUTED' : 'DRAFT',
          signedDocumentKey: data.signedDocumentKey?.trim() || null,
          executedAt: data.signedDocumentKey ? new Date() : null,
        },
      });
      if (data.signedDocumentKey) {
        await tx.sourcingProject.update({ where: { id: award.event.projectId }, data: { status: 'COMPLETED' } });
        await tx.procurementRequest.update({ where: { id: award.event.project.requestId }, data: { status: 'CONTRACTED' } });
      }
      await this.audit(tx, actor.id, 'CONTRACT_CREATED', contract.id, 'CONTRACT', ipAddress);
      return contract;
    });
  }

  async executeContract(actor: Actor, contractId: string, signedDocumentKey: string, ipAddress: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { award: { include: { event: { include: { project: true } } } } },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    this.assertWorkspace(actor, contract.award.event.project.workspaceOrgId);
    if (!['BUYER', 'ADMIN'].includes(actor.role)) throw new ForbiddenException();
    if (!signedDocumentKey?.trim()) throw new BadRequestException('signedDocumentKey is required');
    if (['EXECUTED', 'ACTIVE', 'EXPIRED', 'TERMINATED'].includes(contract.status)) {
      throw new ConflictException('Contract is not executable from its current state');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.contract.update({
        where: { id: contractId },
        data: { status: 'EXECUTED', signedDocumentKey: signedDocumentKey.trim(), executedAt: new Date() },
      });
      await tx.sourcingProject.update({ where: { id: contract.award.event.projectId }, data: { status: 'COMPLETED' } });
      await tx.procurementRequest.update({ where: { id: contract.award.event.project.requestId }, data: { status: 'CONTRACTED' } });
      await this.audit(tx, actor.id, 'CONTRACT_EXECUTED', contractId, 'CONTRACT', ipAddress);
      return updated;
    });
  }

  async listEvents(actor: Actor) {
    const where =
      actor.role === 'ADMIN'
        ? {}
        : actor.role === 'BUYER'
          ? { project: { workspaceOrgId: actor.orgId } }
          : actor.role === 'VENDOR'
            ? { invitations: { some: { supplierOrgId: actor.orgId } } }
            : { assignments: { some: { reviewerId: actor.id } } };

    return this.prisma.sourcingEvent.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, workspaceOrgId: true, currency: true } },
        _count: { select: { invitations: true, responses: true, assignments: true } },
        award: { select: { id: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getEvent(actor: Actor, eventId: string) {
    const event = await this.prisma.sourcingEvent.findUnique({
      where: { id: eventId },
      include: {
        project: { include: { request: true } },
        criteria: { orderBy: { sortOrder: 'asc' } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
        clarifications: { orderBy: { createdAt: 'asc' } },
        amendments: { orderBy: { version: 'asc' } },
        invitations: {
          include: { supplierOrg: { select: { id: true, name: true, supplierStatus: true } } },
        },
        responses: {
          include: {
            supplierOrg: { select: { id: true, name: true } },
            versions: {
              orderBy: { version: 'desc' },
              take: 1,
              include: {
                lineItems: true,
                answers: true,
                documents: { include: { fileObject: true } },
                scorecards: { include: { scores: true } },
              },
            },
            assignments: {
              include: {
                reviewer: { select: { id: true, name: true } },
                scorecard: { include: { scores: true } },
              },
            },
          },
        },
        openingEvents: true,
        versions: {
          select: { id: true, version: true, createdAt: true },
          orderBy: { version: 'asc' },
        },
        award: { include: { contract: true, supplierOrg: { select: { id: true, name: true } } } },
      },
    });
    if (!event) throw new NotFoundException('Sourcing event not found');

    if (actor.role === 'BUYER') {
      this.assertWorkspace(actor, event.project.workspaceOrgId);
    }
    if (actor.role === 'VENDOR') {
      const invited = event.invitations.some((i) => i.supplierOrgId === actor.orgId);
      if (!invited) throw new ForbiddenException('Your organization is not invited to this event');
      return {
        ...event,
        invitations: [],
        responses: event.responses
          .filter((response) => response.supplierOrgId === actor.orgId)
          .map((response) => ({ ...response, assignments: [] })),
      };
    }
    if (actor.role === 'REVIEWER') {
      if (!['OPENED', 'EVALUATING', 'AWARDED'].includes(event.status)) {
        throw new ForbiddenException('Response contents remain sealed until opening');
      }
      const ownAssignments = event.responses.flatMap((response) =>
        response.assignments.filter((assignment) => assignment.reviewerId === actor.id),
      );
      if (ownAssignments.length === 0) throw new ForbiddenException('You are not assigned to this event');
      const assignedResponseIds = new Set(ownAssignments.map((assignment) => assignment.responseId));
      return {
        ...event,
        invitations: [],
        responses: event.responses
          .filter((response) => assignedResponseIds.has(response.id))
          .map((response) => ({
            ...response,
            supplierOrg: undefined,
            assignments: response.assignments.filter((assignment) => assignment.reviewerId === actor.id),
          })),
      };
    }

    const opened = ['OPENED', 'EVALUATING', 'AWARDED'].includes(event.status);
    if (!opened) {
      return {
        ...event,
        responses: event.responses.map((response) => ({
          id: response.id,
          eventId: response.eventId,
          supplierOrgId: response.supplierOrgId,
          supplierOrg: response.supplierOrg,
          status: response.status,
          currentVersion: response.currentVersion,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          versions: [],
          assignments: [],
        })),
      };
    }
    return event;
  }

  async myWork(actor: Actor) {
    if (actor.role === 'REVIEWER') {
      return {
        evaluations: await this.prisma.evaluationAssignment.findMany({
          where: { reviewerId: actor.id, status: { in: ['ASSIGNED', 'READY'] } },
          include: { event: { select: { id: true, title: true, closeAt: true, status: true } } },
          orderBy: { assignedAt: 'asc' },
        }),
      };
    }
    if (actor.role === 'VENDOR') {
      return {
        invitations: await this.prisma.supplierInvitation.findMany({
          where: { supplierOrgId: actor.orgId, event: { status: 'PUBLISHED' } },
          include: { event: { select: { id: true, title: true, closeAt: true, version: true } } },
          orderBy: { invitedAt: 'desc' },
        }),
      };
    }
    if (actor.role === 'ADMIN') {
      return {
        requests: await this.prisma.procurementRequest.findMany({
          where: { status: 'SUBMITTED' },
          orderBy: { submittedAt: 'asc' },
          take: 20,
        }),
        awards: await this.prisma.award.findMany({
          where: { status: 'PENDING_APPROVAL' },
          include: { event: { select: { id: true, title: true } }, supplierOrg: { select: { name: true } } },
          orderBy: { recommendedAt: 'asc' },
          take: 20,
        }),
      };
    }
    return {
      requests: await this.prisma.procurementRequest.findMany({
        where: { workspaceOrgId: actor.orgId, status: { in: ['APPROVED', 'IN_SOURCING'] } },
        include: { project: true },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      events: await this.prisma.sourcingEvent.findMany({
        where: { project: { workspaceOrgId: actor.orgId }, status: { in: ['DRAFT', 'PUBLISHED', 'OPENED', 'EVALUATING'] } },
        include: { _count: { select: { responses: true, assignments: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
    };
  }
}
