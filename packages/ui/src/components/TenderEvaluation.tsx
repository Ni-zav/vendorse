'use client';

import { useState, useMemo } from 'react';
import { Button } from './Button';
import { FormField } from './Form';
import { Input } from './Form';
import { TextArea } from './Form';
import { RadioGroup } from './Form';

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
  bidId,
  criteria,
  onSubmit,
  isSubmitting = false,
}: TenderEvaluationProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState<'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION'>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalScore = useMemo(() => {
    return criteria.reduce((total, criterion) => {
      const score = scores[criterion.id] || 0;
      return total + (score * criterion.weight) / 100;
    }, 0);
  }, [scores, criteria]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    criteria.forEach((criterion) => {
      if (!scores[criterion.id]) {
        newErrors[criterion.id] = 'Please provide a score';
      }
    });

    if (!comments.trim()) {
      newErrors.comments = 'Please provide evaluation comments';
    }

    if (!recommendation) {
      newErrors.recommendation = 'Please select a recommendation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        scores,
        comments,
        recommendation: recommendation!,
      });

      // Reset form on successful submission
      setScores({});
      setComments('');
      setRecommendation(undefined);
      setErrors({});
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setErrors({
        submit: 'Failed to submit evaluation. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {criteria.map((criterion) => (
          <FormField
            key={criterion.id}
            label={criterion.name}
            error={errors[criterion.id]}
            required
          >
            <div className="space-y-2">
              <p className="text-sm text-gray-500">{criterion.description}</p>
              <p className="text-sm text-gray-500">Weight: {criterion.weight}%</p>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Score (0-100)"
                value={scores[criterion.id] || ''}
                onChange={(e) =>
                  setScores({
                    ...scores,
                    [criterion.id]: Number(e.target.value),
                  })
                }
                error={errors[criterion.id]}
              />
            </div>
          </FormField>
        ))}
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900">
          Total Weighted Score: {totalScore.toFixed(2)}%
        </h3>
      </div>

      <FormField
        label="Evaluation Comments"
        error={errors.comments}
        required
      >
        <TextArea
          rows={4}
          placeholder="Provide detailed comments supporting your evaluation"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
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
            setRecommendation(value as 'ACCEPT' | 'REJECT' | 'REQUEST_CLARIFICATION')
          }
          options={[
            { value: 'ACCEPT', label: 'Accept Bid' },
            { value: 'REJECT', label: 'Reject Bid' },
            { value: 'REQUEST_CLARIFICATION', label: 'Request Clarification' },
          ]}
          error={errors.recommendation}
        />
      </FormField>

      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Submit Evaluation
        </Button>
      </div>
    </form>
  );
}