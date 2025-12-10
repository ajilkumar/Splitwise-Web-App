import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // console.log(`User: `, user) // debug log

    return NextResponse.json(user);
  } catch (error) {
    console.error("[ME_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
