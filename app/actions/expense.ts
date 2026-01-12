"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema, CreateExpenseInput } from "@/lib/validations/expense";
import { logActivity } from "@/lib/activity";

export async function createExpense(data: CreateExpenseInput) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const validation = createExpenseSchema.safeParse(data);

  if (!validation.success) {
    return { error: validation.error.format() };
  }

  const { description, amount, category, date, groupId, splitType, splits } =
    validation.data;

  try {
    const expense = await prisma.$transaction(async (tx) => {
      // Create the expense
      const newExpense = await tx.expense.create({
        data: {
          description,
          amount,
          category,
          date,
          groupId,
          splitType,
          paidByUserId: user.id, // Paying user is creator for now (unless specified differently in future)
          createdByUserId: user.id,
          splits: {
            create: splits.map((split) => ({
              userId: split.userId,
              amount: split.amount,
            })),
          },
        },
      });

      // 2. Update Balances
      // Logic:
      // "Total Balance" = (Amount I paid for others) - (Amount I owe others)
      
      const paidByUserId = user.id;

      // Loop through each split to update individual balances
      for (const split of splits) {
        // If the person involved is NOT the payer, they OWE money.
        // Their net balance DECREASES (becomes more negative).
        if (split.userId !== paidByUserId) {
          await tx.user.update({
            where: { id: split.userId },
            data: { totalBalance: { decrement: split.amount } },
          });
        }
      }

      // The Payer (You) paid the full amount. 
      // But part of that was your own share (if you are in the splits).
      // Your Net Balance increases by the amount you paid FOR OTHERS.
      // Calculation: (Total Amount) - (My Share)
      // OR simpler: Just iterate all splits. If split.userId != payer, payer gets +amount.
      
      const payerShare = splits.find(s => s.userId === paidByUserId)?.amount || 0;
      const amountLent = amount - payerShare;

      if (amountLent > 0) {
        await tx.user.update({
          where: { id: paidByUserId },
          data: { totalBalance: { increment: amountLent } },
        });
      }

      return newExpense;
    });

    // Add Activity Logging
    await logActivity({
      type: "EXPENSE_CREATED",
      message: `You added "${expense.description}"`,
      userId: user.id,
      groupId: expense.groupId || undefined,
      relatedId: expense.id,
    });

    revalidatePath("/dashboard");
    return { success: true, expense };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { error: "Failed to create expense" };
  }
}
