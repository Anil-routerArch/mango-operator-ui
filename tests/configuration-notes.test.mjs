import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('ModularConfigModal does not pre-fill existing notes into edit input state', () => {
  const modalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ModularConfigModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  // Verify that note state is NOT pre-filled from initialConfig.notes[0]
  assert.ok(
    !content.includes('initialConfig?.notes?.[0]?.note'),
    'ModularConfigModal must not prefill note state using initialConfig.notes[0]'
  );

  // Verify newNote starts empty
  assert.ok(
    content.includes("const [newNote, setNewNote] = useState<string>('');"),
    "ModularConfigModal must initialize newNote with empty string ''"
  );
});

test('ModularConfigModal payload only sends new notes and leaves notes undefined when unmodified', () => {
  const modalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ModularConfigModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  // Verify notes payload sends new note or undefined to avoid overwriting or duplicating notes in OWPROV
  assert.ok(
    content.includes('notes: newNote.trim() ? [{ note: newNote.trim() }] : undefined,'),
    'ModularConfigModal must send newNote.trim() ? [{ note: newNote.trim() }] : undefined in payload'
  );
});

test('ModularConfigModal local state preserves existing note history and appends new note', () => {
  const modalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ModularConfigModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  // Verify local saved state appends to initialConfig.notes instead of overwriting with only the first note
  assert.ok(
    content.includes('...(initialConfig?.notes || [])'),
    'Saved state must spread and preserve existing note history'
  );
  assert.ok(
    content.includes(': initialConfig?.notes || []'),
    'Saved state must fall back to existing notes when no new note is typed'
  );
});

test('ModularConfigModal renders note history table with Date, Author, and Note', () => {
  const modalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ModularConfigModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  // Verify UI displays note history
  assert.ok(
    content.includes('Note History'),
    'ModularConfigModal must render a Note History section'
  );
  assert.ok(
    content.includes('Table.ColumnHeader') && content.includes('AUTHOR'),
    'ModularConfigModal must display Table ColumnHeader for AUTHOR'
  );
  assert.ok(
    content.includes('n.author || (n as any).createdBy'),
    'ModularConfigModal must handle both author and createdBy fields'
  );
});

test('NoteItem interface supports createdBy and author', () => {
  const typesPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'types',
    'configuration.ts'
  );
  const content = fs.readFileSync(typesPath, 'utf-8');

  assert.ok(
    content.includes('createdBy?: string;'),
    'NoteItem must support optional createdBy property'
  );
  assert.ok(
    content.includes('author?: string;'),
    'NoteItem must support optional author property'
  );
});

test('Device inventory property tabs do not resubmit existing notes to prevent duplicate note history (Issue #3)', () => {
  const tabsDir = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab'
  );

  const mainConfigContent = fs.readFileSync(path.join(tabsDir, 'MainConfigSubTab.tsx'), 'utf-8');
  const stateContent = fs.readFileSync(path.join(tabsDir, 'StateSubTab.tsx'), 'utf-8');
  const deviceSpecificContent = fs.readFileSync(path.join(tabsDir, 'DeviceSpecificConfigSubTab.tsx'), 'utf-8');
  const notesContent = fs.readFileSync(path.join(tabsDir, 'NotesSubTab.tsx'), 'utf-8');

  // 1. MainConfigSubTab must not resubmit notes in its update payload
  assert.strictEqual(
    mainConfigContent.includes('notes:'),
    false,
    'MainConfigSubTab must omit notes field from inventory-update payload'
  );

  // 2. StateSubTab must not resubmit notes in its update payload
  assert.strictEqual(
    stateContent.includes('notes:'),
    false,
    'StateSubTab must omit notes field from inventory-update payload'
  );

  // 3. DeviceSpecificConfigSubTab must not resubmit notes in its update payload
  assert.strictEqual(
    deviceSpecificContent.includes('notes:'),
    false,
    'DeviceSpecificConfigSubTab must omit notes field from inventory-update payload'
  );

  // 4. NotesSubTab must submit only the new note
  assert.ok(
    notesContent.includes('notes: [{ note: newNote.trim() }]'),
    'NotesSubTab must submit only the new note'
  );

  // 5. NotesSubTab must refresh authoritative notes from OWPROV response
  assert.ok(
    notesContent.includes('res?.notes') || notesContent.includes('authoritativeNotes'),
    'NotesSubTab must refresh notes using authoritative OWPROV response'
  );
});

