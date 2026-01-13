"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { createSettlementSchema, CreateSettlementInput } from "@/lib/validations/settlement";

export async function createSettlement(data: CreateSettlementInput) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    return { error: "User not found" };
  }

  const result = createSettlementSchema.safeParse(data);

  if (!result.success) {
    return { error: "Invalid data" };
  }

  const { amount, date, paidToUserId, groupId } = result.data;

  // You cannot settle with yourself
  if (paidToUserId === user.id) {
      return { error: "Cannot settle with yourself" };
  }

  try {
    const settlement = await prisma.$transaction(async (tx) => {
      // 1. Create Settlement Record
      const newSettlement = await tx.settlement.create({
        data: {
          amount,
          date,
          paidByUserId: user.id, // Current user is the Payer
          receivedByUserId: paidToUserId, // Selected friend is Receiver
          groupId,
          createdByUserId: user.id,
        },
        include: {
            receivedByUser: true
        }
      });

      // 2. Update Balances
      // Payer (You): You paid money, so your "Total Balance" (Net Worth) INCREASES (Debts go down, or Credits go up technically???)
      // Wait. If I owe someone $50 (Balance -50). I pay them $50. My balance should be 0 (Increase by 50).
      // If I am owed $50 (Balance +50). Someone pays me. My balance stays same? No.
      // "Total Balance" usually means "Net amount you are owed".
      // If I owe $50, my Net is -50. If I pay it, my Net becomes 0. So +50. Correct.
      await tx.user.update({
        where: { id: user.id },
        data: { totalBalance: { increment: amount } },
      });

      // Receiver (Friend): They received money. Their "Net amount owed" DECREASES.
      // If they were owed $50 (+50). They get paid. Now they are owed 0. So -50. Correct.
      await tx.user.update({
        where: { id: paidToUserId },
        data: { totalBalance: { decrement: amount } },
      });

      return newSettlement;
    });

    // Log Activity
    await logActivity({
      type: "SETTLEMENT_CREATED",
      message: `You paid ${settlement.receivedByUser.firstName} ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(amount))}`,
      userId: user.id,
      groupId: groupId,
      relatedId: settlement.id,
    });

    revalidatePath("/dashboard");
    revalidatePath("/groups");
    if (groupId) {
      revalidatePath(`/groups/${groupId}`);
    }
    revalidatePath("/friends");
    
    return { data: settlement };
  } catch (error) {
    console.error("Failed to create settlement:", error);
    return { error: "Failed to record settlement" };
  }
}
