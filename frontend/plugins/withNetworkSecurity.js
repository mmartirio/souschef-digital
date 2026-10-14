/**
 * Segurança de rede do Android (aplicada no `expo prebuild`):
 * - HTTP em texto puro bloqueado; só HTTPS.
 * - O servidor (host de EXPO_PUBLIC_API_URL) só é aceito com certificado da CA do SousChef
 *   (certs/souschef-root-ca.crt): funciona como pinning. Os demais domínios usam as CAs do sistema.
 * - Build de debug: libera texto puro só para o Metro (bundler de desenvolvimento).
 */
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const CA_FILE = 'certs/souschef-root-ca.crt';

function apiHost() {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url?.startsWith('https://')) throw new Error('EXPO_PUBLIC_API_URL deve usar https:// (veja frontend/.env)');
  return new URL(url).hostname;
}

const config = (host, cleartext) => `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="${cleartext}">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="false">${host}</domain>
    <trust-anchors>
      <certificates src="@raw/souschef_ca" />
    </trust-anchors>
  </domain-config>
</network-security-config>
`;

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

module.exports = function withNetworkSecurity(expoConfig) {
  const host = apiHost();

  expoConfig = withDangerousMod(expoConfig, ['android', async (cfg) => {
    const { projectRoot, platformProjectRoot } = cfg.modRequest;
    const src = path.join(platformProjectRoot, 'app/src');
    write(path.join(src, 'main/res/raw/souschef_ca.crt'), fs.readFileSync(path.join(projectRoot, CA_FILE)));
    write(path.join(src, 'main/res/xml/network_security_config.xml'), config(host, false));
    write(path.join(src, 'debug/res/xml/network_security_config.xml'), config(host, true));
    return cfg;
  }]);

  return withAndroidManifest(expoConfig, (cfg) => {
    const app = cfg.modResults.manifest.application[0].$;
    app['android:networkSecurityConfig'] = '@xml/network_security_config';
    app['android:usesCleartextTraffic'] = 'false';
    return cfg;
  });
};
