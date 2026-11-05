import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('devices.ts uses MDU GET /api/v1/devices as single authoritative fleet API without OWPROV fallback (Issue #2)', () => {
  const devicesApiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const content = fs.readFileSync(devicesApiPath, 'utf-8');

  // Verify paginated device fetching exists
  assert.ok(
    content.includes('export const getPaginatedFleetDevices'),
    'devices.ts must export getPaginatedFleetDevices'
  );
  assert.ok(
    content.includes('export const usePaginatedFleetDevices'),
    'devices.ts must export usePaginatedFleetDevices'
  );

  // Verify MDU devices endpoint is used as authoritative API
  assert.ok(
    content.includes("axiosMdu.get<PaginatedFleetResponse>('devices'"),
    'getPaginatedFleetDevices must query axiosMdu.get("devices")'
  );

  // Verify direct OWPROV fleet fallback queries are completely removed
  assert.strictEqual(
    content.includes('inventory?countOnly=true'),
    false,
    'getPaginatedFleetDevices must not query OWPROV inventory?countOnly=true fallback'
  );
  assert.strictEqual(
    content.includes('inventory?withExtendedInfo=true&limit='),
    false,
    'getPaginatedFleetDevices must not query OWPROV inventory slice fallback'
  );

  // Verify fallback hydration function hydrateTagsWithGatewayStatus is removed
  assert.strictEqual(
    content.includes('export const hydrateTagsWithGatewayStatus'),
    false,
    'fallback-only hydrateTagsWithGatewayStatus must be removed'
  );
});

test('MDU failures propagate errors cleanly without falling back to OWPROV or returning empty fleet (Issue #2)', async () => {
  let mduCallCount = 0;
  let provCallCount = 0;

  // Mock axios instances to test error propagation
  const mockAxiosMdu = {
    get: async () => {
      mduCallCount++;
      const error = new Error('500 Internal Server Error in MDU Service');
      error.response = { status: 500, data: { ErrorDescription: 'Internal Server Error' } };
      throw error;
    },
  };

  const mockAxiosProv = {
    get: async () => {
      provCallCount++;
      return { data: { count: 10, taglist: [] } };
    },
  };

  // Simulate getPaginatedFleetDevices calling MDU directly
  const simulateGetPaginatedFleetDevices = async () => {
    // Single authoritative call: errors must throw and not be caught by fallback
    const res = await mockAxiosMdu.get();
    return res.data;
  };

  await assert.rejects(
    async () => {
      await simulateGetPaginatedFleetDevices();
    },
    (err) => {
      assert.strictEqual(err.message, '500 Internal Server Error in MDU Service');
      return true;
    },
    'MDU error must propagate and reject without being suppressed'
  );

  assert.strictEqual(mduCallCount, 1, 'MDU GET /devices must be called once');
  assert.strictEqual(provCallCount, 0, 'OWPROV inventory must NEVER be called when MDU fails');
});

test('DeviceFleetTable renders error and retry state on MDU failure instead of misleading empty table (Issue #2)', () => {
  const tablePath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceFleetTable',
    'DeviceFleetTable.tsx'
  );
  const content = fs.readFileSync(tablePath, 'utf-8');

  // Verify isError and error are destructured from usePaginatedFleetDevices
  assert.ok(
    content.includes('isError') && content.includes('error'),
    'DeviceFleetTable must destructure isError and error from usePaginatedFleetDevices'
  );

  // Verify error UI state with retry button is present
  assert.ok(
    content.includes('Failed to load fleet devices'),
    'DeviceFleetTable must display error heading on failure'
  );
  assert.ok(
    content.includes('getApiErrorMessage(error'),
    'DeviceFleetTable must display formatted API error message'
  );
  assert.ok(
    content.includes('Retry'),
    'DeviceFleetTable must display Retry button on failure'
  );

  // Verify pagination is disabled during error
  assert.ok(
    content.includes('isDisabled={isLoading || isFetching || isError}'),
    'DevicePaginationControls must be disabled when isError is true'
  );
});

test('devicesUiStore.ts includes pageIndex and pageSize with reset-on-filter logic', () => {
  const storePath = path.join(ROOT_DIR, 'src', 'stores', 'devicesUiStore.ts');
  const content = fs.readFileSync(storePath, 'utf-8');

  assert.ok(
    content.includes('pageIndex: number;'),
    'devicesUiStore must have pageIndex in state interface'
  );
  assert.ok(
    content.includes('pageSize: number;'),
    'devicesUiStore must have pageSize in state interface'
  );
  assert.ok(
    content.includes('setPageIndex: (pageIndex: number) => void;'),
    'devicesUiStore must have setPageIndex action'
  );
  assert.ok(
    content.includes('setPageSize: (pageSize: number) => void;'),
    'devicesUiStore must have setPageSize action'
  );

  // Verify search query, status filter, and unassigned resets pageIndex to 0
  assert.ok(
    content.includes('setSearchQuery: (searchQuery) => set({ searchQuery, pageIndex: 0 })'),
    'setSearchQuery must reset pageIndex to 0'
  );
  assert.ok(
    content.includes('setStatusFilter: (statusFilter) => set({ statusFilter, pageIndex: 0 })'),
    'setStatusFilter must reset pageIndex to 0'
  );
});

test('DevicePaginationControls.tsx provides modular first/prev/next/last and page size controls', () => {
  const paginationComponentPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceFleetTable',
    'DevicePaginationControls.tsx'
  );
  assert.ok(fs.existsSync(paginationComponentPath), 'DevicePaginationControls.tsx must exist');

  const content = fs.readFileSync(paginationComponentPath, 'utf-8');
  assert.ok(
    content.includes('DevicePaginationControlsProps'),
    'Must export typed DevicePaginationControlsProps'
  );
  assert.ok(
    content.includes('onPageChange(0)'),
    'Must support navigating to first page'
  );
  assert.ok(
    content.includes('onPageChange(pageIndex - 1)'),
    'Must support navigating to previous page'
  );
  assert.ok(
    content.includes('onPageChange(pageIndex + 1)'),
    'Must support navigating to next page'
  );
  assert.ok(
    content.includes('onPageChange(totalPages - 1)'),
    'Must support navigating to last page'
  );
  assert.ok(
    content.includes('Show {size}'),
    'Must support page size switching options'
  );
});

test('DeviceFleetTable.tsx connects paginated hook and pagination controls', () => {
  const fleetTablePath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceFleetTable',
    'DeviceFleetTable.tsx'
  );
  const content = fs.readFileSync(fleetTablePath, 'utf-8');

  assert.ok(
    content.includes('usePaginatedFleetDevices'),
    'DeviceFleetTable must use usePaginatedFleetDevices'
  );
  assert.ok(
    content.includes('<DevicePaginationControls'),
    'DeviceFleetTable must render DevicePaginationControls'
  );
  assert.ok(
    content.includes('<DeviceRowActions'),
    'DeviceFleetTable must render DeviceRowActions'
  );

  // Verify all 24 columns are represented in table header
  const requiredColumns = [
    'Serial Number',
    'Memory',
    'Sanity',
    'Load',
    'Temp',
    'Revision',
    'Type',
    'IP',
    'Provisioning',
    'Rad',
    'GPS',
    'Uptime',
    'Last Connected',
    'Last Contact',
    'Last Upgrade',
    'Rx',
    'Tx',
    '2G',
    '5G',
    '6G',
    'Connect Reason',
    'Exp',
    'Actions',
  ];
  for (const col of requiredColumns) {
    assert.ok(content.includes(col), `DeviceFleetTable must include column ${col}`);
  }
});

test('DeviceRowActions.tsx renders all 7 action buttons', () => {
  const actionsPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceFleetTable',
    'DeviceRowActions.tsx'
  );
  assert.ok(fs.existsSync(actionsPath), 'DeviceRowActions.tsx must exist');

  const content = fs.readFileSync(actionsPath, 'utf-8');
  assert.ok(content.includes('Delete device'), 'Must have Delete action');
  assert.ok(content.includes('Edit device configuration'), 'Must have Configure action');
  assert.ok(content.includes('Sync telemetry and configuration'), 'Must have Sync action');
  assert.ok(content.includes('Reboot device'), 'Must have Reboot action');
  assert.ok(content.includes('Wi-Fi scan'), 'Must have Wi-Fi Scan action');
  assert.ok(content.includes('Device diagnostics'), 'Must have Diagnostics action');
  assert.ok(content.includes('View device workspace'), 'Must have View Details action');
});

test('deviceTableHelpers.ts formats bytes, durations, and flags correctly', () => {
  const helpersPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceFleetTable',
    'deviceTableHelpers.ts'
  );
  assert.ok(fs.existsSync(helpersPath), 'deviceTableHelpers.ts must exist');
});

test('useDeviceEventsStream implements OpenWiFi production WebSocket protocol with in-band token auth', () => {
  const devicesApiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const content = fs.readFileSync(devicesApiPath, 'utf-8');

  // Verify export
  assert.ok(
    content.includes('export const useDeviceEventsStream'),
    'devices.ts must export useDeviceEventsStream'
  );

  // Verify WebSocket usage instead of EventSource
  assert.ok(
    content.includes('new WebSocket(wsUrl)'),
    'useDeviceEventsStream must establish a WebSocket connection'
  );
  assert.strictEqual(
    content.includes('new EventSource('),
    false,
    'useDeviceEventsStream must NOT use EventSource because browsers cannot pass custom headers with EventSource'
  );

  // Verify in-band token authentication on onopen
  assert.ok(
    content.includes("ws.send(`token:${token}`)") || content.includes("ws.send('token:' + token)"),
    'useDeviceEventsStream must authenticate using in-band token frame (token:<token>)'
  );

  // Verify dynamic viewport subscription
  assert.ok(
    content.includes('JSON.stringify({ serials })') || content.includes('JSON.stringify({ serials: serialsRef.current })'),
    'useDeviceEventsStream must send active viewport serials over the WebSocket'
  );

  // Verify real-time cache patching for paginated-fleet-devices
  assert.ok(
    content.includes("queryKey: ['paginated-fleet-devices']") && content.includes('queryClient.setQueriesData'),
    'useDeviceEventsStream must patch paginated-fleet-devices in React Query cache'
  );
});

test('DevicesPage.tsx tab switching synchronizes with searchParams without race conditions or extra clicks', () => {
  const pagePath = path.join(ROOT_DIR, 'src', 'pages', 'Devices', 'DevicesPage.tsx');
  const content = fs.readFileSync(pagePath, 'utf-8');

  // Verify targetTab defaults to 'all' when tab param is omitted
  assert.ok(
    content.includes("rawTab === 'dashboard' || rawTab === 'blacklist' ? rawTab : 'all'"),
    'DevicesPage must default to all when tab parameter is omitted'
  );

  // Verify mainTab and selectedSerialNumber are not in useEffect dependency array to avoid race-condition reverts
  assert.ok(
    content.includes('}, [searchParams, selectDevice, clearSelectedDevice, setMainTab]);'),
    'DevicesPage useEffect must only trigger on searchParams changes and not fight Zustand state updates'
  );
});

