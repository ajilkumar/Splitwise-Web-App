"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Users, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
import { FriendSelector } from "@/components/expenses/friend-selector";
import { createGroup } from "@/app/actions/group";

// Define schema locally since we only need title here, validating logic on server is main source
const formSchema = z.object({
  name: z.string().min(1, "Group name is required"),
});

interface CreateGroupDialogProps {
  userId: string;
}

export function CreateGroupDialog({ userId }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const memberIds = selectedFriends.map(f => f.id);
      
      const result = await createGroup({
        name: values.name,
        memberIds,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Group created!");
      setOpen(false);
      form.reset();
      setSelectedFriends([]);
      router.refresh();
      
      // Optional: Redirect to the new group
      if (result.data?.id) {
          router.push(`/groups/${result.data.id}`);
      }

    } catch (error) {
      toast.error("Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Group</DialogTitle>
          <DialogDescription>
            Groups are perfect for trips, apartments, or couples.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Trip to Paris, Apartment 4B..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-2">
                <FormLabel>Add Members</FormLabel>
                <FriendSelector 
                    currentUserId={userId}
                    selectedUsers={selectedFriends} 
                    onSelect={setSelectedFriends} 
                />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
