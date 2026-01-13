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
    if (expense.groupId) {
      revalidatePath(`/groups/${expense.groupId}`);
    }
    revalidatePath("/groups");
    
    // Serialize Decimal fields to numbers for client components
    return { 
      success: true, 
      expense: {
        ...expense,
        amount: Number(expense.amount)
      }
    };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { error: "Failed to create expense" };
  }
}

export async function updateExpense(expenseId: string, data: CreateExpenseInput) {
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

  // Check if user is authorized (creator or payer)
  const existingExpense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { splits: true },
  });

  if (!existingExpense) {
    return { error: "Expense not found" };
  }

  if (existingExpense.createdByUserId !== user.id && existingExpense.paidByUserId !== user.id) {
    return { error: "Unauthorized to edit this expense" };
  }

  const validation = createExpenseSchema.safeParse(data);

  if (!validation.success) {
    return { error: validation.error.format() };
  }

  const { description, amount, category, date, groupId, splitType, splits } =
    validation.data;

  try {
    const expense = await prisma.$transaction(async (tx) => {
      // 1. Reverse old balance updates
      const oldPaidByUserId = existingExpense.paidByUserId;
      const oldPayerShare = existingExpense.splits.find(s => s.userId === oldPaidByUserId)?.amount || 0;
      const oldAmountLent = Number(existingExpense.amount) - Number(oldPayerShare);

      // Reverse payer's balance
      if (oldAmountLent > 0) {
        await tx.user.update({
          where: { id: oldPaidByUserId },
          data: { totalBalance: { decrement: oldAmountLent } },
        });
      }

      // Reverse split participants' balances
      for (const oldSplit of existingExpense.splits) {
        if (oldSplit.userId !== oldPaidByUserId) {
          await tx.user.update({
            where: { id: oldSplit.userId },
            data: { totalBalance: { increment: oldSplit.amount } },
          });
        }
      }

      // 2. Delete old splits
      await tx.split.deleteMany({
        where: { expenseId },
      });

      // 3. Update expense
      const updatedExpense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          description,
          amount,
          category,
          date,
          groupId,
          splitType,
          splits: {
            create: splits.map((split) => ({
              userId: split.userId,
              amount: split.amount,
            })),
          },
        },
      });

      // 4. Apply new balance updates
      const newPaidByUserId = user.id;
      const newPayerShare = splits.find(s => s.userId === newPaidByUserId)?.amount || 0;
      const newAmountLent = amount - newPayerShare;

      // Update split participants
      for (const split of splits) {
        if (split.userId !== newPaidByUserId) {
          await tx.user.update({
            where: { id: split.userId },
            data: { totalBalance: { decrement: split.amount } },
          });
        }
      }

      // Update payer
      if (newAmountLent > 0) {
        await tx.user.update({
          where: { id: newPaidByUserId },
          data: { totalBalance: { increment: newAmountLent } },
        });
      }

      return updatedExpense;
    });

    // Log activity
    await logActivity({
      type: "EXPENSE_UPDATED",
      message: `You updated "${expense.description}"`,
      userId: user.id,
      groupId: expense.groupId || undefined,
      relatedId: expense.id,
    });

    revalidatePath("/dashboard");
    if (expense.groupId) {
      revalidatePath(`/groups/${expense.groupId}`);
    }
    revalidatePath("/groups");
    revalidatePath(`/expenses/${expenseId}`);
    
    // Serialize Decimal fields to numbers for client components
    return { 
      success: true, 
      expense: {
        ...expense,
        amount: Number(expense.amount)
      }
    };
  } catch (error) {
    console.error("Failed to update expense:", error);
    return { error: "Failed to update expense" };
  }
}

export async function deleteExpense(expenseId: string) {
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

  // Check if user is authorized (creator or payer)
  const existingExpense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { splits: true },
  });

  if (!existingExpense) {
    return { error: "Expense not found" };
  }

  if (existingExpense.createdByUserId !== user.id && existingExpense.paidByUserId !== user.id) {
    return { error: "Unauthorized to delete this expense" };
  }

  try {
    const groupId = existingExpense.groupId;
    const description = existingExpense.description;

    await prisma.$transaction(async (tx) => {
      // 1. Reverse balance updates
      const paidByUserId = existingExpense.paidByUserId;
      const payerShare = existingExpense.splits.find(s => s.userId === paidByUserId)?.amount || 0;
      const amountLent = Number(existingExpense.amount) - Number(payerShare);

      // Reverse payer's balance
      if (amountLent > 0) {
        await tx.user.update({
          where: { id: paidByUserId },
          data: { totalBalance: { decrement: amountLent } },
        });
      }

      // Reverse split participants' balances
      for (const split of existingExpense.splits) {
        if (split.userId !== paidByUserId) {
          await tx.user.update({
            where: { id: split.userId },
            data: { totalBalance: { increment: split.amount } },
          });
        }
      }

      // 2. Delete expense (splits cascade)
      await tx.expense.delete({
        where: { id: expenseId },
      });
    });

    // Log activity
    await logActivity({
      type: "EXPENSE_DELETED",
      message: `You deleted "${description}"`,
      userId: user.id,
      groupId: groupId || undefined,
      relatedId: expenseId,
    });

    revalidatePath("/dashboard");
    if (groupId) {
      revalidatePath(`/groups/${groupId}`);
    }
    revalidatePath("/groups");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return { error: "Failed to delete expense" };
  }
}
