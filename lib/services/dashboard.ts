import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics(userId: string) {
  // 1. What does the user OWE? (Negative Balance)
  // Logic: Splits where 'userId' is ME, but 'paidByUserId' is NOT ME
  const debts = await prisma.split.findMany({
    where: {
      userId: userId,
      paid: false,
      expense: {
        paidByUserId: {
          not: userId,
        },
      },
    },
    include: {
      expense: {
        select: {
          paidByUserId: true,
          // currency: true,
        },
      },
    },
  });

  // 2. What is the user OWED? (Positive Balance)
  // Logic: Splits where 'userId' is NOT ME, but 'paidByUserId' IS ME
  const credits = await prisma.split.findMany({
    where: {
      userId: {
        not: userId,
      },
      paid: false,
      expense: {
        paidByUserId: userId,
      },
    },
  });

  // Calculate totals
  const totalOwed = credits.reduce((sum, split) => sum + Number(split.amount), 0);
  const totalOwing = debts.reduce((sum, split) => sum + Number(split.amount), 0);
  const netBalance = totalOwed - totalOwing;

  return {
    totalOwed,
    totalOwing,
    netBalance,
  };
}
