import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const policySource = fs.readFileSync(new URL('../src/pages/Users/PoliciesTab.tsx', import.meta.url), 'utf8');
const production = {};
const compiled = ts.transpileModule(policySource.slice(policySource.indexOf('export const RESOURCES ='), policySource.indexOf('const mapApiPolicyToItem =')), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
}).outputText;
new Function('exports', compiled)(production);
const { DEVICE_COMMAND_ACTIONS, toggleDeviceCommandAction, parseDeviceCommandActions } = production;

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
  'devicecommand',
]);

const ALL_POLICY_RESOURCES = [
  'Entity',
  'Venue',
  'Configuration',
  'Inventory',
  'Operator',
  'Subscriber',
  'Contact',
  'Location',
];



const UI_LABEL_TO_RESOURCE_KEY = {
  Entity: 'entity',
  Venue: 'venue',
  Configuration: 'configuration',
  Inventory: 'inventory',
  Operator: 'operator',
  Subscriber: 'subscriber',
  Contact: 'contact',
  Location: 'location',
  'Device Commands': 'deviceCommand',
};

const RESOURCE_LABEL_MAP = {
  entity: 'Entity',
  property: 'Entity',
  venue: 'Venue',
  inventory: 'Inventory',
  device: 'Inventory',
  configuration: 'Configuration',
  operator: 'Operator',
  subscriber: 'Subscriber',
  contact: 'Contact',
  location: 'Location',
  devicecommand: 'Device Commands',
};

