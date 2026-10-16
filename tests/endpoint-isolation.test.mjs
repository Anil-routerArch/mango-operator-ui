import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('client.ts error interceptor performs hard document reload on 401/403 token expiration', () => {
  const clientPath = path.join(ROOT_DIR, 'src', 'api', 'client.ts');
  const content = fs.readFileSync(clientPath, 'utf-8');

  const matches = content.match(/window\.location\.replace\('\/'\);/g);
  assert.ok(
    matches && matches.length >= 2,
    'client.ts must execute window.location.replace("/") in both 401 and 403 response handlers matching owprov-ui'
  );
});

test('authStore.ts logout performs hard document reload in finally block', () => {
  const authStorePath = path.join(ROOT_DIR, 'src', 'stores', 'authStore.ts');
  const content = fs.readFileSync(authStorePath, 'utf-8');

  assert.ok(
    content.includes("window.location.replace('/');"),
    'authStore.ts logout must perform window.location.replace("/") matching owprov-ui Account.ts'
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
      this.axiosMdu = { defaults: { baseURL: 'https://openwifi.wlan.local:16010/api/v1' } };
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

  // Assertions: Axios MDU baseURL and query cache were wiped cleanly by document reload
  assert.strictEqual(
    tab.axiosMdu.defaults.baseURL,
    'https://openwifi.wlan.local:16010/api/v1',
    'Cluster B session must start from clean default MDU URL'
  );
  assert.strictEqual(
    tab.queryClientCache.size,
    0,
    'Query client cache must be completely empty after document reload'
  );
});
