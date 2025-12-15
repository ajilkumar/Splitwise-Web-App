import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { ApiResponse } from "@/lib/api/response";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = apiHandler(async (_req: Request) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  // Fetch activities where:
  // 1. The user is the actor (userId = user.id)
  // 2. The activity happened in a group the user is part of
  const activities = await prisma.activity.findMany({
    where: {
      OR: [
        { userId: user.id },
        {
          group: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Pagination limit
  });

  return new ApiResponse(200, activities, "Activity feed fetched successfully");
});
