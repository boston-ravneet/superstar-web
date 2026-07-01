import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { isErrorWithCode } from "@react-native-google-signin/google-signin";

let configuredWebClientId: string | null = null;

export function configureNativeGoogleSignIn(webClientId: string): void {
  if (configuredWebClientId === webClientId) {
    return;
  }

  GoogleSignin.configure({ webClientId });
  configuredWebClientId = webClientId;
}

function formatGoogleSignInError(error: unknown): Error {
  if (isErrorWithCode(error) && error.code === "DEVELOPER_ERROR") {
    return new Error(
      "Google Sign-In is misconfigured (SHA-1 fingerprint). In Play Console → App integrity, copy the App signing key SHA-1 and add it to your Android OAuth client in Google Cloud (package: info.getsuperstar.mobile). Changes can take 5–10 minutes.",
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Google Sign-In failed. Try again.");
}

export async function signInWithGoogleNative(): Promise<string> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();
    if (response.type !== "success") {
      throw new Error("Google Sign-In was cancelled.");
    }

    let idToken = response.data.idToken;
    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }

    if (!idToken) {
      throw new Error("Google did not return an identity token.");
    }

    return idToken;
  } catch (error) {
    throw formatGoogleSignInError(error);
  }
}