const normalizeResourceName = (raw) => {
  const lower = raw.trim().toLowerCase();
  if (RESOURCE_LABEL_MAP[lower]) {
    return RESOURCE_LABEL_MAP[lower];
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const parseEntriesToPermissions = (entries = []) => {
  const permMap = new Map();

  for (const res of ALL_POLICY_RESOURCES) {
    permMap.set(res, {
      resource: res,
      read: false,
      create: false,
      update: false,
      delete: false,
    });
  }

  if (entries && Array.isArray(entries)) {
    for (const entry of entries) {
      if (!entry) continue;

      // Only global, unscoped entries are represented in the UI matrix.
      // Entries scoped to specific users or sub-policies must not populate
      // the matrix to prevent promoting scoped permissions to global policy permissions.
      const hasCustomScoping = Boolean(
        entry.users?.length || entry.policy
      );
      if (hasCustomScoping) {
        continue;
      }

      const accessList = (entry.access || []).map((a) => a.toUpperCase());
      const isFull = accessList.includes('FULL') || accessList.includes('*');
      const canRead = isFull || accessList.includes('READ');
      const canCreate = isFull || accessList.includes('CREATE');
      const canUpdate = isFull || accessList.includes('UPDATE');
      const canDelete = isFull || accessList.includes('DELETE');

      for (const rawRes of entry.resources || []) {
        const resName = normalizeResourceName(rawRes);
        if (!permMap.has(resName)) {
          continue;
        }

        const existing = permMap.get(resName);
        permMap.set(resName, {
          resource: resName,
          read: existing.read || canRead,
          create: existing.create || canCreate,
          update: existing.update || canUpdate,
          delete: existing.delete || canDelete,
        });
      }
    }
  }

  return ALL_POLICY_RESOURCES.map((res) => permMap.get(res));
};

// Mirror mergePolicyEntries from PoliciesTab.tsx
const mergePolicyEntries = (originalEntries = [], editedPermissions, editedDeviceCommandActions = []) => {
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

  if (editedDeviceCommandActions && editedDeviceCommandActions.length > 0) {
    const cleanActions = editedDeviceCommandActions.includes('FULL')
      ? ['FULL']
      : Array.from(new Set(editedDeviceCommandActions));

    const fullEntry = managedEntries.find(
      (e) => e.access.length === 1 && e.access[0] === 'FULL' && cleanActions.length === 1 && cleanActions[0] === 'FULL'
    );
    if (fullEntry) {
      if (!fullEntry.resources.includes('deviceCommand')) {
        fullEntry.resources.push('deviceCommand');
      }
    } else {
      managedEntries.push({
        resources: ['deviceCommand'],
        access: cleanActions,
      });
    }
  }

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

test('parseEntriesToPermissions ignores user-scoped and custom-scoped entries', () => {
  const entries = [
    {
      resources: ['venue'],
      access: ['READ'],
      users: ['usr-123'],
    },
    {
      resources: ['contact'],
      access: ['READ', 'UPDATE'],
      policy: 'sub-policy-456',
    },
    {
      resources: ['inventory'],
      access: ['READ'],
    },
  ];

  const permissions = parseEntriesToPermissions(entries);

  // User-scoped Venue and policy-scoped Contact must NOT populate UI matrix
  const venuePerm = permissions.find((p) => p.resource === 'Venue');
  assert.ok(venuePerm);
  assert.strictEqual(venuePerm.read, false);
  assert.strictEqual(venuePerm.create, false);
  assert.strictEqual(venuePerm.update, false);
  assert.strictEqual(venuePerm.delete, false);

  const contactPerm = permissions.find((p) => p.resource === 'Contact');
  assert.ok(contactPerm);
  assert.strictEqual(contactPerm.read, false);
  assert.strictEqual(contactPerm.update, false);

  // Global unscoped Inventory MUST populate UI matrix
  const inventoryPerm = permissions.find((p) => p.resource === 'Inventory');
  assert.ok(inventoryPerm);
  assert.strictEqual(inventoryPerm.read, true);
  assert.strictEqual(inventoryPerm.create, false);
});

test('Preserves user-scoped entries and does not promote them to global role-level entries on save', () => {
  const originalEntries = [
    {
      resources: ['venue'],
      access: ['READ'],
      users: ['usr-123', 'usr-456'],
      policy: 'strict-venue-policy',
    },
    {
      resources: ['inventory'],
      access: ['READ'],
    },
  ];

  // 1. Matrix parses only global entries
  const parsedPermissions = parseEntriesToPermissions(originalEntries);
  const venuePerm = parsedPermissions.find((p) => p.resource === 'Venue');
  assert.strictEqual(venuePerm.read, false, 'User-scoped venue permission must not populate global matrix');

  // 2. User edits unrelated permission (Inventory READ -> FULL) in UI matrix
  const editedPermissions = parsedPermissions.map((p) =>
    p.resource === 'Inventory'
      ? { ...p, read: true, create: true, update: true, delete: true }
      : p
  );

  // 3. Merging back must preserve user-scoped entry WITHOUT creating a global unscoped venue entry
  const merged = mergePolicyEntries(originalEntries, editedPermissions);

  // User-scoped entry is kept intact
  const scopedEntry = merged.find((e) => e.users && e.users.length > 0);
  assert.ok(scopedEntry, 'User-scoped entry must be preserved');
  assert.deepStrictEqual(scopedEntry.users, ['usr-123', 'usr-456']);
  assert.strictEqual(scopedEntry.policy, 'strict-venue-policy');
  assert.deepStrictEqual(scopedEntry.resources, ['venue']);
  assert.deepStrictEqual(scopedEntry.access, ['READ']);

  // Role-level Venue entry must NOT be added (no privilege escalation!)
  const roleVenueEntry = merged.find((e) => !e.users && e.resources.includes('venue'));
  assert.strictEqual(roleVenueEntry, undefined, 'Role-level venue entry must NOT be created');

  // Inventory was updated to FULL
  const inventoryEntry = merged.find((e) => e.resources.includes('inventory'));
  assert.ok(inventoryEntry, 'Inventory entry must be present');
  assert.deepStrictEqual(inventoryEntry.access, ['FULL']);

  // Exactly 2 entries exist in the policy
  assert.strictEqual(merged.length, 2);
});

test('parseDeviceCommandActions does not grant commands from wildcard FULL', () => {
  const entries = [
    {
      resources: ['*'],
      access: ['FULL'],
    },
  ];

  const actions = parseDeviceCommandActions(entries);
  assert.deepStrictEqual(actions, []);
});

test('parseDeviceCommandActions omits device commands from wildcard (*) READ entry', () => {
  const entries = [
    {
      resources: ['*'],
      access: ['READ'],
    },
  ];

  const actions = parseDeviceCommandActions(entries);
  assert.deepStrictEqual(actions, [], 'Read-only wildcard policy must never grant deviceCommand actions');
});

test('parseDeviceCommandActions parses specific domain actions from deviceCommand resource', () => {
  const entries = [
    {
      resources: ['deviceCommand'],
      access: ['REBOOT', 'CONFIGURE', 'WIFI_SCAN'],
    },
  ];

  const actions = parseDeviceCommandActions(entries);
  assert.deepStrictEqual(actions.sort(), ['CONFIGURE', 'REBOOT', 'WIFI_SCAN'].sort());
});

test('toggleDeviceCommandAction requires explicit commands and never creates FULL', () => {
  assert.deepStrictEqual(toggleDeviceCommandAction([], 'FULL'), []);
  let selected = [];
  for (const action of DEVICE_COMMAND_ACTIONS) selected = toggleDeviceCommandAction(selected, action);
  assert.deepStrictEqual(selected, DEVICE_COMMAND_ACTIONS);
  assert.deepStrictEqual(toggleDeviceCommandAction(selected, 'REBOOT'), DEVICE_COMMAND_ACTIONS.filter((action) => action !== 'REBOOT'));
});

test('mergePolicyEntries accurately updates deviceCommand and preserves unmanaged entries', () => {
  const originalEntries = [
    {
      resources: ['customMetricTelemetry'],
      access: ['READ'],
    },
  ];

  const editedPermissions = [
    { resource: 'Inventory', read: true, create: false, update: false, delete: false },
  ];

  const editedDeviceCommands = ['REBOOT', 'CONFIGURE'];

  const merged = mergePolicyEntries(originalEntries, editedPermissions, editedDeviceCommands);

  // 1. customMetricTelemetry preserved
  const custom = merged.find((e) => e.resources.includes('customMetricTelemetry'));
  assert.ok(custom);
  assert.deepStrictEqual(custom.access, ['READ']);

  // 2. Inventory READ
  const inv = merged.find((e) => e.resources.includes('inventory'));
  assert.ok(inv);
  assert.deepStrictEqual(inv.access, ['READ']);

  // 3. deviceCommand REBOOT, CONFIGURE
  const devCmd = merged.find((e) => e.resources.includes('deviceCommand'));
  assert.ok(devCmd);
  assert.deepStrictEqual(devCmd.access.sort(), ['CONFIGURE', 'REBOOT'].sort());
});
