import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/lib/auth/AuthProvider";
import { colors } from "@/constants/theme";

const TERMS_URL = "https://getsuperstar.info/terms";
const PRIVACY_URL = "https://getsuperstar.info/privacy";

export default function LoginScreen() {
  const router = useRouter();
  const {
    account,
    isGoogleAuthConfigured,
    signInWithGoogle,
    signInWithApple,
    signInWithDev,
    acceptTerms,
  } = useAuth();
  const [loading, setLoading] = useState<"google" | "apple" | "dev" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (!account) {
      return;
    }

    setLoading(null);
    if (account.requiresTermsAcceptance) {
      router.replace("/accept-terms");
    } else {
      router.replace("/dashboard");
    }
  }, [account, router]);

  async function runSignIn(
    provider: "google" | "apple" | "dev",
    action: () => Promise<void>,
  ) {
    if (!termsAccepted) {
      setError("Accept the Terms & Conditions to continue.");
      return;
    }

    setLoading(provider);
    setError(null);

    try {
      await action();
      await acceptTerms();
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Sign-in failed. Try again.",
      );
    } finally {
      setLoading(null);
    }
  }

  const signInDisabled = !termsAccepted || loading !== null;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SUPERSTAR</Text>
      <Text style={styles.title}>Sign in to manage your stage</Text>
      <Text style={styles.body}>
        Create and manage one or more public handles from a single account.
        Checking handle availability does not require signing in.
      </Text>

      <Pressable
        style={styles.termsRow}
        onPress={() => setTermsAccepted((current) => !current)}
      >
        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
          {termsAccepted ? <Text style={styles.checkmark}>✓</Text> : null}
        </View>
        <Text style={styles.termsText}>
          I agree to the{" "}
          <Text style={styles.termsLink} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms & Conditions
          </Text>{" "}
          and{" "}
          <Text style={styles.termsLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>
          . I will not upload illegal or prohibited content.
        </Text>
      </Pressable>

      {Platform.OS === "ios" ? (
        <View style={signInDisabled ? styles.disabledWrap : undefined}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={999}
            style={[styles.appleButton, signInDisabled && styles.disabledButton]}
            onPress={() => runSignIn("apple", signInWithApple)}
          />
        </View>
      ) : null}

      <Pressable
        style={[
          styles.providerButton,
          (!isGoogleAuthConfigured || signInDisabled) && styles.disabledButton,
        ]}
        disabled={!isGoogleAuthConfigured || signInDisabled}
        onPress={() => runSignIn("google", signInWithGoogle)}
      >
        {loading === "google" ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.providerButtonText}>
            {isGoogleAuthConfigured
              ? "Continue with Google"
              : "Google Sign-In (not configured)"}
          </Text>
        )}
      </Pressable>

      {__DEV__ ? (
        <Pressable
          style={[styles.devButton, signInDisabled && styles.disabledButton]}
          disabled={signInDisabled || loading === "dev"}
          onPress={() => runSignIn("dev", signInWithDev)}
        >
          {loading === "dev" ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.devButtonText}>Dev sign-in (local only)</Text>
          )}
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Link href="/check-handle" style={styles.link}>
        <Text style={styles.linkText}>Check a handle without signing in</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center",
  },
  eyebrow: {
    color: colors.muted,
    letterSpacing: 3,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 12,
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  termsText: {
    flex: 1,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  appleButton: {
    width: "100%",
    height: 48,
    marginBottom: 12,
  },
  disabledWrap: {
    opacity: 0.45,
    marginBottom: 12,
  },
  providerButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  providerButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  devButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  devButtonText: {
    color: colors.accent,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.45,
  },
  error: {
    color: colors.danger,
    marginTop: 8,
    marginBottom: 8,
  },
  link: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
