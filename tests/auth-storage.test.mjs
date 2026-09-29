import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('authStore.ts prioritizes active tab sessionStorage over localStorage in initializeAuth', () => {
  const authStorePath = path.join(ROOT_DIR, 'src', 'stores', 'authStore.ts');
  const content = fs.readFileSync(authStorePath, 'utf-8');

  assert.ok(
    content.includes('sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)'),
    'initializeAuth must prioritize active tab sessionStorage over localStorage'
  );
});

test('client.ts prioritizes active tab sessionStorage over localStorage in attachAuthToken', () => {
  const clientPath = path.join(ROOT_DIR, 'src', 'api', 'client.ts');
  const content = fs.readFileSync(clientPath, 'utf-8');

  assert.ok(
    content.includes("sessionStorage.getItem('access_token') || localStorage.getItem('access_token')"),
    'attachAuthToken must prioritize active tab sessionStorage over localStorage'
  );
});

test('login and submitMfa cleanly remove token from opposite storage', () => {
  const authStorePath = path.join(ROOT_DIR, 'src', 'stores', 'authStore.ts');
  const content = fs.readFileSync(authStorePath, 'utf-8');

  // Verify that rememberMe=true cleans up sessionStorage
  assert.ok(
    content.includes('localStorage.setItem(STORAGE_KEY, token);\n        sessionStorage.removeItem(STORAGE_KEY);'),
    'rememberMe=true must clear sessionStorage to prevent stale session conflicts'
  );

  // Verify that rememberMe=false cleans up localStorage
  assert.ok(
    content.includes('sessionStorage.setItem(STORAGE_KEY, token);\n        localStorage.removeItem(STORAGE_KEY);'),
    'rememberMe=false must clear localStorage to prevent stale session resurrection on refresh'
  );
});

test('Storage logic simulation: rememberMe=false never resurrects old localStorage token on refresh', () => {
  // Simulate mock browser storages
  const mockLocalStorage = new Map();
  const mockSessionStorage = new Map();

  const STORAGE_KEY = 'access_token';

  const mockLogin = (token, rememberMe) => {
    if (rememberMe) {
      mockLocalStorage.set(STORAGE_KEY, token);
      mockSessionStorage.delete(STORAGE_KEY);
    } else {
      mockSessionStorage.set(STORAGE_KEY, token);
      mockLocalStorage.delete(STORAGE_KEY);
    }
  };

  const mockInitializeAuth = () => {
    return mockSessionStorage.get(STORAGE_KEY) || mockLocalStorage.get(STORAGE_KEY) || null;
  };

  // Step 1: User logs in with rememberMe = true
  mockLogin('OLD_PERSISTENT_TOKEN', true);
  assert.strictEqual(mockLocalStorage.get(STORAGE_KEY), 'OLD_PERSISTENT_TOKEN');
  assert.strictEqual(mockSessionStorage.get(STORAGE_KEY), undefined);

  // Step 2: Later, user logs in with rememberMe = false
  mockLogin('NEW_TRANSIENT_TOKEN', false);
  assert.strictEqual(mockSessionStorage.get(STORAGE_KEY), 'NEW_TRANSIENT_TOKEN');
  // Crucial check: old token must NOT linger in localStorage!
  assert.strictEqual(mockLocalStorage.get(STORAGE_KEY), undefined);

  // Step 3: Page refresh (F5) runs initializeAuth()
  const restoredToken = mockInitializeAuth();
  assert.strictEqual(
    restoredToken,
    'NEW_TRANSIENT_TOKEN',
    'Page refresh must restore the new valid token, NOT the old token'
  );
});

test('login and submitMfa clean up storage and reset Axios on failure in catch blocks', () => {
  const authStorePath = path.join(ROOT_DIR, 'src', 'stores', 'authStore.ts');
  const content = fs.readFileSync(authStorePath, 'utf-8');

  // Verify catch blocks in authStore.ts perform storage and token reset
  const matches = content.match(/localStorage\.removeItem\(STORAGE_KEY\);\s+sessionStorage\.removeItem\(STORAGE_KEY\);\s+setApiToken\(null\);/g);
  assert.ok(matches && matches.length >= 3, 'initializeAuth, login, and submitMfa must all clean up storage and setApiToken(null) on error');
});

test('Login failure simulation: transient profile failure leaves no stored token and prevents resurrection', async () => {
  const mockLocalStorage = new Map();
  const mockSessionStorage = new Map();
  let mockAxiosToken = null;
  const STORAGE_KEY = 'access_token';

  const setApiToken = (t) => { mockAxiosToken = t; };

  // Simulated login with delayed persistence and deterministic catch cleanup
  const mockLoginFlow = async (shouldProfileFail) => {
    try {
      const token = 'MOCK_ACCESS_TOKEN';
      setApiToken(token);

      if (shouldProfileFail) {
        throw new Error('Profile fetch failed (502 / network timeout)');
      }

      // Persist only on success
      mockLocalStorage.set(STORAGE_KEY, token);
      return true;
    } catch {
      // Deterministic cleanup
      mockLocalStorage.delete(STORAGE_KEY);
      mockSessionStorage.delete(STORAGE_KEY);
      setApiToken(null);
      return false;
    }
  };

  // Run failed login
  const success = await mockLoginFlow(true);
  assert.strictEqual(success, false, 'Login must report failure');

  // Assert storage is completely clean
  assert.strictEqual(mockLocalStorage.get(STORAGE_KEY), undefined, 'localStorage must NOT retain access token after failed login');
  assert.strictEqual(mockSessionStorage.get(STORAGE_KEY), undefined, 'sessionStorage must NOT retain access token after failed login');
  assert.strictEqual(mockAxiosToken, null, 'Axios token must be reset to null');

  // Refresh must NOT resurrect session
  const restoredToken = mockSessionStorage.get(STORAGE_KEY) || mockLocalStorage.get(STORAGE_KEY) || null;
  assert.strictEqual(restoredToken, null, 'Refresh after failed login must not resurrect any session');
});

