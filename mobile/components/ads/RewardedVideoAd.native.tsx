import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AdEventType,
  RewardedAdEventType,
  RewardedInterstitialAd,
  type RewardedInterstitialAd as RewardedInterstitialAdInstance,
} from "react-native-google-mobile-ads";
import { getRewardedAdUnitId } from "@/lib/ads/admob-config";
import { ensureAdsInitialized } from "@/lib/ads/initialize-ads";
import type { VideoAdOutcome } from "@/lib/ads/video-ad-provider";
import { colors } from "@/constants/theme";

type AdStatus = "loading" | "ready" | "showing" | "failed";

const MAX_AUTO_RETRIES = 2;

export interface RewardedVideoAdProps {
  slot: number;
  total: number;
  active: boolean;
  onComplete: (outcome: VideoAdOutcome) => void;
}

export function RewardedVideoAd({
  slot,
  total,
  active,
  onComplete,
}: RewardedVideoAdProps) {
  const [status, setStatus] = useState<AdStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const rewardedRef = useRef<RewardedInterstitialAdInstance | null>(null);
  const finishedRef = useRef(false);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const finish = useCallback(
    (outcome: VideoAdOutcome) => {
      if (finishedRef.current) {
        return;
      }
      finishedRef.current = true;
      onComplete(outcome);
    },
    [onComplete],
  );

  const cleanupAd = useCallback(() => {
    unsubscribersRef.current.forEach((unsubscribe) => unsubscribe());
    unsubscribersRef.current = [];
    rewardedRef.current = null;
  }, []);

  const loadAd = useCallback(async () => {
    cleanupAd();
    setLoadError(null);
    setStatus("loading");

    try {
      await ensureAdsInitialized();
    } catch {
      setStatus("failed");
      setLoadError("Ad service could not start. Tap Retry.");
      return;
    }

    let adUnitId: string;
    try {
      adUnitId = getRewardedAdUnitId();
    } catch (error) {
      setStatus("failed");
      setLoadError(
        error instanceof Error
          ? error.message
          : "AdMob is not configured for this build.",
      );
      return;
    }

    const rewarded = RewardedInterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    rewardedRef.current = rewarded;

    unsubscribersRef.current = [
      rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setStatus("ready");
        setLoadError(null);
      }),
      rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        finish("completed");
      }),
      rewarded.addAdEventListener(AdEventType.CLOSED, () => {
        if (finishedRef.current) {
          return;
        }

        setStatus("failed");
        setLoadError("Watch the full video to continue. Tap Retry to load again.");
      }),
      rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
        if (finishedRef.current) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "No ad available right now. New apps can take up to 48 hours for ads to fill.";

        setStatus("failed");
        setLoadError(message);
      }),
    ];

    rewarded.load();
  }, [cleanupAd, finish]);

  useEffect(() => {
    if (!active) {
      return;
    }

    finishedRef.current = false;
    setAttempt(0);
    void loadAd();

    return cleanupAd;
  }, [active, cleanupAd, loadAd, slot]);

  useEffect(() => {
    if (!active || status !== "failed" || finishedRef.current) {
      return;
    }

    if (attempt >= MAX_AUTO_RETRIES) {
      return;
    }

    const timer = setTimeout(() => {
      setAttempt((value) => value + 1);
      void loadAd();
    }, 2500);

    return () => clearTimeout(timer);
  }, [active, attempt, loadAd, status]);

  const showAd = () => {
    if (status !== "ready" || !rewardedRef.current) {
      return;
    }

    setStatus("showing");
    rewardedRef.current.show();
  };

  const retry = () => {
    if (finishedRef.current) {
      return;
    }

    setAttempt(0);
    void loadAd();
  };

  if (!active) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        Sponsored video · {slot} of {total}
      </Text>
      <View style={styles.screen}>
        {status === "loading" ? (
          <>
            <ActivityIndicator color={colors.onPrimary} />
            <Text style={styles.subHint}>
              {attempt > 0 ? "Loading video… trying again" : "Loading video…"}
            </Text>
          </>
        ) : null}

        {status === "ready" ? (
          <>
            <Text style={styles.playHint}>Video ad</Text>
            <Text style={styles.subHint}>
              While you watch, our AI is building your custom profile page.
            </Text>
            <Pressable style={styles.playButton} onPress={showAd}>
              <Text style={styles.playButtonText}>Play video</Text>
            </Pressable>
          </>
        ) : null}

        {status === "showing" ? (
          <Text style={styles.subHint}>Thanks for supporting Superstar Free</Text>
        ) : null}

        {status === "failed" ? (
          <>
            <Text style={styles.playHint}>Video unavailable</Text>
            <Text style={styles.subHint}>
              {loadError ??
                "No ad available right now. Tap Retry — new AdMob apps can take up to 48 hours to serve ads."}
            </Text>
            <Pressable style={styles.playButton} onPress={retry}>
              <Text style={styles.playButtonText}>Retry</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  screen: {
    minHeight: 200,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  playHint: {
    color: colors.onPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  subHint: {
    color: "#a3a3a3",
    textAlign: "center",
    lineHeight: 20,
    fontSize: 14,
  },
  playButton: {
    marginTop: 8,
    backgroundColor: colors.onPrimary,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  playButtonText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
