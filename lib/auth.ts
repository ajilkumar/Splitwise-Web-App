import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  // --- DEV TESTING BYPASS (Uncomment to test APIs in Hoppscotch without Cookies) ---
  return await prisma.user.findFirst(); // Returns the first user in DB
  // ---------------------------------------------------------------------------------

  // const user = await currentUser();

  // if (!user) {
  //   return null;
  // }

  // const dbUser = await prisma.user.findUnique({
  //   where: {
  //     clerkId: user.id,
  //   },
  // });

  // return dbUser;
}
