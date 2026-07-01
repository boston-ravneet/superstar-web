/** @type {import("@expo/config").ExpoConfig} */
const GOOGLE_SIGN_IN_PLUGIN = [
  "@react-native-google-signin/google-signin",
  {
    iosUrlScheme:
      "com.googleusercontent.apps.753240227728-dtk5magac6psgtmve5ui9nbhqqnerbi7",
  },
];

const ADMOB_PLUGIN = [
  "react-native-google-mobile-ads",
  {
    androidAppId:
      process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ??
      "ca-app-pub-3940256099942544~3347511713",
    iosAppId:
      process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID ??
      "ca-app-pub-2673488651987160~5227499848",
  },
];

function isAndroidNativeBuild() {
  if (process.env.EAS_BUILD_PLATFORM === "android") {
    return true;
  }
  if (process.env.EAS_BUILD_PLATFORM === "ios") {
    return false;
  }

  const platformFlagIndex = process.argv.indexOf("--platform");
  if (platformFlagIndex !== -1) {
    return process.argv[platformFlagIndex + 1] === "android";
  }

  return false;
}

module.exports = ({ config }) => {
  const basePlugins = (config.plugins ?? []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== "@react-native-google-signin/google-signin";
  });

  const plugins = isAndroidNativeBuild()
    ? [
        ...basePlugins,
        GOOGLE_SIGN_IN_PLUGIN,
        ADMOB_PLUGIN,
        "./plugins/withAndroidGradleNode.js",
      ]
    : [...basePlugins, ADMOB_PLUGIN, "./plugins/withIosModularHeaders.js"];

  return {
    ...config,
    plugins,
    autolinking: isAndroidNativeBuild()
      ? config.autolinking
      : {
          ...(config.autolinking ?? {}),
          exclude: [
            ...(config.autolinking?.exclude ?? []),
            "@react-native-google-signin/google-signin",
          ],
        },
  };
};
