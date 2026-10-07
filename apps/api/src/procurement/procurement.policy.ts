import { ForbiddenException } from '@nestjs/common';

export type ProcurementActor = {
  id: string;
  role: string;
  orgId: string;
};

export const ProcurementPolicy = {
  requireRole(actor: ProcurementActor, roles: readonly string[]) {
    if (!roles.includes(actor.role)) {
      throw new ForbiddenException(
        'This action is not permitted for the current role',
      );
    }
  },

  requireAdmin(actor: ProcurementActor) {
    this.requireRole(actor, ['ADMIN']);
  },

  requireProcurement(actor: ProcurementActor) {
    this.requireRole(actor, ['BUYER', 'ADMIN']);
  },

  requireVendor(actor: ProcurementActor) {
    this.requireRole(actor, ['VENDOR']);
  },

  requireReviewer(actor: ProcurementActor) {
    this.requireRole(actor, ['REVIEWER']);
  },

  requireWorkspace(actor: ProcurementActor, workspaceOrgId: string) {
    if (actor.role !== 'ADMIN' && actor.orgId !== workspaceOrgId) {
      throw new ForbiddenException(
        'This record belongs to another procurement workspace',
      );
    }
  },

  requireOwnerOrAdmin(actor: ProcurementActor, ownerId: string) {
    if (actor.role !== 'ADMIN' && actor.id !== ownerId) {
      throw new ForbiddenException('This record belongs to another user');
    }
  },

  requireReviewerAssignment(
    actor: ProcurementActor,
    assignment: { reviewerId: string },
  ) {
    this.requireReviewer(actor);
    if (assignment.reviewerId !== actor.id) {
      throw new ForbiddenException(
        'This evaluation assignment belongs to another reviewer',
      );
    }
  },

  requireSupplierSeparation(
    actor: ProcurementActor,
    supplierOrgId: string,
  ) {
    if (actor.orgId === supplierOrgId) {
      throw new ForbiddenException(
        'A reviewer cannot evaluate their own supplier organization',
      );
    }
  },

  requireInvitedSupplier<T extends { supplierOrgId: string }>(
    actor: ProcurementActor,
    invitation: T | null,
  ): T {
    this.requireVendor(actor);
    if (!invitation || invitation.supplierOrgId !== actor.orgId) {
      throw new ForbiddenException(
        'Your organization was not invited to this event',
      );
    }
    return invitation;
  },
};
