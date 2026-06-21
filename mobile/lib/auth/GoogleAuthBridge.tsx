import { useEffect } from "react";
import * as Google from "expo-auth-session/providers/google";
import type { GoogleAuthClientConfig } from "@/lib/auth/googleConfig";

interface GoogleAuthBridgeProps {
  config: GoogleAuthClientConfig;
  onIdToken: (idToken: string) => Promise<void>;
  onPromptReady: (prompt: () => Promise<unknown>) => void;
}

export function GoogleAuthBridge({
  config,
  onIdToken,
  onPromptReady,
}: GoogleAuthBridgeProps) {
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId: config.iosClientId,
    androidClientId: config.androidClientId,
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
