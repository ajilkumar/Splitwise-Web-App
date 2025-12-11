import { z } from "zod";

export const createSettlementSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  paidByUserId: z.string(),
  receivedByUserId: z.string(),
  groupId: z.string().optional(),
  date: z.coerce.date().optional(),
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
