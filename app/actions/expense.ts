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

      // Future: Update balances here via logic similar to settlements if using a ledger system
      // For now, balances are calculated on-the-fly or updated via settlements.
      
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
