import { BadRequestException } from '@nestjs/common';
import {
  parseCreateEvent,
  parseCreateRequest,
  parseResponse,
  parseScorecard,
} from './procurement.contracts';

describe('procurement runtime contracts', () => {
  it('rejects unknown privileged fields instead of silently forwarding them', () => {
    expect(() =>
      parseCreateRequest({
        title: 'Purchase design services',
        description: 'Need a qualified design partner for the launch.',
        category: 'Professional Services',
        estimatedAmount: 1000,
        currency: 'USD',
        role: 'ADMIN',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects NaN and Infinity commercial values', () => {
    for (const estimatedAmount of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        parseCreateRequest({
          title: 'Purchase design services',
          description: 'Need a qualified design partner for the launch.',
          category: 'Professional Services',
          estimatedAmount,
          currency: 'USD',
        }),
      ).toThrow(BadRequestException);
    }
  });

  it('rejects invalid or non-future event deadlines', () => {
    expect(() =>
      parseCreateEvent({
        type: 'RFP',
        title: 'Design services RFP',
        instructions: 'Respond against all published requirements.',
        closeAt: 'not-a-date',
        criteria: [
          {
            key: 'technical',
            name: 'Technical',
            weight: 100,
          },
        ],
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      parseCreateEvent({
        type: 'RFP',
        title: 'Design services RFP',
        instructions: 'Respond against all published requirements.',
        closeAt: new Date(Date.now() - 60_000).toISOString(),
        criteria: [
          {
            key: 'technical',
            name: 'Technical',
            weight: 100,
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('caps nested response document arrays', () => {
    expect(() =>
      parseResponse({
        currency: 'USD',
        totalAmount: 100,
        documentIds: Array.from({ length: 26 }, (_, index) => 'file-' + index),
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects unknown scorecard fields', () => {
    expect(() =>
      parseScorecard({
        recommendation: 'ACCEPT',
        rationale: 'Evidence supports acceptance.',
        scores: [],
        overrideScore: 999,
      }),
    ).toThrow(BadRequestException);
  });
});