test('Simulation: changing device properties does not duplicate notes; adding a note appends without duplicates (Issue #3)', () => {
  // Simulates OWPROV MergeNotes behavior:
  // void MergeNotes(const Types::NoteInfoVec &From, Types::NoteInfoVec &To) {
  //   for (const auto &note : From) To.push_back(note);
  // }
  const owprovInventoryRecord = {
    serialNumber: 'sim-device-001',
    name: 'Main Router',
    description: 'Core gateway',
    state: 'active',
    notes: [
      { note: 'Deployed to rack 4', created: 1670000000, author: 'installer' },
      { note: 'Firmware upgraded to v2.1', created: 1680000000, author: 'admin' },
    ],
  };

  const simulateOwprovUpdate = (payload) => {
    // OWPROV UpdateObjectInfo: only calls MergeNotes if payload contains notes
    if (Array.isArray(payload.notes)) {
      for (const incomingNote of payload.notes) {
        owprovInventoryRecord.notes.push({
          note: incomingNote.note,
          created: Date.now(),
          author: 'current-user',
        });
      }
    }
    if (payload.name !== undefined) owprovInventoryRecord.name = payload.name;
    if (payload.state !== undefined) owprovInventoryRecord.state = payload.state;
    return JSON.parse(JSON.stringify(owprovInventoryRecord));
  };

  // 1. Updating device properties from MainConfig (name change) must not alter notes
  simulateOwprovUpdate({ name: 'Renamed Router' });
  assert.strictEqual(
    owprovInventoryRecord.notes.length,
    2,
    'Updating device name without notes field must not duplicate existing notes'
  );
  assert.strictEqual(owprovInventoryRecord.notes[0].note, 'Deployed to rack 4');
  assert.strictEqual(owprovInventoryRecord.notes[1].note, 'Firmware upgraded to v2.1');

  // 2. Updating state from StateSubTab must not alter notes
  simulateOwprovUpdate({ state: 'maintenance' });
  assert.strictEqual(
    owprovInventoryRecord.notes.length,
    2,
    'Updating device state without notes field must not duplicate existing notes'
  );

  // 3. Adding a new note sends only [{ note: "..." }]
  const res = simulateOwprovUpdate({ notes: [{ note: 'Replaced power supply unit' }] });
  assert.strictEqual(
    owprovInventoryRecord.notes.length,
    3,
    'Adding note must append exactly one new note to existing history'
  );
  assert.strictEqual(res.notes.length, 3);
  assert.strictEqual(res.notes[2].note, 'Replaced power supply unit');
  assert.strictEqual(res.notes[2].author, 'current-user');
});

