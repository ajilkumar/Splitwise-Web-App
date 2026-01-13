"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  memberIds: z.array(z.string()), // IDs of friends to add
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export async function createGroup(data: CreateGroupInput) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { error: "Unauthorized" };
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) {
    return { error: "User not found" };
  }

  const result = createGroupSchema.safeParse(data);

  if (!result.success) {
    return { error: "Invalid data" };
  }

  const { name, memberIds } = result.data;

  try {
    const group = await prisma.$transaction(async (tx) => {
      // 1. Create Group
      const newGroup = await tx.group.create({
        data: {
          name,
          createdByUserId: user.id,
        },
      });

      // 2. Add Members (Creator + Selected Friends)
      // Dedup IDs just in case
      const allMemberIds = Array.from(new Set([user.id, ...memberIds]));

      await tx.groupMember.createMany({
        data: allMemberIds.map((userId) => ({
          groupId: newGroup.id,
          userId,
          role: userId === user.id ? "ADMIN" : "MEMBER",
        })),
      });

      return newGroup;
    });

    // Log Activity
    await logActivity({
      type: "GROUP_CREATED",
      message: `You created the group "${group.name}"`,
      userId: user.id,
      groupId: group.id,
    });

    revalidatePath("/groups");
    revalidatePath("/dashboard");
    revalidatePath("/friends");
    
    return { data: group };
  } catch (error) {
    console.error("Failed to create group:", error);
    return { error: "Failed to create group" };
  }
}
