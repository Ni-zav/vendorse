import { BadRequestException } from '@nestjs/common';
import {
  arrayField,
  asObject,
  booleanField,
  currencyField,
  enumField,
  finiteNumberField,
  isoDateField,
  rejectUnknown,
  stringField,
} from '../common/request-contract';

const EVENT_TYPES = ['RFI', 'RFQ', 'RFP', 'TENDER', 'BAFO'] as const;
const SOURCING_METHODS = [
  'DIRECT',
  'RFQ',
  'RFP',
  'OPEN_TENDER',
  'SELECTIVE_TENDER',
] as const;
const RECOMMENDATIONS = [
  'ACCEPT',
  'REJECT',
  'REQUEST_CLARIFICATION',
] as const;
const QUALIFICATION_STATUSES = [
  'PENDING',
  'QUALIFIED',
  'CONDITIONALLY_QUALIFIED',
  'REJECTED',
  'EXPIRED',
] as const;

export function parseCreateRequest(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, [
    'title',
    'description',
    'category',
    'estimatedAmount',
    'currency',
    'desiredDate',
  ]);
  return {
    title: stringField(value, 'title', { min: 5, max: 200 })!,
    description: stringField(value, 'description', { min: 10, max: 20_000 })!,
    category: stringField(value, 'category', { min: 2, max: 120 })!,
    estimatedAmount: finiteNumberField(value, 'estimatedAmount', { min: 0.01 })!,
    currency: currencyField(value),
    desiredDate: isoDateField(value, 'desiredDate', { optional: true }),
  };
}

export function parseRequestDecision(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['approved', 'reason']);
  return {
    approved: booleanField(value, 'approved'),
    reason: stringField(value, 'reason', { optional: true, max: 4000 }),
  };
}

export function parseCreateProject(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['method', 'title', 'triageReason']);
  return {
    method: enumField(value, 'method', SOURCING_METHODS),
    title: stringField(value, 'title', { optional: true, max: 200 }),
    triageReason: stringField(value, 'triageReason', {
      optional: true,
      max: 4000,
    }),
  };
}

export function parseCreateEvent(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, [
    'type',
    'title',
    'instructions',
    'closeAt',
    'criteria',
    'lineItems',
  ]);

  const criteria = arrayField(value, 'criteria', { max: 100 }).map(
    (entry, index) => {
      const item = asObject(entry, 'criteria[' + index + ']');
      rejectUnknown(
        item,
        [
          'key',
          'name',
          'description',
          'weight',
          'minScore',
          'maxScore',
          'mandatory',
        ],
        'criteria[' + index + ']',
      );
      return {
        key: stringField(item, 'key', { min: 1, max: 80 })!,
        name: stringField(item, 'name', { min: 1, max: 200 })!,
        description: stringField(item, 'description', {
          optional: true,
          max: 4000,
        }),
        weight: finiteNumberField(item, 'weight', { min: 0.0001, max: 100 })!,
        minScore: finiteNumberField(item, 'minScore', {
          optional: true,
          min: 0,
          max: 100_000,
        }),
        maxScore: finiteNumberField(item, 'maxScore', {
          optional: true,
          min: 0.0001,
          max: 100_000,
        }),
        mandatory:
          item.mandatory === undefined
            ? undefined
            : booleanField(item, 'mandatory'),
      };
    },
  );

  const lineItems = arrayField(value, 'lineItems', {
    optional: true,
    max: 1000,
  }).map((entry, index) => {
    const item = asObject(entry, 'lineItems[' + index + ']');
    rejectUnknown(
      item,
      ['code', 'description', 'quantity', 'unit'],
      'lineItems[' + index + ']',
    );
    return {
      code: stringField(item, 'code', { min: 1, max: 80 })!,
      description: stringField(item, 'description', {
        min: 1,
        max: 4000,
      })!,
      quantity: finiteNumberField(item, 'quantity', { min: 0.0001 })!,
      unit: stringField(item, 'unit', { min: 1, max: 40 })!,
    };
  });

  return {
    type: enumField(value, 'type', EVENT_TYPES),
    title: stringField(value, 'title', { min: 5, max: 240 })!,
    instructions: stringField(value, 'instructions', {
      min: 10,
      max: 50_000,
    })!,
    closeAt: isoDateField(value, 'closeAt', { future: true })!,
    criteria,
    lineItems,
  };
}

export function parseSupplierInvitation(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['supplierOrgId']);
  return {
    supplierOrgId: stringField(value, 'supplierOrgId', {
      min: 1,
      max: 120,
    })!,
  };
}

export function parseClarification(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['question']);
  return {
    question: stringField(value, 'question', { min: 3, max: 10_000 })!,
  };
}

export function parseClarificationAnswer(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['answer']);
  return {
    answer: stringField(value, 'answer', { min: 1, max: 20_000 })!,
  };
}

export function parseAmendment(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['summary', 'closeAt']);
  return {
    summary: stringField(value, 'summary', { min: 3, max: 10_000 })!,
    closeAt: isoDateField(value, 'closeAt', {
      optional: true,
      future: true,
    }),
  };
}

