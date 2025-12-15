import { simplifyDebts, Transaction } from "./simplify";

describe("simplifyDebts", () => {
  it("should return empty array for empty input", () => {
    expect(simplifyDebts([])).toEqual([]);
  });

  it("should simplify A->B->C to A->C", () => {
    // Alice owes Bob 10
    // Bob owes Charlie 10
    // Net: Alice -10, Bob 0, Charlie +10
    // Result: Alice owes Charlie 10
    const transactions: Transaction[] = [
      { from: "Alice", to: "Bob", amount: 10 },
      { from: "Bob", to: "Charlie", amount: 10 },
    ];

    const result = simplifyDebts(transactions);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      from: "Alice",
      to: "Charlie",
      amount: 10,
    });
  });

  it("should simplify a circular debt to zero (A->B->A)", () => {
    const transactions: Transaction[] = [
      { from: "Alice", to: "Bob", amount: 10 },
      { from: "Bob", to: "Alice", amount: 10 },
    ];
    const result = simplifyDebts(transactions);
    expect(result).toHaveLength(0);
  });

  it("should handle complex scenario", () => {
    // A -> B: 10
    // B -> C: 10
    // C -> A: 5
    // Net: A: -5, B: 0, C: +5
    // Result: A -> C: 5
    const transactions: Transaction[] = [
      { from: "A", to: "B", amount: 10 },
      { from: "B", to: "C", amount: 10 },
      { from: "C", to: "A", amount: 5 },
    ];
    const result = simplifyDebts(transactions);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ from: "A", to: "C", amount: 5 });
  });
});
