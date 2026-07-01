import { Platform } from "react-native";

export function getRewardedAdUnitId(): string {
  if (Platform.OS === "android") {
    const { getRewardedAdUnitId: getAndroidUnitId } =
      require("./admob-config.android") as {
        getRewardedAdUnitId: () => string;
      };
    return getAndroidUnitId();
  }

  const { getRewardedAdUnitId: getIosUnitId } = require("./admob-config.ios") as {
    getRewardedAdUnitId: () => string;
  };
  return getIosUnitId();
}