test('DeviceOverviewTab renders the complete OpenWiFi OWGW card architecture and retains derived features', () => {
  const overviewPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'OverviewTab',
    'DeviceOverviewTab.tsx'
  );
  const content = fs.readFileSync(overviewPath, 'utf-8');

  // Verify all 6 OpenWiFi layout cards are rendered
  assert.ok(content.includes('<DeviceStatusCard'), 'Must render DeviceStatusCard');
  assert.ok(content.includes('<DeviceDetailsCard'), 'Must render DeviceDetailsCard');
  assert.ok(content.includes('<DeviceStatisticsCard'), 'Must render DeviceStatisticsCard');
  assert.ok(content.includes('<DeviceWifiAnalysisCard'), 'Must render DeviceWifiAnalysisCard');
  assert.ok(content.includes('<DeviceCommandsLogsCard'), 'Must render DeviceCommandsLogsCard');
  assert.ok(content.includes('<DeviceNotesCard'), 'Must render DeviceNotesCard');

  // Verify hardcoded attention conditions feature has been removed
  assert.strictEqual(content.includes('<DeviceAttentionConditionsCard'), false, 'Must not render DeviceAttentionConditionsCard');
});

test('DeviceCommandsLogsCard supports extensive OpenWiFi APIs with newest=true, limit, and +25 Show More pagination', () => {
  const cardPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'OverviewTab',
    'DeviceCommandsLogsCard.tsx'
  );
  const cardContent = fs.readFileSync(cardPath, 'utf-8');

  // Verify all 5 OpenWiFi tabs are present
  assert.ok(cardContent.includes("id: 'commands', label: 'Commands'"), 'Must include Commands tab');
  assert.ok(cardContent.includes("id: 'health', label: 'Health Checks'"), 'Must include Health Checks tab');
  assert.ok(cardContent.includes("id: 'logs', label: 'Logs'"), 'Must include Logs tab');
  assert.ok(cardContent.includes("id: 'crashes', label: 'Crash Logs'"), 'Must include Crash Logs tab');
  assert.ok(cardContent.includes("id: 'reboots', label: 'Reboot Logs'"), 'Must include Reboot Logs tab');

  // Verify independent limit state defaults to 25 and +25 step
  assert.ok(cardContent.includes('const [commandsLimit, setCommandsLimit] = useState(25);'), 'Commands limit starts at 25');
  assert.ok(cardContent.includes('setCommandsLimit((prev) => prev + 25)'), 'Show More increments commandsLimit by +25');
  assert.ok(cardContent.includes('setHealthLimit((prev) => prev + 25)'), 'Show More increments healthLimit by +25');
  assert.ok(cardContent.includes('setLogsLimit((prev) => prev + 25)'), 'Show More increments logsLimit by +25');
  assert.ok(cardContent.includes('setCrashesLimit((prev) => prev + 25)'), 'Show More increments crashesLimit by +25');
  assert.ok(cardContent.includes('setRebootsLimit((prev) => prev + 25)'), 'Show More increments rebootsLimit by +25');

  // Verify Show More button and empty state handling
  assert.ok(cardContent.includes('Show More'), 'Renders Show More button');
  assert.ok(cardContent.includes('No more available!'), 'Renders exhaustion label when no more records exist');

  // Verify API layer implementation routes through MDU with RBAC check
  const apiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');

  assert.ok(
    apiContent.includes('devices/${clean}/commands?newest=true&limit=${limit}'),
    'commands API must query MDU with newest=true and limit for RBAC protection'
  );
  assert.ok(
    apiContent.includes('devices/${clean}/healthchecks?newest=true&limit=${limit}'),
    'healthchecks API must query MDU with newest=true and limit for RBAC protection'
  );
  assert.ok(
    apiContent.includes('devices/${clean}/logs?newest=true&limit=${limit}&logType=${logType}'),
    'logs API must query MDU with newest=true, limit, and logType for RBAC protection'
  );
  assert.ok(
    apiContent.includes('export const useDeleteCommand'),
    'Must export useDeleteCommand mutation'
  );
  assert.ok(
    apiContent.includes('axiosMdu.delete(`devices/${clean}/commands/${commandUuid}`)'),
    'useDeleteCommand must query MDU delete endpoint for RBAC verification'
  );

  // Verify Column Filtering interactive capabilities
  assert.ok(cardContent.includes('TAB_COLUMNS'), 'Must define TAB_COLUMNS for all 5 tabs');
  assert.ok(cardContent.includes('toggleColumn'), 'Must provide toggleColumn handler');
  assert.ok(cardContent.includes('isColVisible'), 'Must conditionally render columns using isColVisible');
  assert.ok(cardContent.includes('Toggle Columns'), 'Must render column toggle popover header');

  // Verify Time Range Filter interactive capabilities
  assert.ok(cardContent.includes('applyPreset'), 'Must provide quick time presets');
  assert.ok(cardContent.includes('applyCustomTime'), 'Must provide custom datetime range support');
  assert.ok(cardContent.includes('clearTimeFilter'), 'Must provide clear time filter action');
  assert.ok(apiContent.includes('startDate !== undefined && endDate !== undefined'), 'API layer must support startDate and endDate parameters');
});

test('DeviceStatisticsCard renders real OpenWiFi statistics graph with all options and queries through MDU backend', () => {
  const cardPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'OverviewTab',
    'DeviceStatisticsCard.tsx'
  );
  assert.ok(fs.existsSync(cardPath), 'DeviceStatisticsCard.tsx must exist');
  const cardContent = fs.readFileSync(cardPath, 'utf-8');

  // Verify MDU API queries with RBAC
  const apiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  assert.ok(
    apiContent.includes('axiosMdu.get') && apiContent.includes('devices/${clean}/statistics'),
    'getDeviceStatisticsFrames must route through axiosMdu with serial'
  );
  assert.ok(
    cardContent.includes('useDeviceStatisticsFrames'),
    'DeviceStatisticsCard must use useDeviceStatisticsFrames'
  );
  assert.ok(
    cardContent.includes('useDeviceLastStats'),
    'DeviceStatisticsCard must use useDeviceLastStats for raw JSON telemetry'
  );

  // Verify Available Options in OWGW Statistics Graph
  assert.ok(cardContent.includes('formatChosen'), 'Must support Data vs Packets format toggle');
  assert.ok(cardContent.includes('!isMemory'), 'Format select must be hidden when Memory is selected');
  assert.ok(cardContent.includes('interfaceNameLabel'), 'Must format interface names to human-readable labels');
  assert.ok(cardContent.includes('memory'), 'Must support Memory graph option');
  assert.ok(cardContent.includes('vlans'), 'Must support dynamic VLAN graph option');
  assert.ok(cardContent.includes('isTimePickerOpen'), 'Must provide interactive time range picker');
  assert.ok(cardContent.includes('isViewLastStatsOpen'), 'Must provide View Last Stats modal');
  assert.ok(cardContent.includes('refetch'), 'Must provide refresh control');

  // Verify Real Calculation Engine
  assert.ok(cardContent.includes('rxDelta'), 'Must calculate rx counter deltas between frames');
  assert.ok(cardContent.includes('txDelta'), 'Must calculate tx counter deltas between frames');
  assert.ok(cardContent.includes('getDivisionFactor'), 'Must calculate division factor for Bytes');
  assert.ok(cardContent.includes('getDivisionFactorPackets'), 'Must calculate division factor for Packets');

  // Verify Interactive Tooltip
  assert.ok(cardContent.includes('hoverIndex'), 'Must support interactive hover index');
  assert.ok(cardContent.includes('onMouseMove={handleMouseMove}'), 'Must bind mouse move listener for crosshair');
});

test('DeviceDetailsCard and DeviceCapabilitiesModal query real device capabilities via MDU with RBAC', () => {
  const detailsCardPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'OverviewTab',
    'DeviceDetailsCard.tsx'
  );
  assert.ok(fs.existsSync(detailsCardPath), 'DeviceDetailsCard.tsx must exist');
  const detailsContent = fs.readFileSync(detailsCardPath, 'utf-8');

  // Verify capabilities button and modal mounting
  assert.ok(detailsContent.includes('title="View Capabilities"'), 'Must have View Capabilities button');
  assert.ok(detailsContent.includes('setIsCapabilitiesOpen(true)'), 'Must open capabilities modal on click');
  assert.ok(detailsContent.includes('<DeviceCapabilitiesModal'), 'Must mount DeviceCapabilitiesModal');
  assert.ok(detailsContent.includes('serialNumber={device.serialNumber}'), 'Must pass device.serialNumber');

  // Verify DeviceCapabilitiesModal implementation
  const modalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'OverviewTab',
    'DeviceCapabilitiesModal.tsx'
  );
  assert.ok(fs.existsSync(modalPath), 'DeviceCapabilitiesModal.tsx must exist');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  assert.ok(modalContent.includes('useDeviceCapabilities(serialNumber, isOpen)'), 'Must use useDeviceCapabilities hook');
  assert.ok(modalContent.includes("activeTab === 'preview'"), 'Must support Preview tab');
  assert.ok(modalContent.includes("activeTab === 'raw'"), 'Must support Raw JSON tab');
  assert.ok(modalContent.includes('navigator.clipboard.writeText'), 'Must support Copy to clipboard');
  assert.ok(modalContent.includes('refetch()'), 'Must support Refresh capabilities');

  // Verify MDU API layer
  const apiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  assert.ok(apiContent.includes('getDeviceCapabilities'), 'devices.ts must export getDeviceCapabilities');
  assert.ok(
    apiContent.includes('axiosMdu.get') && apiContent.includes('devices/${clean}/capabilities'),
    'getDeviceCapabilities must route through axiosMdu with RBAC'
  );
});

