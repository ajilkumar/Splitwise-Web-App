"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {prisma} from "@/lib/prisma";
import { createExpenseSchema, CreateExpenseInput } from "@/lib/validations/expense";

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
          paidByUserId: user.id, // Defaulting to current user for now
          createdByUserId: user.id,
          splits: {
            create: splits.map((split) => ({
              userId: split.userId,
              amount: split.amount,
            })),
          },
        },
      });

      return newExpense;
    });

    revalidatePath("/dashboard");
    return { success: true, expense };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { error: "Failed to create expense" };
  }
}