test('Field-scoped inventory updates: subtabs submit only managed fields and omit unrelated properties (Issue #4)', () => {
  const tabsDir = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab'
  );

  const mainConfigContent = fs.readFileSync(path.join(tabsDir, 'MainConfigSubTab.tsx'), 'utf-8');
  const stateContent = fs.readFileSync(path.join(tabsDir, 'StateSubTab.tsx'), 'utf-8');
  const deviceSpecificContent = fs.readFileSync(path.join(tabsDir, 'DeviceSpecificConfigSubTab.tsx'), 'utf-8');
  const notesContent = fs.readFileSync(path.join(tabsDir, 'NotesSubTab.tsx'), 'utf-8');

  // 1. StateSubTab must only submit name, devClass, and state
  assert.ok(stateContent.includes('state: stateValue'), 'StateSubTab must submit state');
  assert.ok(stateContent.includes('devClass: authoritativeDevClass'), 'StateSubTab must submit authoritative devClass');
  assert.strictEqual(stateContent.includes('deviceConfiguration:'), false, 'StateSubTab must omit deviceConfiguration');
  assert.strictEqual(stateContent.includes('deviceRules:'), false, 'StateSubTab must omit deviceRules');
  assert.strictEqual(stateContent.includes('subscriber:'), false, 'StateSubTab must omit subscriber');
  assert.strictEqual(stateContent.includes('entity:'), false, 'StateSubTab must omit entity');
  assert.strictEqual(stateContent.includes('venue:'), false, 'StateSubTab must omit venue');
  assert.strictEqual(stateContent.includes('deviceType:'), false, 'StateSubTab must omit deviceType');
  assert.strictEqual(stateContent.includes('deviceGroup:'), false, 'StateSubTab must omit deviceGroup');
  assert.strictEqual(stateContent.includes('doNotAllowOverrides:'), false, 'StateSubTab must omit doNotAllowOverrides');

  // 2. DeviceSpecificConfigSubTab inventory update payloads must only submit name, devClass, deviceConfiguration, and deviceRules
  const mutateAsyncBlocks = deviceSpecificContent
    .split('updateMutation.mutateAsync')
    .slice(1)
    .map((chunk) => chunk.slice(0, chunk.indexOf('});')));
  assert.ok(mutateAsyncBlocks.length >= 2, 'DeviceSpecificConfigSubTab must have updateMutation calls for reset and save');
  for (const block of mutateAsyncBlocks) {
    assert.strictEqual(block.includes('subscriber:'), false, 'DeviceSpecificConfigSubTab payload must omit subscriber');
    assert.strictEqual(block.includes('state:'), false, 'DeviceSpecificConfigSubTab payload must omit state');
    assert.strictEqual(block.includes('doNotAllowOverrides:'), false, 'DeviceSpecificConfigSubTab payload must omit doNotAllowOverrides');
    assert.strictEqual(block.includes('entity:'), false, 'DeviceSpecificConfigSubTab payload must omit entity');
    assert.strictEqual(block.includes('venue:'), false, 'DeviceSpecificConfigSubTab payload must omit venue');
    assert.strictEqual(block.includes('deviceType:'), false, 'DeviceSpecificConfigSubTab payload must omit deviceType');
    assert.strictEqual(block.includes('deviceGroup:'), false, 'DeviceSpecificConfigSubTab payload must omit deviceGroup');
    assert.strictEqual(block.includes('description:'), false, 'DeviceSpecificConfigSubTab payload must omit description');
  }

  // 3. MainConfigSubTab must omit deviceConfiguration, subscriber, state, and notes
  assert.strictEqual(mainConfigContent.includes('deviceConfiguration:'), false, 'MainConfigSubTab must omit deviceConfiguration');
  assert.strictEqual(mainConfigContent.includes('subscriber:'), false, 'MainConfigSubTab must omit subscriber');
  assert.strictEqual(mainConfigContent.includes('state:'), false, 'MainConfigSubTab must omit state');
  assert.strictEqual(mainConfigContent.includes('notes:'), false, 'MainConfigSubTab must omit notes');

  // 4. NotesSubTab must only submit name, devClass, and notes
  assert.ok(notesContent.includes('notes: [{ note: newNote.trim() }]'), 'NotesSubTab must submit notes');
  assert.strictEqual(notesContent.includes('deviceConfiguration:'), false, 'NotesSubTab must omit deviceConfiguration');
  assert.strictEqual(notesContent.includes('subscriber:'), false, 'NotesSubTab must omit subscriber');
  assert.strictEqual(notesContent.includes('state:'), false, 'NotesSubTab must omit state');
  assert.strictEqual(notesContent.includes('deviceRules:'), false, 'NotesSubTab must omit deviceRules');

  // 5. Tabs must not fabricate 'venue' or hardware SKU 'asus_rt-ax53u'
  assert.strictEqual(stateContent.includes("|| 'venue'"), false, 'StateSubTab must not fabricate venue devClass');
  assert.strictEqual(deviceSpecificContent.includes("|| 'venue'"), false, 'DeviceSpecificConfigSubTab must not fabricate venue devClass');
  assert.strictEqual(notesContent.includes("|| 'venue'"), false, 'NotesSubTab must not fabricate venue devClass');
});

