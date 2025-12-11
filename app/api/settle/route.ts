
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { ApiResponse } from "@/lib/api/response";
import { createSettlementSchema } from "@/lib/validations/settlement";

export const POST = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Unauthorized");

  const json = await req.json();
  const body = createSettlementSchema.parse(json);

  // If group ID is present, verify membership
  if (body.groupId) {
     const member = await prisma.groupMember.findFirst({
         where: { groupId: body.groupId, userId: user.id }
     });
     if (!member) throw new ApiError(403, "Not a member of this group");
  }

  // Create Settlement
  const settlement = await prisma.settlement.create({
    data: {
      amount: body.amount,
      paidByUserId: body.paidByUserId,
      receivedByUserId: body.receivedByUserId,
      groupId: body.groupId,
      createdByUserId: user.id,
      date: body.date || new Date(),
    },
  });

  return new ApiResponse(201, settlement, "Settlement recorded successfully");
});
