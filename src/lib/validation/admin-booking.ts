import { z } from "zod/v4";

export const assignRequestSchema = z.object({
  assignedTo: z.string().uuid(),
});

export const addNoteSchema = z.object({
  note: z.string().min(1).max(5000),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    "candidate",
    "window_pending",
    "requested",
    "partial_hold",
    "booked",
    "canceled",
  ]),
});

export const attachConfirmationSchema = z.object({
  slots: z
    .array(
      z.object({
        slotId: z.string().uuid(),
        confirmationNumber: z.string().min(1).max(255),
        confirmedTeeTime: z.string().datetime(),
        costPerPlayer: z.number().min(0).optional(),
        totalCost: z.number().min(0).optional(),
      })
    )
    .min(1),
});

export type AssignRequestInput = z.infer<typeof assignRequestSchema>;
export type AddNoteInput = z.infer<typeof addNoteSchema>;
export type UpdateBookingStatusInput = z.infer<
  typeof updateBookingStatusSchema
>;
export type AttachConfirmationInput = z.infer<
  typeof attachConfirmationSchema
>;