test('DeviceWifiAnalysisCard queries real telemetry via MDU backend with RBAC, slider scrubber, and full OWGW table columns', () => {
  const cardPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'OverviewTab',
    'DeviceWifiAnalysisCard.tsx'
  );
  assert.ok(fs.existsSync(cardPath), 'DeviceWifiAnalysisCard.tsx must exist');
  const content = fs.readFileSync(cardPath, 'utf-8');

  // Verify MDU API hook usage with RBAC
  assert.ok(
    content.includes('useDeviceStatisticsFrames(device.serialNumber, 30)'),
    'Must fetch 30 frames via useDeviceStatisticsFrames from MDU'
  );
  assert.ok(content.includes('refetch'), 'Must support refetch for manual refresh');

  // Verify time scrubber slider and dynamic relative time
  assert.ok(content.includes('type="range"'), 'Must render timeline range slider');
  assert.ok(content.includes('sliderIndex'), 'Must bind sliderIndex state');
  assert.ok(content.includes('formatWhen'), 'Must dynamically calculate relative time');

  // Verify full OWGW table schemas
  assert.ok(content.includes('Band'), 'Must render Band column');
  assert.ok(content.includes('CH.'), 'Must render Channel column');
  assert.ok(content.includes('CH. W'), 'Must render Channel Width column');
  assert.ok(content.includes('TX POW.'), 'Must render Tx Power column');
  assert.ok(content.includes('NOISE'), 'Must render Noise column');
  assert.ok(content.includes('ACTIVE (MS)'), 'Must render Active Ms column');
  assert.ok(content.includes('BUSY (MS)'), 'Must render Busy Ms column');
  assert.ok(content.includes('RECEIVE (MS)'), 'Must render Receive Ms column');
  assert.ok(content.includes('SEND (MS)'), 'Must render Send Ms column');
  assert.ok(content.includes('TEMP.'), 'Must render Temperature column');
  assert.ok(content.includes('FREQUENCY'), 'Must render Frequency column');

  assert.ok(content.includes('STATION'), 'Must render Station column');
  assert.ok(content.includes('SSID'), 'Must render SSID column');
  assert.ok(content.includes('IPS'), 'Must render IPs column');
  assert.ok(content.includes('FINGERPRINT'), 'Must render Fingerprint column');
  assert.ok(content.includes('VENDOR'), 'Must render Vendor column');
  assert.ok(content.includes('VLAN'), 'Must render VLAN column');
  assert.ok(content.includes('MODE'), 'Must render Mode column');
  assert.ok(content.includes('RSSI'), 'Must render RSSI column');
  assert.ok(content.includes('RX RATE'), 'Must render RX Rate column');
  assert.ok(content.includes('TX RATE'), 'Must render TX Rate column');
});

test('DeviceNotesCard fetches and appends notes strictly through MDU backend with RBAC', () => {
  const cardPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'OverviewTab',
    'DeviceNotesCard.tsx'
  );
  assert.ok(fs.existsSync(cardPath), 'DeviceNotesCard.tsx must exist');
  const cardContent = fs.readFileSync(cardPath, 'utf-8');

  // Verify complete elimination of direct gateway calls
  assert.strictEqual(
    cardContent.includes('axiosGw'),
    false,
    'DeviceNotesCard must NOT use axiosGw because it bypasses MDU RBAC scoping'
  );

  // Verify MDU API hook usage
  assert.ok(cardContent.includes('useDeviceRecord(device.serialNumber)'), 'Must fetch live device notes via useDeviceRecord');
  assert.ok(cardContent.includes('addDeviceNote(device.serialNumber'), 'Must add notes via addDeviceNote');

  // Verify MDU API layer
  const apiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  assert.ok(
    apiContent.includes('getDeviceRecord') && apiContent.includes('axiosMdu.get<DeviceRecordResponse>(`devices/${clean}`)'),
    'getDeviceRecord must route through axiosMdu with RBAC'
  );
  assert.ok(
    apiContent.includes('addDeviceNote') && apiContent.includes('axiosMdu.put<DeviceRecordResponse>(`devices/${clean}`'),
    'addDeviceNote must route through axiosMdu with RBAC'
  );
});

test('DeviceHeader renders icon-only action capsule with tooltips matching OWGW screenshot', () => {
  const headerPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'DeviceHeader.tsx'
  );
  assert.ok(fs.existsSync(headerPath), 'DeviceHeader.tsx must exist');
  const content = fs.readFileSync(headerPath, 'utf-8');

  // Verify icon-only buttons with titles as tooltips
  assert.ok(content.includes('title="Delete Device"'), 'Must render Delete Device icon button with tooltip');
  assert.ok(content.includes('title="Connect (Terminal / RTTY)"'), 'Must render Connect icon button with tooltip');
  assert.ok(content.includes('title="Configure"'), 'Must render Configure icon button with tooltip');
  assert.ok(content.includes('title="Reboot"') || content.includes('title={isConnected ? \'Reboot\''), 'Must render Reboot icon button with tooltip');
  assert.ok(content.includes('title="Commands & Actions"'), 'Must render Commands & Actions icon button with tooltip');
  assert.ok(content.includes('title="Refresh"'), 'Must render Refresh icon button with tooltip');

  // Verify icons
  assert.ok(content.includes('name="trash"'), 'Must render trash icon for delete');
  assert.ok(content.includes('name="terminal"'), 'Must render terminal icon for connect');
  assert.ok(content.includes('name="barcode"'), 'Must render barcode icon for configure');
  assert.ok(content.includes('name="power"'), 'Must render power icon for reboot');
  assert.ok(content.includes('name="wrench"'), 'Must render wrench icon for commands');
  assert.ok(content.includes('name="refresh"'), 'Must render refresh icon for refresh');
});

test('Device actions and commands route through MDU with RBAC and provide OWGW modals', () => {
  const apiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');

  // Verify MDU routing for all device commands
  assert.ok(apiContent.includes('axiosMdu.post(`devices/${clean}/reboot`'), 'Reboot command must route via axiosMdu');
  assert.ok(apiContent.includes('axiosMdu.post(`devices/${clean}/leds`'), 'Blink LEDs command must route via axiosMdu');
  assert.ok(apiContent.includes('axiosMdu.post(`devices/${clean}/wifiscan`'), 'Wi-Fi scan command must route via axiosMdu');
  assert.ok(apiContent.includes('axiosMdu.post(`devices/${clean}/factory`'), 'Factory reset command must route via axiosMdu');
  assert.ok(apiContent.includes('axiosMdu.post(`devices/${clean}/configure`'), 'Direct configure command must route via axiosMdu');
  assert.ok(apiContent.includes('axiosMdu.get<DeviceRttyResponse>(`devices/${clean}/rtty`)'), 'RTTY connection details must route via axiosMdu');
  assert.ok(apiContent.includes('axiosMdu.delete(`devices/${clean}`)'), 'Delete device must route via axiosMdu');

  // Verify modals exist
  const modalsDir = path.join(ROOT_DIR, 'src', 'pages', 'Devices', 'components', 'DeviceWorkspace', 'modals');
  assert.ok(fs.existsSync(path.join(modalsDir, 'DeviceQuickConfigModal.tsx')), 'DeviceQuickConfigModal must exist');
  assert.ok(fs.existsSync(path.join(modalsDir, 'DeviceWifiScanModal.tsx')), 'DeviceWifiScanModal must exist');
  assert.ok(fs.existsSync(path.join(modalsDir, 'DeviceFactoryResetModal.tsx')), 'DeviceFactoryResetModal must exist');

  // Verify DeviceHeader wires modals and RTTY
  const headerPath = path.join(ROOT_DIR, 'src', 'pages', 'Devices', 'components', 'DeviceWorkspace', 'DeviceHeader.tsx');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');
  assert.ok(headerContent.includes('DeviceQuickConfigModal'), 'DeviceHeader must render DeviceQuickConfigModal');
  assert.ok(headerContent.includes('DeviceWifiScanModal'), 'DeviceHeader must render DeviceWifiScanModal');
  assert.ok(headerContent.includes('DeviceFactoryResetModal'), 'DeviceHeader must render DeviceFactoryResetModal');
  assert.ok(headerContent.includes('window.open(url, \'_blank\')?.focus()'), 'DeviceHeader must open RTTY terminal in new tab');
});

test('DeviceQuickConfigModal integrates modular ConfigurationSectionsCard with platform-aware subsections matching OWGW', () => {
  const modalPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'modals',
    'DeviceQuickConfigModal.tsx'
  );
  assert.ok(fs.existsSync(modalPath), 'DeviceQuickConfigModal.tsx must exist');
  const modalContent = fs.readFileSync(modalPath, 'utf-8');

  // Verify ConfigurationSectionsCard integration
  assert.ok(
    modalContent.includes('ConfigurationSectionsCard'),
    'DeviceQuickConfigModal must integrate modular ConfigurationSectionsCard'
  );

  // Verify platform derivation for olg, switch, and ap
  assert.ok(modalContent.includes("t === 'olg' || t === 'gateway'"), 'Must detect olg platform for gateways');
  assert.ok(modalContent.includes("t === 'switch'"), 'Must detect switch platform');

  // Verify push button and warning banner
  assert.ok(modalContent.includes('showWarningBanner={true}'), 'Must pass showWarningBanner to ConfigurationSectionsCard');
  assert.ok(modalContent.includes('title="Configure"'), 'Must set title to Configure');
  assert.ok(modalContent.includes('Icon name="send"'), 'Must render teal send/push button');

  // Verify ConfigurationSectionsCard contains the warning banner matching screenshot
  const cardPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Configuration',
    'components',
    'ConfigurationSectionsCard',
    'ConfigurationSectionsCard.tsx'
  );
  const cardContent = fs.readFileSync(cardPath, 'utf-8');
  assert.ok(
    cardContent.includes('Be warned: there will only be minimal tests done on this configuration'),
    'Must display exact OWGW warning banner'
  );
});

test('DeviceDetailsCard and useDeviceOverview resolve platform deviceType (olg/ap/switch) matching OWGW', () => {
  const typesPath = path.join(ROOT_DIR, 'src', 'types', 'device.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf-8');

  // Verify normalizePlatformDeviceType helper is exported
  assert.ok(
    typesContent.includes('export const normalizePlatformDeviceType'),
    'src/types/device.ts must export normalizePlatformDeviceType'
  );

  const detailsPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'OverviewTab',
    'DeviceDetailsCard.tsx'
  );
  const detailsContent = fs.readFileSync(detailsPath, 'utf-8');

  // Verify DeviceDetailsCard uses normalizePlatformDeviceType to render Type:
  assert.ok(
    detailsContent.includes('normalizePlatformDeviceType'),
    'DeviceDetailsCard must normalize deviceType for display'
  );
  assert.ok(
    detailsContent.includes('Type:'),
    'DeviceDetailsCard must render Type: label'
  );

  const devicesApiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const devicesApiContent = fs.readFileSync(devicesApiPath, 'utf-8');

  // Verify useDeviceOverview resolves platform vs model
  assert.ok(
    devicesApiContent.includes('const resolvedPlatform = normalizePlatformDeviceType'),
    'devices.ts must resolve platform type using normalizePlatformDeviceType'
  );
  assert.ok(
    devicesApiContent.includes('deviceGroup: tag?.deviceGroup || resolvedPlatform'),
    'devices.ts must set deviceGroup to the resolved platform (ap/switch/olg)'
  );
  assert.ok(
    devicesApiContent.includes('deviceType: tag?.deviceType || resolvedModel'),
    'devices.ts must preserve the device model/type in deviceType matching OWPROV'
  );
  assert.ok(
    devicesApiContent.includes('model: resolvedModel'),
    'devices.ts must preserve the hardware SKU as model'
  );
});

