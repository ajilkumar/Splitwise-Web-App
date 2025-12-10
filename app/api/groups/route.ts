import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGroupSchema } from "@/lib/validations/group";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";

// Create a new group
export const POST = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const json = await req.json();
  const body = createGroupSchema.parse(json);

  const membersToConnect = [{ userId: user.id, role: "ADMIN" }];

  if (body.members && body.members.length > 0) {
    const foundUsers = await prisma.user.findMany({
      where: {
        email: {
          in: body.members,
        },
      },
    });

    foundUsers.forEach((u) => {
      if (u.id !== user.id) {
        membersToConnect.push({ userId: u.id, role: "MEMBER" });
      }
    });
  }

  const group = await prisma.group.create({
    data: {
      name: body.name,
      description: body.description,
      currency: body.currency,
      createdByUserId: user.id,
      members: {
        create: membersToConnect.map((m) => ({
          userId: m.userId,
          role: m.role as "ADMIN" | "MEMBER",
        })),
      },
    },
    include: {
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  return group;
});

// Get all groups for the current user
export const GET = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      _count: {
        select: {
          members: true,
          expenses: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return groups;
});
