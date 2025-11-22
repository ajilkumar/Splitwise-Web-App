// app/(auth)/layout.tsx
import React from "react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Sign in • Splittr",
  description: "Sign in to Splittr — splittr",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-linear-to-b from-slate-50 via-white to-white text-slate-900 antialiased`}
      >
        <div className="min-h-screen flex items-center justify-center px-4">
          {children}
        </div>
      </body>
    </html>
  );
}
