import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  SOCIAL_PLATFORM_FIELDS,
  type SocialHandleDrafts,
  type SocialPlatform,
} from "@/lib/social/accounts";
import { colors } from "@/constants/theme";

interface SocialHandleFieldsProps {
  values: SocialHandleDrafts;
  onChange: (platform: SocialPlatform, value: string) => void;
}

function explainVerify(platformLabel: string) {
  Alert.alert(
    "Verify coming soon",
    `Your ${platformLabel} link already appears on your public page after you rebuild.\n\nPlatform login to show a verified ✓ badge is coming in the next app update.`,
    [{ text: "OK" }],
  );
}

export function SocialHandleFields({ values, onChange }: SocialHandleFieldsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Social links</Text>
      <Text style={styles.sectionHint}>
        Add handles — they link out on your page right away. Tap Verify later to
        prove you own the account and show a ✓ badge (next update).
      </Text>

      {SOCIAL_PLATFORM_FIELDS.map((field) => {
        const handle = values[field.platform]?.trim() ?? "";
        const canVerify = handle.length > 0;

        return (
          <View key={field.platform} style={styles.row}>
            <View style={styles.inputWrap}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                value={values[field.platform] ?? ""}
                onChangeText={(text) => onChange(field.platform, text)}
                placeholder={field.placeholder}
                placeholderTextColor={colors.muted}
                autoCapitalize={field.autoCapitalize ?? "none"}
                autoCorrect={false}
                keyboardType={field.keyboardType ?? "default"}
                style={styles.input}
              />
            </View>
            <Pressable
              style={[
                styles.verifyButton,
                canVerify ? styles.verifyButtonActive : styles.verifyButtonDisabled,
              ]}
              disabled={!canVerify}
              onPress={() => explainVerify(field.label)}
            >
              <Text
                style={[
                  styles.verifyButtonText,
                  canVerify ? styles.verifyButtonTextActive : null,
                ]}
              >
                Verify
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
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
    lineHeight: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  inputWrap: {
    flex: 1,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  verifyButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 72,
    alignItems: "center",
  },
  verifyButtonActive: {
    borderColor: colors.cyan,
    backgroundColor: `${colors.cyan}18`,
  },
  verifyButtonDisabled: {
    borderColor: colors.border,
    opacity: 0.4,
  },
  verifyButtonText: {
    color: colors.muted,
    fontWeight: "700",
    fontSize: 13,
  },
  verifyButtonTextActive: {
    color: colors.cyan,
  },
});
