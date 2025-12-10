import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Group name is too long"),
  description: z.string().optional(),
  currency: z.string().default("INR"),
  members: z.array(z.string().email("Invalid email address")).optional(), // Array of emails to invite
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;