export type DevicesMainTab = 'all' | 'dashboard' | 'blacklist';
export type DeviceWorkspaceTab = 'overview' | 'configuration' | 'activity';
export type DeviceConfigSubTab = 'main' | 'special' | 'computed' | 'overrides' | 'notes' | 'state';

export interface DeviceNote {
  created?: number;
  note: string;
  createdBy?: string;
  author?: string;
}

export interface DeviceRules {
  rrm?: 'inherit' | 'on' | 'off' | string;
  rcOnly?: 'inherit' | 'yes' | 'no' | string;
  firmwareUpgrade?: 'inherit' | 'yes' | 'no' | string;
}

export interface InventoryTagExtendedInfo {
  venue?: {
    id: string;
    name: string;
    description?: string;
  };
  entity?: {
    id: string;
    name: string;
    description?: string;
  };
  subscriber?: {
    id: string;
    email?: string;
    description?: string;
  };
  deviceConfiguration?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface InventoryTagApiResponse {
  serialNumber: string;
  name: string;
  description?: string;
  deviceType?: string;
  deviceGroup?: string;
  devClass?: string;
  entity?: string;
  venue?: string;
  subscriber?: string;
  deviceConfiguration?: string;
  deviceRules?: DeviceRules;
  doNotAllowOverrides?: boolean;
  notes?: DeviceNote[];
  state?: string;
  qrCode?: string;
  realMacAddress?: string;
  tags?: string[];
  created?: number;
  modified?: number;
  extendedInfo?: InventoryTagExtendedInfo;
}

export interface GatewayDeviceApiResponse {
  serialNumber: string;
  UUID?: number;
  macAddress?: string;
  devicePassword?: string;
  deviceType?: string;
  manufacturer?: string;
  compatible?: string;
  firmware?: string;
  entity?: string;
  venue?: string;
  subscriber?: string;
  owner?: string;
  locale?: string;
  location?: string;
  hasGPS?: boolean;
  hasRADIUSSessions?: number | boolean;
  createdTimestamp?: number;
  modified?: number;
  lastContact?: number | string;
  lastRecordedContact?: number;
  lastConfigurationChange?: number;
  lastConfigurationDownload?: number;
  lastFWUpdate?: number;
  fwUpdatePolicy?: string;
  certificateExpiryDate?: number;
  blackListed?: boolean;
  simulated?: boolean;
  restrictedDevice?: boolean;
  notes?: DeviceNote[];
  state?: string;
  configuration?: unknown;
}

export interface DeviceWithStatusApiResponse {
  serialNumber: string;
  UUID?: number;
  macAddress?: string;
  devicePassword?: string;
  deviceType: 'ap' | 'switch' | 'olg' | string;
  manufacturer?: string;
  compatible?: string;
  firmware?: string;
  connected: boolean;
  connectReason?: string;
  sanity?: number;
  memoryUsed?: number;
  load?: number;
  temperature?: number;
  ipAddress?: string;
  rxBytes?: number;
  txBytes?: number;
  associations_2G?: number;
  associations_5G?: number;
  associations_6G?: number;
  lastContact?: number | string;
  lastRecordedContact?: number;
  lastFWUpdate?: number;
  started?: number;
  locale?: string;
  blackListed?: boolean;
  simulated?: boolean;
  restrictedDevice?: boolean;
  certificateExpiryDate?: number;
  certificateIssuerName?: string;
  verifiedCertificate?: string;
  hasGPS?: boolean;
  hasRADIUSSessions?: number | boolean;
  entity?: string;
  venue?: string;
  subscriber?: string;
  notes?: DeviceNote[];
  state?: string;
  createdTimestamp?: number;
  modified?: number;
}

export interface DeviceRadioStat {
  active_ms?: number;
  busy_ms?: number;
  receive_ms?: number;
  transmit_ms?: number;
  channel?: number;
  band?: string[];
  channel_width?: string;
  noise?: number;
  phy?: string;
  temperature?: number;
  tx_power?: number;
  frequency?: number[];
  survey?: Array<{
    busy: number;
    frequency: number;
    noise: number;
    time: number;
    time_rx: number;
    time_tx: number;
  }>;
}

export interface DeviceClientAssociation {
  station: string;
  bssid?: string;
  ssid?: string;
  rssi?: number;
  mode?: string;
  ipaddr_v4?: string;
  dynamic_vlan?: number;
  fingerprint?: Record<string, unknown>;
  rx_bytes?: number;
  tx_bytes?: number;
  rx_duration?: number;
  tx_duration?: number;
  rx_rate?: {
    bitrate: number;
    chwidth: number;
    mcs?: number;
    nss?: number;
    he?: boolean;
  };
  tx_rate?: {
    bitrate: number;
    chwidth: number;
    mcs?: number;
    nss?: number;
    he?: boolean;
  };
  vendor?: string;
  ips?: {
    ipv4?: string[];
    ipv6?: string[];
  };
}

export interface DeviceInterfaceStat {
  name: string;
  location?: string;
  uptime?: number;
  clients?: Array<{
    mac?: string;
    ipv4_addresses?: string[];
    ipv6_addresses?: string[];
    ports?: string[];
  }>;
  counters?: {
    rx_bytes?: number;
    tx_bytes?: number;
    rx_packets?: number;
    tx_packets?: number;
    rx_dropped?: number;
    tx_dropped?: number;
    rx_errors?: number;
    tx_errors?: number;
    collisions?: number;
    multicast?: number;
  };
  'counters-aggregate'?: {
    rx_bytes: number;
    tx_bytes: number;
    rx_packets: number;
    tx_packets: number;
  };
  ssids?: Array<{
    ssid: string;
    mode?: string;
    phy?: string;
    bssid?: string;
    associations?: DeviceClientAssociation[];
    counters?: {
      rx_bytes?: number;
      tx_bytes?: number;
      rx_packets?: number;
      tx_packets?: number;
    };
    radio?: {
      $ref?: string;
    };
  }>;
}

export interface DeviceStatisticsPayload {
  unit?: {
    localtime?: number;
    uptime?: number;
    load?: [number, number, number];
    memory?: {
      total: number;
      free: number;
      cached: number;
      buffered: number;
      used?: number;
    };
  };
  radios?: DeviceRadioStat[];
  interfaces?: DeviceInterfaceStat[];
  dynamic_vlans?: Array<{
    vid: string | number;
    rx_bytes?: number;
    tx_bytes?: number;
    rx_packets?: number;
    tx_packets?: number;
  }>;
  'link-state'?: {
    downstream?: Record<string, { carrier?: number; speed?: number; duplex?: string }>;
    upstream?: Record<string, { carrier?: number; speed?: number; duplex?: string }>;
  };
}

export interface DeviceStatisticsFrame {
  recorded: number;
  UUID?: string;
  data: DeviceStatisticsPayload;
}

/**
 * Unified fleet item combining static inventory metadata with live gateway telemetry.
 */
export interface UnifiedFleetDevice {
  serialNumber: string;
  name: string;
  description?: string;
  model: string;
  deviceGroup: 'ap' | 'switch' | 'olg' | string;
  deviceType: string;
  connected: boolean;
  sanity: number;
  ipAddress: string;
  macAddress?: string;
  locale?: string;
  revision?: string;
  certificateExpiry?: number;
  certificateExpiryDate?: number;
  memoryUsed?: number;
  memoryUsedPct?: number;
  load?: number;
  temperature?: number;
  firmware: string;
  uptimeSeconds?: number;
  started?: number;
  lastContact?: number;
  lastContactText?: string;
  lastContactTimestamp?: number;
  lastRecordedContact?: number;
  lastFWUpdate?: number;
  connectReason?: string;
  certificateIssuerName?: string;
  manufacturer?: string;
  devicePassword?: string;
  createdTimestamp?: number;
  modified?: number;
  notes?: DeviceNote[];
  state?: string;
  unitLoad?: [number, number, number] | number[];
  unitUptime?: number;
  unitLocaltime?: number;
  unitMemoryTotal?: number;
  unitMemoryFree?: number;
  entityId?: string;
  entityName?: string;
  venueId?: string;
  venueName?: string;
  subscriberId?: string;
  subscriberEmail?: string;
  configId?: string;
  configName?: string;
  compatible?: string;
  configuration?: Record<string, unknown>;
  blacklisted: boolean;
  simulated: boolean;
  restricted: boolean;
  associationsTotal: number;
  associations_2G: number;
  associations_5G: number;
  associations_6G: number;
  hasRADIUSSessions?: number | boolean;
  hasGPS?: boolean;
  rxBytes: number;
  txBytes: number;
  lastStats?: {
    raw?: DeviceStatisticsPayload;
  };
  provTag?: InventoryTagApiResponse;
  gwDevice?: GatewayDeviceApiResponse;
  rawStatus?: DeviceWithStatusApiResponse;
}

export interface PaginatedFleetResponse {
  devices: UnifiedFleetDevice[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export interface FleetFetchOptions {
  pageIndex?: number;
  pageSize?: number;
  unassignedOnly?: boolean;
}

export interface DeviceDashboardApiResponse {
  snapshot?: number;
  numberOfDevices?: number;
  healths?: Record<string, number>;
  memoryUsed?: Record<string, number>;
  upTimes?: Record<string, number>;
  vendors?: Record<string, number>;
  associations?: {
    '2G'?: number;
    '5G'?: number;
    '6G'?: number;
    [k: string]: number | undefined;
  };
  deviceType?: Record<string, number>;
  commands?: {
    completed?: number;
    failed?: number;
    pending?: number;
    [k: string]: number | undefined;
  };
  certificates?: {
    valid?: number;
    expiringSoon?: number;
    expired?: number;
    [k: string]: number | undefined;
  };
}

export interface BlacklistDevice {
  serialNumber: string;
  reason: string;
  author?: string;
  created?: number;
}

export interface DeviceHealthCheck {
  UUID?: string;
  recorded: number;
  sanity?: number;
  test?: string;
  status?: 'PASSED' | 'WARNING' | 'FAILED' | string;
  timestamp?: number;
  details?: string;
  values?: Record<string, unknown>;
}

export interface DeviceCommandHistory {
  UUID?: string;
  id?: string;
  command: string;
  status: string;
  submitted: number;
  submittedBy?: string;
  executed?: number;
  completed?: number;
  executionTime?: number;
  errorCode?: number;
  errorText?: string;
  serialNumber?: string;
  details?: Record<string, unknown>;
  results?: {
    serial?: string;
    status?: {
      error?: number;
      resultCode?: number;
      resultText?: string;
      text?: string;
    };
    [k: string]: unknown;
  };
}

export interface DeviceLog {
  UUID?: string;
  id?: number | string;
  recorded: number;
  log: string;
  logType: number; // 0=Syslog, 1=Crash, 2=Reboot
  severity: number;
  data?: Record<string, unknown>;
}

export interface ComputedConfigurationExplanation {
  action?: string;
  'from-name'?: string;
  path?: string;
  reason?: string;
  [k: string]: unknown;
}

export interface ComputedConfigurationResponse {
  config: Record<string, unknown> | 'none';
  explanation?: Partial<ComputedConfigurationExplanation>[];
}

export interface ConfigurationOverride {
  parameterName: string;
  parameterType: 'string' | 'boolean' | 'integer' | string;
  parameterValue: string;
  source?: string;
  reason?: string;
  modified?: number;
}

export interface ConfigurationOverridesResponse {
  serialNumber: string;
  managementPolicy?: string;
  overrides: ConfigurationOverride[];
}

export interface DeviceCapabilitiesResponse {
  serialNumber: string;
  firstUpdate?: number;
  lastUpdate?: number;
  capabilities?: Record<string, unknown>;
}

export interface RadiusSession {
  serialNumber: string;
  userName: string;
  callingStationId: string;
  accountingSessionId?: string;
  accountingMultiSessionId?: string;
  started?: number;
  sessionTime?: number;
  inputOctets?: number;
  outputOctets?: number;
  inputPackets?: number;
  outputPackets?: number;
  destination?: string;
}

/**
 * Normalizes device platform type into 'ap' | 'switch' | 'olg'
 * aligned with OpenWiFi Gateway (OWGW) convention.
 */
export const normalizePlatformDeviceType = (
  gwType?: string,
  devClass?: string,
  tagDeviceType?: string,
  model?: string,
): 'ap' | 'switch' | 'olg' => {
  const candidates = [gwType, devClass, tagDeviceType, model]
    .filter(Boolean)
    .map((s) => (s as string).toLowerCase().trim());

  for (const c of candidates) {
    if (c === 'olg' || c === 'gateway') return 'olg';
    if (c === 'switch') return 'switch';
    if (c === 'ap') return 'ap';
  }

  for (const c of candidates) {
    if (c.includes('olg') || c.includes('gateway')) return 'olg';
    if (c.includes('switch') || c.includes('ecs')) return 'switch';
  }

  return 'ap';
};
