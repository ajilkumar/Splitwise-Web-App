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

  // Find all accepted friendships
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
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
      addressee: {
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

  // Map to return just the "other" person
  const friends = friendships.map((f) => {
    const isRequester = f.requesterId === user.id;
    const friend = isRequester ? f.addressee : f.requester;
    return {
      friendshipId: f.id,
      id: friend.id,
      firstName: friend.firstName,
      lastName: friend.lastName,
      email: friend.email,
      imageUrl: friend.imageUrl,
    };
  });

  return new ApiResponse(200, friends, "Friends fetched successfully");
});
