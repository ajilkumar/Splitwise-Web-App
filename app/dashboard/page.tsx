import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import {prisma} from "@/lib/prisma";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();

  // console.log(`Prsima:`, prisma.user) // debug log

  if (!clerkId) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    // Handle case where user is authenticated but not in DB (sync issue)
    // For now, redirect to home or show error
    redirect("/");
  }

  // console.log(`Signed in user: `, user) // debug log

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <AddExpenseDialog userId={user.id} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Dashboard widgets will go here */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="font-semibold text-gray-500">Total Balance</h3>
          <p className="text-2xl font-bold mt-2">
            {user.totalBalance?.toString() || "0.00"}
          </p>
        </div>
      </div>
    </div>
  );
}