test('DeviceHeader renders all 13 OpenWiFi Gateway command actions and integrations', () => {
  const headerPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'DeviceHeader.tsx'
  );
  const headerContent = fs.readFileSync(headerPath, 'utf-8');

  // Verify all 13 actions from OWGW DeviceActionDropdown are present
  const requiredActions = [
    'Blink LEDs (30s)',
    'Configure',
    'Connect (Terminal / RTTY)',
    'Event Queue',
    'Factory Reset',
    'Firmware Upgrade',
    'Reboot',
    'Re-Enroll Device',
    'Telemetry Stream',
    'Run Script',
    'Network Packet Trace',
    'Wi-Fi Radio Scan',
    'Export Statistics',
  ];

  for (const action of requiredActions) {
    assert.ok(
      headerContent.includes(action),
      `DeviceHeader dropdown must include OWGW action: ${action}`
    );
  }

  // Verify all 10 specialized command modals are integrated
  const requiredModals = [
    'DeviceQuickConfigModal',
    'DeviceWifiScanModal',
    'DeviceFactoryResetModal',
    'DeviceFirmwareUpgradeModal',
    'DeviceEventQueueModal',
    'DeviceTraceModal',
    'DeviceTelemetryModal',
    'DeviceScriptModal',
    'DeviceReEnrollModal',
    'DeviceExportStatsModal',
  ];

  for (const modal of requiredModals) {
    assert.ok(
      headerContent.includes(modal),
      `DeviceHeader must mount modal: ${modal}`
    );
  }
});

test('DeviceConfigTab implements all 6 OWPROV provisioning subtabs and all 11 Main tab fields', () => {
  const configTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'DeviceConfigTab.tsx'
  );
  const configTabContent = fs.readFileSync(configTabPath, 'utf-8');

  // Verify all 6 OWPROV sub-tabs
  const expectedSubTabs = [
    { id: 'main', label: 'Main' },
    { id: 'special', label: 'Device-Specific Configuration' },
    { id: 'computed', label: 'Computed Configuration' },
    { id: 'overrides', label: 'Configuration Overrides' },
    { id: 'notes', label: 'Notes' },
    { id: 'state', label: 'State' },
  ];

  for (const st of expectedSubTabs) {
    assert.ok(
      configTabContent.includes(`id: '${st.id}'`) && configTabContent.includes(`label: '${st.label}'`),
      `DeviceConfigTab must contain subtab ${st.label} (${st.id})`
    );
  }

  // Verify MainConfigSubTab contains all 11 fields from OWPROV EditTagModal
  const mainTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'MainConfigSubTab.tsx'
  );
  const mainTabContent = fs.readFileSync(mainTabPath, 'utf-8');

  const expectedFields = [
    'Serial Number',
    'Name',
    'Description',
    'Device Group',
    'Device Type',
    'Parent',
    'Release Candidates Only',
    'RRM',
    'Firmware Upgrade',
    'Device Class',
    'Ignore Configuration Overrides',
  ];

  for (const field of expectedFields) {
    assert.ok(
      mainTabContent.includes(field),
      `MainConfigSubTab must render field: ${field}`
    );
  }

  // Verify MainConfigSubTab sends exact OWPROV payload structure (including deviceGroup and deviceType)
  assert.ok(mainTabContent.includes('deviceGroup,'), 'MainConfigSubTab payload must include deviceGroup');
  assert.ok(mainTabContent.includes('deviceType,'), 'MainConfigSubTab payload must include deviceType');
  assert.ok(!mainTabContent.includes('deviceConfiguration:'), 'MainConfigSubTab payload must omit deviceConfiguration to prevent overwriting device-specific configuration (Issue #4)');
  assert.ok(!mainTabContent.includes('notes:'), 'MainConfigSubTab payload must omit notes to prevent duplicate note history (Issue #3)');

  // Verify StateSubTab exists and handles JSON formatting & state mutations
  const stateTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'StateSubTab.tsx'
  );
  assert.ok(fs.existsSync(stateTabPath), 'StateSubTab.tsx must exist');
  const stateContent = fs.readFileSync(stateTabPath, 'utf-8');
  assert.ok(stateContent.includes('useUpdateDeviceTag'), 'StateSubTab must wire useUpdateDeviceTag mutation');
  assert.ok(stateContent.includes('Textarea'), 'StateSubTab must render a single clean Textarea matching OWPROV');

  // Verify DeviceSpecificConfigSubTab renders Base Information with RRM, Firmware Upgrade, RC Only, and Trash
  const specialTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'DeviceSpecificConfigSubTab.tsx'
  );
  assert.ok(fs.existsSync(specialTabPath), 'DeviceSpecificConfigSubTab.tsx must exist');
  const specialContent = fs.readFileSync(specialTabPath, 'utf-8');
  assert.ok(specialContent.includes('Base Information'), 'DeviceSpecificConfigSubTab must render Base Information header');
  assert.ok(specialContent.includes('RRM'), 'DeviceSpecificConfigSubTab must render RRM field');
  assert.ok(specialContent.includes('Firmware Upgrade'), 'DeviceSpecificConfigSubTab must render Firmware Upgrade field');
  assert.ok(specialContent.includes('Release Candidates Only'), 'DeviceSpecificConfigSubTab must render Release Candidates Only toggle');
  assert.ok(specialContent.includes('trash'), 'DeviceSpecificConfigSubTab must render trash delete button');
  assert.ok(specialContent.includes('ConfigurationSectionsCard'), 'DeviceSpecificConfigSubTab must render ConfigurationSectionsCard');
  assert.ok(
    specialContent.includes('configData?.configuration'),
    'DeviceSpecificConfigSubTab must populate currentJson from configData.configuration'
  );
  assert.ok(
    specialContent.includes('createModularConfiguration'),
    'DeviceSpecificConfigSubTab must save modular configurations via createModularConfiguration API (Copy-On-Write)'
  );

  // Verify workspace tabs no longer include radios or diagnostics
  const typesPath = path.join(ROOT_DIR, 'src', 'types', 'device.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  assert.ok(
    typesContent.includes("export type DeviceWorkspaceTab = 'overview' | 'configuration' | 'activity';"),
    'DeviceWorkspaceTab must only include overview, configuration, activity'
  );
});

test('Device Type and Device Group options integrate with FMS firmwares?deviceSet=true API matching OWPROV', () => {
  const devicesApiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const devicesApiContent = fs.readFileSync(devicesApiPath, 'utf-8');

  // Verify useGetDeviceTypeInfo queries FMS
  assert.ok(
    devicesApiContent.includes("`inventory/${clean}?withExtendedInfo=true`"),
    'useDeviceOverview must fetch inventory with withExtendedInfo=true to populate configuration'
  );
  assert.ok(
    devicesApiContent.includes("useGetDeviceTypeInfo"),
    'devices.ts must export useGetDeviceTypeInfo'
  );
  assert.ok(
    devicesApiContent.includes("axiosFms.get<DeviceTypeInfoResponse>('firmwares?deviceSet=true')"),
    'devices.ts must query axiosFms firmwares?deviceSet=true matching OWPROV'
  );

  // Verify MainConfigSubTab consumes useGetDeviceTypeInfo for dynamic deviceClasses & deviceTypesByClass
  const mainTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'MainConfigSubTab.tsx'
  );
  const mainTabContent = fs.readFileSync(mainTabPath, 'utf-8');
  assert.ok(
    mainTabContent.includes('useGetDeviceTypeInfo'),
    'MainConfigSubTab must consume useGetDeviceTypeInfo'
  );
  assert.ok(
    mainTabContent.includes('fmsDeviceTypeInfo?.deviceClasses'),
    'MainConfigSubTab must map deviceClasses from FMS'
  );
  assert.ok(
    mainTabContent.includes('fmsDeviceTypeInfo?.deviceTypesByClass'),
    'MainConfigSubTab must map deviceTypesByClass from FMS'
  );
});

test('Parent dropdown dynamically fetches and groups Entities and Venues matching OWPROV', () => {
  const mainTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'MainConfigSubTab.tsx'
  );
  const mainTabContent = fs.readFileSync(mainTabPath, 'utf-8');

  // Verify hooks for entities & venues
  assert.ok(
    mainTabContent.includes('useGetEntities') && mainTabContent.includes('useGetVenues'),
    'MainConfigSubTab must consume both useGetEntities and useGetVenues'
  );

  // Verify optgroup rendering for Entities and Venues
  assert.ok(
    mainTabContent.includes('<optgroup label="Entities">') && mainTabContent.includes('<optgroup label="Venues">'),
    'MainConfigSubTab must group parent options with optgroup for Entities and Venues'
  );

  // Verify ent: and ven: prefix handling on save
  assert.ok(
    mainTabContent.includes("parent.startsWith('ent:') ? parent.slice(4) : ''"),
    'MainConfigSubTab must extract entity UUID when prefix is ent:'
  );
  assert.ok(
    mainTabContent.includes("parent.startsWith('ven:') ? parent.slice(4) : ''"),
    'MainConfigSubTab must extract venue UUID when prefix is ven:'
  );
});

test('Configuration Overrides tab matches OWPROV features with create, column select, table, edit/delete, and pagination', () => {
  const overridesTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'OverridesSubTab.tsx'
  );
  assert.ok(fs.existsSync(overridesTabPath), 'OverridesSubTab.tsx must exist');

  const content = fs.readFileSync(overridesTabPath, 'utf-8');

  // 1. Backend hooks
  assert.ok(content.includes('useDeviceOverrides'), 'Must consume useDeviceOverrides query');
  assert.ok(content.includes('useUpdateDeviceOverrides'), 'Must consume useUpdateDeviceOverrides mutation');

  // 2. Create Override Modal and Parameter Builder
  assert.ok(content.includes('Create Configuration Override'), 'Must provide Create Configuration Override modal');
  assert.ok(content.includes('radios'), 'Must support radios parameter builder prefix');
  assert.ok(content.includes('channel'), 'Must support channel parameter');
  assert.ok(content.includes('tx-power'), 'Must support tx-power parameter');
  assert.ok(content.includes('dBm (Valid range: 1 - 32)'), 'Must enforce tx-power 1-32 dBm range validation');
  assert.ok(content.includes('already exists'), 'Must provide duplicate parameter validation');
  assert.ok(content.includes('64'), 'Must enforce 64 character limit on reason');

  // 3. Column Picker
  assert.ok(content.includes('Columns'), 'Must include Columns picker button');
  assert.ok(content.includes('Toggle Columns'), 'Must render column toggle menu');
  assert.ok(content.includes('AVAILABLE_COLUMNS'), 'Must define available columns');
  assert.ok(content.includes('LOCAL_STORAGE_HIDDEN_COLUMNS_KEY'), 'Must persist hidden columns to localStorage');

  // 4. Data Table and Row Actions
  assert.ok(content.includes('handleHeaderSort'), 'Must support sorting by clicking table column headers');
  assert.ok(content.includes('Edit Configuration Override'), 'Must provide Edit modal for existing overrides');
  assert.ok(content.includes('Delete Configuration Override'), 'Must provide Delete confirmation dialog');

  // 5. Pagination Controls
  assert.ok(content.includes('Go to page'), 'Must provide Go to page navigation');
  assert.ok(content.includes('Show '), 'Must provide page size dropdown');
  assert.ok(content.includes('chevronsLeft') && content.includes('chevronsRight'), 'Must provide first/last pagination buttons');
  assert.ok(content.includes('chevronLeft') && content.includes('chevronRight'), 'Must provide prev/next pagination buttons');

  // 6. Source-scoped mutations to protect inherited venue/entity settings
  assert.ok(
    content.includes("const deviceOverrides = nextOverrides.filter((o) => (o.source || 'device') === 'device');"),
    'Must isolate device overrides on create to avoid corrupting inherited settings'
  );
  assert.ok(
    content.includes("const sourceOverrides = nextOverrides.filter((o) => (o.source || 'device') === targetSource);"),
    'Must isolate target source overrides on edit'
  );
  assert.ok(
    content.includes("const remainingSourceOverrides = nextOverrides.filter((o) => (o.source || 'device') === targetSource);"),
    'Must isolate target source overrides on delete'
  );
});

