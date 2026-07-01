import { useCallback, useEffect, useRef, useState } from "react";
import { submitProfileBuilder } from "@/lib/api/client";
import {
  BUILD_AI_STATUS_MESSAGES,
  BUILD_VIDEO_AD_COUNT,
  EDIT_VIDEO_AD_COUNT,
} from "@/lib/ads/constants";
import type { VideoAdOutcome } from "@/lib/ads/video-ad-provider";
import { getOnboardingState } from "@/lib/state/onboarding";
import { socialAccountsFromDrafts } from "@/lib/social/accounts";
import {
  buildSubmitMedia,
  validateMediaState,
  validateUploadedMediaState,
} from "@/lib/media/build-payload";

export type BuildSessionPhase =
  | "idle"
  | "intro"
  | "video-ad"
  | "ai-working"
  | "finishing"
  | "error";

interface BuildSessionInput {
  profileId?: string;
  sessionToken?: string | null;
  enabled?: boolean;
  isEdit?: boolean;
  onReady: () => void;
}

export function useBuildCreationSession({
  profileId,
  sessionToken,
  enabled = true,
  isEdit = false,
  onReady,
}: BuildSessionInput) {
  const adTotal = isEdit ? EDIT_VIDEO_AD_COUNT : BUILD_VIDEO_AD_COUNT;
  const [phase, setPhase] = useState<BuildSessionPhase>("idle");
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
    const interval = setInterval(() => {
      setAiMessageIndex((current) => (current + 1) % BUILD_AI_STATUS_MESSAGES.length);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function runSession() {
      if (!enabled || startedRef.current || !profileId || !sessionToken) {
        return;
      }

      startedRef.current = true;
      const state = getOnboardingState();
      const { media, imageUrls } = buildSubmitMedia(state);
      const socialAccounts = socialAccountsFromDrafts(state.socialHandleDrafts);

      const mediaError = validateUploadedMediaState(state);
      if (mediaError || imageUrls.length === 0) {
        setError(mediaError ?? "Missing uploaded photos. Go back and try again.");
        setPhase("error");
        return;
      }

      setPhase("intro");
      await delay(2200);

      const apiPromise = submitProfileBuilder(
        {
          profileId,
          bio: state.bio,
          designInstructions: state.designInstructions || undefined,
          imageUrls,
          media,
          preferredArchetypeId: state.preferredArchetypeId ?? undefined,
          socialAccounts,
        },
        sessionToken,
      )
        .then(() => {
          setApiDone(true);
        })
        .catch((submitError) => {
          apiErrorRef.current =
            submitError instanceof Error
              ? submitError.message
              : "We could not build your stage.";
        });

      for (let slot = 0; slot < adTotal; slot += 1) {
        setAdIndex(slot);
        setPhase("video-ad");

        const outcome = await new Promise<VideoAdOutcome>((resolve) => {
          adGateRef.current = resolve;
        });

        if (outcome !== "completed") {
          setError(
            outcome === "unavailable"
              ? "Video ad could not load. Tap Go back, then try Create my page again in a few minutes."
              : "Please watch the full video to continue your free build.",
          );
          setPhase("error");
          return;
        }

        setAdsCompleted(slot + 1);

        if (slot < adTotal - 1) {
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
  }, [adTotal, enabled, profileId, sessionToken]);

  if (!enabled) {
    return {
      phase: "idle" as const,
      adIndex: 0,
      adsCompleted: 0,
      adTotal,
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
    adTotal,
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
