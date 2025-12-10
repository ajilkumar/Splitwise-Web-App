
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { addMembersSchema } from "@/lib/validations/group";
import { ApiResponse } from "@/lib/api/response";

export const POST = apiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const { id } = await params;
  const json = await req.json();
  const body = addMembersSchema.parse(json);

  // 1. Verify group existence and membership (Security)
  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true },
  });

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isMember = group.members.some((m) => m.userId === user.id);
  if (!isMember) {
    throw new ApiError(403, "You are not allowed to add members to this group");
  }

  // 2. Find Users by Email
  const usersToAdd = await prisma.user.findMany({
    where: {
      email: { in: body.members },
    },
  });

  if (usersToAdd.length === 0) {
    throw new ApiError(404, "No users found with those emails");
  }

  // 3. Filter out existing members
  const existingMemberIds = new Set(group.members.map((m) => m.userId));
  const newMembers = usersToAdd.filter((u) => !existingMemberIds.has(u.id));

  if (newMembers.length === 0) {
    return new ApiResponse(200, [], "All users are already in the group");
  }

  // 4. Add them to the group
  await prisma.groupMember.createMany({
    data: newMembers.map((u) => ({
      groupId: id,
      userId: u.id,
      role: "MEMBER",
    })),
  });

  return new ApiResponse(200, newMembers, `Added ${newMembers.length} member(s) successfully`);
});
