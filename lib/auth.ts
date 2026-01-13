import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  // --- DEV TESTING BYPASS ---
  // WARNING: Only enable this in development for API testing without cookies
  // In production, this should ALWAYS be disabled for security
  // To enable: uncomment the line below and comment out the production code
  // return await prisma.user.findFirst();
  // --- END DEV BYPASS ---

  const user = await currentUser();

  if (!user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      clerkId: user.id,
    },
  });

  return dbUser;
}
