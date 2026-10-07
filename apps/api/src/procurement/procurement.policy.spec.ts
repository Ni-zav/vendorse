import { ForbiddenException } from '@nestjs/common';
import { ProcurementPolicy } from './procurement.policy';

describe('ProcurementPolicy', () => {
  const buyer = { id: 'buyer-1', role: 'BUYER', orgId: 'workspace-1' };
  const reviewer = { id: 'reviewer-1', role: 'REVIEWER', orgId: 'review-org' };

  it('blocks cross-workspace buyer access', () => {
    expect(() =>
      ProcurementPolicy.requireWorkspace(buyer, 'workspace-2'),
    ).toThrow(ForbiddenException);
  });

  it('allows administrators to cross workspace boundaries', () => {
    expect(() =>
      ProcurementPolicy.requireWorkspace(
        { id: 'admin-1', role: 'ADMIN', orgId: 'admin-org' },
        'workspace-2',
      ),
    ).not.toThrow();
  });

  it('blocks unassigned reviewers', () => {
    expect(() =>
      ProcurementPolicy.requireReviewerAssignment(reviewer, {
        reviewerId: 'reviewer-2',
      }),
    ).toThrow(ForbiddenException);
  });

  it('blocks reviewer access to their own supplier organization', () => {
    expect(() =>
      ProcurementPolicy.requireSupplierSeparation(
        { ...reviewer, orgId: 'supplier-1' },
        'supplier-1',
      ),
    ).toThrow(ForbiddenException);
  });

  it('requires vendor invitation to match the authenticated organization', () => {
    expect(() =>
      ProcurementPolicy.requireInvitedSupplier(
        { id: 'vendor-1', role: 'VENDOR', orgId: 'supplier-1' },
        { supplierOrgId: 'supplier-2' },
      ),
    ).toThrow(ForbiddenException);
  });
});
