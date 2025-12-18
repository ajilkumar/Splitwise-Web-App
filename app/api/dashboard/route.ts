/* eslint-disable @typescript-eslint/no-unused-vars */
import { getCurrentUser } from "@/lib/auth";
import { apiHandler } from "@/lib/api/server";
import { ApiError } from "@/lib/api/error";
import { ApiResponse } from "@/lib/api/response";
import { getDashboardMetrics } from "@/lib/services/dashboard";

export const GET = apiHandler(async (_req: Request) => {
  const user = await getCurrentUser();

  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  const metrics = await getDashboardMetrics(user.id);

  return new ApiResponse(200, metrics, "Dashboard metrics fetched successfully");
});
