import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { submitProfileBuilder } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getOnboardingState } from "@/lib/state/onboarding";
import { colors } from "@/constants/theme";

const AD_MESSAGES = [
  "Free tier is supported by creators like you.",
  "Upgrade later for instant builds and no ads.",
  "Your custom stage is being designed right now.",
  "Tip: add extra details next time for richer layouts.",
];

export default function GeneratingScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { sessionToken } = useAuth();
  const [adIndex, setAdIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Preparing your photos…");
  const startedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAdIndex((current) => (current + 1) % AD_MESSAGES.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function runGeneration() {
      if (startedRef.current || !profileId || !sessionToken) {
        return;
      }

      startedRef.current = true;
      const state = getOnboardingState();
      const imageUrls = state.imagePublicUrls.filter(
        (url): url is string => Boolean(url),
      );

      if (imageUrls.length !== 3) {
        setError("Missing uploaded photos. Go back and try again.");
        return;
      }

      try {
        setStatusText("Designing your layout…");
        await submitProfileBuilder(
          {
            profileId,
            bio: state.bio,
            designInstructions: state.designInstructions || undefined,
            imageUrls,
          },
          sessionToken,
        );

        router.replace({
          pathname: "/onboarding/preview",
          params: { profileId },
        });
      } catch (generationError) {
        setError(
          generationError instanceof Error
            ? generationError.message
            : "We could not build your stage.",
        );
      }
    }

    runGeneration();
  }, [profileId, router, sessionToken]);

  return (
    <>
      <Stack.Screen options={{ title: "Building your stage" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>FREE TIER</Text>
        <Text style={styles.title}>This takes about 5 minutes</Text>
        <Text style={styles.body}>
          Sit tight while we turn your bio and photos into a custom public page.
        </Text>

        <View style={styles.adCard}>
          <Text style={styles.adLabel}>Sponsored</Text>
          <Text style={styles.adTitle}>Superstar Free</Text>
          <Text style={styles.adBody}>{AD_MESSAGES[adIndex]}</Text>
          <View style={styles.adPlaceholder}>
            <Text style={styles.adPlaceholderText}>Ad placement</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <ActivityIndicator color={colors.fuchsia} />
          <Text style={styles.progressText}>{statusText}</Text>
        </View>

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
    marginBottom: 24,
  },
  adCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
  },
  adLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  adTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 8,
  },
  adBody: {
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 14,
  },
  adPlaceholder: {
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  adPlaceholderText: {
    color: colors.muted,
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
