import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RewardedVideoAd } from "@/components/ads/RewardedVideoAd";
import { useBuildCreationSession } from "@/lib/ads/use-build-creation-session";
import { useRefineSession } from "@/lib/ads/use-refine-session";
import { useAuth } from "@/lib/auth/AuthProvider";
import { colors } from "@/constants/theme";

export default function GeneratingScreen() {
  const router = useRouter();
  const { profileId, mode, prompt } = useLocalSearchParams<{
    profileId: string;
    mode?: string;
    prompt?: string;
  }>();
  const { sessionToken } = useAuth();
  const isRefine = mode === "refine";
  const isEdit = mode === "edit";

  const goToPreview = useCallback(() => {
    router.replace({
      pathname: "/onboarding/preview",
      params: {
        profileId,
        refresh: String(Date.now()),
      },
    });
  }, [profileId, router]);

  const buildSession = useBuildCreationSession({
    profileId,
    sessionToken,
    enabled: !isRefine,
    isEdit,
    onReady: goToPreview,
  });

  const refineSession = useRefineSession({
    profileId,
    prompt,
    sessionToken,
    enabled: isRefine,
    onReady: goToPreview,
  });

  const {
    phase,
    adIndex,
    adsCompleted,
    adTotal,
    aiMessage,
    apiDone,
    error,
    completeVideoAd,
  } = isRefine ? refineSession : buildSession;

  const copy = useMemo(() => {
    if (isRefine) {
      return {
        screenTitle: "Updating your stage",
        title: "AI is updating your design",
        body: `Our AI is applying your requested changes right now. Watch ${adTotal} short video${adTotal === 1 ? "" : "s"} to support the free plan.`,
        aiLabel: "AI update in progress",
        aiHintDone: "Update complete — finishing your sponsored video…",
        aiHintWorking: "This usually takes about a minute on our servers.",
        betweenIntro: "Getting started…",
        betweenWorking: "AI still working…",
        betweenBodyEmpty: "Your design tweak is being generated in the background.",
        finishing: "Returning to your preview…",
      };
    }

    return {
      screenTitle: isEdit ? "Updating your stage" : "Building your stage",
      title: isEdit ? "AI is rebuilding your profile" : "AI is building your profile",
      body: `Our AI is reading your bio, studying your photos, and designing your public page right now. Watch ${adTotal} short video${adTotal === 1 ? "" : "s"} to support the free plan.`,
      aiLabel: "AI design in progress",
      aiHintDone: "Design complete — finishing your sponsored videos…",
      aiHintWorking: "This usually takes about 90 seconds on our servers.",
      betweenIntro: "Getting started…",
      betweenWorking: "AI still working…",
      betweenBodyEmpty: "Your custom stage is being generated in the background.",
      finishing: "Opening your preview…",
    };
  }, [adTotal, isEdit, isRefine]);

  return (
    <>
      <Stack.Screen
        options={{ title: copy.screenTitle, headerBackVisible: false }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>FREE TIER</Text>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>

        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.aiLabel}>{copy.aiLabel}</Text>
          </View>
          <Text style={styles.aiMessage}>{aiMessage}</Text>
          <Text style={styles.aiHint}>
            {apiDone ? copy.aiHintDone : copy.aiHintWorking}
          </Text>
        </View>

        {phase === "video-ad" ? (
          <RewardedVideoAd
            key={`video-ad-${adIndex}`}
            slot={adIndex + 1}
            total={adTotal}
            active
            onComplete={completeVideoAd}
          />
        ) : null}

        {phase === "intro" || phase === "ai-working" ? (
          <View style={styles.betweenAdsCard}>
            <Text style={styles.betweenAdsTitle}>
              {phase === "intro" ? copy.betweenIntro : copy.betweenWorking}
            </Text>
            <Text style={styles.betweenAdsBody}>
              {adsCompleted > 0
                ? `${adsCompleted} of ${adTotal} videos complete. Next video starting…`
                : copy.betweenBodyEmpty}
            </Text>
          </View>
        ) : null}

        {phase === "finishing" ? (
          <View style={styles.progressCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.progressText}>{copy.finishing}</Text>
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
    color: colors.muted,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
