"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Header = () => {
  const path = usePathname();
  const { isSignedIn } = useUser();

  return (
    <header className="fixed top-0 w-full border-b bg-white/95 backdrop-blur z-50 supports-backdrop-filter:bg-white/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/img/splittr.png"
            alt="logo"
            width={30}
            height={30}
            className="h-6 w-auto object-contain"
            priority
          />
        </Link>
        {/* Middle: Navigation links */}
        {path === "/" && (
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="/feature"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              How It Works
            </Link>
          </div>
        )}
        {/* Right: Auth/User controls */}
        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </SignInButton>
          ) : (
            <>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className={cn("hidden md:inline-flex items-center gap-2 transition", path === "/dashboard" ? "bg-accent" : "")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/friends">
                 <Button
                  variant="ghost"
                  className={cn("hidden md:inline-flex items-center gap-2 transition", path === "/friends" ? "bg-accent" : "")}
                >
                  <Users className="h-4 w-4" />
                  Friends
                </Button>
              </Link>
              {/* <Avatar>
                <AvatarImage src={user?.imageUrl ?? undefined} alt={user?.fullName || "User"}/>
                <AvatarFallback>{user?.firstName?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar> */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "shadow-xl",
                    userPreviewMainIdentifier: "font-semibold",
                  },
                }}
                afterSignOutUrl="/"
              />
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
