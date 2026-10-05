'use client';

import { useMemo, useState } from 'react';
import { Button } from './Button';
import { FormField, Input, RadioGroup, TextArea } from './Form/index';

interface EvaluationCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
}

interface TenderEvaluationProps {
  bidId: string;
  criteria: EvaluationCriteria[];
  onSubmit: (data: {
    scores: Record<string, number>;
    comments: string;
    recommendation: 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION';
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function TenderEvaluation({
  criteria,
  onSubmit,
  isSubmitting = false,
}: TenderEvaluationProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState<
    'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION' | undefined
  >();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalScore = useMemo(
    () =>
      criteria.reduce((total, criterion) => {
        const score = scores[criterion.id] ?? 0;
        return total + (score * criterion.weight) / 100;
      }, 0),
    [scores, criteria],
  );

  const completedCriteria = criteria.filter(
    (criterion) => scores[criterion.id] !== undefined,
  ).length;

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    criteria.forEach((criterion) => {
      const score = scores[criterion.id];
      if (
        score === undefined ||
        Number.isNaN(score) ||
        score < 0 ||
        score > 100
      ) {
        nextErrors[criterion.id] = 'Enter a score from 0 to 100.';
      }
    });

    if (!comments.trim()) {
      nextErrors.comments =
        'Record the rationale that supports this scorecard.';
    }

    if (!recommendation) {
      nextErrors.recommendation = 'Select a recommendation.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        scores,
        comments: comments.trim(),
        recommendation: recommendation!,
      });

      setScores({});
      setComments('');
      setRecommendation(undefined);
      setErrors({});
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setErrors({
        submit: 'The scorecard could not be submitted. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem]">
        <div className="space-y-3">
          {criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-950">
                    {criterion.name}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {criterion.description}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                  {criterion.weight}% weight
                </span>
              </div>

              <FormField
                label="Score"
                error={errors[criterion.id]}
                className="mt-4"
                hint="0–100"
              >
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  inputMode="numeric"
                  placeholder="Enter score"
                  value={scores[criterion.id] ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setScores((current) => ({
                      ...current,
                      ...(value === ''
                        ? { [criterion.id]: undefined as unknown as number }
                        : { [criterion.id]: Number(value) }),
                    }));
                  }}
                  error={errors[criterion.id]}
                />
              </FormField>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
            Scorecard
          </p>
          <p className="mt-3 text-4xl font-black tracking-tight">
            {totalScore.toFixed(1)}
          </p>
          <p className="mt-1 text-sm text-slate-400">weighted points / 100</p>
          <div className="mt-5 border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-400">Criteria completed</p>
            <p className="mt-1 text-sm font-bold">
              {completedCriteria} of {criteria.length}
            </p>
          </div>
        </aside>
      </div>

      <FormField
        label="Evaluation rationale"
        error={errors.comments}
        required
        hint="Auditable record"
      >
        <TextArea
          rows={5}
          placeholder="Explain material strengths, gaps, evidence, and any assumptions used in the scoring."
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          error={errors.comments}
        />
      </FormField>

      <FormField
        label="Recommendation"
        error={errors.recommendation}
        required
      >
        <RadioGroup
          name="recommendation"
          value={recommendation}
          onChange={(value) =>
            setRecommendation(
              value as 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION',
            )
          }
          options={[
            { value: 'ACCEPT', label: 'Recommend for award consideration' },
            { value: 'REQUEST_CLARIFICATION', label: 'Request clarification' },
            { value: 'REJECT', label: 'Do not recommend' },
          ]}
          error={errors.recommendation}
        />
      </FormField>

      {errors.submit && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.submit}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Submit scorecard
        </Button>
      </div>
    </form>
  );
}
