import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('SubsectionKey and ConfigurationSectionsState in types.ts include nat and ethernet', () => {
  const typesPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'types.ts'
  );
  const content = fs.readFileSync(typesPath, 'utf-8');

  // Verify SubsectionKey has all 9 keys
  const expectedKeys = [
    'globals',
    'unit',
    'metrics',
    'services',
    'radios',
    'interfaces',
    'third-party',
    'nat',
    'ethernet',
  ];

  for (const key of expectedKeys) {
    assert.ok(
      content.includes(`'${key}'`),
      `SubsectionKey must include '${key}'`
    );
  }

  // Verify ConfigurationSectionsState includes nat and ethernet
  assert.ok(
    content.includes('nat: NatSectionData;'),
    'ConfigurationSectionsState must include nat: NatSectionData;'
  );
  assert.ok(
    content.includes('ethernet: EthernetSectionData;'),
    'ConfigurationSectionsState must include ethernet: EthernetSectionData;'
  );

  // Verify deep NAT interfaces
  assert.ok(content.includes('export interface SnatRule'), 'types.ts must define SnatRule');
  assert.ok(content.includes('export interface DnatRule'), 'types.ts must define DnatRule');
  assert.ok(content.includes('export interface NatSectionData'), 'types.ts must define NatSectionData');
  assert.ok(content.includes('out-interface'), 'SnatRule must define out-interface');
  assert.ok(content.includes('in-interface'), 'DnatRule must define in-interface');

  // Verify deep Ethernet interfaces
  assert.ok(content.includes('export interface EthernetPortEntry'), 'types.ts must define EthernetPortEntry');
  assert.ok(content.includes('export interface EthernetPoeConfig'), 'types.ts must define EthernetPoeConfig');
  assert.ok(content.includes('export interface EthernetBpduGuardConfig'), 'types.ts must define EthernetBpduGuardConfig');
  assert.ok(content.includes('export interface EthernetDhcpSnoopConfig'), 'types.ts must define EthernetDhcpSnoopConfig');
  assert.ok(content.includes('export interface EthernetStormControlConfig'), 'types.ts must define EthernetStormControlConfig');
  assert.ok(content.includes('export interface EthernetVoiceVlanConfig'), 'types.ts must define EthernetVoiceVlanConfig');
  assert.ok(content.includes('export interface LldpInterfaceConfig'), 'types.ts must define LldpInterfaceConfig');
});

test('AddSubsectionModal.tsx defines platform-aware getSubsectionsForPlatform', () => {
  const modalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'AddSubsectionModal.tsx'
  );
  const content = fs.readFileSync(modalPath, 'utf-8');

  assert.ok(
    content.includes("if (platform === 'olg')"),
    'AddSubsectionModal must have branch for olg platform'
  );
  assert.ok(
    content.includes("if (platform === 'switch')"),
    'AddSubsectionModal must have branch for switch platform'
  );
  assert.ok(
    content.includes("{ key: 'nat', label: 'Nat' }"),
    'OLG platform must include nat subsection'
  );
  assert.ok(
    content.includes("{ key: 'ethernet', label: 'Ethernet' }"),
    'Switch platform must include ethernet subsection'
  );
});

test('ConfigurationSectionsCard.tsx wires platform, NatSection, and EthernetSection', () => {
  const cardPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'ConfigurationSectionsCard.tsx'
  );
  const content = fs.readFileSync(cardPath, 'utf-8');

  assert.ok(
    content.includes("import { NatSection } from './NatSection/index';"),
    'ConfigurationSectionsCard must import NatSection'
  );
  assert.ok(
    content.includes("import { EthernetSection } from './EthernetSection/index';"),
    'ConfigurationSectionsCard must import EthernetSection'
  );
  assert.ok(
    content.includes("platform = 'ap'"),
    'ConfigurationSectionsCard must destructure platform with default'
  );
  assert.ok(
    content.includes("<NatSection"),
    'ConfigurationSectionsCard must render <NatSection'
  );
  assert.ok(
    content.includes("<EthernetSection"),
    'ConfigurationSectionsCard must render <EthernetSection'
  );
  assert.ok(
    content.includes("platform={platform}"),
    'ConfigurationSectionsCard must pass platform to AddSubsectionModal'
  );
  assert.ok(
    content.includes("nat: 'Nat'"),
    'ConfigurationSectionsCard labelMap must include nat'
  );
  assert.ok(
    content.includes("ethernet: 'Ethernet'"),
    'ConfigurationSectionsCard labelMap must include ethernet'
  );
});

