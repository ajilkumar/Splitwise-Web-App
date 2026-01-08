import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Friend {
  friendshipId: string;
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
}

interface DashboardFriendsWidgetProps {
  friends: Friend[];
}

export function DashboardFriendsWidget({ friends }: DashboardFriendsWidgetProps) {
  // Take only top 5 friends
  const topFriends = friends.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-base font-semibold">My Friends</CardTitle>
        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
          <Link href="/friends">
            View All <ChevronRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-2">
        {topFriends.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No friends added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {topFriends.map((friend) => (
              <div key={friend.id} className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={friend.imageUrl || ""} alt={friend.firstName || ""} />
                  <AvatarFallback>{friend.firstName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">
                    {friend.firstName} {friend.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {friend.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
