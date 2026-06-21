import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/lib/auth/AuthProvider";
import { colors } from "@/constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const {
    account,
    isGoogleAuthConfigured,
    signInWithGoogle,
    signInWithApple,
    signInWithDev,
  } = useAuth();
  const [loading, setLoading] = useState<"google" | "apple" | "dev" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setLoading(null);
      router.replace("/dashboard");
    }
  }, [account, router]);

  async function runSignIn(
    provider: "google" | "apple" | "dev",
    action: () => Promise<void>,
  ) {
    setLoading(provider);
    setError(null);

    try {
      await action();
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

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SUPERSTAR</Text>
      <Text style={styles.title}>Sign in to manage your stage</Text>
      <Text style={styles.body}>
        Create and manage one or more public handles from a single account.
        Checking handle availability does not require signing in.
      </Text>

      {Platform.OS === "ios" ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={999}
          style={styles.appleButton}
          onPress={() => runSignIn("apple", signInWithApple)}
        />
      ) : (
        <Pressable
          style={styles.providerButton}
          onPress={() =>
            runSignIn("apple", () =>
              Promise.reject(new Error("Apple Sign-In is available on iOS.")),
            )
          }
        >
          <Text style={styles.providerButtonText}>Continue with Apple</Text>
        </Pressable>
      )}

      <Pressable
        style={[
          styles.providerButton,
          !isGoogleAuthConfigured && styles.disabledButton,
        ]}
        disabled={!isGoogleAuthConfigured || loading === "google"}
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
          style={styles.devButton}
          disabled={loading === "dev"}
          onPress={() => runSignIn("dev", signInWithDev)}
        >
          {loading === "dev" ? (
            <ActivityIndicator color={colors.cyan} />
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
    color: colors.fuchsia,
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
    marginBottom: 28,
  },
  appleButton: {
    width: "100%",
    height: 48,
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
    borderColor: colors.cyan,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  devButtonText: {
    color: colors.cyan,
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
    color: colors.cyan,
    fontWeight: "600",
  },
});
