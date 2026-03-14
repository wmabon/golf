import { z } from "zod/v4";

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional().nullable(),
  handicap: z.number().min(-10).max(54).optional().nullable(),
  homeAirport: z.string().max(10).optional().nullable(),
  preferredLocation: z.string().max(255).optional().nullable(),
});

export const createMembershipSchema = z.object({
  clubName: z.string().min(1, "Club name is required").max(255),
  networkName: z.string().max(255).optional().nullable(),
  accessType: z.string().min(1, "Access type is required").max(50),
  willingToSponsor: z.boolean().optional().default(false),
  guestLimitNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateMembershipSchema = createMembershipSchema.partial();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
