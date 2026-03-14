import { z } from "zod/v4";

export const createBookingRequestSchema = z.object({
  courseId: z.string().uuid(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  targetTimeRange: z.object({
    earliest: z.string(),
    latest: z.string(),
  }),
  preferredTime: z.string().optional(),
  numGolfers: z.number().int().min(2).max(8),
  notes: z.string().max(2000).optional(),
});

export const updateBookingRequestSchema = createBookingRequestSchema.partial();

export const captureExternalBookingSchema = z.object({
  type: z.enum(["golf", "lodging", "flight", "other"]),
  source: z.string().max(255).optional(),
  confirmationNumber: z.string().max(255).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  time: z.string().max(10).optional(),
  cost: z.number().min(0).optional(),
  bookingContact: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
  linkUrl: z.string().url().max(500).optional(),
});

export type CreateBookingRequestInput = z.infer<
  typeof createBookingRequestSchema
>;
export type UpdateBookingRequestInput = z.infer<
  typeof updateBookingRequestSchema
>;
export type CaptureExternalBookingInput = z.infer<
  typeof captureExternalBookingSchema
>;
