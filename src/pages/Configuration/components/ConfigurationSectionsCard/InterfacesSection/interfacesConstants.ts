import type { SingleInterfaceConfigItem, SingleSsidConfigItem } from '../types';

export const INTERFACE_SERVICES = [
  'dhcp-snooping',
  'http',
  'ieee8021x',
  'igmp',
  'lldp',
  'mdns',
  'ntp',
  'ssh',
  'vxlan-overlay',
  'wireguard-overlay',
];

export const WIFI_BANDS: ('2G' | '5G' | '5G-lower' | '5G-upper' | '6G')[] = [
  '2G',
  '5G',
  '5G-lower',
  '5G-upper',
  '6G',
];

export const INTERFACE_ROLES = [
  { value: 'upstream', label: 'upstream' },
  { value: 'downstream', label: 'downstream' },
];

export const IPV4_ADDRESSING_OPTIONS = [
  { value: 'dynamic', label: 'dynamic (DHCP)' },
  { value: 'static', label: 'static' },
  { value: 'none', label: 'none' },
];

export const IPV6_ADDRESSING_OPTIONS = [
  { value: 'none', label: 'none' },
  { value: 'dynamic', label: 'dynamic' },
  { value: 'static', label: 'static' },
];

export const SSID_BSS_MODES = [
  { value: 'ap', label: 'ap' },
  { value: 'sta', label: 'sta' },
  { value: 'mesh', label: 'mesh' },
  { value: 'wds-ap', label: 'wds-ap' },
  { value: 'wds-sta', label: 'wds-sta' },
];

export const ENCRYPTION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'psk', label: 'WPA-PSK' },
  { value: 'psk2', label: 'WPA2-PSK' },
  { value: 'psk2-radius', label: 'PSK2-RADIUS' },
  { value: 'psk-mixed', label: 'WPA-PSK/WPA2-PSK Personal Mixed' },
  { value: 'wpa', label: 'WPA-Enterprise' },
  { value: 'wpa2', label: 'WPA2-Enterprise EAP-TLS' },
  { value: 'wpa-mixed', label: 'WPA-Enterprise-Mixed' },
  { value: 'sae', label: 'SAE' },
  { value: 'sae-mixed', label: 'WPA2/WPA3 Transitional' },
  { value: 'wpa3', label: 'WPA3-Enterprise EAP-TLS' },
  { value: 'wpa3-192', label: 'WPA3-192-Enterprise EAP-TLS' },
  { value: 'wpa3-mixed', label: 'WPA3-Enterprise-Mixed' },
  { value: 'owe', label: 'OWE' },
  { value: 'owe-transition', label: 'OWE-Transition' },
];

export const ENCRYPTION_PROTOS = ENCRYPTION_OPTIONS;

export const NO_MULTI_PROTOS = ['sae', 'owe', 'owe-transition', 'wpa3', 'wpa3-192'];

export const ENCRYPTION_PROTOS_REQUIRE_KEY = [
  'psk',
  'psk2',
  'psk-mixed',
  'psk2-radius',
  'sae',
  'sae-mixed',
];

export const ENCRYPTION_PROTOS_REQUIRE_IEEE = [
  'psk',
  'psk2',
  'psk2-radius',
  'psk-mixed',
  'wpa',
  'wpa2',
  'wpa-mixed',
  'sae',
  'sae-mixed',
  'wpa3',
  'wpa3-192',
  'wpa3-mixed',
  'owe',
  'owe-transition',
];

export const ENCRYPTION_PROTOS_CAN_RADIUS = ['none'];

export const ENCRYPTION_PROTOS_REQUIRE_RADIUS = [
  'psk2-radius',
  'wpa',
  'wpa2',
  'wpa-mixed',
  'wpa3',
  'wpa3-192',
  'wpa3-mixed',
];

export const SSID_SERVICES_OPTIONS = [
  { value: 'radius-gw-proxy', label: 'radius-gw-proxy' },
  { value: 'wifi-steering', label: 'wifi-steering' },
  { value: 'captive', label: 'captive' },
];

export const SSID_PURPOSE_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'user-defined', label: 'user-defined' },
  { value: 'onboarding-ap', label: 'onboarding-ap' },
  { value: 'onboarding-sta', label: 'onboarding-sta' },
];

export const CAPTIVE_PORTAL_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'click-to-continue', label: 'Click' },
  { value: 'radius', label: 'Radius' },
  { value: 'credentials', label: 'Credentials' },
  { value: 'uam', label: 'UAM' },
];

export const ROAMING_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'on', label: 'Auto' },
  { value: 'custom', label: 'Custom' },
];

export const IEEE_80211W_OPTIONS = [
  { value: 'disabled', label: 'disabled' },
  { value: 'optional', label: 'optional' },
  { value: 'required', label: 'required' },
];

