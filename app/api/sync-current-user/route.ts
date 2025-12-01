// app/api/sync-current-user/route.ts
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Upsert the currently-signed-in Clerk user into your DB via Prisma.
 * - Uses clerkId as canonical reference.
 * - Acts as a fallback if webhooks fail or for immediate sync.
 */
export async function POST() {
  const u = await currentUser();
  if (!u) {
    return NextResponse.json(
      { ok: false, message: "unauthenticated" },
      { status: 401 }
    );
  }

  // Normalize email selection
  const email =
    u.emailAddresses?.[0]?.emailAddress ??
    u.primaryEmailAddress?.emailAddress ??
    "";

  try {
    const dbUser = await prisma.user.upsert({
      where: { clerkId: u.id },
      update: {
        email,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        imageUrl: u.imageUrl ?? null,
      },
      create: {
        clerkId: u.id,
        email,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        imageUrl: u.imageUrl ?? null,
      },
    });

    return NextResponse.json({ ok: true, user: dbUser });
  } catch (err) {
    console.error("sync-current-user error", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
