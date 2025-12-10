import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
// import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api/response";

export const GET = apiHandler(
  async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const user = await getCurrentUser();
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    const { id } = await params;

    if (!id) {
      throw new ApiError(400, "Group ID is required");
    }

    // Check if I am a member of this group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId: user.id,
        },
      },
    });

    if (!membership) {
      throw new ApiError(403, "You are not a member of this group");
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
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
        expenses: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            paidByUser: {
              select: { firstName: true },
            },
          },
        },
      },
    });

    if (!group) {
      throw new ApiError(404, "Group not found");
    }

    return new ApiResponse(200, group, "Group details fetched successfully");
  }
);