export const TUNNEL_PROTOS = [
  { value: 'none', label: 'none' },
  { value: 'mesh', label: 'mesh' },
  { value: 'vxlan', label: 'vxlan' },
  { value: 'gre', label: 'gre' },
  { value: 'l2tp', label: 'l2tp' },
];

export const INTERFACE_SERVICES_OPTIONS = INTERFACE_SERVICES.map((s) => ({
  value: s,
  label: s,
}));

export const INTERFACE_ETHERNET_PORTS_OPTIONS = [
  { value: '*', label: 'All' },
  { value: 'WAN*', label: 'WAN*' },
  { value: 'LAN*', label: 'LAN*' },
  { value: 'LAN1', label: 'LAN1' },
  { value: 'LAN2', label: 'LAN2' },
  { value: 'LAN3', label: 'LAN3' },
  { value: 'LAN4', label: 'LAN4' },
  { value: 'LAN5', label: 'LAN5' },
  { value: 'LAN6', label: 'LAN6' },
  { value: 'LAN7', label: 'LAN7' },
  { value: 'LAN8', label: 'LAN8' },
  { value: 'LAN9', label: 'LAN9' },
  { value: 'LAN10', label: 'LAN10' },
  { value: 'LAN11', label: 'LAN11' },
  { value: 'LAN12', label: 'LAN12' },
];

export const INTERFACE_ETHERNET_VLAN_TAG_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'tagged', label: 'Tagged' },
  { value: 'un-tagged', label: 'Un-tagged' },
];

export const DHCPV6_MODES = [
  { value: 'hybrid', label: 'hybrid' },
  { value: 'stateless', label: 'stateless' },
  { value: 'stateful', label: 'stateful' },
  { value: 'relay', label: 'relay' },
];

export const createNewInterface = (
  name: string,
  role: 'upstream' | 'downstream' = 'upstream'
): SingleInterfaceConfigItem => ({
  id: `iface-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  name,
  role,
  selectPorts: [],
  ethernet: [],
  isolateHosts: false,
  services: [],
  hostapdBssRaw: '',
  ipv4: {
    addressing: 'dynamic',
    resource: '',
    subnet: '192.168.1.1/24',
    gateway: '192.168.1.1',
    sendHostname: true,
    dhcpServer: true,
    dhcp: {
      leaseFirst: 1,
      leaseCount: 128,
      leaseTime: '6h',
      relayServer: '',
      circuitIdFormat: '',
      remoteIdFormat: '',
      reservedAddresses: [],
    },
  },
  ipv6: {
    addressing: 'none',
    resource: '',
    subnet: '',
    gateway: '',
    prefixSize: 64,
    dhcpv6: {
      enabled: true,
      mode: 'hybrid',
      announceDns: [],
      filterPrefix: '::/0',
    },
  },
  vlan: {
    enabled: false,
    resource: '',
    id: 1080,
  },
  tunnel: {
    proto: 'mesh',
    resource: '',
  },
  ssids: [],
});

export const getDefaultInterface = (
  existingCount: number,
  hasUpstream: boolean
): SingleInterfaceConfigItem => {
  const isDownstream = hasUpstream;
  const num = existingCount > 0 ? existingCount : 1;
  return createNewInterface(isDownstream ? `LAN${num}` : 'WAN', isDownstream ? 'downstream' : 'upstream');
};

export const getDefaultSsid = (index: number): SingleSsidConfigItem => ({
  id: `ssid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  name: `OpenWiFi-SSID-${index + 1}`,
  bssMode: 'ap',
  wifiBands: ['2G', '5G'],
  encryption: {
    proto: 'psk',
    key: 'OpenWiFiPass123',
    ieee80211w: 'disabled',
    keyCaching: true,
  },
  passPoint: {
    enabled: false,
  },
  advanced: {
    hiddenSsid: false,
    services: [],
    maximumClients: 64,
    filsDiscoveryInterval: 20,
    purpose: '',
    dtimPeriod: 2,
    isolateClients: false,
    powerSave: false,
    broadcastTime: false,
    unicastConversion: false,
    proxyArp: false,
    disassocLowAck: false,
    vendorElements: '',
    tipInformationElement: true,
    multiPsk: [],
    rrm: false,
  },
  rateLimit: {
    enabled: false,
    ingressRate: 0,
    egressRate: 0,
  },
  rrm: {
    enabled: false,
    neighborReporting: false,
    lci: '',
    civicLocation: '',
    ftmResponder: false,
    stationaryAp: false,
  },
  captivePortal: {
    mode: 'none',
    walledGardenFqdn: [],
    walledGardenIpaddr: [],
  },
  accessControlList: {
    enabled: false,
    mode: 'allow',
    macAddress: [],
  },
  roaming: {
    state: 'off',
    messageExchange: 'air',
    generatePsk: false,
    domainIdentifier: '',
    pmkR0KeyHolder: '',
    pmkR1KeyHolder: '',
  },
});

