"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

export default function useAuthSync() {
  const { isSignedIn } = useUser();
  const didSync = useRef(false);

  useEffect(() => {
    if (!isSignedIn || didSync.current) return;
    didSync.current = true;

    fetch("/api/sync-current-user", { method: "POST", credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) console.warn("sync-current-user failed:", d);
        else console.log("sync-current-user succeeded");
      })
      .catch((err) => console.error("sync-current-user error:", err));
  }, [isSignedIn]);
}
