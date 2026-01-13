import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, DollarSign, Tag } from "lucide-react";
import Link from "next/link";
import { EditExpenseDialog } from "@/components/expenses/edit-expense-dialog";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";

export default async function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/");

  const expense = await prisma.expense.findUnique({
    where: { id: params.id },
    include: {
      paidByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
          email: true,
        },
      },
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      splits: {
        include: {
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
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!expense) {
    notFound();
  }

  // Check if user is authorized (paid by, created by, or in splits)
  const isAuthorized =
    expense.paidByUserId === user.id ||
    expense.createdByUserId === user.id ||
    expense.splits.some((split) => split.userId === user.id);

  if (!isAuthorized) {
    redirect("/dashboard");
  }

  const userSplit = expense.splits.find((split) => split.userId === user.id);
  const isPayer = expense.paidByUserId === user.id;
  const isCreator = expense.createdByUserId === user.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {expense.group && (
              <Link href={`/groups/${expense.group.id}`}>
                <Badge variant="outline">{expense.group.name}</Badge>
              </Link>
            )}
            <Badge variant="secondary">{expense.splitType}</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{expense.description}</h1>
          <p className="text-muted-foreground mt-1">
            Created {expense.createdAt.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {(isCreator || isPayer) && (
            <>
              <EditExpenseDialog 
                expense={{
                  ...expense,
                  amount: Number(expense.amount),
                  splits: expense.splits.map(s => ({
                    ...s,
                    amount: Number(s.amount)
                  }))
                }}
                userId={user.id} 
              />
              <DeleteExpenseButton expenseId={expense.id} />
            </>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>Complete information about this expense</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(Number(expense.amount))}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="text-lg font-medium">
                {expense.date.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Category */}
          {expense.category && (
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Tag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="text-lg font-medium">{expense.category}</p>
              </div>
            </div>
          )}

          {/* Paid By */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={expense.paidByUser.imageUrl || ""} />
                <AvatarFallback>{expense.paidByUser.firstName?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Paid by</p>
                <p className="text-lg font-medium">
                  {expense.paidByUser.firstName} {expense.paidByUser.lastName}
                  {isPayer && <span className="text-muted-foreground ml-2">(You)</span>}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Splits Card */}
      <Card>
        <CardHeader>
          <CardTitle>Split Details</CardTitle>
          <CardDescription>How this expense was divided</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expense.splits.map((split) => (
              <div
                key={split.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={split.user.imageUrl || ""} />
                    <AvatarFallback>{split.user.firstName?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {split.user.firstName} {split.user.lastName}
                      {split.userId === user.id && (
                        <span className="text-muted-foreground ml-2">(You)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {split.userId === expense.paidByUserId
                        ? "Paid and owes"
                        : "Owes"}{" "}
                      {formatCurrency(Number(split.amount))}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(Number(split.amount))}</p>
                  {split.paid && (
                    <Badge variant="outline" className="mt-1">
                      Paid
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Your Summary */}
          {userSplit && (
            <div className="mt-6 p-4 rounded-lg bg-muted border-2">
              <p className="text-sm font-medium mb-2">Your Summary</p>
              <div className="space-y-1">
                {isPayer && (
                  <p className="text-sm">
                    You paid <span className="font-medium">{formatCurrency(Number(expense.amount))}</span>
                  </p>
                )}
                <p className="text-sm">
                  Your share: <span className="font-medium">{formatCurrency(Number(userSplit.amount))}</span>
                </p>
                {isPayer && (
                  <p className="text-sm font-medium text-green-600">
                    You are owed:{" "}
                    {formatCurrency(Number(expense.amount) - Number(userSplit.amount))}
                  </p>
                )}
                {!isPayer && (
                  <p className="text-sm font-medium text-red-600">
                    You owe: {formatCurrency(Number(userSplit.amount))}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Button */}
      <div className="flex justify-start">
        <Button variant="outline" asChild>
          <Link href={expense.groupId ? `/groups/${expense.groupId}` : "/dashboard"}>
            ← Back
          </Link>
        </Button>
      </div>
    </div>
  );
}
