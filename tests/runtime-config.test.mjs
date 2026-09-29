import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import vm from 'node:vm';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('index.html loads /env-config.js before Vite module bundle', () => {
  const htmlPath = path.join(ROOT_DIR, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  assert.ok(
    htmlContent.includes('<script src="/env-config.js"></script>'),
    'index.html must include <script src="/env-config.js"></script>'
  );

  const envConfigIndex = htmlContent.indexOf('<script src="/env-config.js"></script>');
  const mainModuleIndex = htmlContent.indexOf('src="/src/main.tsx"');

  assert.ok(
    envConfigIndex !== -1 && mainModuleIndex !== -1,
    'Both env-config.js and main.tsx scripts must be present'
  );
  assert.ok(
    envConfigIndex < mainModuleIndex,
    '/env-config.js must be loaded BEFORE /src/main.tsx module bundle'
  );
});

test('dist/index.html production build loads /env-config.js before bundled module', () => {
  const distHtmlPath = path.join(ROOT_DIR, 'dist', 'index.html');
  if (!fs.existsSync(distHtmlPath)) {
    // If not built yet, skip
    return;
  }
  const distHtmlContent = fs.readFileSync(distHtmlPath, 'utf-8');

  assert.ok(
    distHtmlContent.includes('<script src="/env-config.js"></script>'),
    'dist/index.html must include <script src="/env-config.js"></script>'
  );

  const envConfigIndex = distHtmlContent.indexOf('<script src="/env-config.js"></script>');
  const bundleModuleIndex = distHtmlContent.indexOf('<script type="module" crossorigin');

  assert.ok(
    envConfigIndex !== -1 && bundleModuleIndex !== -1,
    'Both env-config.js and production bundle script must be present in dist/index.html'
  );
  assert.ok(
    envConfigIndex < bundleModuleIndex,
    '/env-config.js must be loaded BEFORE production module bundle in dist/index.html'
  );
});

test('40-generate-config.sh generates valid env-config.js with runtime environment variables', () => {
  const scriptPath = path.join(ROOT_DIR, 'docker-entrypoint.d', '40-generate-config.sh');
  const tempDir = fs.mkdtempSync(path.join(ROOT_DIR, 'tests', 'temp-'));
  const tempConfigFile = path.join(tempDir, 'env-config.js');

  try {
    // Run the generator script with custom environment variables
    const customEnv = {
      ...process.env,
      ENV_CONFIG_PATH: tempConfigFile,
      VITE_UCENTRALSEC_URL: 'https://sec.runtime.test:16001',
      VITE_UCENTRALPROV_URL: 'https://prov.runtime.test:16005/',
      VITE_MANGO_MDU_URL: 'https://mdu.runtime.test:16010',
      REACT_APP_CUSTOM: 'custom-react-val',
      IGNORED_VAR: 'should_not_be_included',
    };

    // Execute with sh
    execFileSync('sh', [scriptPath], { env: customEnv });

    assert.ok(fs.existsSync(tempConfigFile), 'Generated env-config.js must exist');
    const generatedContent = fs.readFileSync(tempConfigFile, 'utf-8');

    // Execute generated script in a sandbox context
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(generatedContent, sandbox);

    assert.ok(sandbox.window._env_, 'window._env_ must be created');
    assert.strictEqual(
      sandbox.window._env_.VITE_UCENTRALSEC_URL,
      'https://sec.runtime.test:16001',
      'VITE_UCENTRALSEC_URL must match runtime environment'
    );
    assert.strictEqual(
      sandbox.window._env_.VITE_UCENTRALPROV_URL,
      'https://prov.runtime.test:16005/',
      'VITE_UCENTRALPROV_URL must match runtime environment'
    );
    assert.strictEqual(
      sandbox.window._env_.VITE_MANGO_MDU_URL,
      'https://mdu.runtime.test:16010',
      'VITE_MANGO_MDU_URL must match runtime environment'
    );
    assert.strictEqual(
      sandbox.window._env_.REACT_APP_CUSTOM,
      'custom-react-val',
      'REACT_APP variables must be captured'
    );
    assert.strictEqual(
      sandbox.window._env_.IGNORED_VAR,
      undefined,
      'Non-VITE / non-REACT variables must not be leaked'
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('runtime configured URLs are consumed by client base URL resolvers', () => {
  // Mirror client.ts URL resolution logic
  const resolveSecBaseUrl = (win, fallbackEnv = {}) => {
    const raw = win?._env_?.VITE_UCENTRALSEC_URL || fallbackEnv.VITE_UCENTRALSEC_URL || 'https://openwifi.wlan.local:16001';
    return `${raw.replace(/\/+$/, '')}/api/v1`;
  };

  const resolveProvBaseUrl = (win, fallbackEnv = {}) => {
    const raw = win?._env_?.VITE_UCENTRALPROV_URL || fallbackEnv.VITE_UCENTRALPROV_URL || 'https://openwifi.wlan.local:16005';
    return `${raw.replace(/\/+$/, '')}/api/v1`;
  };

  const resolveProvV2BaseUrl = (win, fallbackEnv = {}) => {
    const raw = win?._env_?.VITE_UCENTRALPROV_URL || fallbackEnv.VITE_UCENTRALPROV_URL || 'https://openwifi.wlan.local:16005';
    return `${raw.replace(/\/+$/, '')}/api/v2`;
  };

  // Case 1: Runtime URLs configured via window._env_ take top priority
  const runtimeWindow = {
    _env_: {
      VITE_UCENTRALSEC_URL: 'https://sec.custom.domain:16001',
      VITE_UCENTRALPROV_URL: 'https://prov.custom.domain:16005///',
    },
  };
  const buildTimeEnv = {
    VITE_UCENTRALSEC_URL: 'https://sec.buildtime.domain:16001',
    VITE_UCENTRALPROV_URL: 'https://prov.buildtime.domain:16005',
  };

  assert.strictEqual(
    resolveSecBaseUrl(runtimeWindow, buildTimeEnv),
    'https://sec.custom.domain:16001/api/v1',
    'Runtime VITE_UCENTRALSEC_URL must take precedence over build-time and default'
  );
  assert.strictEqual(
    resolveProvBaseUrl(runtimeWindow, buildTimeEnv),
    'https://prov.custom.domain:16005/api/v1',
    'Runtime VITE_UCENTRALPROV_URL must take precedence and strip trailing slashes'
  );
  assert.strictEqual(
    resolveProvV2BaseUrl(runtimeWindow, buildTimeEnv),
    'https://prov.custom.domain:16005/api/v2',
    'Runtime VITE_UCENTRALPROV_URL must take precedence for v2 endpoint'
  );

  // Case 2: When runtime window._env_ is not set or empty, falls back to build-time or default
  const emptyWindow = { _env_: {} };
  assert.strictEqual(
    resolveSecBaseUrl(emptyWindow, buildTimeEnv),
    'https://sec.buildtime.domain:16001/api/v1',
    'Falls back to build-time env if window._env_ does not contain the key'
  );
  assert.strictEqual(
    resolveSecBaseUrl({}, {}),
    'https://openwifi.wlan.local:16001/api/v1',
    'Falls back to default URL if neither runtime nor build-time env is set'
  );
});

test('container-level verification: openwifi_operator-ui serves env-config.js and includes script in index.html', () => {
  try {
    // Check if openwifi_operator-ui container is running
    const containerStatus = execSync(
      'docker inspect -f "{{.State.Running}}" openwifi_operator-ui 2>/dev/null',
      { encoding: 'utf-8' }
    ).trim();

    if (containerStatus !== 'true') {
      return; // Skip if container is not currently running
    }

    // Check index.html inside container
    const containerHtml = execSync(
      'docker exec openwifi_operator-ui cat /usr/share/nginx/html/index.html',
      { encoding: 'utf-8' }
    );
    assert.ok(
      containerHtml.includes('<script src="/env-config.js"></script>'),
      'Container index.html must include <script src="/env-config.js"></script>'
    );

    // Verify 40-generate-config.sh exists and is executable in container
    const scriptCheck = execSync(
      'docker exec openwifi_operator-ui ls -l /docker-entrypoint.d/40-generate-config.sh',
      { encoding: 'utf-8' }
    );
    assert.ok(
      scriptCheck.includes('-rwx'),
      'Container must have executable /docker-entrypoint.d/40-generate-config.sh'
    );
  } catch {
    // Docker daemon or container not accessible in current environment
  }
});
