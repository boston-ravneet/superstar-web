import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

export function SocialHandleFields({ values, onChange }: SocialHandleFieldsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Social links</Text>
      <Text style={styles.sectionHint}>
        Optional handles appear as outbound links on your public page after you
        publish.
      </Text>

      {SOCIAL_PLATFORM_FIELDS.map((field) => (
        <View key={field.platform} style={styles.row}>
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
      ))}
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
    fontSize: 15,
    marginBottom: 4,
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  row: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
});
