/** iOS uses expo-auth-session; native Google Sign-In is Android-only. */
module.exports = {
  dependencies: {
    "@react-native-google-signin/google-signin": {
      platforms: {
        ios: null,
      },
    },
  },
};
