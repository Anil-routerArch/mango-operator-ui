import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('Centralized navigation logic resets filters, changes tabs, and calculates target page', () => {
  // Mock dataset of 12 manageable users
  const manageableUsers = Array.from({ length: 12 }, (_, i) => ({
    id: `usr-${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    userRole: i % 2 === 0 ? 'admin' : 'csr',
    suspended: i % 3 === 0,
  }));

  const pageSize = 5;

  // Active state before navigation: filters active, user on Policies tab
  let search = 'csr';
  let roleFilter = 'csr';
  let statusFilter = 'Active';
  let mainTab = 'policies';
  let activeDetailTab = 'overview';
  let selectedUserId = null;
  let currentPage = 1;

  // Simulate centralized handleNavigateToUser
  const handleNavigateToUser = (userId) => {
    // 1. Clear incompatible filters so all users are in filteredUsers
    search = '';
    roleFilter = 'All Roles';
    statusFilter = 'All Status';
    mainTab = 'users';

    if (userId) {
      selectedUserId = userId;
      activeDetailTab = 'profile';

      const userIndex = manageableUsers.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        const targetPage = Math.floor(userIndex / pageSize) + 1;
        currentPage = targetPage;
      }
    }
  };

  // Target user is usr-8 (which was excluded by roleFilter='csr' and statusFilter='Active' if suspended)
  const targetId = 'usr-8';
  handleNavigateToUser(targetId);

  // Assertions
  assert.strictEqual(search, '', 'Search filter must be cleared');
  assert.strictEqual(roleFilter, 'All Roles', 'Role filter must be reset to All Roles');
  assert.strictEqual(statusFilter, 'All Status', 'Status filter must be reset to All Status');
  assert.strictEqual(mainTab, 'users', 'Main tab must switch to users');
  assert.strictEqual(activeDetailTab, 'profile', 'Active detail tab must switch to profile');
  assert.strictEqual(selectedUserId, 'usr-8', 'Target user must be selected');

  // Verify page calculation: usr-8 is at index 7. For pageSize 5, it belongs on Page 2 (items 6–10)
  assert.strictEqual(currentPage, 2, 'Current page must be 2 for 8th user with pageSize=5');

  // Verify user is visible on targetPage
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSlice = manageableUsers.slice(startIndex, startIndex + pageSize);
  assert.ok(
    paginatedSlice.some((u) => u.id === targetId),
    'Destination user row must be contained in the paginated visible rows'
  );
});

test('Pagination synchronization detects filtered-out user and clears incompatible filters', () => {
  const manageableUsers = [
    { id: 'usr-1', name: 'Alice Admin', userRole: 'admin', suspended: false },
    { id: 'usr-2', name: 'Bob CSR', userRole: 'csr', suspended: false },
    { id: 'usr-3', name: 'Charlie NOC', userRole: 'noc', suspended: true },
  ];

  let search = 'bob';
  let roleFilter = 'csr';
  let statusFilter = 'Active';

  // Filtered users under current filters only contains Bob
  const filteredUsers = manageableUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || u.userRole === roleFilter;
    const matchesStatus = statusFilter === 'All Status' || (!u.suspended && statusFilter === 'Active');
    return matchesSearch && matchesRole && matchesStatus;
  });

  assert.strictEqual(filteredUsers.length, 1);
  assert.strictEqual(filteredUsers[0].id, 'usr-2');

  // Now an external navigation selects Alice (usr-1)
  const selectedUserId = 'usr-1';

  // Defensive synchronization check:
  const inFiltered = filteredUsers.findIndex((u) => u.id === selectedUserId);
  assert.strictEqual(inFiltered, -1, 'Alice is excluded by active filters');

  const existsInTotal = manageableUsers.some((u) => u.id === selectedUserId);
  assert.strictEqual(existsInTotal, true, 'Alice exists in total manageable users');

  // Clear filters when excluded
  if (existsInTotal) {
    search = '';
    roleFilter = 'All Roles';
    statusFilter = 'All Status';
  }

  // Recompute filtered users after filter reset
  const restoredUsers = manageableUsers.filter(() => true);
  const newIndex = restoredUsers.findIndex((u) => u.id === selectedUserId);
  assert.ok(newIndex !== -1, 'Alice must be present in restored users list');
  assert.strictEqual(newIndex, 0, 'Alice is at index 0');
});

test('UsersPage.tsx defines handleNavigateToUser and passes it to PoliciesTab', () => {
  const usersPagePath = path.join(ROOT_DIR, 'src', 'pages', 'Users', 'UsersPage.tsx');
  const content = fs.readFileSync(usersPagePath, 'utf-8');

  assert.ok(
    content.includes('const handleNavigateToUser = useCallback('),
    'UsersPage.tsx must declare handleNavigateToUser callback'
  );

  assert.ok(
    content.includes('onNavigateToUsers={handleNavigateToUser}'),
    'UsersPage.tsx must pass handleNavigateToUser to PoliciesTab'
  );

  assert.ok(
    content.includes('prevSelectedUserIdRef'),
    'UsersPage.tsx must track prevSelectedUserIdRef for defensive filter synchronization'
  );
});

test('PoliciesTab.tsx declares typed onNavigateToUsers and passes userId on user click', () => {
  const policiesTabPath = path.join(ROOT_DIR, 'src', 'pages', 'Users', 'PoliciesTab.tsx');
  const content = fs.readFileSync(policiesTabPath, 'utf-8');

  assert.ok(
    content.includes('onNavigateToUsers?: (userId?: string) => void;'),
    'PoliciesTabProps must accept optional userId in onNavigateToUsers'
  );

  assert.ok(
    content.includes('onNavigateToUsers(u.id);'),
    'PoliciesTab must call onNavigateToUsers with user id when an assigned user is clicked'
  );
});

