const { withSettingsGradle, withProjectBuildGradle, withGradleProperties } = require("expo/config-plugins");

const NODE_RESOLVER = `  def superstarNodePath = System.getenv("NODE_BINARY")
  if (superstarNodePath == null || superstarNodePath.isBlank()) {
    superstarNodePath = ["/opt/homebrew/bin/node", "/usr/local/bin/node"].find { new File(it).exists() }
    if (superstarNodePath == null) {
      superstarNodePath = "node"
    }
  }

`;

const KSP_VERSION_BLOCK = `// KSP 2.3.x is standalone; Expo's lookup table does not include Kotlin 2.3 yet.
ext {
  kspVersion = "2.3.0"
}

`;

const KOTLIN_BUILDSCRIPT_PATCH = {
  extBlock: `  ext {
    kotlinVersion = findProperty("android.kotlinVersion") ?: "2.3.0"
  }
`,
  classpath: 'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")',
};

function patchProjectBuildGradle(contents) {
  if (!contents.includes('kspVersion = "2.3.0"')) {
    contents = contents.replace(
      'apply plugin: "expo-root-project"',
      `${KSP_VERSION_BLOCK}apply plugin: "expo-root-project"`,
    );
  }

  if (!contents.includes('kotlinVersion = findProperty("android.kotlinVersion")')) {
    contents = contents.replace(
      "buildscript {",
      `buildscript {\n${KOTLIN_BUILDSCRIPT_PATCH.extBlock}`,
    );
  }

  if (contents.includes("classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')")) {
    contents = contents.replace(
      "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
      KOTLIN_BUILDSCRIPT_PATCH.classpath,
    );
  }

  return contents;
}

/** @param {import("@expo/config-plugins").ExpoConfig} config */
module.exports = function withAndroidGradleNode(config) {
  config = withGradleProperties(config, (gradleConfig) => {
    const key = "android.kotlinVersion";
    const value = "2.3.0";
    const items = gradleConfig.modResults.filter((item) => item.type !== "property" || item.key !== key);
    items.push({ type: "property", key, value });
    gradleConfig.modResults = items;
    return gradleConfig;
  });

  config = withProjectBuildGradle(config, (gradleConfig) => {
    gradleConfig.modResults.contents = patchProjectBuildGradle(
      gradleConfig.modResults.contents,
    );
    return gradleConfig;
  });

  return withSettingsGradle(config, (gradleConfig) => {
    let contents = gradleConfig.modResults.contents;

    if (!contents.includes("superstarNodePath")) {
      contents = contents.replace(
        "pluginManagement {",
        `pluginManagement {\n${NODE_RESOLVER}`,
      );
      contents = contents.replaceAll('commandLine("node"', "commandLine(superstarNodePath");
    }

    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });
};
