"use client";

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full p-">
      <SignIn routing="path" path="/sign-in" />

      <div className="mt-6 text-center">
        <p className="text-sm text-slate-500">
          Don’t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-indigo-600 hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
