import { TestIds } from "react-native-google-mobile-ads";

const PRODUCTION_REWARDED_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_UNIT_ID ?? "";

/** Google test rewarded interstitial unit in dev builds to avoid invalid traffic. */
export function getRewardedAdUnitId(): string {
  if (__DEV__) {
    return TestIds.REWARDED_INTERSTITIAL;
  }

  if (!PRODUCTION_REWARDED_UNIT_ID) {
    throw new Error(
      "Missing EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_UNIT_ID for production Android builds.",
    );
  }

  return PRODUCTION_REWARDED_UNIT_ID;
}
