export type SubsectionKey =
  | 'globals'
  | 'unit'
  | 'metrics'
  | 'services'
  | 'radios'
  | 'interfaces'
  | 'third-party';

export interface SectionMeta {
  name: string;
  description: string;
  weight: number;
}

export interface GlobalsSectionData {
  meta: SectionMeta;
  ipv4Network: string;
  ipv6Network: string;
}

export interface UnitSectionData {
  meta: SectionMeta;
  name: string;
  location: string;
  hostname?: string;
  timezone?: string;
  ledsActive: boolean;
  randomPassword: boolean;
  beaconAdvertisement?: {
    enabled: boolean;
    deviceName: string;
    deviceSerial: string;
    networkId: number;
  };
}

export interface MetricsSectionData {
  meta: SectionMeta;
  activeSubsections: string[]; // 'dhcp-snooping' | 'health' | 'realtime' | 'statistics' | 'telemetry' | 'wifi-frames' | 'wifi-scan'
  dhcpSnooping: {
    filters: string[];
  };
  health: {
    interval: number;
    dhcpLocal: boolean;
    dhcpRemote: boolean;
    dnsLocal: boolean;
    dnsRemote: boolean;
  };
  statistics: {
    interval: number;
    types: string[];
  };
  realtime: {
    types: string[];
  };
  wifiScan: {
    interval: number;
  };
  wifiFrames: {
    filters: string[];
  };
  telemetry: {
    interval: number;
    types: string[];
  };
}

export interface ServicesSectionData {
  meta: SectionMeta;
  activeSubsections: string[];
  airtimePolicies: {
    dnsMatch: string[];
    dnsWeight: number;
  };
  dataPlane: {
    ingressFilters: { name: string; program: string }[];
  };
  facebookWifi: {
    vendorId: string;
    gatewayId: string;
    secret: string;
  };
  fingerprint: {
    mode: 'always' | 'polled' | 'final' | 'raw-data';
    minimumAge: number;
    maximumAge: number;
    periodicity: number;
  };
  dhcpRelay: {
    selectPorts: string[];
    vlans: { vlan: number; relayServer: string; circuitIdFormat: string; remoteIdFormat: string }[];
  };
  gps: {
    baudRate: number;
    adjustTime: boolean;
  };
  http: {
    httpPort: number;
  };
  ieee8021x: {
    useLocalCertificates: boolean;
    caCertificate: string;
    caCertificateFilename?: string;
    privateKey: string;
    privateKeyFilename?: string;
    serverCertificate: string;
    serverCertificateFilename?: string;
    users: { mac: string; userName: string; vlanId: number; password: string }[];
  };
  igmp: {
    enable: boolean;
  };
  lldp: {
    describe: string;
    location: string;
  };
  log: {
    host: string;
    port: number;
    proto: 'udp' | 'tcp';
    size: number;
  };
  mdns: {
    enable: boolean;
  };
  ntp: {
    servers: string[];
    localServer: boolean;
  };
  onlineCheck: {
    action: string[] | string;
    pingHosts: string[];
    downloadHosts: string[];
    checkInterval: number;
    checkThreshold: number;
  };
  openFlow: {
    controller: string;
    mode: string;
    caCertificate: string;
    caCertificateFilename?: string;
    privateKey: string;
    privateKeyFilename?: string;
    sslCertificate: string;
    sslCertificateFilename?: string;
  };
  qualityOfService: {
    selectPorts: string[];
    bandwidthUp: number;
    bandwidthDown: number;
    bulkDetection: boolean;
    bulkDetectionDscp?: string;
    bulkDetectionPacketsPerSecond?: number;
    classifier: {
      dscp: string;
      ports: {
        protocol: string;
        port: number;
        rangeEnd: number;
        reclassify: boolean;
      }[];
      dns: {
        fqdn: string;
        suffixMatching: boolean;
        reclassify: boolean;
      }[];
    }[];
  };
  radiusProxy: {
    realms: {
      realm: string;
      port: number;
      autoDiscover: boolean;
      secret: string;
      useLocalCertificates: boolean;
      caCertificate?: string;
      caCertificateFilename?: string;
      certificate?: string;
      certificateFilename?: string;
      privateKey?: string;
      privateKeyFilename?: string;
      privateKeyPassword?: string;
    }[];
  };
  rtty: {
    host: string;
    port: number;
    token: string;
  };
  ssh: {
    port: number;
    passwordAuthentication: boolean;
  };
  wifiSteering: {
    mode: 'local' | 'cloud';
    assocSteering: boolean;
    autoChannel: boolean;
    requiredProbeSnr: number;
    requiredRoamSnr: number;
    loadKickThreshold: number;
  };
}

export interface SingleRadioConfigItem {
  id: string;
  band: '2G' | '5G' | '5G-lower' | '5G-upper' | '6G';
  bandwidth: number;
  country: string;
  channelMode: string;
  channelWidth: number;
  channel: string;
  mimo: string;
  txPower: number;
  legacyRates: boolean;
  maximumClients: number;
  multipleBssid: boolean;
  // Advanced Settings
  allowDfs: boolean;
  beaconRate: string;
  beaconInterval: number;
  hostapdIfaceRaw: string;
  multicast: string;
  ema: boolean;
  bssColor?: number;
  requireMode: string;
}