export function parseResponse(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, [
    'currency',
    'totalAmount',
    'narrative',
    'lineItems',
    'answers',
    'documentIds',
  ]);

  const lineItems = arrayField(value, 'lineItems', {
    optional: true,
    max: 1000,
  }).map((entry, index) => {
    const item = asObject(entry, 'lineItems[' + index + ']');
    rejectUnknown(
      item,
      ['eventLineItemId', 'unitPrice', 'notes'],
      'lineItems[' + index + ']',
    );
    return {
      eventLineItemId: stringField(item, 'eventLineItemId', {
        min: 1,
        max: 120,
      })!,
      unitPrice: finiteNumberField(item, 'unitPrice', { min: 0 })!,
      notes: stringField(item, 'notes', { optional: true, max: 4000 }),
    };
  });

  const answers = arrayField(value, 'answers', {
    optional: true,
    max: 250,
  }).map((entry, index) => {
    const item = asObject(entry, 'answers[' + index + ']');
    rejectUnknown(item, ['key', 'value'], 'answers[' + index + ']');
    return {
      key: stringField(item, 'key', { min: 1, max: 120 })!,
      value: stringField(item, 'value', { max: 20_000 }) || '',
    };
  });

  const documentIds = arrayField(value, 'documentIds', {
    optional: true,
    max: 25,
  }).map((entry, index) => {
    if (typeof entry !== 'string' || !entry.trim() || entry.length > 120) {
      throw new BadRequestException('documentIds[' + index + '] must be a valid identifier');
    }
    return entry.trim();
  });

  return {
    currency: currencyField(value),
    totalAmount: finiteNumberField(value, 'totalAmount', {
      optional: true,
      min: 0.01,
    }),
    narrative: stringField(value, 'narrative', {
      optional: true,
      max: 50_000,
    }),
    lineItems,
    answers,
    documentIds,
  };
}

export function parseOpening(body: unknown) {
  const value = asObject(body || {});
  rejectUnknown(value, ['note']);
  return {
    note: stringField(value, 'note', { optional: true, max: 4000 }),
  };
}

export function parseReviewerAssignment(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['responseId', 'reviewerId']);
  return {
    responseId: stringField(value, 'responseId', { min: 1, max: 120 })!,
    reviewerId: stringField(value, 'reviewerId', { min: 1, max: 120 })!,
  };
}

export function parseConflictDeclaration(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['conflict', 'note']);
  return {
    conflict: booleanField(value, 'conflict'),
    note: stringField(value, 'note', { optional: true, max: 4000 }),
  };
}

export function parseScorecard(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['recommendation', 'rationale', 'scores']);
  const scores = arrayField(value, 'scores', { max: 100 }).map(
    (entry, index) => {
      const item = asObject(entry, 'scores[' + index + ']');
      rejectUnknown(
        item,
        ['criterionId', 'score', 'notes'],
        'scores[' + index + ']',
      );
      return {
        criterionId: stringField(item, 'criterionId', {
          min: 1,
          max: 120,
        })!,
        score: finiteNumberField(item, 'score', { min: 0, max: 100_000 })!,
        notes: stringField(item, 'notes', { optional: true, max: 4000 }),
      };
    },
  );
  return {
    recommendation: enumField(value, 'recommendation', RECOMMENDATIONS),
    rationale: stringField(value, 'rationale', { min: 3, max: 10_000 })!,
    scores,
  };
}

export function parseAwardRecommendation(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['responseId', 'rationale']);
  return {
    responseId: stringField(value, 'responseId', { min: 1, max: 120 })!,
    rationale: stringField(value, 'rationale', { min: 3, max: 10_000 })!,
  };
}

export function parseAwardDecision(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['approved']);
  return { approved: booleanField(value, 'approved') };
}

export function parseCreateContract(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, [
    'title',
    'startDate',
    'endDate',
    'signedDocumentKey',
  ]);
  return {
    title: stringField(value, 'title', { min: 3, max: 240 })!,
    startDate: isoDateField(value, 'startDate')!,
    endDate: isoDateField(value, 'endDate')!,
    signedDocumentKey: stringField(value, 'signedDocumentKey', {
      optional: true,
      max: 500,
    }),
  };
}

export function parseExecuteContract(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, ['signedDocumentKey']);
  return {
    signedDocumentKey: stringField(value, 'signedDocumentKey', {
      min: 1,
      max: 500,
    })!,
  };
}

export function parsePerformanceReview(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, [
    'periodStart',
    'periodEnd',
    'quality',
    'delivery',
    'responsiveness',
    'commercial',
    'notes',
  ]);
  return {
    periodStart: isoDateField(value, 'periodStart')!,
    periodEnd: isoDateField(value, 'periodEnd')!,
    quality: finiteNumberField(value, 'quality', { min: 0, max: 100 })!,
    delivery: finiteNumberField(value, 'delivery', { min: 0, max: 100 })!,
    responsiveness: finiteNumberField(value, 'responsiveness', {
      min: 0,
      max: 100,
    })!,
    commercial: finiteNumberField(value, 'commercial', {
      min: 0,
      max: 100,
    })!,
    notes: stringField(value, 'notes', { optional: true, max: 10_000 }),
  };
}

export function parseQualification(body: unknown) {
  const value = asObject(body);
  rejectUnknown(value, [
    'status',
    'scopeCategory',
    'notes',
    'expiresAt',
  ]);
  return {
    status: enumField(value, 'status', QUALIFICATION_STATUSES),
    scopeCategory: stringField(value, 'scopeCategory', {
      optional: true,
      max: 120,
    }),
    notes: stringField(value, 'notes', { optional: true, max: 10_000 }),
    expiresAt: isoDateField(value, 'expiresAt', { optional: true }),
  };
}
