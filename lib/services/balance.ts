/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";

type BalanceMap = Record<string, number>; // userId -> net balance

export async function calculateGroupBalances(groupId: string) {
  // 1. Fetch all expenses and settlements for the group
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      expenses: {
        include: { splits: true },
      },
      settlements: true,
      members: {
        include: { user: true },
      },
    },
  });

  if (!group) throw new Error("Group not found");

  const balances: BalanceMap = {};

  // Initialize everyone with 0
  group.members.forEach((m) => {
    balances[m.userId] = 0;
  });

  // 2. Process Expenses
  // If Alice pays $100 and split is 50/50:
  // Alice: +100 (Paid) - 50 (Share) = +50
  // Bob: 0 (Paid) - 50 (Share) = -50
  for (const expense of group.expenses) {
    // Payer gets positive credit for the full amount
    balances[expense.paidByUserId] = (balances[expense.paidByUserId] || 0) + Number(expense.amount);

    // Each person in the split gets negative debit for their share
    for (const split of expense.splits) {
      balances[split.userId] = (balances[split.userId] || 0) - Number(split.amount);
    }
  }

  // 3. Process Settlements
  // If Bob pays Alice $50:
  // Bob: +50 (He paid, so his debt reduces / his balance increases)
  // Alice: -50 (She received, so her "owed" amount reduces)
  for (const settlement of group.settlements) {
    balances[settlement.paidByUserId] = (balances[settlement.paidByUserId] || 0) + Number(settlement.amount);
    balances[settlement.receivedByUserId] = (balances[settlement.receivedByUserId] || 0) - Number(settlement.amount);
  }

  // 4. Simplify Debts (User A owes User B)
  // Algorithm: Separate into Debtors (-) and Creditors (+)
  const debtors: { userId: string; amount: number }[] = [];
  const creditors: { userId: string; amount: number }[] = [];

  for (const [userId, amount] of Object.entries(balances)) {
    // Round to 2 decimals to avoid floating point issues
    const val = Math.round(amount * 100) / 100;
    if (val < -0.01) debtors.push({ userId, amount: -val }); // Store simplified positive debt
    if (val > 0.01) creditors.push({ userId, amount: val });
  }

  // Sort by magnitude (heuristic for better simplification)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: { from: string; to: string; amount: number; fromUser: any; toUser: any }[] = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    // The amount to settle is the minimum of what Debtor owes and Creditor is owed
    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
       // Find user details for response
       const fromUser = group.members.find(m => m.userId === debtor.userId)?.user;
       const toUser = group.members.find(m => m.userId === creditor.userId)?.user;

       debts.push({
         from: debtor.userId,
         to: creditor.userId,
         amount,
         fromUser,
         toUser
       });

       // Adjust remaining amounts
       debtor.amount -= amount;
       creditor.amount -= amount;
    }

    // Move pointers if settled
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return debts;
}
