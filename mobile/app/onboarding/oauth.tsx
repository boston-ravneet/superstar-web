import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { mockOAuthHandshake } from "@/lib/oauth/mockOAuth";
import {
  getOnboardingState,
  patchOnboardingState,
} from "@/lib/state/onboarding";
import type { OAuthProvider } from "@/types/profile";
import { colors } from "@/constants/theme";

export default function OAuthScreen() {
  const router = useRouter();
  const state = getOnboardingState();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [identityPreview, setIdentityPreview] = useState<string | null>(null);

  async function connect(provider: OAuthProvider) {
    setLoadingProvider(provider);
    setError(null);
    setIdentityPreview(null);

    try {
      const identity = await mockOAuthHandshake({
        provider,
        expectedHandle: state.username,
      });

      patchOnboardingState({
        oauth: identity,
        displayName: identity.displayName ?? state.username,
      });

      setIdentityPreview(
        `${provider.toUpperCase()} verified as @${identity.handle}`,
      );
    } catch (oauthError) {
      setError(
        oauthError instanceof Error
          ? oauthError.message
          : "OAuth handshake failed.",
      );
    } finally {
      setLoadingProvider(null);
    }
  }

  function handleContinue() {
    const latest = getOnboardingState();
    if (!latest.oauth) {
      setError("Connect Instagram or TikTok before continuing.");
      return;
    }

    router.push("/onboarding/build");
  }

  return (
    <>
      <Stack.Screen options={{ title: "Verify identity" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Link your social identity</Text>
        <Text style={styles.subtitle}>
          Your OAuth handle must match @{state.username || "your-handle"} to
          prevent impersonation and squatting.
        </Text>

        <Pressable
          style={styles.providerButton}
          onPress={() => connect("instagram")}
        >
          {loadingProvider === "instagram" ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.providerButtonText}>Connect Instagram</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.providerButton}
          onPress={() => connect("tiktok")}
        >
          {loadingProvider === "tiktok" ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.providerButtonText}>Connect TikTok</Text>
          )}
        </Pressable>

        {identityPreview ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Verification handshake complete</Text>
            <Text style={styles.successBody}>{identityPreview}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to build your stage</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  providerButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  providerButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  successCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "rgba(74, 222, 128, 0.08)",
    borderRadius: 18,
    padding: 16,
  },
  successTitle: {
    color: colors.success,
    fontWeight: "700",
    marginBottom: 6,
  },
  successBody: {
    color: colors.text,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
  },
  continueButton: {
    marginTop: "auto",
    backgroundColor: colors.fuchsia,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  continueButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
});
