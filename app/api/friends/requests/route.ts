import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { ApiResponse } from "@/lib/api/response";

// Get pending friend requests (incoming)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const GET = apiHandler(async (_req: Request) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const requests = await prisma.friendship.findMany({
    where: {
      addresseeId: user.id,
      status: "PENDING",
    },
    include: {
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          imageUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return new ApiResponse(200, requests, "Friend requests fetched successfully");
});
