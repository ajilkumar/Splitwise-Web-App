"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function useAuthSync() {
  const { isSignedIn, isLoaded } = useUser();
  const didSync = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || didSync.current) return;
    didSync.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSyncing(true);
    setSyncError(null);

    fetch("/api/sync-current-user", { method: "POST", credentials: "include" })
      .then(async (r) => {
        const d = await r.json();
        if (!d.ok) {
          const errorMsg = d.message || d.error || "Failed to sync user data";
          console.warn("sync-current-user failed:", d);
          setSyncError(errorMsg);
          // Retry once after a delay
          setTimeout(() => {
            if (didSync.current) {
              didSync.current = false;
            }
          }, 3000);
        } else {
          console.log("sync-current-user succeeded");
          setSyncError(null);
        }
      })
      .catch((err) => {
        console.error("sync-current-user error:", err);
        setSyncError("Network error during sync");
      })
      .finally(() => setIsSyncing(false));
  }, [isSignedIn, isLoaded]);

  return { isSyncing, syncError };
}
