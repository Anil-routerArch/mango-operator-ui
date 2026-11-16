import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/pages/Users/PoliciesTab.tsx', import.meta.url), 'utf8');
const compile = (text) => ts.transpileModule(text, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2023 },
}).outputText;
// Exercise production helpers rather than a separate implementation of permission rules.
const api = {};
new Function('exports', compile(source.slice(source.indexOf('export const RESOURCES ='), source.indexOf('const mapApiPolicyToItem ='))))(api);
const { RESOURCES, ACTIONS, DEVICE_COMMAND_ACTIONS, parseEntriesToPermissions, mergePolicyEntries, toggleActionForResource } = api;

test('standard permissions use UPDATE without MODIFY alias conversion', () => {
  assert.ok(ACTIONS.includes('UPDATE'));
  assert.ok(!ACTIONS.includes('MODIFY'));
  const permissions = parseEntriesToPermissions([{ resources: ['configuration', 'inventory'], access: ['READ', 'UPDATE'] }]);
  const entries = mergePolicyEntries([], permissions);
  assert.deepEqual(entries, [{ resources: ['configuration', 'inventory'], access: ['READ', 'UPDATE'] }]);
  const unsupported = parseEntriesToPermissions([{ resources: ['inventory'], access: ['MODIFY'] }]);
  assert.deepEqual(unsupported.find((p) => p.resource === 'inventory').actions, []);
});

test('all device commands stay explicit when selected, parsed, and saved', () => {
  assert.ok(!DEVICE_COMMAND_ACTIONS.includes('FULL'));
  let selected = [];
  for (const action of DEVICE_COMMAND_ACTIONS) selected = toggleActionForResource('deviceCommand', action, selected);
  assert.deepEqual(selected, DEVICE_COMMAND_ACTIONS);
  assert.deepEqual(toggleActionForResource('deviceCommand', 'FULL', selected), selected);
  const original = [{ resources: ['deviceCommand'], access: selected }];
  const permissions = parseEntriesToPermissions(original);
  assert.deepEqual(permissions.find((p) => p.resource === 'deviceCommand').actions, selected);
  assert.deepEqual(mergePolicyEntries([], permissions, selected), [{ resources: ['deviceCommand'], access: [...selected].sort() }]);
});

test('FULL never supplies device-command permissions through entries or save overrides', () => {
  const permissions = parseEntriesToPermissions([{ resources: ['*'], access: ['FULL'] }]);
  assert.deepEqual(permissions.find((p) => p.resource === 'deviceCommand').actions, []);
  assert.ok(mergePolicyEntries([], permissions, ['FULL']).every((e) => !e.resources.includes('deviceCommand')));
  assert.deepEqual(mergePolicyEntries([], [], ['FULL']), []);
});

const formSource = compile(source.slice(source.indexOf('  // New policy modal state'), source.indexOf('  // Filtered policies list')));
const createForm = () => {
  const states = [];
  const useState = (initial) => {
    const index = states.length;
    const value = typeof initial === 'function' ? initial() : initial;
    states.push(value);
    return [value, (next) => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
  };
  const handlers = new Function('useState', 'RESOURCES', 'RESOURCE_DISPLAY_MAP', 'onCloseCreatePolicy', 'toggleActionForResource',
    formSource + '\nreturn {handleApplyPreset, handleCloseCreateModal};')(
    useState, RESOURCES, api.RESOURCE_DISPLAY_MAP, undefined, toggleActionForResource);
  return { states, ...handlers };
};

test('new policy and reset leave every resource unselected', () => {
  const form = createForm();
  const assertBlank = () => {
    assert.ok(form.states[3].every((p) => p.actions.length === 0 && !p.read && !p.create && !p.update && !p.delete));
    assert.deepEqual(form.states[4], []);
  };
  assertBlank();
  form.handleApplyPreset('full');
  form.handleCloseCreateModal();
  assertBlank();
});

test('explicit full/read presets exclude device commands from form state and creation payload', async () => {
  for (const preset of ['full', 'read']) {
    const form = createForm();
    form.handleApplyPreset(preset);
    assert.deepEqual(form.states[3].find((p) => p.resource === 'deviceCommand').actions, []);
    assert.deepEqual(form.states[4], []);
    let payload;
    const createSource = compile(source.slice(source.indexOf('  const handleCreatePolicy ='), source.indexOf('  const handleDeletePolicy =')));
    const create = new Function('isRoot', 'newPolicyName', 'newPolicyDesc', 'newPolicyPreset', 'RESOURCES', 'createPolicyMutation', 'toaster', 'handleCloseCreateModal',
      createSource + '\nreturn handleCreatePolicy;')(
      true, 'Policy', '', preset, RESOURCES, { mutateAsync: async (value) => { payload = value; return {}; } }, { success() {}, error(e) { throw new Error(JSON.stringify(e)); } }, () => {});
    await create();
    assert.deepEqual(payload.entries, [{ resources: RESOURCES.filter((r) => r !== 'deviceCommand'), access: [preset === 'full' ? 'FULL' : 'READ'] }]);
  }
});