test('Simulation: field-scoped saving prevents overwriting unrelated inventory properties in OWPROV (Issue #4)', () => {
  // Models OWPROV inventory PUT endpoint:
  // - Preserves omitted fields (CreateMove, AssignIfPresent, RawObject->has checks)
  // - Only modifies fields explicitly present in payload
  const initialDeviceRecord = {
    serialNumber: 'sim-switch-001',
    name: 'Aggregation Switch',
    description: 'Floor 2 Core',
    devClass: 'entity',
    deviceType: 'edgecore_ecs4100_52p',
    deviceGroup: 'switch',
    entity: 'entity-uuid-abc',
    venue: '',
    subscriber: 'sub-uuid-xyz',
    deviceConfiguration: 'shared-config-uuid-1',
    deviceRules: {
      firmwareUpgrade: 'yes',
      rcOnly: 'yes',
      rrm: 'off',
    },
    doNotAllowOverrides: true,
    state: 'active',
    notes: [{ note: 'Installed by network team', created: 1670000000, author: 'admin' }],
  };

  let dbRecord = JSON.parse(JSON.stringify(initialDeviceRecord));

  const simulateOwprovPut = (payload) => {
    // OWPROV validation: devClass is unconditionally validated
    assert.ok(payload.devClass, 'OWPROV requires valid devClass');

    // CreateMove behavior for associations:
    // If field is in payload, it sets the value (even if empty string "")
    // If field is NOT in payload, existing value is preserved!
    if ('deviceConfiguration' in payload) dbRecord.deviceConfiguration = payload.deviceConfiguration;
    if ('entity' in payload) dbRecord.entity = payload.entity;
    if ('venue' in payload) dbRecord.venue = payload.venue;
    if ('subscriber' in payload) dbRecord.subscriber = payload.subscriber;

    // Has guards:
    if ('state' in payload) dbRecord.state = payload.state;
    if ('deviceRules' in payload) dbRecord.deviceRules = payload.deviceRules;
    if ('doNotAllowOverrides' in payload) dbRecord.doNotAllowOverrides = payload.doNotAllowOverrides;
    if ('deviceType' in payload) dbRecord.deviceType = payload.deviceType;
    if ('deviceGroup' in payload) dbRecord.deviceGroup = payload.deviceGroup;
    if ('description' in payload) dbRecord.description = payload.description;
    if ('name' in payload) dbRecord.name = payload.name;
    if ('devClass' in payload && payload.devClass !== dbRecord.devClass) dbRecord.devClass = payload.devClass;

    return JSON.parse(JSON.stringify(dbRecord));
  };

  // Step 1: StateSubTab updates state only
  simulateOwprovPut({
    name: dbRecord.name,
    devClass: dbRecord.devClass,
    state: 'maintenance',
  });
  assert.strictEqual(dbRecord.state, 'maintenance', 'State should be updated to maintenance');
  assert.strictEqual(dbRecord.deviceConfiguration, 'shared-config-uuid-1', 'State update must not unlink deviceConfiguration');
  assert.strictEqual(dbRecord.entity, 'entity-uuid-abc', 'State update must not unlink parent entity');
  assert.strictEqual(dbRecord.subscriber, 'sub-uuid-xyz', 'State update must not unlink subscriber');
  assert.strictEqual(dbRecord.deviceType, 'edgecore_ecs4100_52p', 'State update must not overwrite deviceType with default SKU');
  assert.strictEqual(dbRecord.devClass, 'entity', 'State update must not overwrite devClass with venue');
  assert.strictEqual(dbRecord.deviceRules.firmwareUpgrade, 'yes', 'State update must not reset deviceRules');

  // Step 2: DeviceSpecificConfigSubTab attaches new COW configuration and rules
  simulateOwprovPut({
    name: dbRecord.name,
    devClass: dbRecord.devClass,
    deviceConfiguration: 'cow-config-uuid-2',
    deviceRules: {
      firmwareUpgrade: 'no',
      rcOnly: 'no',
      rrm: 'inherit',
    },
  });
  assert.strictEqual(dbRecord.deviceConfiguration, 'cow-config-uuid-2', 'Configuration should be updated to COW ID');
  assert.strictEqual(dbRecord.entity, 'entity-uuid-abc', 'Config save must not unlink parent entity');
  assert.strictEqual(dbRecord.subscriber, 'sub-uuid-xyz', 'Config save must not unlink subscriber');
  assert.strictEqual(dbRecord.state, 'maintenance', 'Config save must not revert state');
  assert.strictEqual(dbRecord.deviceType, 'edgecore_ecs4100_52p', 'Config save must not overwrite deviceType');

  // Step 3: DeviceSpecificConfigSubTab resets configuration to inherited
  simulateOwprovPut({
    name: dbRecord.name,
    devClass: dbRecord.devClass,
    deviceConfiguration: '',
    deviceRules: {
      firmwareUpgrade: 'no',
      rcOnly: 'no',
      rrm: 'inherit',
    },
  });
  assert.strictEqual(dbRecord.deviceConfiguration, '', 'Configuration should be detached');
  assert.strictEqual(dbRecord.entity, 'entity-uuid-abc', 'Resetting config must not unlink entity');
  assert.strictEqual(dbRecord.subscriber, 'sub-uuid-xyz', 'Resetting config must not unlink subscriber');

  // Step 4: MainConfigSubTab updates metadata without touching config or state
  simulateOwprovPut({
    name: 'Updated Switch Name',
    description: 'Updated Floor 2 Core',
    deviceGroup: 'switch',
    devClass: 'entity',
    deviceRules: {
      firmwareUpgrade: 'no',
      rcOnly: 'no',
      rrm: 'inherit',
    },
    doNotAllowOverrides: true,
  });
  assert.strictEqual(dbRecord.name, 'Updated Switch Name');
  assert.strictEqual(dbRecord.description, 'Updated Floor 2 Core');
  assert.strictEqual(dbRecord.deviceConfiguration, '', 'MainConfig save must not re-attach or clobber configuration');
  assert.strictEqual(dbRecord.subscriber, 'sub-uuid-xyz', 'MainConfig save must not unlink subscriber');
  assert.strictEqual(dbRecord.state, 'maintenance', 'MainConfig save must not overwrite state');
});

