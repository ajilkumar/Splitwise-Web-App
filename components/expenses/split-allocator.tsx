"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
}

export interface SplitItem {
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

  // Helper function to distribute rounding errors to the largest split
  const distributeRemainder = (splits: SplitItem[], total: number, targetTotal: number): SplitItem[] => {
    const remainder = targetTotal - total;
    if (Math.abs(remainder) < 0.01) return splits; // No rounding needed
    
    // Find the largest split and add the remainder to it
    const sortedSplits = [...splits].sort((a, b) => b.amount - a.amount);
    const largestSplit = sortedSplits[0];
    
    return splits.map(split => 
      split.userId === largestSplit.userId
        ? { ...split, amount: split.amount + remainder }
        : split
    );
  };

  const [prevProps, setPrevProps] = useState({ amount, splitType, userCount: users.length });

  // Calculate defaults
  const calculateValues = () => {
     const newValues: Record<string, number> = {};
     if (splitType === "SHARES") {
        users.forEach(u => newValues[u.id] = 1);
     } else {
        // PERCENTAGE or EXACT
        users.forEach(u => {
           if (splitType === "PERCENTAGE") newValues[u.id] = 100 / users.length;
           else newValues[u.id] = amount / users.length;
        });
     }
     return newValues;
  };

  if (prevProps.amount !== amount || prevProps.splitType !== splitType || prevProps.userCount !== users.length) {
    setPrevProps({ amount, splitType, userCount: users.length });
    // Reset values logic
    if (splitType === "EQUAL") {
       setValues({});
    } else {
       setValues(calculateValues());
    }
  }

  // Effect only for calculating splits and calling onChange (no setState)
  useEffect(() => {
    if (splitType === "EQUAL") {
       const splitAmount = amount / users.length;
       const baseAmount = Math.floor((splitAmount * 100)) / 100;
       const remainder = amount - (baseAmount * users.length);
       const newSplits = users.map((u, index) => ({
         userId: u.id,
         amount: index === 0 ? baseAmount + remainder : baseAmount
       }));
       onChange(newSplits);
    } else {
       // Calculation depends on 'values'.
       // Note: 'values' here will be the stale one from closure if we didn't update it?
       // Wait, if we setValues during render, the component re-renders IMMEDIATELY.
       // The Effect runs AFTER the re-render.
       // So 'values' in this effect will be the NEW values.
       
       let newSplits: SplitItem[] = [];
       if (splitType === "SHARES") {
          // const shareValue = 1; // Unused
          // If we just reset, values are 1.
          
          const totalShares = users.reduce((sum, u) => sum + (values[u.id] || 0), 0);
          if (totalShares > 0) {
             newSplits = users.map(u => ({
                userId: u.id,
                amount: (amount * (values[u.id] || 0)) / totalShares
             }));
          } else {
             newSplits = users.map(u => ({ userId: u.id, amount: 0 }));
          }
       } else if (splitType === "PERCENTAGE") {
          newSplits = users.map(u => ({
            userId: u.id,
            amount: (amount * (values[u.id] || 0)) / 100
          }));
       } else if (splitType === "EXACT") {
          newSplits = users.map(u => ({
            userId: u.id,
            amount: values[u.id] || 0
          }));
       }
       
       if (newSplits.length > 0) {
          const total = newSplits.reduce((sum, s) => sum + s.amount, 0);
          const adjustedSplits = distributeRemainder(newSplits, total, amount);
          onChange(adjustedSplits);
       }
    }
  }, [amount, users, splitType, values, onChange]); // Added values to deps

  const handleInputChange = (userId: string, val: string) => {
    const num = parseFloat(val) || 0;
    const newValues = { ...values, [userId]: num };
    setValues(newValues);

    let newSplits: SplitItem[];
    
    if (splitType === "PERCENTAGE") {
      // Convert percentage to amount
      newSplits = users.map(u => ({
        userId: u.id,
        amount: (amount * (newValues[u.id] || 0)) / 100
      }));
    } else if (splitType === "SHARES") {
      // Convert shares to amount
      const totalShares = users.reduce((sum, u) => sum + (newValues[u.id] || 0), 0);
      if (totalShares > 0) {
        newSplits = users.map(u => ({
          userId: u.id,
          amount: (amount * (newValues[u.id] || 0)) / totalShares
        }));
      } else {
        newSplits = users.map(u => ({ userId: u.id, amount: 0 }));
      }
    } else {
      // EXACT split
      newSplits = users.map(u => ({
        userId: u.id,
        amount: newValues[u.id] || 0
      }));
    }
    
    // Distribute remainder for EXACT and SHARES
    if (splitType === "EXACT" || splitType === "SHARES") {
      const total = newSplits.reduce((sum, s) => sum + s.amount, 0);
      newSplits = distributeRemainder(newSplits, total, amount);
    }
    
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
                        {formatCurrency(amount / users.length)}
                      </span>
                  </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground w-full text-center">= {formatCurrency(amount)} total</p>
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
      <div className="text-right text-xs space-y-1">
          {splitType === "PERCENTAGE" && (() => {
            const totalPercent = Object.values(values).reduce((a, b) => a + b, 0);
            const isValid = Math.abs(totalPercent - 100) < 0.01;
            return (
              <div>
                <span className={isValid ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  Total: {totalPercent.toFixed(2)}% / 100%
                </span>
                {!isValid && (
                  <p className="text-red-500 text-[10px] mt-1">
                    {totalPercent < 100 ? "Add " + (100 - totalPercent).toFixed(2) + "%" : "Reduce by " + (totalPercent - 100).toFixed(2) + "%"}
                  </p>
                )}
              </div>
            );
          })()}
          {splitType === "EXACT" && (() => {
            const totalAmount = Object.values(values).reduce((a, b) => a + b, 0);
            const isValid = Math.abs(totalAmount - amount) < 0.01;
            return (
              <div>
                <span className={isValid ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  Total: {formatCurrency(totalAmount)} / {formatCurrency(amount)}
                </span>
                {!isValid && (
                  <p className="text-red-500 text-[10px] mt-1">
                    {totalAmount < amount 
                      ? "Add " + formatCurrency(amount - totalAmount) 
                      : "Reduce by " + formatCurrency(totalAmount - amount)}
                  </p>
                )}
              </div>
            );
          })()}
          {splitType === "SHARES" && (() => {
            const totalShares = Object.values(values).reduce((a, b) => a + b, 0);
            const isValid = totalShares > 0;
            return (
              <div>
                <span className={isValid ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  Total shares: {totalShares.toFixed(2)}
                </span>
                {!isValid && (
                  <p className="text-red-500 text-[10px] mt-1">
                    At least one share must be greater than 0
                  </p>
                )}
              </div>
            );
          })()}
      </div>
    </div>
  );
}