export interface RadiosSectionData {
  meta: SectionMeta;
  bands: SingleRadioConfigItem[];
}

export interface SsidMultiPskItem {
  mac?: string;
  key: string;
  vlanId: number;
}

export interface SingleSsidConfigItem {
  id: string;
  name: string;
  resource?: string;
  bssMode: 'ap' | 'sta' | 'mesh' | 'wds-ap' | 'wds-sta';
  wifiBands: ('2G' | '5G' | '5G-lower' | '5G-upper' | '6G')[];
  encryption: {
    proto: string;
    key?: string;
    ieee80211w?: 'disabled' | 'optional' | 'required';
    keyCaching?: boolean;
  };
  radius?: {
    server?: string;
    port?: number;
    secret?: string;
    accountingServer?: string;
    accountingPort?: number;
    accountingSecret?: string;
  };
  passPoint?: {
    enabled?: boolean;
    venueName?: string[];
    venueUrl?: string[];
    domainName?: string[];
  };
  advanced: {
    hiddenSsid: boolean;
    services?: string[];
    maximumClients?: number;
    filsDiscoveryInterval?: number;
    purpose?: string;
    dtimPeriod?: number;
    isolateClients: boolean;
    powerSave?: boolean;
    broadcastTime?: boolean;
    unicastConversion?: boolean;
    proxyArp?: boolean;
    disassocLowAck?: boolean;
    vendorElements?: string;
    tipInformationElement?: boolean;
    multiPsk?: SsidMultiPskItem[];
    rrm?: boolean;
  };
  rateLimit?: {
    enabled?: boolean;
    ingressRate?: number;
    egressRate?: number;
  };
  rrm?: {
    enabled?: boolean;
    neighborReporting?: boolean;
    lci?: string;
    civicLocation?: string;
    ftmResponder?: boolean;
    stationaryAp?: boolean;
  };
  captivePortal?: {
    mode?: string;
    walledGardenFqdn?: string[];
    walledGardenIpaddr?: string[];
    idleTimeout?: number;
    sessionTimeout?: number;
  };
  accessControlList?: {
    enabled?: boolean;
    mode?: 'allow' | 'deny';
    macAddress?: string[];
  };
  roaming?: {
    state?: 'on' | 'off' | 'custom';
    messageExchange?: 'air' | 'ds';
    generatePsk?: boolean;
    domainIdentifier?: string;
    pmkR0KeyHolder?: string;
    pmkR1KeyHolder?: string;
  };
}

export interface InterfaceEthernetItem {
  selectPorts: string[];
  macaddr?: string;
  multicast: boolean;
  learning: boolean;
  isolate?: boolean;
  reversePath: boolean;
  vlanTag: 'auto' | 'tagged' | 'un-tagged' | string;
}

export interface DhcpReservedAddressItem {
  macaddr: string;
  staticLeaseOffset?: number;
  leaseTime: string;
  publishHostname: boolean;
}

export interface SingleInterfaceConfigItem {
  id: string;
  name: string;
  role: 'upstream' | 'downstream';
  selectPorts: string[];
  ethernet?: InterfaceEthernetItem[];
  isolateHosts: boolean;
  services: string[];
  hostapdBssRaw?: string;
  ipv4: {
    addressing: 'dynamic' | 'static' | 'none';
    resource?: string;
    subnet?: string;
    gateway?: string;
    sendHostname?: boolean;
    useDns?: string[];
    dhcpServer?: boolean;
    dhcp?: {
      leaseFirst?: number;
      leaseCount?: number;
      leaseTime?: string;
      relayServer?: string;
      circuitIdFormat?: string;
      remoteIdFormat?: string;
      reservedAddresses?: DhcpReservedAddressItem[];
    };
    dns?: string[];
    leaseFirst?: number;
    leaseCount?: number;
    leaseTime?: string;
  };
  ipv6: {
    addressing: 'dynamic' | 'static' | 'none';
    resource?: string;
    subnet?: string;
    gateway?: string;
    prefixSize?: number;
    dhcpv6?: {
      enabled?: boolean;
      mode?: 'hybrid' | 'stateless' | 'stateful' | 'relay';
      announceDns?: string[];
      filterPrefix?: string;
    };
  };
  vlan: {
    enabled: boolean;
    resource?: string;
    id?: number;
  };
  tunnel: {
    proto?: string;
    resource?: string;
    peer?: string;
  };
  ssids: SingleSsidConfigItem[];
}

export interface InterfacesSectionData {
  meta: SectionMeta;
  interfaces: SingleInterfaceConfigItem[];
}

export interface ThirdPartySectionData {
  meta: SectionMeta;
  customProperties?: Record<string, unknown>;
  configuration?: string;
}

export interface ConfigurationSectionsState {
  activeSections: SubsectionKey[];
  globals: GlobalsSectionData;
  unit: UnitSectionData;
  metrics: MetricsSectionData;
  services: ServicesSectionData;
  radios: RadiosSectionData;
  interfaces: InterfacesSectionData;
  thirdParty: ThirdPartySectionData;
}
