import { z } from "zod/v4";

export const declineSwapSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const updateSwapPolicySchema = z.object({
  policy: z.enum(["notify_only", "captain_approval", "auto_upgrade"]),
});

export const updateFreezeDateSchema = z.object({
  freezeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type DeclineSwapInput = z.infer<typeof declineSwapSchema>;
export type UpdateSwapPolicyInput = z.infer<typeof updateSwapPolicySchema>;
export type UpdateFreezeDateInput = z.infer<typeof updateFreezeDateSchema>;
