import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

const ALLOWED_USER_ROLES = ['root', 'admin', 'csr', 'noc', 'installer'];

test('UserRole type in src/types/auth.ts contains exactly the 5 allowed roles', () => {
  const authTypesPath = path.join(ROOT_DIR, 'src', 'types', 'auth.ts');
  const content = fs.readFileSync(authTypesPath, 'utf-8');

  const match = content.match(/export type UserRole =([\s\S]*?);/);
  assert.ok(match, 'UserRole type must be exported in auth.ts');

  const roles = match[1]
    .split('|')
    .map((r) => r.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  assert.deepStrictEqual(
    roles.sort(),
    [...ALLOWED_USER_ROLES].sort(),
    `auth.ts UserRole must only contain ${ALLOWED_USER_ROLES.join(', ')}`
  );
});

test('UserRole type in src/types/user.ts contains exactly the 5 allowed roles', () => {
  const userTypesPath = path.join(ROOT_DIR, 'src', 'types', 'user.ts');
  const content = fs.readFileSync(userTypesPath, 'utf-8');

  const match = content.match(/export type UserRole =([\s\S]*?);/);
  assert.ok(match, 'UserRole type must be exported in user.ts');

  const roles = match[1]
    .split('|')
    .map((r) => r.trim().replace(/['"]/g, ''))
    .filter(Boolean);

  assert.deepStrictEqual(
    roles.sort(),
    [...ALLOWED_USER_ROLES].sort(),
    `user.ts UserRole must only contain ${ALLOWED_USER_ROLES.join(', ')}`
  );
});

test('Create User dropdown in UsersPage.tsx restricts roles to the 5 allowed and limits root to root users', () => {
  const usersPagePath = path.join(ROOT_DIR, 'src', 'pages', 'Users', 'UsersPage.tsx');
  const content = fs.readFileSync(usersPagePath, 'utf-8');

  // Verify roleOptions definition in CreateUserModal
  assert.ok(
    content.includes('...(isCurrentUserRoot ? [{ label: \'Root\', value: \'root\' }] : [])'),
    'CreateUserModal must only include Root when isCurrentUserRoot is true'
  );

  // Check that discarded roles are not in roleOptions or availableRoles
  assert.ok(!content.includes("'accounting'"), 'Accounting role must not exist in UsersPage');
  assert.ok(!content.includes("'subscriber'"), 'Subscriber role must not exist in UsersPage');
  assert.ok(!content.includes("'partner'"), 'Partner role must not exist in UsersPage');

  // Verify role filter options in UsersPage
  assert.ok(
    content.includes("options={['All Roles', 'root', 'admin', 'csr', 'noc', 'installer']}"),
    'Role filter in UsersPage must only include All Roles and the 5 allowed roles'
  );
});
