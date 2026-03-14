import { z } from "zod/v4";

const feeTypeValues = [
  "tee_time_service",
  "cancellation_penalty",
  "pass_through",
] as const;

const allFeeTypeValues = [
  "tee_time_service",
  "bet_fee",
  "lodging_service",
  "air_service",
  "cancellation_penalty",
  "pass_through",
] as const;

const calculationMethodValues = ["flat", "percentage"] as const;

export const feeEstimateSchema = z.object({
  type: z.enum(feeTypeValues),
  baseCost: z.number().min(0),
  numGolfers: z.number().int().min(1).max(8).optional(),
});

export const updateFeeScheduleSchema = z.object({
  feeType: z.enum(allFeeTypeValues),
  calculationMethod: z.enum(calculationMethodValues),
  flatAmount: z.number().min(0).optional(),
  percentageRate: z.number().min(0).max(1).optional(),
  perGolferCap: z.number().min(0).optional(),
  effectiveFrom: z.string().datetime(),
});

export const createFeeChargeSchema = z.object({
  tripId: z.string().uuid(),
  userId: z.string().uuid(),
  feeType: z.enum(allFeeTypeValues),
  sourceObjectType: z.string().min(1).max(50),
  sourceObjectId: z.string().uuid(),
  amount: z.number().min(0),
});

export type FeeEstimateInput = z.infer<typeof feeEstimateSchema>;
export type UpdateFeeScheduleInput = z.infer<typeof updateFeeScheduleSchema>;
export type CreateFeeChargeInput = z.infer<typeof createFeeChargeSchema>;
