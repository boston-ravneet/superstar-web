const { withPodfile } = require("expo/config-plugins");

/** Fixes GoogleUtilities / AppCheckCore static Swift pod integration on iOS. */
module.exports = function withIosModularHeaders(config) {
  return withPodfile(config, (podfileConfig) => {
    if (!podfileConfig.modResults.contents.includes("use_modular_headers!")) {
      podfileConfig.modResults.contents = podfileConfig.modResults.contents.replace(
        /platform :ios.*$/m,
        (line) => `${line}\nuse_modular_headers!`,
      );
    }

    return podfileConfig;
  });
};