test('utils.ts initializes, compiles, and parses nat and ethernet sections', () => {
  const utilsPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'utils.ts'
  );
  const content = fs.readFileSync(utilsPath, 'utf-8');

  // Initial State
  assert.ok(
    content.includes("nat: {"),
    'getInitialSectionsState must initialize nat'
  );
  assert.ok(
    content.includes("ethernet: {"),
    'getInitialSectionsState must initialize ethernet'
  );

  // Compilation
  assert.ok(
    content.includes("state.activeSections.includes('nat')"),
    'compileStateToUCentralJson must serialize nat section'
  );
  assert.ok(
    content.includes("doc.nat = natObj;"),
    'compileStateToUCentralJson must attach doc.nat'
  );
  assert.ok(
    content.includes("state.activeSections.includes('ethernet')"),
    'compileStateToUCentralJson must serialize ethernet section'
  );
  assert.ok(
    content.includes("doc.ethernet = ethernetArray;"),
    'compileStateToUCentralJson must attach doc.ethernet'
  );

  // Parsing
  assert.ok(
    content.includes("doc.nat && typeof doc.nat === 'object'"),
    'parseUCentralJsonToSectionsState must parse doc.nat'
  );
  assert.ok(
    content.includes("Array.isArray(doc.ethernet)"),
    'parseUCentralJsonToSectionsState must parse doc.ethernet'
  );
  assert.ok(
    content.includes("detectedSections.push('nat')"),
    'parseUCentralJsonToSectionsState must detect nat section'
  );
  assert.ok(
    content.includes("detectedSections.push('ethernet')"),
    'parseUCentralJsonToSectionsState must detect ethernet section'
  );

  // Modular Blocks
  assert.ok(
    content.includes("state.nat.meta"),
    'compileStateToModularConfigurationElements must handle nat meta'
  );
  assert.ok(
    content.includes("state.ethernet.meta"),
    'compileStateToModularConfigurationElements must handle ethernet meta'
  );
});

test('Device group dropdowns across modals offer ap, switch, and olg options', () => {
  // ModularConfigModal
  const modularPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ModularConfigModal.tsx'
  );
  const modularContent = fs.readFileSync(modularPath, 'utf-8');
  assert.ok(
    modularContent.includes("{ value: 'ap', label: 'AP' }") &&
    modularContent.includes("{ value: 'switch', label: 'Switch' }") &&
    modularContent.includes("{ value: 'olg', label: 'OLG' }"),
    'ModularConfigModal must support AP, Switch, and OLG'
  );

  // CreateProfileModal
  const profileModalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'CreateProfileModal.tsx'
  );
  const profileModalContent = fs.readFileSync(profileModalPath, 'utf-8');
  assert.ok(
    profileModalContent.includes("{ value: 'ap', label: 'ap' }") &&
    profileModalContent.includes("{ value: 'switch', label: 'switch' }") &&
    profileModalContent.includes("{ value: 'olg', label: 'olg' }"),
    'CreateProfileModal must support ap, switch, and olg'
  );

  // ProfileEditorPage
  const profileEditorPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'ProfileEditorPage.tsx'
  );
  const profileEditorContent = fs.readFileSync(profileEditorPath, 'utf-8');
  assert.ok(
    profileEditorContent.includes("{ value: 'ap'") &&
    profileEditorContent.includes("{ value: 'switch'") &&
    profileEditorContent.includes("{ value: 'olg'"),
    'ProfileEditorPage must support ap, switch, and olg'
  );
});
