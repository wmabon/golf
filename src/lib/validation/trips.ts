import { z } from "zod/v4";

export const createTripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(255),
  dateStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  dateEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  golferCount: z.number().int().min(2).max(8).optional().default(4),
  anchorType: z.enum(["airport_code", "city_region", "map_area"]),
  anchorValue: z.string().min(1, "Destination is required").max(255),
  budgetSettings: z
    .object({
      perRoundMin: z.number().min(0).optional(),
      perRoundMax: z.number().min(0).optional(),
    })
    .optional(),
});

export const updateTripSchema = createTripSchema.partial();

export const transitionStateSchema = z.object({
  status: z.enum([
    "draft",
    "planning",
    "voting",
    "booking",
    "locked",
    "in_progress",
    "completed",
    "archived",
  ]),
});

export const sendInvitesSchema = z.object({
  emails: z.array(z.email()).min(1, "At least one email required"),
});

export const setConstraintsSchema = z.object({
  hardConstraints: z
    .object({
      maxBudgetPerRound: z.number().min(0).optional(),
      travelWindowStart: z.string().optional(),
      travelWindowEnd: z.string().optional(),
      preferredAirport: z.string().optional(),
      willingPrivateRounds: z.boolean().optional(),
    })
    .optional()
    .nullable(),
  softPreferences: z
    .object({
      preferredTeeTime: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export const transferCaptainSchema = z.object({
  newCaptainId: z.string().uuid(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

// --- Shortlist & Voting (FR-23-28) ---

export const createOptionSchema = z.object({
  type: z.enum(["destination", "course", "itinerary"]),
  title: z.string().min(1, "Title is required").max(500),
  estimatedCostPerGolfer: z.number().min(0).optional(),
  fitScore: z.number().min(0).max(5).optional(),
  fitRationale: z.string().max(2000).optional(),
});

export const updateOptionSchema = createOptionSchema.partial();

export const castVoteSchema = z.object({
  voteValue: z.enum(["in", "fine", "out"]),
  comment: z.string().max(1000).optional().nullable(),
  budgetObjection: z.boolean().optional().default(false),
});

export const setVotingDeadlineSchema = z.object({
  deadline: z.string().datetime(),
});

export const switchVotingModeSchema = z.object({
  mode: z.enum(["destination", "course"]),
});

export type CreateOptionInput = z.infer<typeof createOptionSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
