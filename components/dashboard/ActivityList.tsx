import { Activity } from "@/lib/generated/prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ActivityItem } from "./ActivityItem";

interface ActivityListProps {
  activities: (Activity & {
    user: {
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
    group?: {
      name: string;
    } | null;
  })[];
}

export function ActivityList({ activities }: ActivityListProps) {
  return (
    <Card className="col-span-4 lg:col-span-3">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest updates from your friends and groups.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No recent activity.
          </p>
        ) : (
          <div className="h-[400px] overflow-y-auto pr-4">
            <div className="space-y-1">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
