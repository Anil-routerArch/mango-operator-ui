import test from 'node:test';
import assert from 'node:assert/strict';

// MANAGED_RESOURCE_KEYS mirrors PoliciesTab.tsx
const MANAGED_RESOURCE_KEYS = new Set([
  'entity',
  'property',
  'venue',
  'configuration',
  'inventory',
  'device',
  'operator',
  'subscriber',
  'contact',
  'location',
]);

const UI_LABEL_TO_RESOURCE_KEY = {
  Entity: 'entity',
  Venue: 'venue',
  Configuration: 'configuration',
  Inventory: 'inventory',
  Operator: 'operator',
  Subscriber: 'subscriber',
  Contact: 'contact',
  Location: 'location',
};

// Mirror mergePolicyEntries from PoliciesTab.tsx
const mergePolicyEntries = (originalEntries = [], editedPermissions) => {
  const preservedUnmanagedEntries = [];

  for (const entry of originalEntries) {
    if (!entry || !Array.isArray(entry.resources)) continue;

    const hasCustomScoping = Boolean(
      entry.users?.length || entry.policy
    );

    const unmanagedResources = entry.resources.filter(
      (r) => !MANAGED_RESOURCE_KEYS.has(r.trim().toLowerCase())
    );

    if (hasCustomScoping) {
      preservedUnmanagedEntries.push({
        ...entry,
        resources: [...entry.resources],
        access: [...(entry.access || [])],
      });
    } else if (unmanagedResources.length > 0) {
      preservedUnmanagedEntries.push({
        ...entry,
        resources: unmanagedResources,
        access: [...(entry.access || [])],
      });
    }
  }

  const accessGroups = {};
  editedPermissions.forEach((perm) => {
    const isFull = perm.read && perm.create && perm.update && perm.delete;
    const access = [];
    if (isFull) {
      access.push('FULL');
    } else {
      if (perm.read) access.push('READ');
      if (perm.create) access.push('CREATE');
      if (perm.update) access.push('UPDATE');
      if (perm.delete) access.push('DELETE');
    }

    if (access.length > 0) {
      const key = [...access].sort().join(',');
      if (!accessGroups[key]) {
        accessGroups[key] = [];
      }
      const resKey = UI_LABEL_TO_RESOURCE_KEY[perm.resource] || perm.resource.toLowerCase();
      accessGroups[key].push(resKey);
    }
  });

  const managedEntries = Object.entries(accessGroups).map(([key, resources]) => ({
    resources,
    access: key.split(','),
  }));

  return [...preservedUnmanagedEntries, ...managedEntries];
};

test('P1 Review Case: Preserves configurationProfile when editing inventory from READ to FULL', () => {
  const originalEntries = [
    {
      resources: ['inventory'],
      access: ['READ'],
    },
    {
      resources: ['configurationProfile'],
      access: ['READ', 'UPDATE'],
    },
  ];

  // Operator edits UI: Inventory becomes FULL (all permissions true)
  const editedPermissions = [
    { resource: 'Inventory', read: true, create: true, update: true, delete: true },
    { resource: 'Entity', read: false, create: false, update: false, delete: false },
    { resource: 'Venue', read: false, create: false, update: false, delete: false },
    { resource: 'Configuration', read: false, create: false, update: false, delete: false },
    { resource: 'Operator', read: false, create: false, update: false, delete: false },
    { resource: 'Subscriber', read: false, create: false, update: false, delete: false },
    { resource: 'Contact', read: false, create: false, update: false, delete: false },
    { resource: 'Location', read: false, create: false, update: false, delete: false },
  ];

  const merged = mergePolicyEntries(originalEntries, editedPermissions);

  // 1. configurationProfile MUST be preserved with its original access ['READ', 'UPDATE']
  const configProfileEntry = merged.find((e) =>
    e.resources.includes('configurationProfile')
  );
  assert.ok(configProfileEntry, 'configurationProfile entry must NOT be deleted');
  assert.deepStrictEqual(configProfileEntry.access, ['READ', 'UPDATE']);

  // 2. inventory MUST be updated to FULL
  const inventoryEntry = merged.find((e) => e.resources.includes('inventory'));
  assert.ok(inventoryEntry, 'inventory entry must be present');
  assert.deepStrictEqual(inventoryEntry.access, ['FULL']);

  // 3. Exactly 2 entries exist in the merged payload
  assert.strictEqual(merged.length, 2);
});

test('Preserves mixed entries where one resource is managed and another is unmanaged', () => {
  const originalEntries = [
    {
      resources: ['inventory', 'customSensorDevice'],
      access: ['READ'],
    },
  ];

  const editedPermissions = [
    { resource: 'Inventory', read: true, create: true, update: true, delete: false },
    { resource: 'Entity', read: false, create: false, update: false, delete: false },
  ];

  const merged = mergePolicyEntries(originalEntries, editedPermissions);

  // customSensorDevice was preserved
  const customSensorEntry = merged.find((e) => e.resources.includes('customSensorDevice'));
  assert.ok(customSensorEntry, 'customSensorDevice must be preserved');
  assert.deepStrictEqual(customSensorEntry.access, ['READ']);

  // inventory was updated
  const inventoryEntry = merged.find((e) => e.resources.includes('inventory'));
  assert.ok(inventoryEntry, 'inventory must be updated');
  assert.deepStrictEqual(inventoryEntry.access.sort(), ['CREATE', 'READ', 'UPDATE'].sort());
});

test('Preserves user-scoped entries with custom metadata', () => {
  const originalEntries = [
    {
      resources: ['venue'],
      access: ['READ'],
      users: ['usr-123', 'usr-456'],
      policy: 'strict-venue-policy',
    },
  ];

  const editedPermissions = [
    { resource: 'Venue', read: true, create: true, update: true, delete: true },
  ];

  const merged = mergePolicyEntries(originalEntries, editedPermissions);

  // User-scoped entry is kept intact
  const scopedEntry = merged.find((e) => e.users && e.users.length > 0);
  assert.ok(scopedEntry, 'User-scoped entry must be preserved');
  assert.deepStrictEqual(scopedEntry.users, ['usr-123', 'usr-456']);
  assert.strictEqual(scopedEntry.policy, 'strict-venue-policy');

  // Role-level Venue entry is added from UI
  const roleVenueEntry = merged.find((e) => !e.users && e.resources.includes('venue'));
  assert.ok(roleVenueEntry, 'Role-level venue entry must be added');
  assert.deepStrictEqual(roleVenueEntry.access, ['FULL']);
});