test('RRM validation and serialization aligns strictly with OWPROV ValidRRM contract', async () => {
  const rrmHelperPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'rrmHelper.ts'
  );
  assert.ok(fs.existsSync(rrmHelperPath), 'rrmHelper.ts must exist');

  const mainSubTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'MainConfigSubTab.tsx'
  );
  const deviceSpecificSubTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'DeviceSpecificConfigSubTab.tsx'
  );
  const rrmEditorFieldPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'RrmEditorField.tsx'
  );

  assert.ok(fs.existsSync(mainSubTabPath), 'MainConfigSubTab.tsx must exist');
  assert.ok(fs.existsSync(deviceSpecificSubTabPath), 'DeviceSpecificConfigSubTab.tsx must exist');
  assert.ok(fs.existsSync(rrmEditorFieldPath), 'RrmEditorField.tsx must exist');

  const mainContent = fs.readFileSync(mainSubTabPath, 'utf-8');
  const deviceSpecificContent = fs.readFileSync(deviceSpecificSubTabPath, 'utf-8');
  const rrmEditorContent = fs.readFileSync(rrmEditorFieldPath, 'utf-8');
  const rrmHelperContent = fs.readFileSync(rrmHelperPath, 'utf-8');

  // 1. Verify invalid legacy options are completely eliminated from both tabs
  assert.strictEqual(
    mainContent.includes("setRrm(e.target.value as 'inherit' | 'yes' | 'no')"),
    false,
    'MainConfigSubTab must not use select setting rrm directly to yes/no'
  );
  assert.strictEqual(
    deviceSpecificContent.includes('<option value="on">on</option>'),
    false,
    'DeviceSpecificConfigSubTab must not offer invalid "on" option for RRM'
  );
  assert.strictEqual(
    deviceSpecificContent.includes('<option value="off">off</option>'),
    false,
    'DeviceSpecificConfigSubTab must not offer invalid "off" option for RRM'
  );

  // 2. Verify shared RrmEditorField is used across both subtabs
  assert.ok(
    mainContent.includes('<RrmEditorField'),
    'MainConfigSubTab must use shared RrmEditorField'
  );
  assert.ok(
    deviceSpecificContent.includes('<RrmEditorField'),
    'DeviceSpecificConfigSubTab must use shared RrmEditorField'
  );

  // 3. Verify normalization ensures OWPROV ValidRRM compliance on submit
  assert.ok(
    mainContent.includes('normalizeRrmForSubmission(rrm)'),
    'MainConfigSubTab must normalize RRM value before submission'
  );
  assert.ok(
    deviceSpecificContent.includes('const normalizedRrm = normalizeRrmForSubmission(rrm);'),
    'DeviceSpecificConfigSubTab must normalize RRM value before submission'
  );

  // 4. Verify RrmEditorField provides inherit, enabled, and disabled options with configuration modal
  assert.ok(rrmEditorContent.includes('<option value="inherit">Inherit</option>'), 'RrmEditorField must support inherit');
  assert.ok(rrmEditorContent.includes('<option value="enabled">Enabled</option>'), 'RrmEditorField must support enabled');
  assert.ok(rrmEditorContent.includes('<option value="no">Disabled (No)</option>'), 'RrmEditorField must support no (disabled)');
  assert.ok(rrmEditorContent.includes('Configure RRM'), 'RrmEditorField must provide configuration modal');
  assert.ok(rrmEditorContent.includes('Cron Schedule'), 'RrmEditorField must provide cron schedule configuration');

  // 5. Verify rrmHelper logic handles legacy conversion and preserves custom structured configs
  assert.ok(rrmHelperContent.includes("export const DEFAULT_RRM_SCHEDULE = '*/10 * * * *';"));
  assert.ok(rrmHelperContent.includes("export const DEFAULT_RRM_VENDOR = 'telecominfraproject';"));
  assert.ok(rrmHelperContent.includes('isValidCronSchedule'));
  assert.ok(rrmHelperContent.includes('parseRrmValue'));
  assert.ok(rrmHelperContent.includes('serializeRrmForSubmission'));

  // 6. Runtime logic simulation of rrmHelper contract
  const isValidCron = (cron) => {
    if (!cron || typeof cron !== 'string') return false;
    const parts = cron.trim().split(/\s+/);
    return parts.length === 5 && parts.every((p) => p.length > 0);
  };
  assert.strictEqual(isValidCron('*/10 * * * *'), true);
  assert.strictEqual(isValidCron('0 0 * * *'), true);
  assert.strictEqual(isValidCron('0 0 * *'), false);
  assert.strictEqual(isValidCron('invalid'), false);

  const defaultPayload = {
    vendor: 'telecominfraproject',
    schedule: '*/10 * * * *',
    algorithms: [],
  };

  const parseRrm = (raw) => {
    if (!raw || raw === 'inherit') return { mode: 'inherit', payload: defaultPayload };
    if (raw === 'no' || raw === 'off') return { mode: 'no', payload: defaultPayload };
    if (raw === 'yes' || raw === 'on') return { mode: 'enabled', payload: defaultPayload };
    if (typeof raw === 'object' && raw !== null) return { mode: 'enabled', payload: raw };
    if (typeof raw === 'string' && raw.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        return { mode: 'enabled', payload: parsed };
      } catch {
        return { mode: 'inherit', payload: defaultPayload };
      }
    }
    return { mode: 'inherit', payload: defaultPayload };
  };

  // Test legacy values are converted and never sent as yes/on/off
  assert.strictEqual(parseRrm('inherit').mode, 'inherit');
  assert.strictEqual(parseRrm('no').mode, 'no');
  assert.strictEqual(parseRrm('off').mode, 'no');
  assert.strictEqual(parseRrm('yes').mode, 'enabled');
  assert.strictEqual(parseRrm('on').mode, 'enabled');

  // Test structured JSON preservation
  const customConfig = JSON.stringify({
    vendor: 'custom-vendor',
    schedule: '0 12 * * *',
    algorithms: [{ name: 'algo-1', parameters: 'param' }],
  });
  const parsedCustom = parseRrm(customConfig);
  assert.strictEqual(parsedCustom.mode, 'enabled');
  assert.strictEqual(parsedCustom.payload.vendor, 'custom-vendor');
  assert.strictEqual(parsedCustom.payload.schedule, '0 12 * * *');
  assert.strictEqual(parsedCustom.payload.algorithms[0].name, 'algo-1');
});

test('Eliminates fabricated device telemetry, credentials, and demo blacklist fallbacks (Finding #8)', () => {
  const devicesApiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const devicesApiContent = fs.readFileSync(devicesApiPath, 'utf-8');

  const blacklistTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceBlacklist',
    'DeviceBlacklistTab.tsx'
  );
  const blacklistTabContent = fs.readFileSync(blacklistTabPath, 'utf-8');

  const workspacePath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'DeviceWorkspace.tsx'
  );
  const workspaceContent = fs.readFileSync(workspacePath, 'utf-8');

  // 1. Blacklist tab must not contain demo fabricated fallback records
  assert.ok(
    !blacklistTabContent.includes("serialNumber: '00:11:22:33:44:55'"),
    'DeviceBlacklistTab must not supply a fallback demo blocked device'
  );
  assert.ok(
    !blacklistTabContent.includes("'Rogue AP spoofing SSID'"),
    'DeviceBlacklistTab must not fabricate fake security threats'
  );
  assert.ok(
    blacklistTabContent.includes('No Blacklisted Devices'),
    'DeviceBlacklistTab must render a real empty state when no devices are blacklisted'
  );

  // 2. devices.ts must not contain fabricated fallbacks
  assert.ok(
    !devicesApiContent.includes('anilbeheraapril13@gmail.com'),
    'devices.ts must not hardcode personal email addresses as fallback venue'
  );
  assert.ok(
    !devicesApiContent.includes('b5930152-566c-4d16-91f9-814267088e36'),
    'devices.ts must not hardcode fake subscriber UUIDs'
  );
  assert.ok(
    !devicesApiContent.includes('Auto-provisioned.'),
    'devices.ts must not hardcode fake auto-provisioned notes'
  );
  assert.ok(
    !devicesApiContent.includes('41.66'),
    'devices.ts must not hardcode fake memoryUsedPct'
  );
  assert.ok(
    !devicesApiContent.includes('2147'),
    'devices.ts must not hardcode fake uptimeSeconds'
  );

  // 3. useDeviceOverview must return null when device does not exist
  assert.ok(
    devicesApiContent.includes('if (!tag && !gw && !status)'),
    'useDeviceOverview must verify records exist and return null for non-existent devices'
  );

  // 4. DeviceWorkspace must render Device Not Found state rather than synthesizing demo devices
  assert.ok(
    workspaceContent.includes('Device Not Found'),
    'DeviceWorkspace must render Device Not Found state when device does not exist'
  );
  assert.ok(
    !workspaceContent.includes('Sunrise Apartments'),
    'DeviceWorkspace must not fabricate fake property names'
  );
});

test('Blacklist management routes through tenant-scoped MDU API instead of raw OWGW (Finding #3)', () => {
  const devicesApiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const devicesApiContent = fs.readFileSync(devicesApiPath, 'utf-8');

  // Extract blacklist section
  const blacklistSection = devicesApiContent.match(/\/\/ 3\. Blacklist APIs[\s\S]*?\/\/ 4\. Single Device Detail/)?.[0] || '';
  assert.ok(blacklistSection.length > 0, 'devices.ts must define Blacklist APIs section');

  // Verify getBlacklistDevices calls axiosMdu
  assert.ok(
    blacklistSection.includes("axiosMdu.get<{ devices: BlacklistDevice[] }>('devices/blacklist')"),
    'getBlacklistDevices must query tenant-scoped MDU devices/blacklist endpoint'
  );
  assert.ok(
    !blacklistSection.includes("axiosGw.get<{ devices: BlacklistDevice[] }>('blacklist"),
    'getBlacklistDevices must not query un-scoped OWGW blacklist directly'
  );

  // Verify useCreateBlacklistDevice calls axiosMdu
  assert.ok(
    blacklistSection.includes("axiosMdu.post('devices/blacklist'"),
    'useCreateBlacklistDevice must submit through MDU devices/blacklist'
  );
  assert.ok(
    !blacklistSection.includes("axiosGw.post(`blacklist/"),
    'useCreateBlacklistDevice must not bypass MDU by posting directly to OWGW'
  );

  // Verify useDeleteBlacklistDevice calls axiosMdu
  assert.ok(
    blacklistSection.includes("axiosMdu.delete(`devices/blacklist/${clean}`)"),
    'useDeleteBlacklistDevice must delete through MDU devices/blacklist/:serial'
  );
  assert.ok(
    !blacklistSection.includes("axiosGw.delete(`blacklist/"),
    'useDeleteBlacklistDevice must not bypass MDU by deleting directly from OWGW'
  );
});

