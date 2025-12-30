import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  variant?: "default" | "success" | "destructive";
  description?: string;
}

export function SummaryCard({
  title,
  amount,
  icon: Icon,
  variant = "default",
  description,
}: SummaryCardProps) {
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR", // Defaulting to INR for now as seen in Group model
  }).format(Math.abs(amount));

  const isPositive = amount > 0;
  const isNegative = amount < 0;

  let colorClass = "text-foreground";
  if (variant === "success" || (variant === "default" && isPositive)) {
    colorClass = "text-green-600";
  } else if (variant === "destructive" || (variant === "default" && isNegative)) {
    colorClass = "text-red-600";
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground")} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", colorClass)}>
          {variant === "default" && isNegative ? "-" : ""}
          {formattedAmount}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
