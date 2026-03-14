import { z } from "zod/v4";

const dimensionScore = z.number().int().min(1).max(5);

export const createReviewSchema = z.object({
  conditioning: dimensionScore,
  layout: dimensionScore,
  value: dimensionScore,
  pace: dimensionScore,
  service: dimensionScore,
  vibe: dimensionScore,
  text: z.string().max(5000).optional().nullable(),
  roundId: z.string().uuid().optional().nullable(),
});

export const updateReviewSchema = z.object({
  conditioning: dimensionScore.optional(),
  layout: dimensionScore.optional(),
  value: dimensionScore.optional(),
  pace: dimensionScore.optional(),
  service: dimensionScore.optional(),
  vibe: dimensionScore.optional(),
  text: z.string().max(5000).optional().nullable(),
});

export const updateQualityScoresSchema = z.object({
  editorialScore: z.number().min(0).max(5).optional(),
  externalRankScore: z.number().min(0).max(5).optional(),
  valueScore: z.number().min(0).max(5).optional(),
  valueLabel: z.string().max(100).optional().nullable(),
  tripFitInputs: z.record(z.string(), z.number()).optional().nullable(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type UpdateQualityScoresInput = z.infer<typeof updateQualityScoresSchema>;
