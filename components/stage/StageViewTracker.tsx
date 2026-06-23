"use client";

import { useEffect } from "react";

export function StageViewTracker({
  profileId,
  enabled = true,
}: {
  profileId: string;
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled || !profileId) {
      return;
    }

    const storageKey = `superstar_view_${profileId}`;
    if (sessionStorage.getItem(storageKey)) {
      return;
    }

    sessionStorage.setItem(storageKey, "1");

    void fetch("/api/profile/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
      keepalive: true,
    }).catch(() => {
      sessionStorage.removeItem(storageKey);
    });
  }, [enabled, profileId]);

  return null;
}
