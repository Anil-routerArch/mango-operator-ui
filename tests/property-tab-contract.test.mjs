import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('properties.ts accepts only complete scoped Device inventory responses', () => {
  const propertiesApiPath = path.join(ROOT_DIR, 'src', 'api', 'properties.ts');
  const content = fs.readFileSync(propertiesApiPath, 'utf-8');

  assert.ok(
    content.includes('totalCount: number;') &&
      content.includes('pageIndex: number;') &&
      content.includes('totalPages: number;'),
    'ScopedDevicesResponse must require authoritative numeric pagination'
  );
  assert.ok(
    content.includes('requireCompleteScopedDevicesResponse'),
    'the scoped Device adapter must validate complete inventory responses'
  );
  assert.ok(
    content.includes("throw new Error('Complete scoped Device inventory is unavailable')"),
    'incomplete inventory must become an unavailable query state'
  );
});

test('properties.ts declares factual numeric availability counts in ScopeSummary', () => {
  const propertiesApiPath = path.join(ROOT_DIR, 'src', 'api', 'properties.ts');
  const content = fs.readFileSync(propertiesApiPath, 'utf-8');

  assert.ok(
    content.includes('totalDevices: number;'),
    'ScopeSummary must declare totalDevices as a number'
  );
  assert.ok(
    content.includes('onlineDevices: number;'),
    'ScopeSummary must declare onlineDevices as a number'
  );
  assert.ok(
    content.includes('offlineDevices: number;') && content.includes('unknownDevices: number;'),
    'ScopeSummary must declare Offline and Unknown as numbers'
  );
});

test('PropertyPortfolio.tsx decouples structural tree loading from portfolio operational stats', () => {
  const portfolioPath = path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'PropertyPortfolio.tsx');
  const content = fs.readFileSync(portfolioPath, 'utf-8');

  assert.ok(
    content.includes('usePropertyTree()') && content.includes('usePropertyPortfolio('),
    'PropertyPortfolio must invoke both usePropertyTree and usePropertyPortfolio'
  );
  assert.ok(
    content.includes('usePropertyPortfolio(!treeLoading && !treeError)'),
    'operational portfolio aggregation must start only after the structural hierarchy request settles successfully'
  );
  assert.ok(
    content.includes('countScopes'),
    'PropertyPortfolio must compute structural counts so cards render without waiting for portfolio'
  );
  assert.ok(
    content.includes('mergeTreeWithSummaries'),
    'PropertyPortfolio must merge operational summaries onto the fast structural tree'
  );
  assert.ok(
    content.includes('mergeTreeWithSummaries(treeNodes, portfolio?.nodes)') &&
      !content.includes('return portfolio.nodes'),
    'Portfolio operational nodes must enrich rather than replace the authorized structural tree'
  );
  assert.ok(
    content.includes("portfolio?.dataQuality?.state === 'partial'") || content.includes("portfolio.dataQuality.state === 'partial'"),
    'PropertyPortfolio must render partial status warning'
  );
  assert.ok(
    content.includes("portfolio?.dataQuality?.state === 'stale'") || content.includes("portfolio.dataQuality.state === 'stale'"),
    'PropertyPortfolio must render stale status warning'
  );
});

