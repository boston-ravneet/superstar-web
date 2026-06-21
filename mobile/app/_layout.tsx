import { Stack } from "expo-router";
import { AuthProvider } from "@/lib/auth/AuthProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" options={{ headerShown: true, title: "Your stages" }} />
        <Stack.Screen
          name="check-handle"
          options={{ headerShown: true, title: "Check handle" }}
        />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
