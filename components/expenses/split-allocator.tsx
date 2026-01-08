"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

interface SplitItem {
  userId: string;
  amount: number;
}

interface SplitAllocatorProps {
  amount: number;
  users: User[]; // Includes currently logged in user + selected friends
  splitType: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";
  onChange: (splits: SplitItem[]) => void;
  paidByUserId: string; // To possibly highlight payer
}

export function SplitAllocator({ amount, users, splitType, onChange }: SplitAllocatorProps) {
  const [values, setValues] = useState<Record<string, number>>({});

  // Reset or Recalculate when type or amount changes
  useEffect(() => {
    if (splitType === "EQUAL") {
      const splitAmount = amount / users.length;
      const newSplits = users.map(u => ({ userId: u.id, amount: splitAmount }));
      onChange(newSplits);
    } else {
        // Initialize values map for other types if empty
        // We generally don't auto-calculate for exact/percentage unless we want to distribute remainder?
        // For now, let user input.
    }
  }, [amount, users.length, splitType, users, onChange]);

  const handleInputChange = (userId: string, val: string) => {
    const num = parseFloat(val) || 0;
    const newValues = { ...values, [userId]: num };
    setValues(newValues);

    const newSplits = users.map(u => ({
        userId: u.id,
        amount: newValues[u.id] || 0
    }));
    onChange(newSplits);
  };

  if (splitType === "EQUAL") {
      return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {users.map(u => (
                  <Badge key={u.id} variant="secondary" className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={u.imageUrl || ""} />
                        <AvatarFallback>{u.firstName?.[0]}</AvatarFallback>
                      </Avatar>
                      {u.firstName}
                      <span className="ml-1 font-bold">
                        ${(amount / users.length).toFixed(2)}
                      </span>
                  </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground w-full text-center">= ${amount.toFixed(2)} total</p>
          </div>
      )
  }

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                <AvatarImage src={u.imageUrl || ""} />
                <AvatarFallback>{u.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">{u.firstName}</div>
            </div>
            <div className="flex items-center space-x-2">
                <Input
                    type="number"
                    className="w-24 h-8 text-right"
                    placeholder="0"
                    onChange={(e) => handleInputChange(u.id, e.target.value)}
                />
                <span className="text-xs text-muted-foreground w-4">
                    {splitType === "PERCENTAGE" ? "%" : splitType === "SHARES" ? "units" : "$"}
                </span>
            </div>
        </div>
      ))}
      <div className="text-right text-xs text-muted-foreground">
          {splitType === "PERCENTAGE" && "Total: " + Object.values(values).reduce((a, b) => a + b, 0) + "%"}
          {splitType === "EXACT" && "Total: $" + Object.values(values).reduce((a, b) => a + b, 0).toFixed(2) + " / " + amount}
      </div>
    </div>
  );
}