test('property tree normalization removes embedded Device identity collections', () => {
  const propertiesApiPath = path.join(ROOT_DIR, 'src', 'api', 'properties.ts');
  const content = fs.readFileSync(propertiesApiPath, 'utf-8');

  const treeInterface = content.match(/export interface PropertyTreeNode \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.strictEqual(
    treeInterface.includes('devices:'),
    false,
    'PropertyTreeNode must remain structural and exclude Device serial arrays'
  );
  assert.ok(
    content.includes('const normalizeTreeNode') && content.includes('return normalizeTree(data.nodes)'),
    'tree responses must be normalized before entering the query cache'
  );
});

test('ScopeDevicesTab.tsx uses authoritative pagination and tri-state availability', () => {
  const devicesTabPath = path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ScopeDevicesTab.tsx');
  const content = fs.readFileSync(devicesTabPath, 'utf-8');

  assert.ok(
    content.includes("<option value=\"availability:unknown\">Unknown</option>"),
    'ScopeDevicesTab must allow filtering Unknown availability'
  );
  assert.ok(
    content.includes('<AvailabilityDot state={device.availability} />'),
    'ScopeDevicesTab must render tri-state availability rather than Boolean connected state'
  );
  assert.ok(
    !content.includes('retrievedCount') && !content.includes('Inventory enumeration is incomplete'),
    'ScopeDevicesTab must not render a partial inventory subset'
  );
  assert.ok(
    content.includes('deviceType'),
    'ScopeDevicesTab must provide Device Type filtering'
  );
});

test('Property Details editing state is isolated by selected scope', () => {
  const pagePath = path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'PropertiesPage.tsx');
  const content = fs.readFileSync(pagePath, 'utf-8');

  assert.match(
    content,
    /<ScopeDetailsTab key=\{`\$\{selected\.type\}-\$\{selected\.id\}`\}/,
    'ScopeDetailsTab must remount when the selected scope changes'
  );
});

test('Venue Contact and Location retries reuse resources created before association failure', () => {
  const apiContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'api', 'properties.ts'), 'utf-8');
  const contactContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ContactEditorModal.tsx'), 'utf-8');
  const locationContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'LocationEditorModal.tsx'), 'utf-8');

  assert.ok(apiContent.includes('CreatedResourceAssociationError'));
  assert.ok(apiContent.includes('createdContactId') && apiContent.includes('createdLocationId'));
  assert.ok(contactContent.includes('setCreatedContactId(error.resourceId)'));
  assert.ok(locationContent.includes('setCreatedLocationId(error.resourceId)'));
  assert.ok(contactContent.includes('A second Contact will not be created.'));
  assert.ok(locationContent.includes('A second Location will not be created.'));
});

test('Refresh Scope invalidates the active scope query instead of only the structural tree', () => {
  const pageContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'PropertiesPage.tsx'), 'utf-8');

  assert.ok(pageContent.includes('refreshSelectedScope'));
  assert.ok(pageContent.includes("['scope-overview', selected.type, selected.id]"));
  assert.ok(pageContent.includes("['scope-devices', selected.type, selected.id]"));
  assert.ok(pageContent.includes("['scope-configurations']"));
  assert.ok(pageContent.includes("['scope-details', selected.type, selected.id]"));
});

test('Scoped Device placeholder rows are inert and Device filters follow the URL', () => {
  const devicesContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ScopeDevicesTab.tsx'), 'utf-8');

  assert.ok(devicesContent.includes('isPlaceholderData'));
  assert.ok(devicesContent.includes("tabIndex={isPlaceholderData ? -1 : 0}"));
  assert.ok(devicesContent.includes('disabled={isPlaceholderData || pageIndex === 0}'));
  assert.ok(devicesContent.includes("const availability = searchParams.get('availability') || ''"));
  assert.ok(!devicesContent.includes('setAvailability('));
  assert.ok(!devicesContent.includes('setAttention('));
});

test('Scoped Device rows support keyboard navigation', () => {
  const devicesContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ScopeDevicesTab.tsx'), 'utf-8');

  assert.ok(devicesContent.includes('role="link"'));
  assert.ok(devicesContent.includes('onKeyDown={(event)'));
  assert.ok(devicesContent.includes("event.key === 'Enter' || event.key === ' '"));
  assert.ok(devicesContent.includes('_focusVisible'));
});

