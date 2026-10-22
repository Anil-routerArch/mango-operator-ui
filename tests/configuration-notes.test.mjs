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