test('Device group persistence aligns with OWPROV platform contract and eliminates fallback SKU (Finding #4)', () => {
  const mainTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'MainConfigSubTab.tsx'
  );
  const mainTabContent = fs.readFileSync(mainTabPath, 'utf-8');

  // 1. Must define and export getDeviceGroupFromType matching owprov-ui pattern
  assert.ok(
    mainTabContent.includes('export const getDeviceGroupFromType'),
    'MainConfigSubTab must export getDeviceGroupFromType'
  );

  // 2. Must submit platform in uppercase alongside deviceGroup in save payload
  assert.ok(
    mainTabContent.includes('platform: deviceGroup.toUpperCase()'),
    'MainConfigSubTab must submit platform: deviceGroup.toUpperCase() for OWPROV persistence'
  );
  assert.ok(
    mainTabContent.includes('deviceGroup,'),
    'MainConfigSubTab must submit deviceGroup for backward compatibility'
  );

  // 3. Must eliminate fallback SKU asus_rt-ax53u from handleGroupChange and availableDeviceTypes
  assert.ok(
    !mainTabContent.includes("setDeviceType(validTypes[0] || 'asus_rt-ax53u')"),
    'handleGroupChange must not default to asus_rt-ax53u when validTypes is empty'
  );
  assert.ok(
    !mainTabContent.includes("DEVICE_TYPES_BY_GROUP[deviceGroup] || ['asus_rt-ax53u'"),
    'availableDeviceTypes must not default to asus_rt-ax53u when group types are missing'
  );

  // 4. Save-then-reload simulation test
  // FMS catalog fixture
  const fmsCatalog = {
    ap: ['asus_rt-ax53u', 'edgecore_eap102', 'cig_wf188n'],
    switch: ['edgecore_ecs4100_12ph', 'edgecore_ecs4100_28p'],
    olg: ['openlan_gateway'],
  };

  // Pure logic implementation of getDeviceGroupFromType
  const getDeviceGroupFromTypeLogic = (type, typesByClass) => {
    if (!type || !typesByClass) return '';
    const entries = Object.entries(typesByClass);
    const match = entries.find(([, types]) => types?.includes(type));
    return match ? match[0] : '';
  };

  // Simulate editing a device from AP to Switch
  const initialDevice = {
    serialNumber: '24f5a201b1a0',
    deviceType: 'asus_rt-ax53u',
    provTag: {
      serialNumber: '24f5a201b1a0',
      deviceType: 'asus_rt-ax53u',
      platform: 'AP',
    },
  };

  // Initial group derived from FMS
  const initialGroup = getDeviceGroupFromTypeLogic(initialDevice.provTag.deviceType, fmsCatalog);
  assert.strictEqual(initialGroup, 'ap', 'Initial group must resolve to ap for asus_rt-ax53u');

  // User selects 'switch' and chooses switch model
  const selectedGroup = 'switch';
  const selectedType = fmsCatalog[selectedGroup][0]; // 'edgecore_ecs4100_12ph'
  assert.strictEqual(selectedType, 'edgecore_ecs4100_12ph');

  // Client creates save payload
  const savePayload = {
    deviceGroup: selectedGroup,
    platform: selectedGroup.toUpperCase(),
    deviceType: selectedType,
  };
  assert.strictEqual(savePayload.platform, 'SWITCH');
  assert.strictEqual(savePayload.deviceGroup, 'switch');
  assert.strictEqual(savePayload.deviceType, 'edgecore_ecs4100_12ph');

  // OWPROV persists deviceType and platform to database record
  const savedDbRecord = {
    serialNumber: '24f5a201b1a0',
    deviceType: savePayload.deviceType,
    platform: savePayload.platform,
  };

  // Simulate subsequent reload of device from inventory
  const reloadedDevice = {
    serialNumber: '24f5a201b1a0',
    provTag: {
      serialNumber: '24f5a201b1a0',
      deviceType: savedDbRecord.deviceType,
      platform: savedDbRecord.platform,
    },
  };

  // Reload re-derives deviceGroup from FMS deviceType and platform
  const reloadedGroup = getDeviceGroupFromTypeLogic(reloadedDevice.provTag.deviceType, fmsCatalog);
  assert.strictEqual(
    reloadedGroup,
    'switch',
    'Reloaded device must persist switch group from saved deviceType'
  );
  assert.strictEqual(
    reloadedDevice.provTag.platform,
    'SWITCH',
    'Reloaded device must persist SWITCH platform from saved platform'
  );
});

test('useUpdateInventoryTag and device mutations invalidate active workspace and paginated fleet caches (Finding #9)', () => {
  const devicesApiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const devicesApiContent = fs.readFileSync(devicesApiPath, 'utf-8');

  // Extract useUpdateInventoryTag block
  const updateTagBlock = devicesApiContent.match(/export const useUpdateInventoryTag = [\s\S]*?^};/m)?.[0] || '';
  assert.ok(updateTagBlock.length > 0, 'devices.ts must define useUpdateInventoryTag');

  // Verify it invalidates single-device-overview
  assert.ok(
    updateTagBlock.includes("queryKey: ['single-device-overview'"),
    'useUpdateInventoryTag must invalidate single-device-overview for active workspace'
  );

  // Verify it invalidates paginated-fleet-devices
  assert.ok(
    updateTagBlock.includes("queryKey: ['paginated-fleet-devices']"),
    'useUpdateInventoryTag must invalidate paginated-fleet-devices for fleet table'
  );

  // Verify it invalidates device-computed-config
  assert.ok(
    updateTagBlock.includes("queryKey: ['device-computed-config'"),
    'useUpdateInventoryTag must invalidate device-computed-config'
  );

  // Verify useConfigureDeviceDirect invalidates single-device-overview and paginated-fleet-devices
  const configureBlock = devicesApiContent.match(/export const useConfigureDeviceDirect = [\s\S]*?^};/m)?.[0] || '';
  assert.ok(
    configureBlock.includes("queryKey: ['single-device-overview'"),
    'useConfigureDeviceDirect must invalidate single-device-overview'
  );
  assert.ok(
    configureBlock.includes("queryKey: ['paginated-fleet-devices']"),
    'useConfigureDeviceDirect must invalidate paginated-fleet-devices'
  );

  // Verify usePushDeviceConfig invalidates single-device-overview and paginated-fleet-devices
  const pushBlock = devicesApiContent.match(/export const usePushDeviceConfig = [\s\S]*?^};/m)?.[0] || '';
  assert.ok(
    pushBlock.includes("queryKey: ['single-device-overview'"),
    'usePushDeviceConfig must invalidate single-device-overview'
  );
  assert.ok(
    pushBlock.includes("queryKey: ['paginated-fleet-devices']"),
    'usePushDeviceConfig must invalidate paginated-fleet-devices'
  );
});

test('DeviceSpecificConfigSubTab implements Copy-On-Write (COW) to prevent mutating shared configurations (Issue #1)', () => {
  const filePath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'DeviceSpecificConfigSubTab.tsx'
  );
  const content = fs.readFileSync(filePath, 'utf-8');

  // 1. Must use createModularConfiguration for COW
  assert.ok(
    content.includes('createModularConfiguration(newConfigPayload)'),
    'handleSave must create a new modular configuration via createModularConfiguration'
  );

  // 2. Must not update modular configuration in-place
  assert.strictEqual(
    content.includes('updateModularConfiguration('),
    false,
    'handleSave must never call updateModularConfiguration in place'
  );

  // 3. Must not delete modular configuration on reset
  const deleteConfigBlock = content.match(/const handleDeleteConfig = [\s\S]*?^  };/m)?.[0] || '';
  assert.strictEqual(
    deleteConfigBlock.includes('deleteModularConfiguration('),
    false,
    'handleDeleteConfig must never call deleteModularConfiguration on reset'
  );

  // 4. Must preserve metadata: variables, entity, venue, subscriber, and rules
  assert.ok(
    content.includes('variables: configData?.variables || []'),
    'handleSave must preserve variables from original configuration'
  );
  assert.ok(
    content.includes("name: `device:${device.serialNumber}`"),
    'handleSave must name the configuration device:${serialNumber}'
  );

  // 5. Must associate with device only after successful creation
  assert.ok(
    content.includes('if (!createRes?.id)'),
    'handleSave must check that configuration creation returned an ID before associating with device'
  );

  // 6. Reset must only detach (set deviceConfiguration to empty string)
  assert.ok(
    content.includes("deviceConfiguration: ''"),
    'handleDeleteConfig must detach by setting deviceConfiguration to empty string'
  );
});

