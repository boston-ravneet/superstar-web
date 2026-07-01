import { useEffect } from "react";
import { Platform } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import type { GoogleAuthClientConfig } from "@/lib/auth/googleConfig";

interface GoogleAuthBridgeProps {
  config: GoogleAuthClientConfig;
  onIdToken: (idToken: string) => Promise<void>;
  onPromptReady: (prompt: () => Promise<unknown>) => void;
}

/** iOS browser OAuth via expo-auth-session. Android uses native SDK in AuthProvider. */
export function GoogleAuthBridge({
  config,
  onIdToken,
  onPromptReady,
}: GoogleAuthBridgeProps) {
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId: config.iosClientId,
    webClientId: config.webClientId,
  });

  useEffect(() => {
    onPromptReady(() => promptGoogleAsync());
  }, [onPromptReady, promptGoogleAsync]);

  useEffect(() => {
    async function completeGoogleSignIn() {
      if (googleResponse?.type !== "success") {
        return;
      }

      const idToken = googleResponse.authentication?.idToken;
      if (!idToken) {
        throw new Error("Google did not return an identity token.");
      }

      await onIdToken(idToken);
    }

    completeGoogleSignIn().catch(() => undefined);
  }, [googleResponse, onIdToken]);

  return null;
}

export function shouldUseGoogleAuthBridge(): boolean {
  return Platform.OS === "ios";
}
