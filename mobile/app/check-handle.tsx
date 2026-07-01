import { Stack } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { checkUsername } from "@/lib/api/client";
import type { UsernameCheckResult } from "@/types/profile";
import { colors } from "@/constants/theme";

export default function CheckHandleScreen() {
  const inputRef = useRef<TextInput>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UsernameCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusColor = useMemo(() => {
    if (!result) {
      return colors.muted;
    }
    if (result.locked) {
      return colors.danger;
    }
    return result.available ? colors.success : colors.danger;
  }, [result]);

  async function handleCheck() {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await checkUsername(username);
      setResult(response);
    } catch (checkError) {
      setError(
        checkError instanceof Error
          ? checkError.message
          : "Unable to check username.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Check handle" }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.title}>Is your handle free?</Text>
          <Text style={styles.subtitle}>
            Anyone can check availability. Sign in only when you are ready to
            claim a handle.
          </Text>

          <TextInput
            ref={inputRef}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="@yourname"
            placeholderTextColor={colors.muted}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setResult(null);
              setError(null);
            }}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={handleCheck}
            style={styles.input}
          />

          <Pressable style={styles.primaryButton} onPress={handleCheck}>
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>Check availability</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {result ? (
            <View style={styles.resultCard}>
              <Text style={[styles.resultTitle, { color: statusColor }]}>
                @{result.username}
              </Text>
              <Text style={styles.resultBody}>
                {result.reason ??
                  (result.available
                    ? "This handle is available."
                    : "This handle is unavailable.")}
              </Text>
              <Pressable
                style={styles.tryAnotherButton}
                onPress={() => {
                  setResult(null);
                  setError(null);
                  setUsername("");
                  inputRef.current?.focus();
                }}
              >
                <Text style={styles.tryAnotherButtonText}>Try another handle</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingBottom: 40,
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  resultBody: {
    color: colors.muted,
    lineHeight: 20,
  },
  tryAnotherButton: {
    marginTop: 14,
    alignSelf: "flex-start",
  },
  tryAnotherButtonText: {
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
