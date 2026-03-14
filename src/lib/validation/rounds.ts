import { z } from "zod/v4";

export const createRoundSchema = z.object({
  courseId: z.string().uuid(),
  roundDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  format: z.string().max(50).optional(),
});

export const updateRoundSchema = createRoundSchema.partial();

export const batchScoreSchema = z.object({
  playerId: z.string().uuid(),
  entries: z
    .array(
      z.object({
        holeNumber: z.number().int().min(1).max(18),
        strokes: z.number().int().min(1),
        netStrokes: z.number().int().optional(),
      })
    )
    .min(1)
    .max(18),
});

export const createGameSchema = z.object({
  templateId: z.string().uuid().optional(),
  format: z.enum(["stroke_play", "best_ball", "skins", "nassau", "custom"]),
  name: z.string().max(255).optional(),
  teams: z
    .array(
      z.object({
        name: z.string().max(100),
        playerIds: z.array(z.string().uuid()).min(1),
      })
    )
    .optional(),
  stakesPerPlayer: z.number().min(0).optional(),
});

export const createBetSchema = z.object({
  roundId: z.string().uuid().optional(),
  name: z.string().max(255).optional(),
  amount: z.number().min(0),
  triggerDescription: z.string().min(1).max(2000),
  participantIds: z.array(z.string().uuid()).min(1),
});

export const resolveBetSchema = z.object({
  outcome: z.string().min(1).max(2000),
});

export type CreateRoundInput = z.infer<typeof createRoundSchema>;
export type UpdateRoundInput = z.infer<typeof updateRoundSchema>;
export type BatchScoreInput = z.infer<typeof batchScoreSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type CreateBetInput = z.infer<typeof createBetSchema>;
export type ResolveBetInput = z.infer<typeof resolveBetSchema>;
