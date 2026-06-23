import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  fetchBuilderStatus,
  getPreviewProfileUrl,
  getPublicProfileUrl,
  publishProfileBuilder,
  refineProfileBuilder,
  setBioDisplayMode,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { resetOnboardingState } from "@/lib/state/onboarding";
import { colors } from "@/constants/theme";

export default function PreviewScreen() {
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const { sessionToken, refreshProfiles } = useAuth();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const previewHeight = keyboardOpen
    ? Math.min(Math.round(windowHeight * 0.2), 160)
    : Math.min(Math.round(windowHeight * 0.42), 360);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardOpen(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOpen(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [refining, setRefining] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string | null>(null);
  const [useOriginalBio, setUseOriginalBio] = useState(false);
  const [togglingBio, setTogglingBio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [viewAnalytics, setViewAnalytics] = useState<{
    totalViews: number;
    viewsLast7Days: number;
  } | null>(null);

  useEffect(() => {
    async function loadPreview() {
      if (!profileId || !sessionToken) {
        return;
      }

      try {
        const status = await fetchBuilderStatus(profileId, sessionToken);
        setPreviewUrl(getPreviewProfileUrl(status.username));
        setUseOriginalBio(status.bioDisplayMode === "original");
        if (status.analytics) {
          setViewAnalytics({
            totalViews: status.analytics.totalViews,
            viewsLast7Days: status.analytics.viewsLast7Days,
          });
        }
        if (status.generationError) {
          setStatusMessage(
            `Using local builder (no AI): ${status.generationError}. Add GEMINI_API_KEY to .dev.vars and restart the web server.`,
          );
        }
        const lastLog = status.recentGenerationLogs?.[0];
        if (lastLog) {
          setDebugLog(
            `[${lastLog.event}] ${JSON.stringify(lastLog.detail ?? {}, null, 0).slice(0, 280)}`,
          );
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load preview.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPreview();
  }, [profileId, sessionToken]);

  async function handleRefine() {
    if (!profileId || !sessionToken || !refinePrompt.trim()) {
      return;
    }

    Keyboard.dismiss();
    setRefining(true);
    setError(null);
    setStatusMessage("Sending tweak to AI…");

    try {
      const result = await refineProfileBuilder(
        { profileId, prompt: refinePrompt.trim() },
        sessionToken,
      );

      setRefinePrompt("");
      setPreviewVersion((version) => version + 1);
      const sourceLabel =
        result.generationSource === "gemini" ? "AI (Gemini)" : "local builder";
      setStatusMessage(
        result.generationSource === "gemini"
          ? "Preview updated with AI."
          : `Preview updated with ${sourceLabel}${result.generationError ? `: ${result.generationError}` : ""}.`,
      );
      if (result.generationSource !== "gemini") {
        setDebugLog(
          `Refine used fallback${result.generationError ? `: ${result.generationError}` : ""}. Set GEMINI_API_KEY in superstar-web/.dev.vars`,
        );
      }
    } catch (refineError) {
      setError(
        refineError instanceof Error
          ? refineError.message
          : "Unable to apply changes.",
      );
      setStatusMessage(null);
    } finally {
      setRefining(false);
    }
  }

  async function handleBioSourceToggle(nextValue: boolean) {
    if (!profileId || !sessionToken || togglingBio) {
      return;
    }

    setTogglingBio(true);
    setError(null);

    try {
      await setBioDisplayMode(profileId, nextValue, sessionToken);
      setUseOriginalBio(nextValue);
      setPreviewVersion((version) => version + 1);
      setStatusMessage(
        nextValue ? "Showing your original bio." : "Showing AI-polished bio.",
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update bio.",
      );
    } finally {
      setTogglingBio(false);
    }
  }

  async function handlePublish() {
    if (!profileId || !sessionToken) {
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const result = await publishProfileBuilder(profileId, sessionToken);
      setPublishedUrl(
        result.publicUrl ?? getPublicProfileUrl(result.username ?? ""),
      );
      resetOnboardingState();
      await refreshProfiles();
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Unable to publish.",
      );
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.fuchsia} />
      </View>
    );
  }

  const working = refining || publishing || togglingBio;

  return (
    <>
      <Stack.Screen options={{ title: "Preview your stage" }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        {publishedUrl ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Your stage is live</Text>
            <Text style={styles.successUrl}>{publishedUrl}</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/dashboard")}
            >
              <Text style={styles.primaryButtonText}>Go to your stages</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
          >
            {previewUrl ? (
              <View style={[styles.webviewWrap, { height: previewHeight }]}>
                <WebView
                  key={`preview-${previewVersion}`}
                  source={{ uri: `${previewUrl}?v=${previewVersion}` }}
                  style={styles.webview}
                  startInLoadingState
                  cacheEnabled={false}
                />
                {refining ? (
                  <View style={styles.refineOverlay}>
                    <ActivityIndicator color={colors.fuchsia} size="large" />
                    <Text style={styles.refineOverlayText}>
                      AI is tweaking your design…
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.panel}>
              {viewAnalytics ? (
                <Text style={styles.analyticsText}>
                  {viewAnalytics.totalViews} page views ·{" "}
                  {viewAnalytics.viewsLast7Days} this week
                </Text>
              ) : null}
              <Text style={styles.sectionLabel}>Edit your preview</Text>
              <Text style={styles.panelHint}>
                Scroll here to request design changes. Type what you want below,
                then tap Apply changes.
              </Text>

              <View style={styles.bioToggleRow}>
                <View style={styles.bioToggleCopy}>
                  <Text style={styles.panelTitle}>Use original bio</Text>
                  <Text style={styles.panelHintCompact}>
                    Off = polished summary · On = your exact words
                  </Text>
                </View>
                <Switch
                  value={useOriginalBio}
                  onValueChange={handleBioSourceToggle}
                  disabled={working}
                  trackColor={{ false: colors.border, true: colors.fuchsia }}
                  thumbColor={colors.text}
                />
              </View>

              <Text style={styles.panelTitle}>Request changes</Text>
              <TextInput
                value={refinePrompt}
                onChangeText={setRefinePrompt}
                placeholder='e.g. "Make it more athletic, use navy blue, cleaner layout"'
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
                editable={!working}
              />
              {statusMessage ? (
                <Text style={styles.statusMessage}>{statusMessage}</Text>
              ) : null}
              {debugLog ? <Text style={styles.debugLog}>{debugLog}</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.secondaryButton, working && styles.disabled]}
                  disabled={working || !refinePrompt.trim()}
                  onPress={handleRefine}
                >
                  {refining ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={styles.secondaryButtonText}>Apply changes</Text>
                  )}
                </Pressable>
                <Pressable
                  style={[styles.primaryButton, working && styles.disabled]}
                  disabled={working}
                  onPress={handlePublish}
                >
                  {publishing ? (
                    <ActivityIndicator color={colors.text} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Publish</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  webviewWrap: {
    position: "relative",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  webview: {
    flex: 1,
  },
  refineOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,5,5,0.72)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  refineOverlayText: {
    color: colors.text,
    fontWeight: "600",
  },
  panel: {
    padding: 16,
    backgroundColor: colors.surface,
  },
  sectionLabel: {
    color: colors.fuchsia,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bioToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    marginTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bioToggleCopy: {
    flex: 1,
  },
  analyticsText: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  panelTitle: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 4,
  },
  panelHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  panelHintCompact: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 88,
    textAlignVertical: "top",
    marginBottom: 10,
    marginTop: 4,
  },
  statusMessage: {
    color: colors.cyan,
    fontSize: 13,
    marginBottom: 8,
  },
  debugLog: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
    fontFamily: "Menlo",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.fuchsia,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    color: colors.danger,
    marginBottom: 8,
  },
  successCard: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  successTitle: {
    color: colors.success,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  successUrl: {
    color: colors.text,
    textAlign: "center",
    marginBottom: 20,
  },
});