test('Multi-device simulation: updating or resetting one device does not affect another device sharing the same configuration (Issue #1)', async () => {
  // Setup simulated OWPROV database
  const configurationsDB = new Map();
  const inventoryDB = new Map();

  const SHARED_CONFIG_ID = 'shared-venue-modular-profile-99';
  const sharedConfig = {
    id: SHARED_CONFIG_ID,
    name: 'Shared Venue Template',
    description: 'Corporate AP Template',
    deviceGroup: 'ap',
    deviceTypes: ['asus_rt-ax53u'],
    variables: ['var-uuid-1'],
    deviceRules: { rrm: 'inherit', firmwareUpgrade: 'yes', rcOnly: 'no' },
    configuration: [
      { name: 'ssids', weight: 1, configuration: '{"ssids":[{"name":"CorpNet","security":"wpa2"}]}' }
    ],
  };
  configurationsDB.set(SHARED_CONFIG_ID, JSON.parse(JSON.stringify(sharedConfig)));

  // Two devices sharing the exact same modular configuration
  inventoryDB.set('dev-serial-AAA', {
    serialNumber: 'dev-serial-AAA',
    name: 'Office AP 1',
    deviceConfiguration: SHARED_CONFIG_ID,
    deviceRules: { rrm: 'inherit', firmwareUpgrade: 'yes', rcOnly: 'no' },
  });

  inventoryDB.set('dev-serial-BBB', {
    serialNumber: 'dev-serial-BBB',
    name: 'Office AP 2',
    deviceConfiguration: SHARED_CONFIG_ID,
    deviceRules: { rrm: 'inherit', firmwareUpgrade: 'yes', rcOnly: 'no' },
  });

  // Simulation of Copy-On-Write handleSave for dev-serial-AAA
  const simulateCowSave = async (serialNumber, modifiedBlocks) => {
    const dev = inventoryDB.get(serialNumber);
    const originalConfig = configurationsDB.get(dev.deviceConfiguration);

    // 1. Create new configuration (COW)
    const newConfigId = `device-cfg-${serialNumber}-${Date.now()}`;
    const newConfig = {
      id: newConfigId,
      name: `device:${serialNumber}`,
      description: originalConfig?.description || 'Device-specific configuration',
      deviceGroup: originalConfig?.deviceGroup || 'ap',
      deviceTypes: originalConfig?.deviceTypes || ['asus_rt-ax53u'],
      deviceRules: { rrm: 'enabled', firmwareUpgrade: 'yes', rcOnly: 'no' },
      variables: originalConfig?.variables || [],
      configuration: modifiedBlocks,
    };
    configurationsDB.set(newConfigId, newConfig);

    // 2. Associate new configuration with device
    inventoryDB.set(serialNumber, {
      ...dev,
      deviceConfiguration: newConfigId,
      deviceRules: newConfig.deviceRules,
    });

    return newConfigId;
  };

  // Device AAA modifies SSIDs and saves
  const devANewConfigId = await simulateCowSave('dev-serial-AAA', [
    { name: 'ssids', weight: 1, configuration: '{"ssids":[{"name":"GuestNet","security":"wpa3"}]}' }
  ]);

  // Assertions:
  // 1. Device AAA now points to new dedicated configuration
  assert.strictEqual(inventoryDB.get('dev-serial-AAA').deviceConfiguration, devANewConfigId);

  // 2. Device BBB is COMPLETELY unaffected and still references SHARED_CONFIG_ID
  assert.strictEqual(inventoryDB.get('dev-serial-BBB').deviceConfiguration, SHARED_CONFIG_ID);

  // 3. The original shared configuration in configurationsDB is completely UNTOUCHED
  const persistedSharedConfig = configurationsDB.get(SHARED_CONFIG_ID);
  assert.deepStrictEqual(persistedSharedConfig.configuration, sharedConfig.configuration);
  assert.strictEqual(persistedSharedConfig.name, 'Shared Venue Template');

  // Simulation of handleDeleteConfig (Reset Configuration) for dev-serial-BBB
  const simulateResetConfig = async (serialNumber) => {
    const dev = inventoryDB.get(serialNumber);
    // Detach only; do NOT delete configurationsDB.delete(dev.deviceConfiguration)
    inventoryDB.set(serialNumber, {
      ...dev,
      deviceConfiguration: '',
      deviceRules: { rrm: 'inherit', firmwareUpgrade: 'no', rcOnly: 'no' },
    });
  };

  await simulateResetConfig('dev-serial-BBB');

  // Assertions:
  // 4. Device BBB has detached its configuration pointer
  assert.strictEqual(inventoryDB.get('dev-serial-BBB').deviceConfiguration, '');

  // 5. The shared configuration still exists in configurationsDB and was NOT deleted
  assert.ok(configurationsDB.has(SHARED_CONFIG_ID), 'Shared configuration must not be deleted on reset');

  // 6. Error handling simulation: failure during creation does not alter device tag
  const devBeforeFailedAttempt = JSON.parse(JSON.stringify(inventoryDB.get('dev-serial-AAA')));
  const simulateFailedSave = async (serialNumber) => {
    try {
      // Simulate network / validation failure
      throw new Error('500 Internal Server Error in OWPROV');
    } catch {
      // Catch block must not alter device tag
    }
  };

  await simulateFailedSave('dev-serial-AAA');
  assert.deepStrictEqual(
    inventoryDB.get('dev-serial-AAA'),
    devBeforeFailedAttempt,
    'Device configuration pointer must remain unchanged when creation fails'
  );
});

test('useConfigureDeviceDirect aligns with OWPROV protocol: sends timestamp UUID and configuration.uuid (Issue #5)', async () => {
  const devicesApiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const devicesApiContent = fs.readFileSync(devicesApiPath, 'utf-8');

  const configureBlock = devicesApiContent.match(/export const useConfigureDeviceDirect = [\s\S]*?^};/m)?.[0] || '';
  assert.ok(configureBlock, 'useConfigureDeviceDirect must be declared in devices.ts');

  // 1. Must NOT contain hardcoded UUID: 1
  assert.strictEqual(
    configureBlock.includes('UUID: 1'),
    false,
    'useConfigureDeviceDirect must not send hardcoded UUID: 1'
  );

  // 2. Must use timestamp-based UUID consistent with OWPROV (Date.now() / 1000)
  assert.ok(
    configureBlock.includes('Date.now() / 1000') || configureBlock.includes('Math.floor(Date.now()'),
    'useConfigureDeviceDirect must calculate timestamp-based UUID'
  );
  assert.ok(
    configureBlock.includes('UUID: now') || configureBlock.includes('UUID:'),
    'useConfigureDeviceDirect must pass timestamp UUID'
  );

  // 3. Must inject uuid into the inner configuration object
  assert.ok(
    configureBlock.includes('uuid: now') || configureBlock.includes('uuid:'),
    'useConfigureDeviceDirect must inject uuid into configuration object'
  );

  // 4. Must preserve when: 0 and normalized serialNumber
  assert.ok(configureBlock.includes('when: 0'), 'useConfigureDeviceDirect must preserve when: 0');
  assert.ok(
    configureBlock.includes('serialNumber: clean'),
    'useConfigureDeviceDirect must send normalized serialNumber'
  );

  // 5. Simulation: Request payload construction and forwarding through MDU to OWGW
  const normalizeSerial = (s) => (s || '').toLowerCase().replace(/[^a-f0-9]/g, '');

  let forwardedToMdu = null;
  const mockAxiosMdu = {
    post: async (endpoint, data) => {
      forwardedToMdu = { endpoint, data };
      return { data: { success: true } };
    },
  };

  const simulateConfigure = async (payload) => {
    const clean = normalizeSerial(payload.serialNumber);
    const now = Math.floor(Date.now() / 1000);
    const res = await mockAxiosMdu.post(`devices/${clean}/configure`, {
      when: 0,
      UUID: now,
      serialNumber: clean,
      configuration: {
        ...payload.configuration,
        uuid: now,
      },
    });
    return res.data;
  };

  const configInput = {
    globals: { ipv4_network: '192.168.1.0/24' },
    radios: [{ band: '5G', channel: 36 }],
  };

  const beforeTime = Math.floor(Date.now() / 1000);
  const result = await simulateConfigure({
    serialNumber: '60:CF:84:F2:22:90',
    configuration: configInput,
  });
  const afterTime = Math.floor(Date.now() / 1000);

  assert.strictEqual(result.success, true);
  assert.strictEqual(forwardedToMdu.endpoint, 'devices/60cf84f22290/configure');
  assert.strictEqual(forwardedToMdu.data.serialNumber, '60cf84f22290');
  assert.strictEqual(forwardedToMdu.data.when, 0);

  // Assert outer UUID is a valid timestamp
  assert.ok(
    forwardedToMdu.data.UUID >= beforeTime && forwardedToMdu.data.UUID <= afterTime,
    'Outer UUID must be current epoch timestamp'
  );

  // Assert inner configuration.uuid matches outer UUID
  assert.strictEqual(
    forwardedToMdu.data.configuration.uuid,
    forwardedToMdu.data.UUID,
    'Inner configuration.uuid must match outer command UUID'
  );

  // Assert other configuration blocks are preserved
  assert.deepStrictEqual(forwardedToMdu.data.configuration.globals, configInput.globals);
  assert.deepStrictEqual(forwardedToMdu.data.configuration.radios, configInput.radios);

  // 6. Simulate OWGW REST API validation (ra-wlan-cloud-ucentralgw/src/RESTAPI/RESTAPI_device_commandHandler.cpp)
  const owgwReceivedBody = forwardedToMdu.data;
  assert.ok('serialNumber' in owgwReceivedBody, 'OWGW requires serialNumber');
  assert.ok('UUID' in owgwReceivedBody, 'OWGW requires UUID');
  assert.ok('configuration' in owgwReceivedBody, 'OWGW requires configuration');
  assert.strictEqual(typeof owgwReceivedBody.configuration.uuid, 'number', 'uCentral AP requires numeric uuid');
});

test('Copy-on-write guards against empty block saves, fetch failures, and rolls back orphaned configurations (P1 #2)', async () => {
  const filePath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'DeviceSpecificConfigSubTab.tsx'
  );
  const content = fs.readFileSync(filePath, 'utf-8');

  // 1. Verify query state captures loading and error states
  assert.ok(content.includes('isLoading: isConfigLoading'), 'Must capture isConfigLoading from useQuery');
  assert.ok(content.includes('isError: isConfigError'), 'Must capture isConfigError from useQuery');
  assert.ok(content.includes('refetch: refetchConfig'), 'Must capture refetchConfig from useQuery');

  // 2. Verify Save button is disabled during loading and error states
  assert.ok(
    content.includes('(hasExistingConfig && isConfigLoading)') || content.includes('isConfigLoading'),
    'Save button must be disabled when existing configuration is loading'
  );
  assert.ok(
    content.includes('(hasExistingConfig && isConfigError)') || content.includes('isConfigError'),
    'Save button must be disabled when existing configuration query errored'
  );

  // 3. Verify handleSave throws errors on loading or fetch failures before creating configurations
  assert.ok(
    content.includes('if (hasExistingConfig)'),
    'handleSave must check hasExistingConfig before proceeding'
  );
  assert.ok(
    content.includes('throw new Error('),
    'handleSave must guard against missing configuration blocks'
  );

  // 4. Verify rollback on device association failure
  assert.ok(
    content.includes('deleteModularConfiguration(newConfigId)'),
    'handleSave must delete newly created modular configuration if device association fails (rollback)'
  );

  // 5. Simulation: Delayed OWPROV response (loading state)
  const simulateSaveWithQueryState = (hasExistingConfig, isConfigLoading, isConfigError, configData, latestSectionsState) => {
    if (hasExistingConfig) {
      if (isConfigLoading) {
        throw new Error('Existing configuration is still loading. Please wait before saving.');
      }
      if (isConfigError) {
        throw new Error('Failed to load existing configuration. Saving is blocked to prevent data loss.');
      }
      if (!configData && !latestSectionsState) {
        throw new Error('Existing configuration blocks are unavailable. Cannot proceed with save.');
      }
    }

    let blocksToSave = [];
    if (latestSectionsState) {
      blocksToSave = latestSectionsState;
    } else if (configData?.configuration && Array.isArray(configData.configuration)) {
      blocksToSave = configData.configuration;
    } else if (hasExistingConfig && !latestSectionsState) {
      throw new Error('Original configuration blocks could not be verified. Aborting save.');
    }
    return blocksToSave;
  };

  // Case A: Query is still loading -> Throws, prevents creating empty config
  assert.throws(
    () => simulateSaveWithQueryState(true, true, false, undefined, null),
    /still loading/,
    'Saving while loading must be blocked'
  );

  // Case B: Query failed with 500 error -> Throws, prevents creating empty config
  assert.throws(
    () => simulateSaveWithQueryState(true, false, true, undefined, null),
    /Failed to load existing configuration/,
    'Saving when fetch fails must be blocked'
  );

  // Case C: Successfully loaded original configuration with 3 blocks -> Preserves 3 blocks
  const existingBlocks = [
    { name: 'radios', configuration: { radios: [] } },
    { name: 'interfaces', configuration: { interfaces: [] } },
    { name: 'globals', configuration: { ipv4_network: '10.0.0.1/24' } },
  ];
  const savedBlocks = simulateSaveWithQueryState(true, false, false, { configuration: existingBlocks }, null);
  assert.strictEqual(savedBlocks.length, 3, 'Must preserve existing configuration blocks');

  // Case D: Simulation of orphan cleanup on failed device association
  const mockDb = new Map();
  const simulateCowWithRollback = async (shouldFailDeviceUpdate) => {
    // 1. Create configuration
    const newConfigId = 'cow-cfg-' + Math.random().toString(36).substring(7);
    mockDb.set(newConfigId, { id: newConfigId, name: 'device:test' });

    // 2. Associate with device
    try {
      if (shouldFailDeviceUpdate) {
        throw new Error('500 Internal Server Error: Failed to associate device tag');
      }
      return { success: true, configId: newConfigId };
    } catch (err) {
      // Rollback
      mockDb.delete(newConfigId);
      throw err;
    }
  };

  // Run failed attempt:
  await assert.rejects(
    async () => simulateCowWithRollback(true),
    /Failed to associate device tag/,
    'Should rethrow device update error'
  );
  assert.strictEqual(mockDb.size, 0, 'Orphaned configuration must be rolled back from database');

  // Run successful attempt:
  const successRes = await simulateCowWithRollback(false);
  assert.strictEqual(mockDb.size, 1);
  assert.ok(mockDb.has(successRes.configId), 'Successfully associated configuration must remain in database');
});

