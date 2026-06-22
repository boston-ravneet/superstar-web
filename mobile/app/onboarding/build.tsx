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
import { ARCHETYPE_OPTIONS, type ArchetypeId } from "@/constants/archetypes";
import {
  registerProfile,
  requestUploadToken,
  uploadProfileImage,
} from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { compressImageToWebp } from "@/lib/image/compressWebp";
import {
  getOnboardingState,
  patchOnboardingState,
} from "@/lib/state/onboarding";
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
  const [imageUris, setImageUris] = useState(initial.imageUris);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickImage(index: 0 | 1 | 2) {
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
    const next = [...imageUris] as typeof imageUris;
    next[index] = compressed.uri;
    setImageUris(next);
    patchOnboardingState({ imageUris: next });
  }

  async function handleContinue() {
    Keyboard.dismiss();
    setSubmitting(true);
    setError(null);

    const state = getOnboardingState();
    const editing = state.mode === "edit" && Boolean(state.profileId);

    if (!editing && (!state.username || !state.oauth)) {
      setError("Missing handle or verification.");
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

    if (imageUris.some((uri) => !uri)) {
      setError("Please upload all 3 photos.");
      setSubmitting(false);
      return;
    }

    if (!sessionToken) {
      setError("Sign in to continue.");
      setSubmitting(false);
      return;
    }

    try {
      let profileId = state.profileId;

      if (!profileId) {
        const registration = await registerProfile(
          {
            username: state.username,
            displayName: state.displayName || state.username,
            bio: bio.trim(),
            oauth: state.oauth!,
          },
          sessionToken,
        );
        profileId = registration.profile.id;
      }

      const publicUrls: [string | null, string | null, string | null] = [
        null,
        null,
        null,
      ];

      for (let index = 0; index < 3; index += 1) {
        const uri = imageUris[index];
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
          fileName: `${state.username}-${index + 1}.webp`,
        });
        publicUrls[index] = upload.publicUrl;
      }

      patchOnboardingState({
        bio: bio.trim(),
        designInstructions: designInstructions.trim(),
        preferredArchetypeId,
        profileId,
        imagePublicUrls: publicUrls,
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

        <Text style={styles.sectionLabel}>Your 3 photos</Text>
        <View style={styles.photoRow}>
          {([0, 1, 2] as const).map((index) => (
            <Pressable
              key={index}
              style={styles.photoSlot}
              onPress={() => pickImage(index)}
            >
              {imageUris[index] ? (
                <Image source={{ uri: imageUris[index]! }} style={styles.photo} />
              ) : (
                <Text style={styles.photoPlaceholder}>Photo {index + 1}</Text>
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
          Free tier: building takes about 5 minutes. You will see a short ad
          while we craft your design.
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
