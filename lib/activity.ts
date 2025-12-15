import { prisma } from "@/lib/prisma";
import { ActivityType } from "@/lib/generated/prisma/client";

interface LogActivityParams {
  type: ActivityType;
  message: string;
  userId: string;
  groupId?: string;
  relatedId?: string;
  metadata?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * Logs a user activity to the database.
 * This is a fire-and-forget helper effectively, but we await it to ensure consistency in server actions.
 */
export async function logActivity({
  type,
  message,
  userId,
  groupId,
  relatedId,
  metadata,
}: LogActivityParams) {
  try {
    await prisma.activity.create({
      data: {
        type,
        message,
        userId,
        groupId,
        relatedId,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    // We do not want to fail the main request if logging fails, just log the error to console
    console.error("Failed to log activity:", error);
  }
}
