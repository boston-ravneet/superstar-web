import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth/AuthProvider";
import { colors } from "@/constants/theme";

export default function IndexScreen() {
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
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (account) {
    if (account.requiresTermsAcceptance) {
      return <Redirect href="/accept-terms" />;
    }
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}
