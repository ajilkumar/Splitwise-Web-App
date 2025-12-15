import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respondToFriendRequestSchema } from "@/lib/validations/friend";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { ApiResponse } from "@/lib/api/response";

export const POST = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const json = await req.json();
  const body = respondToFriendRequestSchema.parse(json);

  const friendship = await prisma.friendship.findUnique({
    where: { id: body.requestId },
  });

  if (!friendship) {
    throw new ApiError(404, "Friend request not found");
  }

  // Security check: Only the addressee can respond
  if (friendship.addresseeId !== user.id) {
    throw new ApiError(403, "You are not authorized to respond to this request");
  }

  if (friendship.status !== "PENDING") {
    throw new ApiError(400, "Friend request is not pending");
  }

  const newStatus = body.action === "accept" ? "ACCEPTED" : "DECLINED";

  const updatedFriendship = await prisma.friendship.update({
    where: { id: body.requestId },
    data: { status: newStatus },
  });

  return new ApiResponse(
    200,
    updatedFriendship,
    `Friend request ${body.action}ed successfully`
  );
});
