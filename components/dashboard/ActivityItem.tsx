import { Activity } from "@/lib/generated/prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import {
  Banknote,
  UserPlus,
  Users,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface ActivityItemProps {
  activity: Activity & {
    user: {
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
    group?: {
      name: string;
    } | null;
  };
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = getActivityIcon(activity.type);
  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
  });

  return (
    <div className="flex items-start space-x-4 p-4 border-b last:border-0">
      <div className="mt-1">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">
          {activity.message}
        </p>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          {activity.group && (
            <>
              <span>•</span>
              <span>{activity.group.name}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getActivityIcon(type: string) {
  switch (type) {
    case "EXPENSE_CREATED":
    case "EXPENSE_UPDATED":
    case "EXPENSE_DELETED":
      return Banknote;
    case "FRIEND_REQUEST_SENT":
    case "FRIEND_REQUEST_ACCEPTED":
      return UserPlus;
    case "GROUP_CREATED":
    case "GROUP_UPDATED":
      return Users;
    case "SETTLEMENT_CREATED":
      return MessageSquare; // Or a Handshake icon if available
    default:
      return AlertCircle;
  }
}
