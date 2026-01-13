
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Actually ActivityItem is for Activity feed. We might need a generic ExpenseItem or reuse basic structure.
// Let's create a specialized inline list for expenses.
import { formatCurrency } from "@/lib/utils";
import { Calendar, User as UserIcon, ArrowRight, Wallet } from "lucide-react";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog"; 
import { SettleUpDialog } from "@/components/settlements/settle-up-dialog";
import { calculateGroupBalances } from "@/lib/services/balance";
import Link from "next/link";

// Reuse AddExpenseDialog but we might need to pre-fill groupId. 
// The current AddExpenseDialog doesn't accept groupId. We should update it or pass it via props?
// Wait, the schema supports groupId. The Dialog accepts userId.
// Let's stick to basic view first, and maybe add "Add Group Expense" later or update the dialog in next step.

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/");

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      description: true,
      currency: true,
      createdAt: true,
      members: {
        select: {
          id: true,
          userId: true,
          role: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
              email: true,
            },
          },
        },
      },
      expenses: {
        select: {
          id: true,
          description: true,
          amount: true,
          category: true,
          date: true,
          splitType: true,
          paidByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          splits: {
            select: {
              id: true,
              userId: true,
              amount: true,
              paid: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
        take: 50, // Limit expenses to prevent large queries
      },
    },
  });

  if (!group) {
    notFound();
  }

  // Security check: Is user a member?
  const isMember = group.members.some(m => m.userId === user.id);
  if (!isMember) {
     redirect("/groups");
  }

  // Calculate total group spend
  const totalSpend = group.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Calculate debts
  const debts = await calculateGroupBalances(params.id);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-xl border bg-background shadow">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10" />
        <div className="relative px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="space-y-2">
                <Badge variant="outline" className="w-fit bg-background/50 backdrop-blur">Group</Badge>
                <h1 className="text-4xl font-bold tracking-tight">{group.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                   <div className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      <span>{group.members.length} members</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {group.createdAt.toLocaleDateString()}</span>
                   </div>
                </div>
             </div>
             
             <div className="flex flex-col items-end gap-2">
                 <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Total Spend</div>
                 <div className="text-3xl font-bold">{formatCurrency(totalSpend)}</div>
                 <div className="flex gap-2">
                    <SettleUpDialog userId={user.id} groupId={group.id} />
                 </div>
             </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent space-x-6">
          <TabsTrigger 
            value="expenses" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-1"
          >
            Expenses
          </TabsTrigger>
          <TabsTrigger 
            value="balances" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-1"
          >
            Balances
          </TabsTrigger>
          <TabsTrigger 
            value="members"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none py-3 px-1"
          >
            Members
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses" className="pt-6">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle>Group Expenses</CardTitle>
                    <CardDescription>All transactions in this group.</CardDescription>
                 </div>
                 <AddExpenseDialog userId={user.id} groupId={group.id} />
              </CardHeader>
              <CardContent>
                 {group.expenses.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No expenses yet.</p>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       {group.expenses.map(expense => (
                          <Link key={expense.id} href={`/expenses/${expense.id}`} className="block">
                            <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 hover:bg-muted/50 p-2 rounded transition-colors cursor-pointer">
                               <div className="flex items-start gap-4">
                                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                                     <span>{expense.date.toLocaleString('default', { month: 'short' })}</span>
                                     <span className="text-lg text-foreground">{expense.date.getDate()}</span>
                                  </div>
                                  <div className="space-y-1">
                                     <p className="font-medium text-base">{expense.description}</p>
                                     <p className="text-sm text-muted-foreground">
                                        Paid by <span className="font-medium text-foreground">{expense.paidByUser.firstName}</span>
                                     </p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <div className="font-bold text-lg">{formatCurrency(Number(expense.amount))}</div>
                                  <div className="text-xs text-muted-foreground">
                                     {expense.splits.length} people involved
                                  </div>
                               </div>
                            </div>
                          </Link>
                       ))}
                    </div>
                 )}
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="balances" className="pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Group Balances</CardTitle>
                    <CardDescription>Simplified view of who owes whom.</CardDescription>
                </CardHeader>
                <CardContent>
                    {debts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <Wallet className="h-10 w-10 mb-2 opacity-20" />
                            <p>Everyone is settled up!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {debts.map((debt, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={debt.fromUser?.imageUrl} />
                                                <AvatarFallback>{debt.fromUser?.firstName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs mt-1 font-medium">{debt.fromUser?.firstName}</span>
                                        </div>
                                        
                                        <div className="flex flex-col items-center px-2 text-muted-foreground">
                                            <span className="text-xs">owes</span>
                                            <ArrowRight className="h-4 w-4 my-1" />
                                        </div>

                                        <div className="flex flex-col items-center">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={debt.toUser?.imageUrl} />
                                                <AvatarFallback>{debt.toUser?.firstName?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs mt-1 font-medium">{debt.toUser?.firstName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="font-bold text-red-600">
                                            {formatCurrency(debt.amount)}
                                        </div>
                                        {/* If I am the one who owes, show Pay button */}
                                        {debt.from === user.id && (
                                            <SettleUpDialog 
                                                userId={user.id} 
                                                groupId={group.id} 
                                                friendId={debt.to} 
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="members" className="pt-6">
           <Card>
              <CardHeader>
                 <CardTitle>Members</CardTitle>
                 <CardDescription>People in this group.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {group.members.map(member => (
                       <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
                          <Avatar className="h-10 w-10">
                             <AvatarImage src={member.user.imageUrl || ""} />
                             <AvatarFallback>{member.user.firstName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                             <p className="font-medium">{member.user.firstName} {member.user.lastName}</p>
                             <p className="text-xs text-muted-foreground">{member.role}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
