import { z } from "zod";

export const createSettlementSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  paidToUserId: z.string().min(1, "Select a friend to pay"),
  groupId: z.string().optional(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
