import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScreen } from "@/components/KeyboardAwareScreen";
import { SocialHandleFields } from "@/components/SocialHandleFields";
import { ARCHETYPE_OPTIONS, type ArchetypeId } from "@/constants/archetypes";
import {
  registerProfile,
  requestUploadToken,
  uploadProfileImage,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { compressImageToWebp } from "@/lib/image/compressWebp";
import {
  PORTFOLIO_MAX,
  PORTFOLIO_MIN,
  PORTFOLIO_SLOT_COUNT,
  type PortfolioSlots,
} from "@/lib/media/constants";
import { validateMediaState } from "@/lib/media/build-payload";
import { isValidShowreelUrl } from "@/lib/media/showreel-url";
import {
  getOnboardingState,
  patchOnboardingState,
} from "@/lib/state/onboarding";
import {
  patchSocialDraft,
  socialAccountsFromDrafts,
  type SocialHandleDrafts,
} from "@/lib/social/accounts";
import { colors } from "@/constants/theme";

function isRemoteUrl(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://");
}

export default function BuildStageScreen() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const initial = getOnboardingState();
  const isEdit = initial.mode === "edit" && Boolean(initial.profileId);
  const [bio, setBio] = useState(initial.bio);
  const [designInstructions, setDesignInstructions] = useState(
    initial.designInstructions,
  );
  const [preferredArchetypeId, setPreferredArchetypeId] =
    useState<ArchetypeId | null>(initial.preferredArchetypeId);
  const [socialHandleDrafts, setSocialHandleDrafts] = useState<SocialHandleDrafts>(
    initial.socialHandleDrafts,
  );
  const [headshotUri, setHeadshotUri] = useState(initial.headshotUri);
  const [showreelUrls, setShowreelUrls] = useState(initial.showreelUrls);
  const [portfolioUris, setPortfolioUris] = useState(initial.portfolioUris);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickHeadshot() {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const compressed = await compressImageToWebp(result.assets[0].uri);
    setHeadshotUri(compressed.uri);
    patchOnboardingState({ headshotUri: compressed.uri });
  }

  async function pickPortfolioImage(index: number) {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const compressed = await compressImageToWebp(result.assets[0].uri);
    const next = [...portfolioUris] as PortfolioSlots;
    next[index] = compressed.uri;
    setPortfolioUris(next);
    patchOnboardingState({ portfolioUris: next });
  }

  function updateShowreelUrl(index: 0 | 1, value: string) {
    const next: [string, string] = [...showreelUrls];
    next[index] = value;
    setShowreelUrls(next);
    patchOnboardingState({ showreelUrls: next });
  }

  async function handleContinue() {
    Keyboard.dismiss();
    setSubmitting(true);
    setError(null);

    const state = getOnboardingState();
    const editing = state.mode === "edit" && Boolean(state.profileId);

    if (!editing && !state.username) {
      setError("Missing handle.");
      setSubmitting(false);
      return;
    }

    if (editing && !state.profileId) {
      setError("Missing profile to edit.");
      setSubmitting(false);
      return;
    }

    if (!bio.trim()) {
      setError("Add a short bio so we can design your page.");
      setSubmitting(false);
      return;
    }

    const mediaError = validateMediaState({
      ...state,
      bio: bio.trim(),
      headshotUri,
      portfolioUris,
    });
    if (mediaError) {
      setError(mediaError);
      setSubmitting(false);
      return;
    }

    for (const url of showreelUrls) {
      if (url.trim() && !isValidShowreelUrl(url)) {
        setError("Showreel links must be YouTube, Vimeo, or TikTok URLs.");
        setSubmitting(false);
        return;
      }
    }

    if (!sessionToken) {
      setError("Sign in to continue.");
      setSubmitting(false);
      return;
    }

    try {
      let profileId = state.profileId;
      const socialAccounts = socialAccountsFromDrafts(socialHandleDrafts);

      if (!profileId) {
        const registration = await registerProfile(
          {
            username: state.username,
            displayName: state.displayName || state.username,
            bio: bio.trim(),
            socialAccounts,
          },
          sessionToken,
        );
        profileId = registration.profile.id;
      }

      const publicUrls: PortfolioSlots = [
        null,
        null,
        null,
        null,
        null,
        null,
      ];
      let headshotPublicUrl: string | null = null;

      if (headshotUri) {
        if (isRemoteUrl(headshotUri)) {
          headshotPublicUrl = headshotUri;
        } else {
          const token = await requestUploadToken(state.username);
          const upload = await uploadProfileImage({
            username: state.username,
            uploadToken: token.uploadToken,
            uri: headshotUri,
            mimeType: "image/webp",
            fileName: `${state.username}-headshot.webp`,
          });
          headshotPublicUrl = upload.publicUrl;
        }
      }

      for (let index = 0; index < PORTFOLIO_SLOT_COUNT; index += 1) {
        const uri = portfolioUris[index];
        if (!uri) {
          continue;
        }

        if (isRemoteUrl(uri)) {
          publicUrls[index] = uri;
          continue;
        }

        const token = await requestUploadToken(state.username);
        const upload = await uploadProfileImage({
          username: state.username,
          uploadToken: token.uploadToken,
          uri,
          mimeType: "image/webp",
          fileName: `${state.username}-portfolio-${index + 1}.webp`,
        });
        publicUrls[index] = upload.publicUrl;
      }

      patchOnboardingState({
        bio: bio.trim(),
        designInstructions: designInstructions.trim(),
        preferredArchetypeId,
        socialHandleDrafts,
        profileId,
        showreelUrls,
        headshotPublicUrl,
        portfolioPublicUrls: publicUrls,
      });

      router.push({
        pathname: "/onboarding/generating",
        params: { profileId, mode: editing ? "edit" : "create" },
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to start building your stage.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEdit ? "Edit your stage" : "Build your stage",
        }}
      />
      <KeyboardAwareScreen contentContainerStyle={styles.container}>
        {isEdit ? (
          <Text style={styles.handleLabel}>@{initial.username}</Text>
        ) : null}

        <Text style={styles.title}>
          {isEdit ? "Update your page" : "Tell us about you"}
        </Text>
        <Text style={styles.subtitle}>
          {isEdit
            ? "Change your bio or photos and we will redesign your stage the same way as when you first created it."
            : "Pick a style vibe, share your story, and we will design your custom page."}
        </Text>

        <Text style={styles.sectionLabel}>Choose a style</Text>
        <Text style={styles.sectionHint}>
          Optional — tap one or let us auto-pick from your bio.
        </Text>
        <View style={styles.styleGrid}>
          {ARCHETYPE_OPTIONS.map((option) => {
            const selected = preferredArchetypeId === option.id;
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.styleCard,
                  {
                    backgroundColor: option.previewColors.background,
                    borderColor: selected
                      ? option.previewColors.primary
                      : colors.border,
                  },
                  selected && styles.styleCardSelected,
                ]}
                onPress={() => {
                  const next =
                    preferredArchetypeId === option.id ? null : option.id;
                  setPreferredArchetypeId(next);
                  patchOnboardingState({ preferredArchetypeId: next });
                }}
              >
                <View style={styles.styleSwatches}>
                  <View
                    style={[
                      styles.styleSwatch,
                      { backgroundColor: option.previewColors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.styleSwatch,
                      { backgroundColor: option.previewColors.accent },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.styleName,
                    {
                      color:
                        option.id === "midnight-creator" ||
                        option.id === "gold-ledger"
                          ? "#fafafa"
                          : "#0f172a",
                    },
                  ]}
                >
                  {option.name}
                </Text>
                <Text
                  style={[
                    styles.styleDescription,
                    {
                      color:
                        option.id === "midnight-creator" ||
                        option.id === "gold-ledger"
                          ? "#cbd5e1"
                          : "#475569",
                    },
                  ]}
                >
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Your bio — who you are, what you do"
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, styles.textArea]}
        />

        <TextInput
          value={designInstructions}
          onChangeText={setDesignInstructions}
          placeholder="Optional design notes — e.g. dark and minimal, gold luxury vibe (won't appear on your page)"
          placeholderTextColor={colors.muted}
          multiline
          style={[styles.input, styles.textAreaSmall]}
        />

        <SocialHandleFields
          values={socialHandleDrafts}
          onChange={(platform, value) => {
            const next = patchSocialDraft(socialHandleDrafts, platform, value);
            setSocialHandleDrafts(next);
            patchOnboardingState({ socialHandleDrafts: next });
          }}
        />

        <Text style={styles.sectionLabel}>Profile headshot</Text>
        <Text style={styles.sectionHint}>
          One square photo for your avatar — we crop it automatically.
        </Text>
        <Pressable style={styles.headshotSlot} onPress={pickHeadshot}>
          {headshotUri ? (
            <Image source={{ uri: headshotUri }} style={styles.headshot} />
          ) : (
            <Text style={styles.photoPlaceholder}>Add headshot</Text>
          )}
        </Pressable>

        <Text style={styles.sectionLabel}>Featured showreel & trailers</Text>
        <Text style={styles.sectionHint}>
          Optional — paste up to 2 YouTube, Vimeo, or TikTok links (no video uploads).
        </Text>
        {([0, 1] as const).map((index) => (
          <TextInput
            key={`showreel-${index}`}
            value={showreelUrls[index]}
            onChangeText={(value) => updateShowreelUrl(index, value)}
            placeholder={`Video link ${index + 1} (optional)`}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            style={styles.input}
          />
        ))}

        <Text style={styles.sectionLabel}>Portfolio gallery</Text>
        <Text style={styles.sectionHint}>
          Add {PORTFOLIO_MIN}–{PORTFOLIO_MAX} photos — they appear as a swipeable gallery on your page.
        </Text>
        <View style={styles.portfolioGrid}>
          {Array.from({ length: PORTFOLIO_SLOT_COUNT }, (_, index) => (
            <Pressable
              key={index}
              style={styles.portfolioSlot}
              onPress={() => pickPortfolioImage(index)}
            >
              {portfolioUris[index] ? (
                <Image
                  source={{ uri: portfolioUris[index]! }}
                  style={styles.portfolioPhoto}
                />
              ) : (
                <Text style={styles.photoPlaceholder}>
                  {index < PORTFOLIO_MIN ? `Photo ${index + 1}` : "Optional"}
                </Text>
              )}
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.submitButton} onPress={handleContinue}>
          {submitting ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEdit ? "Rebuild my page" : "Create my page"}
            </Text>
          )}
        </Pressable>

        <Text style={styles.note}>
          Free tier: watch 3 short videos while our AI builds your page (about
          90 seconds). Upgrade later for instant builds with no ads.
        </Text>
      </KeyboardAwareScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  handleLabel: {
    color: colors.fuchsia,
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 8,
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
    marginBottom: 12,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  textAreaSmall: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  sectionLabel: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 8,
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
  },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  styleCard: {
    width: "48%",
    flexGrow: 1,
    minWidth: "46%",
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
    minHeight: 118,
  },
  styleCardSelected: {
    borderWidth: 2,
  },
  styleSwatches: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  styleSwatch: {
    width: 18,
    height: 18,
    borderRadius: 999,
  },
  styleName: {
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 4,
  },
  styleDescription: {
    fontSize: 11,
    lineHeight: 15,
  },
  photoRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  headshotSlot: {
    width: 132,
    height: 132,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  headshot: {
    width: "100%",
    height: "100%",
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  portfolioSlot: {
    width: "31%",
    flexGrow: 1,
    minWidth: "30%",
    aspectRatio: 4 / 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  portfolioPhoto: {
    width: "100%",
    height: "100%",
  },
  photoSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  submitButton: {
    backgroundColor: colors.fuchsia,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  note: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 16,
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
  },
});
