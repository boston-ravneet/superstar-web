import { useCallback, useEffect, useRef, useState } from "react";
import { refineProfileBuilder } from "@/lib/api/client";
import {
  BUILD_AI_STATUS_MESSAGES,
  REFINE_VIDEO_AD_COUNT,
} from "@/lib/ads/constants";
import type { VideoAdOutcome } from "@/lib/ads/video-ad-provider";

export type RefineSessionPhase =
  | "idle"
  | "intro"
  | "video-ad"
  | "ai-working"
  | "finishing"
  | "error";

interface RefineSessionInput {
  profileId?: string;
  prompt?: string;
  sessionToken?: string | null;
  enabled: boolean;
  onReady: () => void;
}

export function useRefineSession({
  profileId,
  prompt,
  sessionToken,
  enabled,
  onReady,
}: RefineSessionInput) {
  const [phase, setPhase] = useState<RefineSessionPhase>("idle");
  const [adIndex, setAdIndex] = useState(0);
  const [adsCompleted, setAdsCompleted] = useState(0);
  const [aiMessageIndex, setAiMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [apiDone, setApiDone] = useState(false);

  const startedRef = useRef(false);
  const apiErrorRef = useRef<string | null>(null);
  const onReadyRef = useRef(onReady);
  const adGateRef = useRef<((outcome: VideoAdOutcome) => void) | null>(null);

  onReadyRef.current = onReady;

  const completeVideoAd = useCallback((outcome: VideoAdOutcome) => {
    adGateRef.current?.(outcome);
    adGateRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = setInterval(() => {
      setAiMessageIndex((current) => (current + 1) % BUILD_AI_STATUS_MESSAGES.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    async function runSession() {
      if (!enabled || startedRef.current || !profileId || !sessionToken || !prompt?.trim()) {
        return;
      }

      startedRef.current = true;

      setPhase("intro");
      await delay(2200);

      const apiPromise = refineProfileBuilder(
        { profileId, prompt: prompt.trim() },
        sessionToken,
      )
        .then(() => {
          setApiDone(true);
        })
        .catch((refineError) => {
          apiErrorRef.current =
            refineError instanceof Error
              ? refineError.message
              : "We could not update your design.";
        });

      for (let slot = 0; slot < REFINE_VIDEO_AD_COUNT; slot += 1) {
        setAdIndex(slot);
        setPhase("video-ad");

        const outcome = await new Promise<VideoAdOutcome>((resolve) => {
          adGateRef.current = resolve;
        });

        if (outcome !== "completed") {
          setError(
            outcome === "unavailable"
              ? "Video ad could not load. Tap Go back, then try again in a few minutes."
              : "Please watch the full video to apply your design changes.",
          );
          setPhase("error");
          return;
        }

        setAdsCompleted(slot + 1);

        if (slot < REFINE_VIDEO_AD_COUNT - 1) {
          setPhase("ai-working");
          await delay(1200);
        }
      }

      setPhase("finishing");
      await apiPromise;

      if (apiErrorRef.current) {
        setError(apiErrorRef.current);
        setPhase("error");
        return;
      }

      onReadyRef.current();
    }

    runSession();
  }, [enabled, profileId, prompt, sessionToken]);

  if (!enabled) {
    return {
      phase: "idle" as const,
      adIndex: 0,
      adsCompleted: 0,
      adTotal: REFINE_VIDEO_AD_COUNT,
      aiMessage: BUILD_AI_STATUS_MESSAGES[0],
      apiDone: false,
      error: null,
      completeVideoAd,
    };
  }

  return {
    phase,
    adIndex,
    adsCompleted,
    adTotal: REFINE_VIDEO_AD_COUNT,
    aiMessage: BUILD_AI_STATUS_MESSAGES[aiMessageIndex],
    apiDone,
    error,
    completeVideoAd,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
