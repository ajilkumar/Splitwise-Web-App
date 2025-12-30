import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { prisma } from "@/lib/prisma";
import { getDashboardMetrics } from "@/lib/services/dashboard";
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.firstName || "Friend"}!
          </p>
        </div>
        <AddExpenseDialog userId={user.id} />
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
        <ActivityList activities={activities} />
        
        {/* Placeholder for future Quick Actions or charts */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
            {/* Could add a 'Quick Add' friend widget here later */}
        </div>
      </div>
    </div>
  );
}
