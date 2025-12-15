import { z } from "zod";

export const inviteFriendSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export const respondToFriendRequestSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  action: z.enum(["accept", "decline"]),
});

export type InviteFriendValues = z.infer<typeof inviteFriendSchema>;
export type RespondToFriendRequestValues = z.infer<typeof respondToFriendRequestSchema>;
