"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
}

interface FriendSelectorProps {
  onSelect: (users: User[]) => void;
  selectedUsers: User[];
  currentUserId?: string; // Optional or removed? Lint said unused.
}

export function FriendSelector({ onSelect, selectedUsers }: FriendSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [friends, setFriends] = React.useState<User[]>([]);

  React.useEffect(() => {
    async function fetchFriends() {
      try {
        const res = await fetch("/api/friends");
        if (res.ok) {
          const data = await res.json();
          // The API returns friendship objects, need to extract friend details
          // But wait, the API /api/friends returns { status: 200, data: [...] }
          // Let's verify standard response structure.
          // API handler returns `data` in standard wrapper.
          if (data.data) {
             setFriends(data.data as User[]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch friends", error);
      }
    }
    fetchFriends();
  }, []);

  const toggleUser = (user: User) => {
    const isSelected = selectedUsers.some((u) => u.id === user.id);
    if (isSelected) {
      onSelect(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      onSelect([...selectedUsers, user]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto py-2"
        >
          {selectedUsers.length === 0
            ? "Split with..."
            : `With ${selectedUsers.length} people`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search friends..." />
          <CommandList>
            <CommandEmpty>No friend found.</CommandEmpty>
            <CommandGroup>
              {friends.map((friend) => (
                <CommandItem
                  key={friend.id}
                  value={friend.email} // Search by email as value
                  onSelect={() => toggleUser(friend)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedUsers.some((u) => u.id === friend.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex items-center space-x-2">
                     <Avatar className="h-6 w-6">
                        <AvatarImage src={friend.imageUrl || ""} />
                        <AvatarFallback>{friend.firstName?.[0]}</AvatarFallback>
                     </Avatar>
                     <div className="flex flex-col">
                        <span className="text-sm font-medium">{friend.firstName} {friend.lastName}</span>
                        <span className="text-xs text-muted-foreground">{friend.email}</span>
                     </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
