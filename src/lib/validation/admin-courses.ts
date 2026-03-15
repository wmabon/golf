import { z } from "zod/v4";

export const updateAccessSchema = z.object({
  accessType: z.enum(["public", "resort", "semi_private", "private", "unknown"]),
  accessConfidence: z.enum(["verified", "unverified", "disputed"]),
});

export const updateBookingRulesSchema = z.object({
  bookingWindowDays: z.int().min(0).optional(),
  cancellationDeadlineHours: z.int().min(0).optional(),
  maxPlayers: z.int().min(1).max(8).optional(),
  bookingChannel: z.string().max(50).optional(),
  rulesConfirmed: z.boolean().optional(),
  publicTimesAvailable: z.boolean().optional(),
  bookingWindowRule: z.string().max(500).optional(),
  cancellationRule: z.string().max(500).optional(),
  cancellationPenaltyAmount: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  source: z.string().max(50).optional(),
});

export const resolveReportSchema = z.object({
  status: z.enum(["reviewed", "resolved", "dismissed"]),
});

export const adminCourseFilterSchema = z.object({
  search: z.string().max(255).optional(),
  accessType: z
    .enum(["public", "resort", "semi_private", "private", "unknown"])
    .optional(),
  status: z.enum(["draft", "active", "hidden", "archived"]).optional(),
});

export type UpdateAccessInput = z.infer<typeof updateAccessSchema>;
export type UpdateBookingRulesInput = z.infer<typeof updateBookingRulesSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type AdminCourseFilterInput = z.infer<typeof adminCourseFilterSchema>;