test('Property realtime updates availability and refreshes factual aggregates', () => {
  const devicesApi = fs.readFileSync(path.join(ROOT_DIR, 'src', 'api', 'devices.ts'), 'utf-8');
  const propertiesApi = fs.readFileSync(path.join(ROOT_DIR, 'src', 'api', 'properties.ts'), 'utf-8');
  assert.match(devicesApi, /copy\.availability = event\.connected \? 'online' : 'offline'/);
  assert.match(devicesApi, /invalidateQueries\(\{ queryKey: \['scope-devices'\] \}\)/);
  assert.ok(!propertiesApi.includes('HealthState'), 'Property schemas must not invent health classifications');
  const summaryInterface = propertiesApi.match(/export interface ScopeSummary \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.ok(!summaryInterface.includes('sanity'), 'scope summaries must not invent a sanity or health score');
});

test('ScopeConfigurationsTab.tsx distinguishes direct from descendant assignments (PVT-061)', () => {
  const configTabPath = path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ScopeConfigurationsTab.tsx');
  const content = fs.readFileSync(configTabPath, 'utf-8');

  assert.ok(
    content.includes('selectedId'),
    'ScopeConfigurationsTab must accept selectedId'
  );
  assert.ok(
    content.includes('Direct') && content.includes('Descendant'),
    'ScopeConfigurationsTab must label Direct and Descendant assignments'
  );
  assert.ok(
    content.includes('Descendant assignments affect') || content.includes('descendant venues'),
    'ScopeConfigurationsTab must explain that descendant assignments are not effective at the parent scope'
  );
});

test('scoped Configuration pagination exposes incomplete list state instead of a false total', () => {
  const propertiesApiPath = path.join(ROOT_DIR, 'src', 'api', 'properties.ts');
  const configTabPath = path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ScopeConfigurationsTab.tsx');
  const apiContent = fs.readFileSync(propertiesApiPath, 'utf-8');
  const tabContent = fs.readFileSync(configTabPath, 'utf-8');

  assert.ok(apiContent.includes('complete: boolean;'));
  assert.ok(apiContent.includes('getModularConfigurationsBatch'));
  assert.ok(tabContent.includes('!data.complete'));
  assert.ok(tabContent.includes('not an authoritative empty result'));
});

test('scope edits preserve unknown OWPROV deviceRules', () => {
  const detailsPath = path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ScopeDetailsTab.tsx');
  const content = fs.readFileSync(detailsPath, 'utf-8');
  assert.ok(
    content.includes("...(data.deviceRules || {})"),
    'visible behavior controls must merge into rather than replace deviceRules'
  );
});

test('client.ts clears query cache on session teardown and logout (PVT-059)', () => {
  const clientPath = path.join(ROOT_DIR, 'src', 'api', 'client.ts');
  const content = fs.readFileSync(clientPath, 'utf-8');

  assert.ok(
    content.includes('clearAuthenticatedQueryCache()'),
    'teardownSessionAndReload must call clearAuthenticatedQueryCache()'
  );
});

test('PropertyPortfolio.tsx renders factual availability without scope health', () => {
  const portfolioPath = path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'PropertyPortfolio.tsx');
  const content = fs.readFileSync(portfolioPath, 'utf-8');

  assert.ok(!content.includes('ScopeHealthDiagnostics'));
  assert.ok(!content.includes('Overall Health'));
  assert.ok(content.includes("['Online', summary?.onlineDevices]"));
  assert.ok(content.includes("['Offline', summary?.offlineDevices]"));
  assert.ok(content.includes("['Unknown', summary?.unknownDevices]"));
  assert.ok(
    content.includes("navigate(`/devices?serial=${encodeURIComponent(device.serialNumber)}`)"),
    'selection drawer devices subtab must navigate to the Device workspace page when a device is clicked'
  );
});

