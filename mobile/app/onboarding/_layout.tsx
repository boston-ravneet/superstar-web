import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth/AuthProvider";
import { colors } from "@/constants/theme";

export default function OnboardingLayout() {
  const { isBootstrapping, account } = useAuth();

  if (isBootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.fuchsia} />
      </View>
    );
  }

  if (!account) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
      }}
    />
  );
}
