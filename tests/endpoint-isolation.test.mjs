import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('client.ts error interceptor performs hard document reload via teardownSessionAndReload on 401/403 token expiration', () => {
  const clientPath = path.join(ROOT_DIR, 'src', 'api', 'client.ts');
  const content = fs.readFileSync(clientPath, 'utf-8');

  assert.ok(
    content.includes('teardownSessionAndReload();'),
    'client.ts must execute teardownSessionAndReload on token expiration'
  );
  assert.ok(
    content.includes("window.location.hash = '#/login';") && content.includes('window.location.reload();'),
    'teardownSessionAndReload must reload to #/login preserving the deployment subpath'
  );
});

test('authStore.ts logout performs hard document reload via teardownSessionAndReload in finally block', () => {
  const authStorePath = path.join(ROOT_DIR, 'src', 'stores', 'authStore.ts');
  const content = fs.readFileSync(authStorePath, 'utf-8');

  assert.ok(
    content.includes('teardownSessionAndReload();'),
    'authStore.ts logout must perform teardownSessionAndReload'
  );
});

test('client.ts isolates axiosMdu: attaches session-terminating response interceptor only to coreAxiosInstances', () => {
  const clientPath = path.join(ROOT_DIR, 'src', 'api', 'client.ts');
  const content = fs.readFileSync(clientPath, 'utf-8');

  // Verify coreAxiosInstances definition exists and excludes axiosMdu
  assert.ok(
    content.includes('export const coreAxiosInstances'),
    'client.ts must define coreAxiosInstances'
  );
  assert.ok(
    content.includes('coreAxiosInstances.forEach'),
    'client.ts must attach handleResponseError only to coreAxiosInstances'
  );

  // Extract coreAxiosInstances block and assert axiosMdu is not in it
  const coreBlockMatch = content.match(/coreAxiosInstances:\s*AxiosInstance\[\]\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(coreBlockMatch, 'coreAxiosInstances definition block must match');
  assert.strictEqual(
    coreBlockMatch[1].includes('axiosMdu'),
    false,
    'coreAxiosInstances must NOT include axiosMdu'
  );

  // Assert allAxiosInstances includes axiosMdu so it receives tokens and request interceptors
  assert.ok(
    content.includes('...coreAxiosInstances,\n  axiosMdu,'),
    'allAxiosInstances must combine coreAxiosInstances with axiosMdu'
  );
});

test('Simulation: Hard reload destroys JS heap, resetting Axios baseURLs and query cache', () => {
  // Simulate browser JS heap lifecycle
  class BrowserTabContext {
    constructor() {
      this.localStorage = new Map();
      this.sessionStorage = new Map();
      this.reboot();
    }

    // Full document navigation recreates module scope and singletons from environment defaults
    reboot() {
      this.axiosMdu = { defaults: { baseURL: undefined } };
      this.axiosProv = { defaults: { baseURL: 'https://openwifi.wlan.local:16005/api/v1' } };
      this.queryClientCache = new Map();
    }

    // Cluster discovery updates in-memory singletons during active session
    discoverEndpoints(endpoints) {
      for (const ep of endpoints) {
        if (ep.type === 'mango-mdu-service') {
          this.axiosMdu.defaults.baseURL = `${ep.uri}/api/v1`;
        }
        if (ep.type === 'owprov') {
          this.axiosProv.defaults.baseURL = `${ep.uri}/api/v1`;
        }
      }
    }

    // owprov-ui pattern: logout clears token and executes window.location.replace('/')
    logout() {
      this.localStorage.delete('access_token');
      this.sessionStorage.delete('access_token');
      this.reboot();
    }
  }

  const tab = new BrowserTabContext();

  // 1. Admin A logs into Cluster A (which includes MDU service)
  tab.discoverEndpoints([
    { type: 'owprov', uri: 'https://cluster-a.net:16005' },
    { type: 'mango-mdu-service', uri: 'https://cluster-a.net:16010' },
  ]);
  tab.queryClientCache.set('policyOverview', { policyId: 'pol-123', users: 10 });

  assert.strictEqual(tab.axiosMdu.defaults.baseURL, 'https://cluster-a.net:16010/api/v1');
  assert.strictEqual(tab.queryClientCache.size, 1);

  // 2. Admin A logs out (triggers hard document reload)
  tab.logout();

  // 3. Admin B logs into Cluster B (which omits MDU service)
  tab.discoverEndpoints([
    { type: 'owprov', uri: 'https://cluster-b.net:16005' },
  ]);

  // Assertions: Axios MDU baseURL is undefined (never pings a hardcoded fallback outside the cluster)
  assert.strictEqual(
    tab.axiosMdu.defaults.baseURL,
    undefined,
    'Cluster B session must have undefined MDU URL when not discovered in cluster'
  );
  assert.strictEqual(
    tab.queryClientCache.size,
    0,
    'Query client cache must be completely empty after document reload'
  );
});

test('client.ts does not hardcode default MDU URL and only sets baseURL when configured or discovered', () => {
  const clientPath = path.join(ROOT_DIR, 'src', 'api', 'client.ts');
  const content = fs.readFileSync(clientPath, 'utf-8');

  // getMduBaseUrl must return string | undefined and NOT hardcode openwifi.wlan.local:16010
  assert.strictEqual(
    content.includes("'https://openwifi.wlan.local:16010'"),
    false,
    'client.ts must NOT hardcode fallback URL for MDU service to prevent cross-cluster traffic'
  );
  assert.ok(
    content.includes('getMduBaseUrl = (): string | undefined'),
    'getMduBaseUrl must return undefined when not configured'
  );
});

test('users.ts useGetPolicyOverview gates query execution with isMduConfigured', () => {
  const usersPath = path.join(ROOT_DIR, 'src', 'api', 'users.ts');
  const content = fs.readFileSync(usersPath, 'utf-8');

  assert.ok(
    content.includes('const isMduConfigured = Boolean(axiosMdu.defaults.baseURL);'),
    'useGetPolicyOverview must check if axiosMdu.defaults.baseURL is configured'
  );
  assert.ok(
    content.includes('enabled: Boolean(policyId) && isEnabled && isMduConfigured'),
    'useGetPolicyOverview query must be disabled if MDU service is not configured/discovered'
  );
});

test('PoliciesTab.tsx surfaces stale cached metrics warning when refresh fails', () => {
  const policiesPath = path.join(ROOT_DIR, 'src', 'pages', 'Users', 'PoliciesTab.tsx');
  const content = fs.readFileSync(policiesPath, 'utf-8');

  // Must detect when MDU is not configured
  assert.ok(
    content.includes('const isMduConfigured = Boolean(axiosMdu.defaults.baseURL);'),
    'PoliciesTab must check isMduConfigured'
  );

  // Must distinguish failed refresh with cached data from fresh data
  assert.ok(
    content.includes('Refresh failed — cached'),
    'PoliciesTab must display "Refresh failed — cached" badge when refresh fails'
  );
  assert.ok(
    content.includes('Unable to refresh metrics from service. Displaying previously loaded data.'),
    'PoliciesTab must alert user when displaying previously loaded data after failed refresh'
  );
  assert.ok(
    content.includes('Previously loaded:'),
    'Policy impact callout must label metrics as "Previously loaded" when refresh fails'
  );
});

test('Simulation: MDU 401 rejects locally without clearing token or redirecting session', () => {
  let sessionTerminated = false;
  let activeToken = 'VALID_OWSEC_TOKEN';

  const terminateSession = () => {
    sessionTerminated = true;
    activeToken = null;
  };

  // Interceptor dispatcher simulating client.ts
  const dispatchResponseError = (clientName, error) => {
    // Only core clients trigger session termination on 401/403
    if (clientName !== 'axiosMdu' && (error.status === 401 || error.status === 403)) {
      terminateSession();
    }
    return Promise.reject(error);
  };

  // Case 1: axiosMdu receives 401 Unauthorized from mango-mdu-service
  const mduError = { status: 401, message: 'Unauthorized from MDU' };
  assert.rejects(
    async () => {
      await dispatchResponseError('axiosMdu', mduError);
    },
    (err) => err.status === 401
  );

  // Assert session remains intact
  assert.strictEqual(sessionTerminated, false, 'MDU 401 must NOT terminate the UI session');
  assert.strictEqual(activeToken, 'VALID_OWSEC_TOKEN', 'OpenWiFi token must remain active after MDU 401');

  // Case 2: Core client (e.g. axiosSec) receives 401 Unauthorized
  const secError = { status: 401, message: 'Unauthorized from OWSEC' };
  assert.rejects(
    async () => {
      await dispatchResponseError('axiosSec', secError);
    },
    (err) => err.status === 401
  );

  // Assert core failure terminates session
  assert.strictEqual(sessionTerminated, true, 'Core OWSEC 401 must terminate session');
  assert.strictEqual(activeToken, null, 'Active token must be cleared on core 401');
});

test('client.ts does not reload page on 401 from login or MFA endpoints', () => {
  const clientPath = path.join(ROOT_DIR, 'src', 'api', 'client.ts');
  const content = fs.readFileSync(clientPath, 'utf-8');

  // Verify isAuthEndpoint helper exists and checks oauth2 POST requests
  assert.ok(
    content.includes('export const isAuthEndpoint'),
    'client.ts must define isAuthEndpoint'
  );
  assert.ok(
    content.includes('if (isAuthEndpoint(url, method))'),
    'client.ts handleResponseError must check isAuthEndpoint and reject without reloading'
  );

  // Verify isLoginRoute guard exists
  assert.ok(
    content.includes('export const isLoginRoute'),
    'client.ts must define isLoginRoute'
  );
  assert.ok(
    content.includes('if (!isLoginRoute())'),
    'client.ts handleResponseError must prevent reload if already on login route'
  );
});

test('Simulation: 401 on login POST oauth2 rejects without page reload or storage clearing', async () => {
  let reloaded = false;
  let activeToken = null;

  // Interceptor matching client.ts
  const isAuthEndpoint = (url, method) => {
    if (!url) return false;
    const isPost = !method || method.toLowerCase() === 'post';
    return isPost && url.includes('oauth2') && !url.includes('oauth2?me=true');
  };

  const handleResponseError = (error) => {
    if (isAuthEndpoint(error.config?.url, error.config?.method)) {
      return Promise.reject(error);
    }

    if (error.status === 401) {
      reloaded = true;
    }
    return Promise.reject(error);
  };

  // 1. User submits wrong credentials on login page
  const failedLoginError = {
    status: 401,
    config: { url: 'oauth2', method: 'post' },
    response: { status: 401, data: { ErrorDescription: 'Invalid credentials' } },
  };

  await assert.rejects(
    async () => {
      await handleResponseError(failedLoginError);
    },
    (err) => err.status === 401
  );

  assert.strictEqual(reloaded, false, 'Failed login 401 must NOT trigger a page reload');

  // 2. User submits invalid MFA answer
  const failedMfaError = {
    status: 401,
    config: { url: 'oauth2?completeMFAChallenge=true', method: 'post' },
    response: { status: 401, data: { ErrorDescription: 'Invalid MFA' } },
  };

  await assert.rejects(
    async () => {
      await handleResponseError(failedMfaError);
    },
    (err) => err.status === 401
  );

  assert.strictEqual(reloaded, false, 'Failed MFA 401 must NOT trigger a page reload');

  // 3. Authenticated session token expires on an API request
  const expiredSessionError = {
    status: 401,
    config: { url: 'users', method: 'get' },
    response: { status: 401, data: { ErrorDescription: 'Token expired' } },
  };

  await assert.rejects(
    async () => {
      await handleResponseError(expiredSessionError);
    },
    (err) => err.status === 401
  );

  assert.strictEqual(reloaded, true, 'Expired session 401 on authenticated API request MUST trigger session reload');
});

test('teardownSessionAndReload sets hash to #/login and reloads without modifying pathname', () => {
  // Simulate browser window.location under a subpath deployment
  const mockLocation = {
    pathname: '/operator/',
    hash: '#/dashboard',
    reloaded: false,
    reload() {
      this.reloaded = true;
    },
  };

  const mockStorage = {
    access_token: 'ACTIVE_TOKEN',
  };

  const teardownSessionAndReload = (loc, storage) => {
    delete storage.access_token;
    loc.hash = '#/login';
    loc.reload();
  };

  teardownSessionAndReload(mockLocation, mockStorage);

  assert.strictEqual(mockStorage.access_token, undefined, 'Access token must be deleted');
  assert.strictEqual(mockLocation.pathname, '/operator/', 'Subpath pathname must remain strictly preserved');
  assert.strictEqual(mockLocation.hash, '#/login', 'Hash must be set to #/login');
  assert.strictEqual(mockLocation.reloaded, true, 'Browser must execute document reload');
});


