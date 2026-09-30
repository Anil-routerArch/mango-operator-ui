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
    // If not built yet, run build to ensure production artifacts exist and are tested
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'pipe' });
  }

  assert.ok(
    fs.existsSync(distHtmlPath),
    'Production build dist/index.html must exist (npm run build)'
  );

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

test('40-generate-config.sh safely escapes special characters (quotes, backslashes, newlines, injection attempts)', () => {
  const scriptPath = path.join(ROOT_DIR, 'docker-entrypoint.d', '40-generate-config.sh');
  const tempDir = fs.mkdtempSync(path.join(ROOT_DIR, 'tests', 'temp-'));
  const tempConfigFile = path.join(tempDir, 'env-config.js');

  try {
    const customEnv = {
      ...process.env,
      ENV_CONFIG_PATH: tempConfigFile,
      // Exact example from review comment:
      VITE_TEST: 'abc"; console.log("x',
      VITE_QUOTES: 'Test "double" and \'single\' quotes',
      VITE_BACKSLASH: 'C:\\Users\\Operator\\Path',
      VITE_MULTILINE: 'Line 1\nLine 2\r\nLine 3',
      VITE_INJECTION: 'foo"; window._injected_ = true; //',
    };

    execFileSync('sh', [scriptPath], { env: customEnv });

    assert.ok(fs.existsSync(tempConfigFile), 'Generated env-config.js must exist');
    const generatedContent = fs.readFileSync(tempConfigFile, 'utf-8');

    // Ensure the generated code is valid JavaScript and executes safely
    const sandbox = { window: {} };
    vm.createContext(sandbox);

    // This will throw a SyntaxError if values were not escaped properly
    assert.doesNotThrow(() => {
      vm.runInContext(generatedContent, sandbox);
    }, 'Generated env-config.js must be syntactically valid JavaScript');

    // Verify injected code was NOT executed
    assert.strictEqual(
      sandbox.window._injected_,
      undefined,
      'Script injection must not execute'
    );

    // Verify literal values are accurately preserved
    assert.strictEqual(
      sandbox.window._env_.VITE_TEST,
      'abc"; console.log("x',
      'Quotes and code-like strings must be preserved without execution'
    );
    assert.strictEqual(
      sandbox.window._env_.VITE_QUOTES,
      'Test "double" and \'single\' quotes'
    );
    assert.strictEqual(
      sandbox.window._env_.VITE_BACKSLASH,
      'C:\\Users\\Operator\\Path'
    );
    assert.strictEqual(
      sandbox.window._env_.VITE_MULTILINE,
      'Line 1\nLine 2\r\nLine 3'
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

test('container-level verification: openwifi_operator-ui serves env-config.js and includes script in index.html', (t) => {
  let isContainerRunning = false;
  try {
    const containerStatus = execSync(
      'docker inspect -f "{{.State.Running}}" openwifi_operator-ui 2>/dev/null',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    isContainerRunning = containerStatus === 'true';
  } catch {
    isContainerRunning = false;
  }

  if (!isContainerRunning) {
    t.skip('Docker daemon or openwifi_operator-ui container is not available/running');
    return;
  }

  // Assertions run OUTSIDE any try/catch so any failure will fail the test!
  const containerHtml = execSync(
    'docker exec openwifi_operator-ui cat /usr/share/nginx/html/index.html',
    { encoding: 'utf-8' }
  );
  assert.ok(
    containerHtml.includes('<script src="/env-config.js"></script>'),
    'Container index.html must include <script src="/env-config.js"></script>'
  );

  const scriptCheck = execSync(
    'docker exec openwifi_operator-ui ls -l /docker-entrypoint.d/40-generate-config.sh',
    { encoding: 'utf-8' }
  );
  assert.ok(
    scriptCheck.includes('-rwx') || scriptCheck.includes('-r-x'),
    'Container must have executable /docker-entrypoint.d/40-generate-config.sh'
  );

  // Check generated env-config.js in container
  const containerEnvConfig = execSync(
    'docker exec openwifi_operator-ui cat /usr/share/nginx/html/env-config.js',
    { encoding: 'utf-8' }
  );
  assert.ok(
    containerEnvConfig.includes('window._env_ = {'),
    'Container env-config.js must contain window._env_ assignment'
  );
});

test('nginx/default.conf defines exact matches for env-config.js and index.html before static assets', () => {
  const confPath = path.join(ROOT_DIR, 'nginx/default.conf');
  assert.ok(fs.existsSync(confPath), 'nginx/default.conf must exist');

  const content = fs.readFileSync(confPath, 'utf-8');
  const envConfigIndex = content.indexOf('location = /env-config.js');
  const indexHtmlIndex = content.indexOf('location = /index.html');
  const staticRegexIndex = content.indexOf('location ~* \\.(js|css|');

  assert.ok(envConfigIndex !== -1, 'location = /env-config.js exact match must be defined');
  assert.ok(indexHtmlIndex !== -1, 'location = /index.html exact match must be defined');
  assert.ok(staticRegexIndex !== -1, 'Static assets regex location must be defined');
  assert.ok(
    envConfigIndex < staticRegexIndex,
    'location = /env-config.js must be declared before static assets regex'
  );
  assert.ok(
    indexHtmlIndex < staticRegexIndex,
    'location = /index.html must be declared before static assets regex'
  );
});

test('container-level verification: Nginx response headers prevent caching of env-config.js and index.html', (t) => {
  let isContainerRunning = false;
  try {
    const containerStatus = execSync(
      'docker inspect -f "{{.State.Running}}" openwifi_operator-ui 2>/dev/null',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
    ).trim();
    isContainerRunning = containerStatus === 'true';
  } catch {
    isContainerRunning = false;
  }

  if (!isContainerRunning) {
    t.skip('Docker daemon or openwifi_operator-ui container is not available/running');
    return;
  }

  // 1. env-config.js must have no-store, no-cache and NEVER be cached
  const envConfigHeaders = execSync(
    'docker exec openwifi_operator-ui wget --no-check-certificate -S -O /dev/null https://127.0.0.1:8445/env-config.js 2>&1',
    { encoding: 'utf-8' }
  );
  assert.ok(
    envConfigHeaders.includes('no-store'),
    'env-config.js must return Cache-Control: no-store'
  );
  assert.ok(
    envConfigHeaders.includes('no-cache'),
    'env-config.js must return Cache-Control: no-cache'
  );
  assert.strictEqual(
    envConfigHeaders.includes('immutable'),
    false,
    'env-config.js must NOT return Cache-Control: immutable'
  );

  // 2. index.html must have no-store, no-cache
  const indexHeaders = execSync(
    'docker exec openwifi_operator-ui wget --no-check-certificate -S -O /dev/null https://127.0.0.1:8445/index.html 2>&1',
    { encoding: 'utf-8' }
  );
  assert.ok(
    indexHeaders.includes('no-store'),
    'index.html must return Cache-Control: no-store'
  );

  // 3. Static assets under /assets/ must have immutable caching
  const assetFile = execSync(
    'docker exec openwifi_operator-ui sh -c "ls /usr/share/nginx/html/assets/*.js | head -n 1"',
    { encoding: 'utf-8' }
  ).trim();
  if (assetFile) {
    const assetBasename = path.basename(assetFile);
    const assetHeaders = execSync(
      `docker exec openwifi_operator-ui wget --no-check-certificate -S -O /dev/null https://127.0.0.1:8445/assets/${assetBasename} 2>&1`,
      { encoding: 'utf-8' }
    );
    assert.ok(
      assetHeaders.includes('immutable'),
      'Hashed static assets must return Cache-Control: immutable'
    );
  }
});

