import { z } from "zod/v4";

// --- Search ---

const coordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const anchorSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("airport"),
    value: z.string().min(1).max(10),
  }),
  z.object({
    type: z.literal("city"),
    value: z.string().min(1).max(255),
  }),
  z.object({
    type: z.literal("coordinates"),
    value: coordsSchema,
  }),
  z.object({
    type: z.literal("bounds"),
    value: z.object({ sw: coordsSchema, ne: coordsSchema }),
  }),
]);

export const searchCoursesSchema = z.object({
  anchor: anchorSchema,
  radiusMiles: z.number().min(1).max(200).optional().default(50),
  priceBand: z
    .object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    })
    .optional(),
  numGolfers: z.number().int().min(1).max(8).optional(),
  accessTypes: z
    .array(z.enum(["public", "resort", "semi_private", "private"]))
    .optional(),
  includePrivate: z.boolean().optional().default(false),
  tripId: z.string().uuid().optional(),
  sortBy: z
    .enum(["distance", "price", "quality"])
    .optional()
    .default("distance"),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});

export type SearchCoursesInput = z.infer<typeof searchCoursesSchema>;

// --- Course Report ---

export const createReportSchema = z.object({
  reportType: z.enum([
    "misclassified_access",
    "wrong_price",
    "closed_permanently",
    "duplicate",
    "other",
  ]),
  description: z.string().min(10, "Please provide details").max(2000),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
