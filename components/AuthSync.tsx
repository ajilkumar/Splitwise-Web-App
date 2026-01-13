"use client";

import useAuthSync from "@/hooks/useAuthSync";
import { useEffect } from "react";


export default function AuthSync() {
  const { isSyncing, syncError } = useAuthSync();

  useEffect(() => {
    if (syncError) {
      // Only show error toast if sync fails after retry
      // Don't spam user with errors on initial load
      console.warn("User sync error:", syncError);
    }
  }, [syncError]);

  // Show loading indicator during sync (optional - can be removed if not needed)
  if (isSyncing) {
    // Silent sync - no UI needed, but we track state
    return null;
  }

  return null;
}