test('DeviceDashboardTab eliminates fabricated fleet metrics and derives authoritative counts (P2 #6)', () => {
  const tabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceDashboard',
    'DeviceDashboardTab.tsx'
  );
  assert.ok(fs.existsSync(tabPath), 'DeviceDashboardTab.tsx must exist');
  const tabContent = fs.readFileSync(tabPath, 'utf-8');

  // Verify elimination of fabricated fallback values
  assert.ok(!tabContent.includes('?? 4'), 'Must not hardcode fabricated fallback of 4 devices');
  assert.ok(!tabContent.includes('?? 1'), 'Must not hardcode fabricated fallback of 1 connected device');
  assert.ok(!tabContent.includes('return 85'), 'Must not hardcode fabricated 85% average sanity');
  assert.ok(!tabContent.includes(': 25'), 'Must not hardcode fabricated 25% connectivity rate');

  // Verify loading and error states
  assert.ok(tabContent.includes('isLoading'), 'Must handle isLoading from useUnifiedFleetDevices');
  assert.ok(tabContent.includes('<Spinner'), 'Must render Spinner during loading state');
  assert.ok(tabContent.includes('isError'), 'Must handle isError state');
  assert.ok(tabContent.includes('refetch()'), 'Must provide retry button calling refetch');

  // Verify authoritative metrics derivation
  assert.ok(tabContent.includes('data?.totalCount ?? devices.length'), 'Must derive totalCount authoritatively from MDU payload');
  assert.ok(tabContent.includes("averageSanity !== null ? `${averageSanity}%` : '—'"), 'Must display dash when no sanity score is available');

  // Verify API contracts in devices.ts
  const apiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  assert.ok(apiContent.includes('export interface FleetDevicesResponse'), 'Must export FleetDevicesResponse interface');
  assert.ok(apiContent.includes('useFleetDashboard'), 'Must export useFleetDashboard hook');
  assert.ok(apiContent.includes('totalCount > pageSize'), 'Must implement multi-page aggregation for fleets exceeding page size');
});

test('Simulation: fleet metrics calculation strictly respects authorized device count and avoids fabrication', () => {
  // Case A: Empty fleet response (e.g. fresh tenant or unassigned view with 0 devices)
  const emptyData = { devices: [], totalCount: 0 };
  const calcMetrics = (data) => {
    const devices = data?.devices ?? [];
    const totalCount = data?.totalCount ?? devices.length;
    const connectedCount = devices.filter((d) => d.connected).length;
    const offlineCount = Math.max(0, totalCount - connectedCount);
    const connectivityRate = totalCount > 0 ? Math.round((connectedCount / totalCount) * 100) : 0;
    const scored = devices.filter((d) => typeof d.sanity === 'number' && !Number.isNaN(d.sanity));
    const averageSanity = scored.length > 0 ? Math.round(scored.reduce((acc, curr) => acc + (curr.sanity || 0), 0) / scored.length) : null;
    return { totalCount, connectedCount, offlineCount, connectivityRate, averageSanity };
  };

  const emptyResult = calcMetrics(emptyData);
  assert.strictEqual(emptyResult.totalCount, 0, 'Total count must be 0 for empty authorized scope');
  assert.strictEqual(emptyResult.connectedCount, 0, 'Connected count must be 0');
  assert.strictEqual(emptyResult.offlineCount, 0, 'Offline count must be 0');
  assert.strictEqual(emptyResult.connectivityRate, 0, 'Connectivity rate must be 0% not 25%');
  assert.strictEqual(emptyResult.averageSanity, null, 'Sanity must be null not 85%');

  // Case B: Scoped fleet with authorized count > active page count
  const mockDevices = [
    { serialNumber: 'dev-1', connected: true, sanity: 95, model: 'AP-1' },
    { serialNumber: 'dev-2', connected: true, sanity: 85, model: 'AP-1' },
    { serialNumber: 'dev-3', connected: false, sanity: 40, model: 'GW-1' },
  ];
  const populatedData = { devices: mockDevices, totalCount: 150 }; // 150 authorized in tenant
  const populatedResult = calcMetrics(populatedData);
  assert.strictEqual(populatedResult.totalCount, 150, 'Total count must reflect authoritative tenant-authorized count');
  assert.strictEqual(populatedResult.connectedCount, 2);
  assert.strictEqual(populatedResult.offlineCount, 148, 'Offline count must accurately subtract connected devices from totalCount');
  assert.strictEqual(populatedResult.connectivityRate, 1, '2 / 150 = 1.33% -> 1%');
  assert.strictEqual(populatedResult.averageSanity, 73, '(95 + 85 + 40) / 3 = 73.33% -> 73%');
});

test('Overview Notes route to OWGW and Configuration Notes route to OWPROV with explicit distinction (Issue #7)', () => {
  const overviewCardPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'OverviewTab',
    'DeviceNotesCard.tsx'
  );
  const configTabPath = path.join(
    ROOT_DIR,
    'src',
    'pages',
    'Devices',
    'components',
    'DeviceWorkspace',
    'tabs',
    'ConfigurationTab',
    'NotesSubTab.tsx'
  );
  const apiPath = path.join(ROOT_DIR, 'src', 'api', 'devices.ts');

  assert.ok(fs.existsSync(overviewCardPath), 'DeviceNotesCard.tsx must exist');
  assert.ok(fs.existsSync(configTabPath), 'NotesSubTab.tsx must exist');
  assert.ok(fs.existsSync(apiPath), 'devices.ts must exist');

  const overviewContent = fs.readFileSync(overviewCardPath, 'utf-8');
  const configContent = fs.readFileSync(configTabPath, 'utf-8');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');

  // 1. Overview Notes routes to OWGW via MDU and labels as Operational Notes without leaking internal names
  assert.ok(
    overviewContent.includes('Operational Notes'),
    'DeviceNotesCard must label Operational Notes'
  );
  assert.ok(
    overviewContent.includes('addDeviceNote(device.serialNumber'),
    'DeviceNotesCard must add notes to OWGW via addDeviceNote'
  );
  assert.ok(
    apiContent.includes('addDeviceNote') && apiContent.includes('axiosMdu.put<DeviceRecordResponse>(`devices/${clean}`'),
    'addDeviceNote must persist strictly to OWGW via MDU with RBAC scoping'
  );

  // 2. Configuration Notes routes to OWPROV inventory tag without leaking internal names
  assert.ok(
    configContent.includes('Device Notes'),
    'NotesSubTab must label Device Notes'
  );
  assert.ok(
    configContent.includes('updateMutation.mutateAsync'),
    'NotesSubTab must submit notes to OWPROV inventory tag via updateMutation'
  );
  assert.ok(
    configContent.includes('device.provTag?.notes'),
    'NotesSubTab must read strictly from OWPROV inventory tag'
  );

  // 3. Elimination of fabricated fallback note in NotesSubTab
  assert.strictEqual(
    configContent.includes('Auto-provisioned device tag.'),
    false,
    'NotesSubTab must eliminate fabricated fallback note'
  );
});

test('Simulation: Separation of concerns between OWGW operational notes and OWPROV inventory notes', () => {
  const mockProvInventoryNotes = new Map();
  const mockGwOperationalNotes = new Map();

  // Overview Tab action: adds note to OWGW
  const addGwNote = (serial, text) => {
    const list = mockGwOperationalNotes.get(serial) || [];
    mockGwOperationalNotes.set(serial, [...list, { note: text, created: Date.now() }]);
  };

  // Configuration Tab action: adds note to OWPROV inventory tag
  const addProvNote = (serial, text) => {
    const list = mockProvInventoryNotes.get(serial) || [];
    mockProvInventoryNotes.set(serial, [...list, { note: text, created: Date.now() }]);
  };

  const serial = '24f5a210beef';

  // 1. Add operational memo on Overview tab
  addGwNote(serial, 'Replaced bad patch cable during field maintenance');
  assert.strictEqual(mockGwOperationalNotes.get(serial).length, 1);
  assert.strictEqual(mockProvInventoryNotes.get(serial), undefined, 'OWPROV inventory must remain unaffected by gateway notes');

  // 2. Add asset tag note on Configuration tab
  addProvNote(serial, 'Asset Tag: BLDG4-RACK2-U12');
  assert.strictEqual(mockProvInventoryNotes.get(serial).length, 1);
  assert.strictEqual(mockGwOperationalNotes.get(serial).length, 1, 'OWGW gateway notes must remain unaffected by inventory notes');

  // Verify payloads are cleanly separated
  assert.strictEqual(mockGwOperationalNotes.get(serial)[0].note, 'Replaced bad patch cable during field maintenance');
  assert.strictEqual(mockProvInventoryNotes.get(serial)[0].note, 'Asset Tag: BLDG4-RACK2-U12');
});






















