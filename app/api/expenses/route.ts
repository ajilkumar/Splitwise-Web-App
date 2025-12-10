
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { ApiResponse } from "@/lib/api/response";
import { createExpenseSchema } from "@/lib/validations/expense";

export const POST = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const json = await req.json();
  const body = createExpenseSchema.parse(json);

  // 1. If groupId is provided, verify membership
  if (body.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: body.groupId,
          userId: user.id,
        },
      },
    });
    if (!membership) {
      throw new ApiError(403, "You are not a member of this group");
    }
  }

  // 2. Transaction: Create Expense + Splits
  const expense = await prisma.$transaction(async (tx) => {
    // Create the main expense record
    const newExpense = await tx.expense.create({
      data: {
        description: body.description,
        amount: body.amount,
        category: body.category,
        date: body.date,
        groupId: body.groupId,
        paidByUserId: user.id, // Assuming the creator is the payer for now. Ideally, this should be selectable.
        createdByUserId: user.id,
        splitType: body.splitType,
      },
    });

    // Create splits
    await tx.split.createMany({
      data: body.splits.map((split) => ({
        expenseId: newExpense.id,
        userId: split.userId,
        amount: split.amount,
        paid: false, // Default to false
      })),
    });

    return newExpense;
  });

  return new ApiResponse(201, expense, "Expense created successfully");
});

export const GET = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  // Fetch recent expenses where the user is involved (either paid or part of the split)
  // This is a bit complex query. For MVP, let's fetch expenses from groups the user is part of.
  
  // 1. Get Group IDs the user is part of
  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    select: { groupId: true },
  });
  const groupIds = memberships.map((m) => m.groupId);

  // 2. Fetch expenses in those groups
  const expenses = await prisma.expense.findMany({
    where: {
      groupId: { in: groupIds },
    },
    take: 20,
    orderBy: { date: "desc" },
    include: {
      paidByUser: {
        select: { firstName: true, imageUrl: true },
      },
      group: {
        select: { name: true },
      },
    },
  });

  return new ApiResponse(200, expenses, "Recent activity fetched successfully");
});
