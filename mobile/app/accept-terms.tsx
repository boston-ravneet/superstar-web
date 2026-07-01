import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth/AuthProvider";
import { colors } from "@/constants/theme";

const TERMS_URL = "https://getsuperstar.info/terms";
const PRIVACY_URL = "https://getsuperstar.info/privacy";

export default function AcceptTermsScreen() {
  const router = useRouter();
  const { account, acceptTerms, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);

    try {
      await acceptTerms();
      router.replace("/dashboard");
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Could not save your acceptance. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>SUPERSTAR</Text>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.body}>
        Before you build or publish a stage, please confirm that you agree to our
        terms and will not upload illegal or prohibited content.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>You agree that you will not upload or publish:</Text>
        <Text style={styles.bullet}>• Illegal content or content promoting unlawful activity</Text>
        <Text style={styles.bullet}>• Sexually explicit or pornographic material</Text>
        <Text style={styles.bullet}>• Graphic violence, hate, or harassment</Text>
        <Text style={styles.bullet}>• Content that infringes others&apos; rights</Text>
        <Text style={styles.cardNote}>
          We review uploaded photos with AI and may block builds that violate our policy.
        </Text>
      </View>

      <View style={styles.links}>
        <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
          <Text style={styles.linkText}>Read full Terms & Conditions</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.primaryButton, loading && styles.disabledButton]}
        disabled={loading}
        onPress={handleAccept}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.primaryButtonText}>I agree — continue</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {account ? (
        <Pressable style={styles.signOut} onPress={() => signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 48,
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
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 10,
  },
  bullet: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  cardNote: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  links: {
    gap: 12,
    marginBottom: 24,
  },
  linkText: {
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
    textAlign: "center",
  },
  signOut: {
    marginTop: 24,
    alignItems: "center",
  },
  signOutText: {
    color: colors.muted,
    fontSize: 14,
  },
});
