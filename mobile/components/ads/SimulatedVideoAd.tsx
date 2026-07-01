import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MOCK_VIDEO_AD_MS } from "@/lib/ads/constants";
import { colors } from "@/constants/theme";

interface SimulatedVideoAdProps {
  slot: number;
  total: number;
  active: boolean;
  onComplete: () => void;
}

/**
 * Dev / pre-AdMob stand-in. Replace with AdMob rewarded or interstitial
 * when `getVideoAdProvider()` is wired to the real SDK.
 */
export function SimulatedVideoAd({
  slot,
  total,
  active,
  onComplete,
}: SimulatedVideoAdProps) {
  const durationSec = Math.max(1, Math.round((MOCK_VIDEO_AD_MS || 15_000) / 1000));
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!active) {
      setStarted(false);
      setSecondsLeft(durationSec);
    }
  }, [active, durationSec]);

  useEffect(() => {
    if (!active || !started || secondsLeft <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [active, started, secondsLeft]);

  useEffect(() => {
    if (active && started && secondsLeft <= 0) {
      onComplete();
    }
  }, [active, started, secondsLeft, onComplete]);

  if (!active) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Sponsored video · {slot} of {total}</Text>
      <View style={styles.screen}>
        {!started ? (
          <>
            <Text style={styles.playHint}>Video ad</Text>
            <Text style={styles.subHint}>
              While you watch, our AI is building your custom profile page.
            </Text>
            <Pressable style={styles.playButton} onPress={() => setStarted(true)}>
              <Text style={styles.playButtonText}>Play video</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((durationSec - secondsLeft) / durationSec) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.countdown}>{secondsLeft}s</Text>
            <Text style={styles.playingCopy}>Thanks for supporting Superstar Free</Text>
          </>
        )}
      </View>
      {__DEV__ ? (
        <Text style={styles.devNote}>
          Dev simulation — swap for AdMob rewarded video in production.
        </Text>
      ) : null}
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
  progressTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.onPrimary,
  },
  countdown: {
    color: colors.onPrimary,
    fontSize: 28,
    fontWeight: "800",
  },
  playingCopy: {
    color: "#a3a3a3",
    fontSize: 13,
    textAlign: "center",
  },
  devNote: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 10,
    fontStyle: "italic",
  },
});