test('Concurrency protection for deviceRules across configuration subtabs (Issue F3)', () => {
  const tabsDir = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab'
  );

  const mainConfigContent = fs.readFileSync(path.join(tabsDir, 'MainConfigSubTab.tsx'), 'utf-8');
  const deviceSpecificContent = fs.readFileSync(path.join(tabsDir, 'DeviceSpecificConfigSubTab.tsx'), 'utf-8');

  // 1. MainConfigSubTab dirty-checks rules and only attaches deviceRules when modified
  assert.ok(
    mainConfigContent.includes('const isRulesDirty ='),
    'MainConfigSubTab must check if rules are dirty'
  );
  assert.ok(
    mainConfigContent.includes('if (isRulesDirty) {'),
    'MainConfigSubTab must only attach deviceRules when dirty'
  );
  assert.ok(
    mainConfigContent.includes('...(authoritativeRules || {})'),
    'MainConfigSubTab must merge over authoritative rules to preserve unknown properties'
  );

  // 2. DeviceSpecificConfigSubTab dirty-checks rules on save and only attaches deviceRules when modified
  assert.ok(
    deviceSpecificContent.includes('const isRulesDirty ='),
    'DeviceSpecificConfigSubTab must check if rules are dirty'
  );
  assert.ok(
    deviceSpecificContent.includes('if (isRulesDirty) {'),
    'DeviceSpecificConfigSubTab must conditionally attach deviceRules'
  );
  assert.ok(
    deviceSpecificContent.includes('...(authoritativeRules || {})'),
    'DeviceSpecificConfigSubTab must merge over authoritative rules to preserve unknown properties'
  );
});

