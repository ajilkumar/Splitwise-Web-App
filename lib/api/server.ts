import { NextResponse } from "next/server";
import { ApiError } from "./error";
import { ApiResponse } from "./response";
import { z } from "zod";

type ApiHandler = (req: Request) => Promise<unknown>;

export function apiHandler(handler: ApiHandler) {
  return async (req: Request) => {
    try {
      // Run the actual route logic
      const result = await handler(req);

      // If the result is already a Response object (like a redirect), return it as is
      if (result instanceof Response) {
        return result;
      }

      // Otherwise, wrap the result in our standard success response
      return NextResponse.json(
        new ApiResponse(200, result, "Success")
      );
    } catch (error) {
      console.error("API Error:", error);

      // Handle custom ApiError
      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            statusCode: error.statusCode,
            message: error.message,
            success: false,
            errors: error.errors,
          },
          { status: error.statusCode }
        );
      }

      // Handle Zod Validation Errors
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            statusCode: 422,
            message: "Validation Error",
            success: false,
            errors: error.errors,
          },
          { status: 422 }
        );
      }

      // Handle generic errors
      return NextResponse.json(
        {
          statusCode: 500,
          message: "Internal Server Error",
          success: false,
        },
        { status: 500 }
      );
    }
  };
}
