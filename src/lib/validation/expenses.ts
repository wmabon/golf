import { z } from "zod/v4";

const expenseCategoryValues = [
  "tee_time",
  "lodging",
  "meal",
  "transport",
  "other",
] as const;

const splitMethodValues = ["equal", "custom", "exclude"] as const;

const customSplitEntry = z.object({
  userId: z.string().uuid(),
  amount: z.number().min(0),
});

export const createExpenseSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  category: z.enum(expenseCategoryValues),
  splitMethod: z.enum(splitMethodValues).default("equal"),
  customSplits: z.array(customSplitEntry).optional(),
  excludedUserIds: z.array(z.string().uuid()).optional(),
});

export const updateExpenseSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  amount: z.number().min(0).optional(),
  category: z.enum(expenseCategoryValues).optional(),
  splitMethod: z.enum(splitMethodValues).optional(),
  customSplits: z.array(customSplitEntry).optional(),
  excludedUserIds: z.array(z.string().uuid()).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
