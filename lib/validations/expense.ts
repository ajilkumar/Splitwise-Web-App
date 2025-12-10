import { z } from "zod";

export const createExpenseSchema = z
  .object({
    description: z.string().min(1, "Description is required"),
    amount: z.coerce.number().positive("Amount must be positive"),
    category: z.string().default("General"),
    date: z.coerce.date(),
    groupId: z.string().optional(),
    splitType: z.enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"]),
    splits: z
      .array(
        z.object({
          userId: z.string(),
          amount: z.coerce.number().min(0),
        })
      )
      .min(1, "At least one person must be involved in the split"),
  })
  .refine(
    (data) => {
      if (data.splitType === "EXACT") {
        const totalSplit = data.splits.reduce(
          (sum, split) => sum + split.amount,
          0
        );
        return Math.abs(totalSplit - data.amount) < 0.01;
      }
      if (data.splitType === "PERCENTAGE") {
        const totalPercent = data.splits.reduce(
          (sum, split) => sum + split.amount,
          0
        );
        return Math.abs(totalPercent - 100) < 0.01;
      }
      return true;
    },
    {
      message: "Split amounts must equal the total expense amount (or 100%)",
      path: ["splits"],
    }
  );

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
