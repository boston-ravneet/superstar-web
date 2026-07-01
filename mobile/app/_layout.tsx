import { Stack } from "expo-router";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { initializeAds } from "@/lib/ads/initialize-ads";
import { colors } from "@/constants/theme";

export default function RootLayout() {
  useEffect(() => {
    void initializeAds();
  }, []);

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text, fontWeight: "600" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen
          name="accept-terms"
          options={{ headerShown: true, title: "Terms" }}
        />
        <Stack.Screen name="dashboard" options={{ headerShown: true, title: "Your stages" }} />
        <Stack.Screen
          name="check-handle"
          options={{ headerShown: true, title: "Check handle" }}
        />
        <Stack.Screen
          name="account-settings"
          options={{ headerShown: true, title: "Account settings" }}
        />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
