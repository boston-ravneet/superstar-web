/** iOS uses expo-auth-session — native Google Sign-In is Android-only. */
export function configureNativeGoogleSignIn(_webClientId: string): void {
  // no-op
}

export async function signInWithGoogleNative(): Promise<string> {
  throw new Error("Native Google Sign-In is not used on iOS.");
}
