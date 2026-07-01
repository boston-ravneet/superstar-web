import { Platform } from "react-native";

export interface GoogleAuthClientConfig {
  iosClientId?: string;
  androidClientId?: string;
  webClientId?: string;
}

export function getGoogleAuthClientConfig(): GoogleAuthClientConfig | null {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  if (Platform.OS === "ios") {
    if (!iosClientId) {
      return null;
    }
    return { iosClientId, androidClientId, webClientId };
  }

  if (Platform.OS === "android") {
    if (!androidClientId || !webClientId) {
      return null;
    }
    return { iosClientId, androidClientId, webClientId };
  }

  if (!webClientId) {
    return null;
  }

  return { iosClientId, androidClientId, webClientId };
}

export function isGoogleAuthConfigured(): boolean {
  return getGoogleAuthClientConfig() !== null;
}
