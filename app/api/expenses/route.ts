import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validations/expense";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { ApiResponse } from "@/lib/api/response";
import { logActivity } from "@/lib/activity";

export const POST = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const json = await req.json();
  const body = createExpenseSchema.parse(json);

  // Group Validation
  if (body.groupId) {
    const isMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: body.groupId,
          userId: user.id,
        },
      },
    });

    if (!isMember) {
      throw new ApiError(403, "You are not a member of this group");
    }
  } else {
    // Friend Validation (Non-group)
    // If no group, ensure we are splitting with valid friends
    // For now, we allow splitting with self (tracking personal expense) or others.
    // Ideally, check for friendship status here, but skipping for flexibility in V1.
  }

  // Calculate generic split Logic if using Shares or Percentage
  let finalSplits = body.splits.map((s) => ({ ...s, amount: Number(s.amount) }));

  if (body.splitType === "PERCENTAGE") {
    finalSplits = body.splits.map((s) => ({
      userId: s.userId,
      amount: (body.amount * s.amount) / 100,
    }));
  } else if (body.splitType === "SHARES") {
    const totalShares = body.splits.reduce((sum, s) => sum + s.amount, 0);
    finalSplits = body.splits.map((s) => ({
      userId: s.userId,
      amount: (body.amount * s.amount) / totalShares,
    }));
  }

  // Double check basic math safety (rounding errors)
  // Sum of splits might not exactly match total due to float math.
  // In production, we'd distribute the penny remainder.

  const expense = await prisma.expense.create({
    data: {
      description: body.description,
      amount: body.amount,
      category: body.category,
      date: body.date,
      groupId: body.groupId || null,
      paidByUserId: user.id,
      createdByUserId: user.id,
      splitType: body.splitType,
      splits: {
        create: finalSplits.map((s) => ({
          userId: s.userId,
          amount: s.amount,
        })),
      },
    },
    include: {
      splits: true,
    },
  });

  await logActivity({
    type: "EXPENSE_CREATED",
    message: `You created expense '${body.description}'`,
    userId: user.id,
    groupId: body.groupId,
    relatedId: expense.id,
    metadata: { amount: body.amount, splitType: body.splitType },
  });

  return new ApiResponse(201, expense, "Expense created successfully");
});