test('Simulation: concurrent editing preserves deviceRules when untouched by other subtab (Issue F3)', () => {
  // Authoritative OWPROV database record
  let dbRecord = {
    serialNumber: 'sim-ap-001',
    name: 'Boardroom AP',
    devClass: 'entity',
    deviceConfiguration: 'shared-config-1',
    deviceRules: {
      firmwareUpgrade: 'no',
      rcOnly: 'no',
      rrm: 'inherit',
      customVendorRule: 'preserve-me', // Unmanaged rule property
    },
  };

  const simulateOwprovPut = (payload) => {
    if ('deviceConfiguration' in payload) dbRecord.deviceConfiguration = payload.deviceConfiguration;
    if ('deviceRules' in payload) dbRecord.deviceRules = payload.deviceRules;
    if ('name' in payload) dbRecord.name = payload.name;
    return JSON.parse(JSON.stringify(dbRecord));
  };

  // User A (MainConfigSubTab) and User B (DeviceSpecificConfigSubTab) load device state at the same time
  const snapshotForUserA = JSON.parse(JSON.stringify(dbRecord));
  const snapshotForUserB = JSON.parse(JSON.stringify(dbRecord));

  // User A in MainConfigSubTab modifies firmwareUpgrade: 'yes'
  const userARulesModified = true;
  const userAPayload = {
    name: snapshotForUserA.name,
    devClass: snapshotForUserA.devClass,
  };
  if (userARulesModified) {
    userAPayload.deviceRules = {
      ...(snapshotForUserA.deviceRules || {}),
      firmwareUpgrade: 'yes',
      rcOnly: 'no',
      rrm: 'inherit',
    };
  }
  simulateOwprovPut(userAPayload);

  assert.strictEqual(dbRecord.deviceRules.firmwareUpgrade, 'yes', 'User A change should be applied in DB');
  assert.strictEqual(dbRecord.deviceRules.customVendorRule, 'preserve-me', 'Custom rule should be preserved');

  // User B in DeviceSpecificConfigSubTab only edits a device-specific configuration (e.g. WiFi channel)
  // and does NOT touch deviceRules.
  const userBRulesModified = false; // untouched
  const userBPayload = {
    name: snapshotForUserB.name,
    devClass: snapshotForUserB.devClass,
    deviceConfiguration: 'cow-config-2',
  };
  if (userBRulesModified) {
    userBPayload.deviceRules = {
      ...(snapshotForUserB.deviceRules || {}),
      firmwareUpgrade: 'no',
      rcOnly: 'no',
      rrm: 'inherit',
    };
  }
  simulateOwprovPut(userBPayload);

  // Verification:
  // User B's save attached the new config, but because deviceRules was omitted,
  // User A's firmwareUpgrade: 'yes' was NOT clobbered!
  assert.strictEqual(dbRecord.deviceConfiguration, 'cow-config-2', 'User B config should be saved');
  assert.strictEqual(
    dbRecord.deviceRules.firmwareUpgrade,
    'yes',
    'User A deviceRules change must NOT be overwritten by User B save'
  );
  assert.strictEqual(
    dbRecord.deviceRules.customVendorRule,
    'preserve-me',
    'Custom rule must remain intact'
  );
});



