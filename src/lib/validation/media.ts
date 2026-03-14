import { z } from "zod/v4";

export const uploadPhotoSchema = z.object({
  caption: z.string().max(500).optional(),
});

export const tagPhotoSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, "At least one user ID required"),
});

export const consentSchema = z.object({
  decision: z.enum(["approved", "vetoed"]),
});

export const updateMicrositeSchema = z.object({
  selectedAssetIds: z.array(z.string().uuid()).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

export const visibilitySchema = z.object({
  mode: z.enum(["unlisted", "public"]),
});

export type UploadPhotoInput = z.infer<typeof uploadPhotoSchema>;
export type TagPhotoInput = z.infer<typeof tagPhotoSchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
export type UpdateMicrositeInput = z.infer<typeof updateMicrositeSchema>;
export type VisibilityInput = z.infer<typeof visibilitySchema>;
