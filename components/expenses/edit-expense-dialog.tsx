"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateExpense } from "@/app/actions/expense";
import {
  createExpenseSchema,
  CreateExpenseInput,
} from "@/lib/validations/expense";
import { FriendSelector } from "./friend-selector";
import { SplitAllocator } from "./split-allocator";

interface EditExpenseDialogProps {
  expense: {
    id: string;
    description: string;
    amount: number;
    category: string | null;
    date: Date;
    groupId: string | null;
    splitType: "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES";
    splits: Array<{
      userId: string;
      amount: number;
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
        email: string;
      };
    }>;
  };
  userId: string;
}

export function EditExpenseDialog({ expense, userId }: EditExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<{ id: string; firstName: string | null; lastName: string | null; imageUrl: string | null; email: string }[]>([]);

  // Get friends from splits (excluding current user)
  const friendsFromSplits = useMemo(() => expense.splits
    .filter((split) => split.userId !== userId)
    .map((split) => split.user), [expense.splits, userId]);

  const form = useForm<CreateExpenseInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createExpenseSchema) as any,
    defaultValues: {
      description: expense.description,
      amount: Number(expense.amount),
      category: expense.category || "General",
      date: new Date(expense.date),
      splitType: expense.splitType,
      splits: expense.splits.map((split) => ({
        userId: split.userId,
        amount: Number(split.amount),
      })),
      groupId: expense.groupId || undefined,
    },
  });

  useEffect(() => {
    setSelectedFriends(friendsFromSplits);
  }, [expense.id, friendsFromSplits]);

  const amount = form.watch("amount");
  const splitType = form.watch("splitType");

  const currentUser = useMemo(() => ({
    id: userId,
    firstName: "You",
    lastName: "",
    imageUrl: null,
    email: "",
  }), [userId]);
  const allParticipants = useMemo(() => [currentUser, ...selectedFriends], [currentUser, selectedFriends]);

  useEffect(() => {
    if (splitType === "EQUAL" && amount > 0) {
      const splitAmount = amount / allParticipants.length;
      const splits = allParticipants.map((u) => ({
        userId: u.id,
        amount: splitAmount,
      }));
      form.setValue("splits", splits);
    }
  }, [amount, splitType, form, allParticipants]);

  async function onSubmit(data: CreateExpenseInput) {
    try {
      if ((!data.splits || data.splits.length === 0) && allParticipants.length > 0) {
        const splitAmount = data.amount / allParticipants.length;
        data.splits = allParticipants.map((u) => ({
          userId: u.id,
          amount: splitAmount,
        }));
      }

      const result = await updateExpense(expense.id, data);
      if (result.error) {
        toast.error("Failed to update expense");
      } else {
        toast.success("Expense updated!");
        setOpen(false);
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
          <DialogDescription>Update expense details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Dinner, Movie, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="General" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>With whom?</FormLabel>
              <FriendSelector
                selectedUsers={selectedFriends}
                onSelect={setSelectedFriends}
              />
            </div>

            {amount > 0 && selectedFriends.length > 0 && (
              <div className="rounded-md border p-4 bg-muted/50">
                <FormLabel className="mb-2 block">Split Distribution</FormLabel>
                <SplitAllocator
                  amount={amount}
                  users={allParticipants}
                  splitType={splitType}
                  paidByUserId={userId}
                  onChange={(splits) => form.setValue("splits", splits)}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="submit">Update Expense</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
