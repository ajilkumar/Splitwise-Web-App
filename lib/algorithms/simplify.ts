export interface Transaction {
  from: string;
  to: string;
  amount: number;
}

/**
 * Simplifies debts by minimizing the number of transactions.
 * Uses a greedy approach which is optimal for this "Minimize Cash Flow" problem.
 * Time Complexity: O(N^2) where N is number of people.
 */
export function simplifyDebts(transactions: Transaction[]): Transaction[] {
  // 1. Calculate net balance for each person
  const balances: Record<string, number> = {};

  transactions.forEach((t) => {
    balances[t.from] = (balances[t.from] || 0) - t.amount;
    balances[t.to] = (balances[t.to] || 0) + t.amount;
  });

  const people = Object.keys(balances);
  const creditList: { person: string; amount: number }[] = [];
  const debitList: { person: string; amount: number }[] = [];

  // 2. Separate into those who owe (Debit) and those who are owed (Credit)
  people.forEach((p) => {
    const bal = balances[p];
    if (bal > 0.01) creditList.push({ person: p, amount: bal });
    if (bal < -0.01) debitList.push({ person: p, amount: -bal }); // Store as positive debt
  });

  const simplified: Transaction[] = [];

  // 3. Match max debtor with max creditor Greedy Algorithm
  // While both lists have people
  while (debitList.length > 0 && creditList.length > 0) {
    // Sort to find max (Greedy choice)
    // Sorting inside loop is O(N^2 log N), but N is small (group size). 
    // Optimization: Use MaxHeap for O(N log N). For <50 people, sort is fine.
    debitList.sort((a, b) => b.amount - a.amount);
    creditList.sort((a, b) => b.amount - a.amount);

    const debtor = debitList[0];
    const creditor = creditList[0];

    const amount = Math.min(debtor.amount, creditor.amount);

    simplified.push({
      from: debtor.person,
      to: creditor.person,
      amount: Number(amount.toFixed(2)),
    });

    // Update remaining amounts
    debtor.amount -= amount;
    creditor.amount -= amount;

    // Remove if settled (using small epsilon for float precision)
    if (debtor.amount < 0.01) debitList.shift();
    if (creditor.amount < 0.01) creditList.shift();
  }

  return simplified;
}
