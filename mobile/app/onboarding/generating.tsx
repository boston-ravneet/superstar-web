import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SimulatedVideoAd } from "@/components/ads/SimulatedVideoAd";
import { BUILD_VIDEO_AD_COUNT } from "@/lib/ads/constants";
import { useBuildCreationSession } from "@/lib/ads/use-build-creation-session";
import { useAuth } from "@/lib/auth/AuthProvider";
import { colors } from "@/constants/theme";

export default function GeneratingScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { sessionToken } = useAuth();

  const goToPreview = useCallback(() => {
    router.replace({
      pathname: "/onboarding/preview",
      params: { profileId },
    });
  }, [profileId, router]);

  const {
    phase,
    adIndex,
    adsCompleted,
    adTotal,
    aiMessage,
    apiDone,
    error,
    completeVideoAd,
  } = useBuildCreationSession({
    profileId,
    sessionToken,
    onReady: goToPreview,
  });

  return (
    <>
      <Stack.Screen options={{ title: "Building your stage", headerBackVisible: false }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>FREE TIER</Text>
        <Text style={styles.title}>AI is building your profile</Text>
        <Text style={styles.body}>
          Our AI is reading your bio, studying your photos, and designing your
          public page right now. Watch {BUILD_VIDEO_AD_COUNT} short videos to
          support the free plan.
        </Text>

        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <ActivityIndicator color={colors.fuchsia} size="small" />
            <Text style={styles.aiLabel}>AI design in progress</Text>
          </View>
          <Text style={styles.aiMessage}>{aiMessage}</Text>
          <Text style={styles.aiHint}>
            {apiDone
              ? "Design complete — finishing your sponsored videos…"
              : "This usually takes about 90 seconds on our servers."}
          </Text>
        </View>

        {phase === "video-ad" ? (
          <SimulatedVideoAd
            slot={adIndex + 1}
            total={adTotal}
            active
            onComplete={() => completeVideoAd("completed")}
          />
        ) : null}

        {phase === "intro" || phase === "ai-working" ? (
          <View style={styles.betweenAdsCard}>
            <Text style={styles.betweenAdsTitle}>
              {phase === "intro" ? "Getting started…" : "AI still working…"}
            </Text>
            <Text style={styles.betweenAdsBody}>
              {adsCompleted > 0
                ? `${adsCompleted} of ${adTotal} videos complete. Next video starting…`
                : "Your custom stage is being generated in the background."}
            </Text>
          </View>
        ) : null}

        {phase === "finishing" ? (
          <View style={styles.progressCard}>
            <ActivityIndicator color={colors.fuchsia} />
            <Text style={styles.progressText}>Opening your preview…</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {error ? (
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go back</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center",
  },
  eyebrow: {
    color: colors.cyan,
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 10,
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  aiCard: {
    borderWidth: 1,
    borderColor: `${colors.fuchsia}55`,
    backgroundColor: `${colors.fuchsia}12`,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  aiMessage: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  aiHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  betweenAdsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  betweenAdsTitle: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 6,
  },
  betweenAdsBody: {
    color: colors.muted,
    lineHeight: 20,
  },
  progressCard: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  progressText: {
    color: colors.text,
    fontWeight: "600",
  },
  error: {
    color: colors.danger,
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    alignItems: "center",
  },
  retryText: {
    color: colors.cyan,
    fontWeight: "600",
  },
});
