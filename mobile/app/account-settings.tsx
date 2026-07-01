import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/lib/auth/AuthProvider";
import { colors } from "@/constants/theme";

const PRIVACY_URL = "https://getsuperstar.info/privacy";
const TERMS_URL = "https://getsuperstar.info/terms";
const DELETE_INFO_URL = "https://getsuperstar.info/account/delete";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { account, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  function confirmDeleteAccount() {
    Alert.alert(
      "Delete account permanently?",
      "This removes your Superstar account, all handles, published pages, uploaded photos, bios, and analytics. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "Your public pages will go offline and your data will be deleted from our servers.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, delete everything",
                  style: "destructive",
                  onPress: () => {
                    void handleDeleteAccount();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      router.replace("/login");
    } catch (deleteError) {
      Alert.alert(
        "Unable to delete account",
        deleteError instanceof Error
          ? deleteError.message
          : "Try again in a moment.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Account settings" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionLabel}>Signed in as</Text>
        <Text style={styles.email}>
          {account?.displayName ?? account?.email ?? "Your account"}
        </Text>
        {account?.email ? (
          <Text style={styles.emailSecondary}>{account.email}</Text>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Legal</Text>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.link}>Terms & Conditions</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(DELETE_INFO_URL)}>
            <Text style={styles.link}>Account deletion information</Text>
          </Pressable>
        </View>

        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Delete account</Text>
          <Text style={styles.dangerBody}>
            Permanently delete your account and all associated data. You can also
            read more at getsuperstar.info/account/delete.
          </Text>
          <Pressable
            style={[styles.deleteButton, deleting ? styles.deleteButtonDisabled : null]}
            disabled={deleting}
            onPress={confirmDeleteAccount}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete my account</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  email: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  emailSecondary: {
    color: colors.muted,
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  link: {
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    borderRadius: 18,
    padding: 16,
  },
  dangerTitle: {
    color: "#991b1b",
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 8,
  },
  dangerBody: {
    color: "#7f1d1d",
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