test('devices.ts and DeviceWorkspace broadcast real-time events to single-device and scoped queries', () => {
  const devicesApiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const workspacePath = path.join(ROOT_DIR, 'src', 'pages', 'Devices', 'components', 'DeviceWorkspace', 'DeviceWorkspace.tsx');
  const apiContent = fs.readFileSync(devicesApiPath, 'utf-8');
  const wsContent = fs.readFileSync(workspacePath, 'utf-8');

  assert.ok(
    apiContent.includes("key === 'single-device-overview'") &&
      apiContent.includes("queryKey[0] === 'scope-devices'"),
    'useDeviceEventsStream must update single-device-overview and scope-devices queries on incoming events'
  );
  assert.ok(
    wsContent.includes('useDeviceEventsStream'),
    'DeviceWorkspace must mount useDeviceEventsStream for real-time telemetry updates'
  );
});

test('Property lifecycle controls follow OWPROV Root, Operator-linked, and normal Entity rules', () => {
  const apiContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'api', 'properties.ts'), 'utf-8');
  const headerContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ScopeHeader.tsx'), 'utf-8');
  const detailsContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ScopeDetailsTab.tsx'), 'utf-8');
  const editorContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'ScopeEditorModal.tsx'), 'utf-8');

  assert.ok(apiContent.includes("ROOT_PROPERTY_ID = '0000-0000-0000'"));
  assert.ok(apiContent.includes('Child Properties can only be created under Root or an Operator-linked Property'));
  assert.ok(apiContent.includes('Venues cannot be created directly under Root'));
  assert.ok(apiContent.includes('Operator-linked Properties must be deleted through Operator administration'));
  assert.ok(headerContent.includes('canCreateProperty') && headerContent.includes('canCreateVenue') && headerContent.includes('canDelete'));
  assert.ok(detailsContent.includes('{canDelete && <Button'));
  assert.ok(editorContent.includes("? ['property', 'venue']") && editorContent.includes("return ['venue']"));
});

test('Property map loads direct Device nodes through MDU without inventing Device health', () => {
  const apiContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'api', 'properties.ts'), 'utf-8');
  const mapContent = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'PropertyTreeMap.tsx'), 'utf-8');

  assert.ok(apiContent.includes("axiosMdu.get<PropertyMapResponse>('properties/map')"));
  assert.ok(mapContent.includes('usePropertyMap(true)'));
  assert.ok(mapContent.includes("type: 'device'") && mapContent.includes('device.serialNumber'));
  assert.ok(mapContent.includes("navigate(`/devices?serial=${encodeURIComponent(n.serialNumber)}`)"));
  assert.ok(!mapContent.includes('axiosGw'));
  assert.ok(!mapContent.includes('sanity'));
  assert.ok(!mapContent.includes("name=\"heart\""));
});

test('Property overview lists factual offline and low-sanity Devices needing attention', () => {
  const propertiesApi = fs.readFileSync(path.join(ROOT_DIR, 'src', 'api', 'properties.ts'), 'utf-8');
  const portfolio = fs.readFileSync(path.join(ROOT_DIR, 'src', 'pages', 'Properties', 'components', 'PropertyPortfolio.tsx'), 'utf-8');
  const devicesApi = fs.readFileSync(path.join(ROOT_DIR, 'src', 'api', 'devices.ts'), 'utf-8');

  assert.ok(propertiesApi.includes('sanity?: number;'));
  assert.ok(portfolio.includes("if (device.availability === 'offline') return 'offline'"));
  assert.ok(portfolio.includes("if (typeof device.sanity !== 'number') return 'sanity-unavailable'"));
  assert.ok(portfolio.includes("if (device.sanity < 90) return 'low-sanity'"));
  assert.ok(portfolio.includes('Devices needing attention'));
  assert.ok(portfolio.includes('Needs attention ·'));
  assert.ok(portfolio.includes('Sanity unavailable'));
  assert.ok(portfolio.includes("navigate(`/devices?serial=${encodeURIComponent(device.serialNumber)}`)"));
  assert.ok(devicesApi.includes("queryClient.setQueryData<PropertyMapResponse>(['property-map']"));
  assert.ok(devicesApi.includes("sanity: typeof event.sanity === 'number' ? event.sanity : undefined"));
});
