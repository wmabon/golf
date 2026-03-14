import { z } from "zod/v4";

export const createItineraryItemSchema = z.object({
  itemType: z.enum([
    "golf",
    "lodging",
    "flight",
    "dining",
    "transport",
    "note",
    "other",
  ]),
  title: z.string().min(1).max(500),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z
    .object({
      address: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })
    .optional(),
  confirmationNumber: z.string().max(255).optional(),
  bookingContact: z.string().max(255).optional(),
  participants: z.array(z.string().uuid()).optional(),
  contactNotes: z.string().max(2000).optional(),
  cost: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
  sortOrder: z.number().int().optional(),
});

export const updateItineraryItemSchema = createItineraryItemSchema.partial();

export type CreateItineraryItemInput = z.infer<
  typeof createItineraryItemSchema
>;
export type UpdateItineraryItemInput = z.infer<
  typeof updateItineraryItemSchema
>;
