import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { prisma } from "@/lib/prisma";
import { getDashboardMetrics } from "@/lib/services/dashboard";
import { AddFriendDialog } from "@/components/friends/add-friend-dialog";
import { DashboardFriendsWidget } from "@/components/dashboard/DashboardFriendsWidget";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

export default async function DashboardPage() {
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

  // Fetch Metrics
  const metrics = await getDashboardMetrics(user.id);

  // Fetch Activities
  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { userId: user.id },
        {
          group: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
      group: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  // Fetch Friends for Widget (optimized query)
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
    include: {
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
      addressee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
    },
    take: 5,
  });

  const friends = friendships.map((f) => {
    const isRequester = f.requesterId === user.id;
    const friend = isRequester ? f.addressee : f.requester;
    return {
      friendshipId: f.id,
      ...friend,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.firstName || "Friend"}!
          </p>
        </div>
        <div className="flex space-x-2">
            <AddFriendDialog />
            <AddExpenseDialog userId={user.id} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total Balance"
          amount={metrics.netBalance}
          icon={Wallet}
          variant={metrics.netBalance >= 0 ? "success" : "destructive"}
          description="Net balance across all expenses"
        />
        <SummaryCard
          title="You are owed"
          amount={metrics.totalOwed}
          icon={ArrowDownLeft}
          variant="success"
          description="Amount friends owe you"
        />
        <SummaryCard
          title="You owe"
          amount={metrics.totalOwing}
          icon={ArrowUpRight}
          variant="destructive"
          description="Amount you owe friends"
        />
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-4">
        <Suspense fallback={
          <div className="lg:col-span-3 space-y-4">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }>
          <ActivityList activities={activities} />
        </Suspense>
        
        {/* Placeholder for future Quick Actions or charts */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
          <Suspense fallback={
            <div className="space-y-4">
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }>
            <DashboardFriendsWidget friends={friends} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
