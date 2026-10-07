import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ProcurementService } from './procurement.service';

describe('ProcurementService domain invariants', () => {
  const actor = {
    id: 'buyer-1',
    role: 'BUYER',
    orgId: 'workspace-1',
  };

  function serviceWith(overrides: Record<string, unknown>) {
    return new ProcurementService(overrides as never);
  }

  it('rejects an evaluation plan whose weights do not total 100', async () => {
    const service = serviceWith({
      sourcingProject: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'project-1',
          workspaceOrgId: actor.orgId,
        }),
      },
    });

    await expect(
      service.createEvent(
        actor,
        'project-1',
        {
          type: 'RFP',
          title: 'Architecture services',
          instructions: 'Respond against the published requirements.',
          closeAt: new Date(Date.now() + 60_000),
          criteria: [
            { key: 'technical', name: 'Technical', weight: 60 },
            { key: 'commercial', name: 'Commercial', weight: 30 },
          ],
        },
        '127.0.0.1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not allow opening before the published close time', async () => {
    const service = serviceWith({
      sourcingEvent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'event-1',
          status: 'PUBLISHED',
          closeAt: new Date(Date.now() + 60_000),
          project: { workspaceOrgId: actor.orgId },
        }),
      },
    });

    await expect(
      service.openEvent(actor, 'event-1', undefined, '127.0.0.1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires a clear conflict declaration before a reviewer can score', async () => {
    const reviewer = {
      id: 'reviewer-1',
      role: 'REVIEWER',
      orgId: 'review-org',
    };
    const service = serviceWith({
      evaluationAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'assignment-1',
          reviewerId: reviewer.id,
          conflictStatus: 'PENDING',
          status: 'ASSIGNED',
          event: {
            id: 'event-1',
            status: 'OPENED',
            criteria: [],
          },
          response: {
            id: 'response-1',
            versions: [{ id: 'version-1' }],
          },
          scorecard: null,
        }),
      },
    });

    await expect(
      service.submitScorecard(
        reviewer,
        'assignment-1',
        {
          recommendation: 'ACCEPT',
          rationale: 'Evidence reviewed',
          scores: [],
        },
        '127.0.0.1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents an award recommender from approving the same award', async () => {
    const admin = {
      id: 'admin-1',
      role: 'ADMIN',
      orgId: 'workspace-1',
    };
    const service = serviceWith({
      award: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'award-1',
          status: 'PENDING_APPROVAL',
          recommendedById: admin.id,
        }),
      },
    });

    await expect(
      service.approveAward(admin, 'award-1', true, '127.0.0.1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('blocks award recommendation while assigned evaluations remain incomplete', async () => {
    const service = serviceWith({
      sourcingEvent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'event-1',
          status: 'EVALUATING',
          project: { workspaceOrgId: actor.orgId },
          award: null,
        }),
      },
      sourcingResponse: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'response-1',
          eventId: 'event-1',
          supplierOrgId: 'supplier-1',
          versions: [{ id: 'version-1', totalAmount: '100', currency: 'IDR' }],
          assignments: [
            { id: 'assignment-1', status: 'READY', scorecard: null },
          ],
        }),
      },
    });

    await expect(
      service.recommendAward(
        actor,
        'event-1',
        'response-1',
        'Best evaluated offer',
        '127.0.0.1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents a reviewer from evaluating a supplier in their own organization', async () => {
    const reviewer = {
      id: 'reviewer-1',
      role: 'REVIEWER',
      orgId: 'supplier-1',
    };
    const service = serviceWith({
      evaluationAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'assignment-1',
          reviewerId: reviewer.id,
          response: { supplierOrgId: reviewer.orgId },
        }),
      },
    });

    await expect(
      service.declareConflict(
        reviewer,
        'assignment-1',
        { conflict: false },
        '127.0.0.1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('keeps cross-workspace buyer access forbidden', async () => {
    const service = serviceWith({
      sourcingEvent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'event-1',
          status: 'DRAFT',
          project: { workspaceOrgId: 'another-workspace' },
          criteria: [],
        }),
      },
    });

    await expect(
      service.publishEvent(actor, 'event-1', '127.0.0.1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not expose comparison before formal opening', async () => {
    const service = serviceWith({
      sourcingEvent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'event-1',
          status: 'PUBLISHED',
          project: { workspaceOrgId: actor.orgId, currency: 'IDR' },
          criteria: [],
          responses: [],
        }),
      },
    });

    await expect(service.getComparison(actor, 'event-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('computes weighted comparison only from submitted locked scorecards', async () => {
    const service = serviceWith({
      sourcingEvent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'event-1',
          title: 'Design services',
          status: 'EVALUATING',
          version: 1,
          project: { workspaceOrgId: actor.orgId, currency: 'IDR' },
          criteria: [
            {
              id: 'technical',
              key: 'technical',
              name: 'Technical',
              weight: '60',
              minScore: 0,
              maxScore: 100,
            },
            {
              id: 'commercial',
              key: 'commercial',
              name: 'Commercial',
              weight: '40',
              minScore: 0,
              maxScore: 100,
            },
          ],
          responses: [
            {
              id: 'response-1',
              status: 'EVALUATED',
              supplierOrg: { id: 'supplier-1', name: 'Supplier One' },
              versions: [
                {
                  id: 'version-1',
                  version: 1,
                  receiptCode: 'VR-1',
                  totalAmount: '1000000',
                  currency: 'IDR',
                  submittedAt: new Date(),
                  lineItems: [],
                },
              ],
              assignments: [
                {
                  status: 'SUBMITTED',
                  conflictStatus: 'CLEAR',
                  scorecard: {
                    recommendation: 'ACCEPT',
                    scores: [
                      { criterionId: 'technical', score: '80' },
                      { criterionId: 'commercial', score: '60' },
                    ],
                  },
                },
                {
                  status: 'SUBMITTED',
                  conflictStatus: 'CLEAR',
                  scorecard: {
                    recommendation: 'ACCEPT',
                    scores: [
                      { criterionId: 'technical', score: '100' },
                      { criterionId: 'commercial', score: '80' },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      },
    });

    const comparison = await service.getComparison(actor, 'event-1');

    expect(comparison.methodology.autoRanking).toBe(false);
    expect(comparison.responses[0].evaluation.weightedScore).toBeCloseTo(82, 6);
    expect(comparison.responses[0].evaluation.recommendationCounts).toEqual({
      ACCEPT: 2,
    });
  });

});
