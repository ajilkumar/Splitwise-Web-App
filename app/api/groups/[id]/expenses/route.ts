
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { ApiResponse } from "@/lib/api/response";

export const GET = apiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const { id } = await params;
  if (!id) throw new ApiError(400, "Group ID is required");

  // Verify membership
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

  const expenses = await prisma.expense.findMany({
    where: { groupId: id },
    orderBy: { date: "desc" },
    include: {
      paidByUser: {
        select: {
          id: true,
          firstName: true,
          imageUrl: true,
        },
      },
      splits: {
        include: {
          user: {
            select: { firstName: true, imageUrl: true },
          },
        },
      },
    },
  });

  return new ApiResponse(200, expenses, "Group expenses fetched successfully");
});
