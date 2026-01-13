"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SettleUpDialog } from "@/components/settlements/settle-up-dialog";

interface Friend {
  friendshipId: string;
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  balance?: number; // Optional balance field
}

interface FriendsListProps {
  friends: Friend[];
  currentUserId: string;
}

export function FriendsList({ friends, currentUserId }: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p>You haven&apos;t added any friends yet.</p>
        <p className="text-sm"> Invite someone properly to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {friends.map((friend) => (
        <div 
          key={friend.id} 
          className="flex flex-col space-y-3 rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={friend.imageUrl || ""} alt={friend.firstName || ""} />
              <AvatarFallback>{friend.firstName?.[0] || friend.email[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {friend.firstName} {friend.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{friend.email}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t mt-2">
             <div className="text-sm">
                {friend.balance !== undefined && friend.balance !== 0 && (
                   <span className={friend.balance > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                     {friend.balance > 0 ? "owes you" : "you owe"} {formatCurrency(Math.abs(friend.balance))}
                   </span>
                )}
                {(friend.balance === undefined || friend.balance === 0) && (
                    <span className="text-muted-foreground text-xs">Settled up</span>
                )}
             </div>
             {friend.balance !== undefined && friend.balance !== 0 && (
               <SettleUpDialog userId={currentUserId} friendId={friend.id} />
             )}
          </div>
        </div>
      ))}
    </div>
  );
}
