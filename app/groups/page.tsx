import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { Users } from "lucide-react";

export default async function GroupsPage() {
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

  // Fetch groups
  const groupMemberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: true,
            },
            take: 5, // Show first 5 members avatars
          },
          _count: {
             select: { members: true }
          }
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  const groups = groupMemberships.map((m) => m.group);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Groups</h1>
          <p className="text-muted-foreground">
            Manage expenses shared with specific groups.
          </p>
        </div>
        <CreateGroupDialog userId={user.id} />
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
           <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent mb-4">
              <Users className="h-6 w-6 text-muted-foreground" />
           </div>
           <h3 className="text-lg font-semibold">No groups yet</h3>
           <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-4">
             Create a group for a trip, housemates, or a project to start tracking shared expenses.
           </p>
           <CreateGroupDialog userId={user.id} />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="block group">
              <Card className="h-full transition-all hover:shadow-md hover:border-green-500/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{group.name}</span>
                  </CardTitle>
                  <CardDescription>
                     {group._count.members} members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="mt-4 flex -space-x-2 overflow-hidden">
                      {group.members.map((member) => (
                        <Avatar key={member.id} className="inline-block border-2 border-background w-8 h-8">
                          <AvatarImage src={member.user.imageUrl || ""} />
                          <AvatarFallback>{member.user.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                      {group._count.members > 5 && (
                         <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                           +{group._count.members - 5}
                         </div>
                      )}
                   </div>
                   
                   {/* Future: Add Balance summary here e.g. "You owe $50" */}
                   <div className="mt-6 text-sm text-muted-foreground group-hover:text-green-600 transition-colors">
                      View details &rarr;
                   </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
