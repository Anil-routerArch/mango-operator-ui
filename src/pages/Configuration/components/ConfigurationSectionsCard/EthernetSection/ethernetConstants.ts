import type { EthernetPortEntry } from '../types';

export const ETHERNET_PORT_OPTIONS = Array.from({ length: 41 }, (_, i) => ({
  label: `Eth${i}`,
  value: `Ethernet${i}`,
}));

export const DUPLEX_OPTIONS = [
  { label: 'full', value: 'full' },
  { label: 'half', value: 'half' },
];

export const SPEED_OPTIONS = [
  { label: '10 Mbps', value: 10 },
  { label: '100 Mbps', value: 100 },
  { label: '1 Gbps (1000)', value: 1000 },
  { label: '2.5 Gbps (2500)', value: 2500 },
  { label: '5 Gbps (5000)', value: 5000 },
  { label: '10 Gbps (10000)', value: 10000 },
  { label: '25 Gbps (25000)', value: 25000 },
  { label: '100 Gbps (100000)', value: 100000 },
];

export const LLDP_ADMIN_STATUS_OPTIONS = [
  { label: 'receive (rx)', value: 'rx' },
  { label: 'transmit (tx)', value: 'tx' },
  { label: 'tx-rx', value: 'rx-tx' },
  { label: 'disabled', value: 'disabled' },
];

export const POE_DETECTION_OPTIONS = [
  { label: '4pt-dot3af', value: '4pt-dot3af' },
  { label: '2pt-dot3af', value: '2pt-dot3af' },
  { label: 'dot3bt', value: 'dot3bt' },
  { label: 'legacy', value: 'legacy' },
];

export const POE_PRIORITY_OPTIONS = [
  { label: 'high', value: 'high' },
  { label: 'low', value: 'low' },
  { label: 'critical', value: 'critical' },
  { label: 'medium', value: 'medium' },
];

export const VOICE_VLAN_MODE_OPTIONS = [
  { label: 'auto', value: 'auto' },
  { label: 'manual', value: 'manual' },
  { label: 'none', value: 'none' },
];

export const VOICE_VLAN_DETECT_OPTIONS = [
  { label: 'oui', value: 'oui' },
  { label: 'lldp', value: 'lldp' },
];

export const DEFAULT_STORM_CONTROL = {
  'broadcast-pps': 500,
  'multicast-pps': 500,
  'unknown-unicast-pps': 500,
};

export const DEFAULT_BPDU_GUARD = {
  enabled: true,
  'auto-recovery-intvl-secs': 300,
};

export const DEFAULT_DHCP_SNOOP_PORT = {
  'dhcp-snoop-port-trust': false,
};

export const DEFAULT_VOICE_VLAN = {
  'voice-vlan-intf-mode': 'auto',
  'voice-vlan-intf-priority': 6,
  'voice-vlan-intf-detect-voice': 'oui',
  'voice-vlan-intf-security': false,
};

export const DEFAULT_POE = {
  'admin-mode': true,
  detection: '4pt-dot3af',
  'power-limit': 30000,
  priority: 'high',
  'do-reset': false,
};

export const DEFAULT_LLDP = {
  'lldp-admin-status': 'rx-tx' as const,
  'lldp-basic-tlv-mgmt-ip-v4': false,
  'lldp-basic-tlv-mgmt-ip-v6': false,
  'lldp-basic-tlv-port-descr': false,
  'lldp-basic-tlv-sys-capab': false,
  'lldp-basic-tlv-sys-descr': false,
  'lldp-basic-tlv-sys-name': false,
  'lldp-dot1-tlv-proto-ident': false,
  'lldp-dot1-tlv-proto-vid': false,
  'lldp-dot1-tlv-pvid': false,
  'lldp-dot1-tlv-vlan-name': false,
  'lldp-dot3-tlv-link-agg': false,
  'lldp-dot3-tlv-mac-phy': false,
  'lldp-dot3-tlv-max-frame': false,
  'lldp-dot3-tlv-poe': false,
  'lldp-med-tlv-ext-poe': false,
  'lldp-med-tlv-inventory': false,
  'lldp-med-tlv-location': false,
  'lldp-med-tlv-med-cap': false,
  'lldp-med-tlv-network-policy': false,
  'lldp-notification': false,
  'lldp-med-notification': false,
};

export const LLDP_TLV_FIELDS = [
  { name: 'lldp-basic-tlv-mgmt-ip-v4', label: 'basic-tlv-mgmt-ip-v4' },
  { name: 'lldp-basic-tlv-mgmt-ip-v6', label: 'basic-tlv-mgmt-ip-v6' },
  { name: 'lldp-basic-tlv-port-descr', label: 'basic-tlv-port-descr' },
  { name: 'lldp-basic-tlv-sys-capab', label: 'basic-tlv-sys-capab' },
  { name: 'lldp-basic-tlv-sys-descr', label: 'basic-tlv-sys-descr' },
  { name: 'lldp-basic-tlv-sys-name', label: 'basic-tlv-sys-name' },
  { name: 'lldp-dot1-tlv-proto-ident', label: 'dot1-tlv-proto-ident' },
  { name: 'lldp-dot1-tlv-proto-vid', label: 'dot1-tlv-proto-vid' },
  { name: 'lldp-dot1-tlv-pvid', label: 'dot1-tlv-pvid' },
  { name: 'lldp-dot1-tlv-vlan-name', label: 'dot1-tlv-vlan-name' },
  { name: 'lldp-dot3-tlv-link-agg', label: 'dot3-tlv-link-agg' },
  { name: 'lldp-dot3-tlv-mac-phy', label: 'dot3-tlv-mac-phy' },
  { name: 'lldp-dot3-tlv-max-frame', label: 'dot3-tlv-max-frame' },
  { name: 'lldp-dot3-tlv-poe', label: 'dot3-tlv-poe' },
  { name: 'lldp-med-tlv-ext-poe', label: 'med-tlv-ext-poe' },
  { name: 'lldp-med-tlv-inventory', label: 'med-tlv-inventory' },
  { name: 'lldp-med-tlv-location', label: 'med-tlv-location' },
  { name: 'lldp-med-tlv-med-cap', label: 'med-tlv-med-cap' },
  { name: 'lldp-med-tlv-network-policy', label: 'med-tlv-network-policy' },
  { name: 'lldp-notification', label: 'notification' },
  { name: 'lldp-med-notification', label: 'med-notification' },
] as const;

export const getDefaultEthernetEntry = (): EthernetPortEntry => ({
  'select-ports': ['Ethernet0'],
  speed: 1000,
  duplex: 'full',
  enabled: true,
  'edge-port': false,
});

