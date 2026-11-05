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

