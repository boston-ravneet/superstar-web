import { Redirect } from "expo-router";

/** Legacy route — social handles are collected on the build screen. */
export default function OAuthScreen() {
  return <Redirect href="/onboarding/build" />;
}
