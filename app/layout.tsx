// import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import {ClerkProvider} from '@clerk/nextjs'
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";

const inter = Inter({ subsets: ["latin"] });

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Splittr - Split Expenses Easily",
  description: "The smartest way to split expenses with friends",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/img/icon.png" sizes="512x512" />
        </head>
        <body className={`${inter.className} `}>
          <Header />
          <main className="min-h-screen">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
