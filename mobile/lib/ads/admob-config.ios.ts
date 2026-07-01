import { TestIds } from "react-native-google-mobile-ads";

const PRODUCTION_REWARDED_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_UNIT_ID ??
  "ca-app-pub-2673488651987160/8253118436";

/** Google test rewarded interstitial unit in dev builds to avoid invalid traffic. */
export function getRewardedAdUnitId(): string {
  if (__DEV__) {
    return TestIds.REWARDED_INTERSTITIAL;
  }

  return PRODUCTION_REWARDED_UNIT_ID;
}

/** @deprecated Use getRewardedAdUnitId */
export const getIosRewardedAdUnitId = getRewardedAdUnitId;
