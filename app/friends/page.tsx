import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddFriendDialog } from "@/components/friends/add-friend-dialog";
import { FriendRequestsList } from "@/components/friends/friend-requests-list";
import { FriendsList } from "@/components/friends/friends-list";

export default async function FriendsPage() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    redirect("/");
  }

  // 1. Fetch Accepted Friends
  // We can reuse the logic from GET /api/friends or just query directly since this is a server component
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
    include: {
      requester: true,
      addressee: true,
    },
  });

  const friends = friendships.map((f) => {
    const isRequester = f.requesterId === user.id;
    const friend = isRequester ? f.addressee : f.requester;
    return {
      friendshipId: f.id,
      ...friend,
    };
  });

  // 2. Fetch Pending Requests
  const pendingRequests = await prisma.friendship.findMany({
    where: {
      status: "PENDING",
      addresseeId: user.id, // Only requests RECEIVED
    },
    include: {
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });

  // Transform for client component
  const formattedRequests = pendingRequests.map(r => ({
    requestId: r.id,
    requester: r.requester,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
          <p className="text-muted-foreground">Manage your friendships and requests.</p>
        </div>
        <AddFriendDialog />
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList>
          <TabsTrigger value="friends">My Friends</TabsTrigger>
          <TabsTrigger value="requests">
            Friend Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">
                {pendingRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          <Card>
            <CardHeader>
              <CardTitle>My Friends</CardTitle>
              <CardDescription>People you share expenses with.</CardDescription>
            </CardHeader>
            <CardContent>
              <FriendsList friends={friends} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
              <CardDescription>People who want to add you.</CardDescription>
            </CardHeader>
            <CardContent>
              <FriendRequestsList requests={formattedRequests} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
