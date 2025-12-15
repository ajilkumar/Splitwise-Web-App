import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inviteFriendSchema } from "@/lib/validations/friend";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { ApiResponse } from "@/lib/api/response";

export const POST = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const json = await req.json();
  const body = inviteFriendSchema.parse(json);

  // 1. Check if trying to add self
  if (body.email.toLowerCase() === user.email.toLowerCase()) {
    throw new ApiError(400, "You cannot add yourself as a friend");
  }

  // 2. Find the user
  const foundUser = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (!foundUser) {
    throw new ApiError(404, "User with this email not found on Splitwise");
  }

  // 3. Check existing friendship
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, addresseeId: foundUser.id },
        { requesterId: foundUser.id, addresseeId: user.id },
      ],
    },
  });

  if (existingFriendship) {
    if (existingFriendship.status === "ACCEPTED") {
      throw new ApiError(409, "You are already friends with this user");
    } else if (existingFriendship.status === "PENDING") {
      throw new ApiError(409, "A friend request is already pending");
    } else if (existingFriendship.status === "BLOCKED") {
      throw new ApiError(403, "Unable to add friend");
    }
  }

  // 4. Create request
  const friendship = await prisma.friendship.create({
    data: {
      requesterId: user.id,
      addresseeId: foundUser.id,
      status: "PENDING",
    },
  });

  return new ApiResponse(201, friendship, "Friend request sent successfully");
});
