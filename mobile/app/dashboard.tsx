import { Link, Redirect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getPublicProfileUrl } from "@/lib/api/client";
import { loadProfileForEdit } from "@/lib/builder/load-edit";
import { resetOnboardingState } from "@/lib/state/onboarding";
import { colors } from "@/constants/theme";

function publishStatusLabel(
  status: import("@/types/account").AccountProfileSummary["publishStatus"],
): string {
  switch (status) {
    case "published":
      return "Live";
    case "preview":
      return "Ready to publish";
    case "generating":
      return "Building…";
    default:
      return "Draft";
  }
}

export default function DashboardScreen() {
  const router = useRouter();
  const {
    account,
    profiles,
    isBootstrapping,
    isRefreshingProfiles,
    refreshProfiles,
    signOut,
    sessionToken,
  } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshProfiles();
    }, [refreshProfiles]),
  );

  if (isBootstrapping) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!account) {
    return <Redirect href="/login" />;
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  async function handleEditStage(profileId: string) {
    if (!sessionToken) {
      return;
    }

    setEditingId(profileId);
    try {
      resetOnboardingState();
      await loadProfileForEdit(profileId, sessionToken);
      router.push("/onboarding/build");
    } catch (editError) {
      Alert.alert(
        "Unable to open editor",
        editError instanceof Error
          ? editError.message
          : "Try again in a moment.",
      );
    } finally {
      setEditingId(null);
    }
  }

  function handleCreateHandle() {
    resetOnboardingState();
    router.push("/onboarding/username");
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {account?.displayName ?? account?.email ?? "Your account"}
        </Text>
        <Text style={styles.subtitle}>
          One login can manage multiple public handles.
        </Text>
      </View>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshingProfiles}
            onRefresh={refreshProfiles}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No stages yet</Text>
            <Text style={styles.emptyBody}>
              Claim your first handle to publish a page on getsuperstar.info.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.profileCard}>
            <View style={styles.profileCardHeader}>
              <Text style={styles.handle}>@{item.username}</Text>
              <Text style={styles.statusBadge}>
                {publishStatusLabel(item.publishStatus)}
              </Text>
            </View>
            <Text style={styles.displayName}>{item.displayName}</Text>
            <Text style={styles.publicUrl}>{getPublicProfileUrl(item.username)}</Text>
            {item.publishStatus === "published" ? (
              <Text style={styles.analyticsText}>
                {item.totalViews ?? 0} total views
                {(item.viewsLast7Days ?? 0) > 0
                  ? ` · ${item.viewsLast7Days} this week`
                  : ""}
              </Text>
            ) : null}
            <Pressable
              style={styles.editButton}
              disabled={editingId === item.id}
              onPress={() => handleEditStage(item.id)}
            >
              {editingId === item.id ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.editButtonText}>Edit stage</Text>
              )}
            </Pressable>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <Pressable style={styles.primaryButton} onPress={handleCreateHandle}>
        <Text style={styles.primaryButtonText}>Create new handle</Text>
      </Pressable>

      <Link href="/check-handle" style={styles.secondaryLink}>
        <Text style={styles.secondaryLinkText}>Check handle availability</Text>
      </Link>

      <Link href="/account-settings" style={styles.secondaryLink}>
        <Text style={styles.secondaryLinkText}>Account settings</Text>
      </Link>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    color: colors.muted,
    lineHeight: 20,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 8,
  },
  emptyBody: {
    color: colors.muted,
    lineHeight: 20,
  },
  profileCard: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  profileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  statusBadge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  handle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18,
  },
  displayName: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: 4,
  },
  publicUrl: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
  },
  analyticsText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },
  editButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  editButtonText: {
    color: colors.text,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryLink: {
    alignItems: "center",
    marginBottom: 16,
  },
  secondaryLinkText: {
    color: colors.text,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  signOutButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  signOutText: {
    color: colors.muted,
  },
});
