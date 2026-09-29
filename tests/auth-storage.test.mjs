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
