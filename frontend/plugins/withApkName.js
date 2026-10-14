/**
 * Nomeia o APK com o nome e a versão do app (ex.: SousChef-Digital-1.0.0.apk; no debug, ...-debug.apk)
 * em vez do padrão app-release.apk.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// withApkName';

module.exports = function withApkName(expoConfig) {
  const name = expoConfig.name.trim().replace(/\s+/g, '-');
  return withAppBuildGradle(expoConfig, (cfg) => {
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents += `
${MARKER}
android.applicationVariants.all { variant ->
    variant.outputs.all {
        def suffix = variant.buildType.name == 'release' ? '' : "-\${variant.buildType.name}"
        outputFileName = "${name}-\${variant.versionName}\${suffix}.apk"
    }
}
`;
    }
    return cfg;
  });
};
