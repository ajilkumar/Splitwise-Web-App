/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Banknote } from "lucide-react";
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
import { createSettlement } from "@/app/actions/settlement";
import { createSettlementSchema, CreateSettlementInput } from "@/lib/validations/settlement";
import { FriendSelector, User } from "@/components/expenses/friend-selector";

interface SettleUpDialogProps {
  userId: string;
  groupId?: string;
  friendId?: string; // Pre-select a friend if opened from friend context
}

export function SettleUpDialog({ userId, groupId, friendId }: SettleUpDialogProps) {
  const [open, setOpen] = useState(false);
  // We use the same selector logic but enforce single selection for settlement ideally?
  // Or just pick one from the list. The schema expects a single string `paidToUserId`.
  // Our FriendSelector returns array. We'll take the first one.
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);

  // Explicitly cast resolver to avoid generic mismatch between Zod schema and RHF strict types
  const form = useForm<CreateSettlementInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createSettlementSchema) as any,
    defaultValues: {
      amount: 0,
      date: new Date(),
      paidToUserId: friendId || "",
      groupId: groupId || undefined,
    },
  });

  // Watch for external friendId changes to update form default
  // (Optional logic if friendId can change dynamically while dialog is potentially mounted)


  async function onSubmit(data: CreateSettlementInput) {
    if (selectedFriends.length > 0) {
        data.paidToUserId = selectedFriends[0].id;
    }

    if (!data.paidToUserId) {
        toast.error("Please select who you paid.");
        return;
    }

    const result = await createSettlement(data);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Payment recorded!");
      setOpen(false);
      form.reset();
      setSelectedFriends([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="border-green-500/20 hover:bg-green-50 text-green-700">
          <Banknote className="mr-2 h-4 w-4" /> Settle Up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record a Payment</DialogTitle>
          <DialogDescription>
            You paid someone back.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-2">
                <FormLabel>Who did you pay?</FormLabel>
                <FriendSelector 
                // currentUserId={userId} // Removed prop
                    selectedUsers={selectedFriends} 
                    onSelect={(users) => {
                        // Enforce single selection style behavior or just take last
                        if (users.length > 1) {
                             setSelectedFriends([users[users.length - 1]]);
                        } else {
                             setSelectedFriends(users);
                        }
                    }} 
                />
                {selectedFriends.length === 0 && <p className="text-xs text-muted-foreground">Select the friend you paid.</p>}
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input 
                        type="number" 
                        placeholder="0.00" 
                        {...field} 
                        value={field.value || ""}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
