"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toast } from "sonner"; // Used consistent toast library

interface Request {
  requestId: string;
  requester: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string | null;
  };
}

interface FriendRequestsListProps {
  requests: Request[];
}

export function FriendRequestsList({ requests }: FriendRequestsListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRespond(requestId: string, action: "accept" | "decline") {
    setLoadingId(requestId);
    try {
      const response = await fetch("/api/friends/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId, action }),
      });

      if (!response.ok) {
        throw new Error("Failed to process request");
      }

      toast.success(action === "accept" ? "Friend request accepted" : "Request declined");
      router.refresh(); // Refresh server components to update lists
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoadingId(null);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No pending friend requests.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <div
          key={req.requestId}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={req.requester.imageUrl || ""} />
              <AvatarFallback>{req.requester.firstName?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {req.requester.firstName} {req.requester.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {req.requester.email}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={loadingId === req.requestId}
              onClick={() => handleRespond(req.requestId, "decline")}
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
            <Button
              size="sm"
              disabled={loadingId === req.requestId}
              onClick={() => handleRespond(req.requestId, "accept")}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
