export const METRICS_SUBSECTIONS_OPTIONS = [
  { value: 'dhcp-snooping', label: 'dhcp-snooping' },
  { value: 'health', label: 'health' },
  { value: 'realtime', label: 'realtime' },
  { value: 'statistics', label: 'statistics' },
  { value: 'telemetry', label: 'telemetry' },
  { value: 'wifi-frames', label: 'wifi-frames' },
  { value: 'wifi-scan', label: 'wifi-scan' },
];

export const DHCP_FILTER_OPTIONS = [
  { value: 'ack', label: 'ack' },
  { value: 'discover', label: 'discover' },
  { value: 'offer', label: 'offer' },
  { value: 'request', label: 'request' },
  { value: 'solicit', label: 'solicit' },
  { value: 'reply', label: 'reply' },
  { value: 'renew', label: 'renew' },
  { value: 'inform', label: 'inform' },
  { value: 'decline', label: 'decline' },
  { value: 'nak', label: 'nak' },
  { value: 'release', label: 'release' },
];

export const STATS_TYPE_OPTIONS = [
  { value: 'ssids', label: 'ssids' },
  { value: 'lldp', label: 'lldp' },
  { value: 'clients', label: 'clients' },
  { value: 'radios', label: 'radios' },
  { value: 'interfaces', label: 'interfaces' },
  { value: 'poe', label: 'poe' },
];

export const EVENT_TYPES_OPTIONS = [
  { value: 'ssh', label: 'ssh' },
  { value: 'health', label: 'health' },
  { value: 'health.dns', label: 'health.dns' },
  { value: 'health.dhcp', label: 'health.dhcp' },
  { value: 'health.radius', label: 'health.radius' },
  { value: 'health.memory', label: 'health.memory' },
  { value: 'client', label: 'client' },
  { value: 'client.join', label: 'client.join' },
  { value: 'client.leave', label: 'client.leave' },
  { value: 'client.key-mismatch', label: 'client.key-mismatch' },
  { value: 'wifi', label: 'wifi' },
  { value: 'wifi.start', label: 'wifi.start' },
  { value: 'wifi.stop', label: 'wifi.stop' },
  { value: 'wired', label: 'wired' },
  { value: 'wired.carrier-up', label: 'wired.carrier-up' },
  { value: 'wired.carrier-down', label: 'wired.carrier-down' },
  { value: 'unit', label: 'unit' },
  { value: 'unit-boot-up', label: 'unit-boot-up' },
];

export const TELEMETRY_TYPE_OPTIONS = [
  ...EVENT_TYPES_OPTIONS,
  { value: 'radios', label: 'radios' },
  { value: 'interfaces', label: 'interfaces' },
  { value: 'system', label: 'system' },
];

export const WIFI_FRAMES_FILTER_OPTIONS = [
  { value: 'probe', label: 'probe' },
  { value: 'auth', label: 'auth' },
  { value: 'assoc', label: 'assoc' },
  { value: 'disassoc', label: 'disassoc' },
  { value: 'deauth', label: 'deauth' },
  { value: 'local-deauth', label: 'local-deauth' },
  { value: 'inactive-deauth', label: 'inactive-deauth' },
  { value: 'key-mismatch', label: 'key-mismatch' },
  { value: 'beacon-report', label: 'beacon-report' },
  { value: 'radar-detected', label: 'radar-detected' },
  { value: 'probe-request', label: 'probe-request' },
  { value: 'probe-response', label: 'probe-response' },
  { value: 'beacon', label: 'beacon' },
  { value: 'assoc-request', label: 'assoc-request' },
  { value: 'assoc-response', label: 'assoc-response' },
];

// Deprecated arrays kept for backward compatibility if imported elsewhere
export const DHCP_FILTERS = DHCP_FILTER_OPTIONS.map((o) => o.value);
export const STATS_TYPES = STATS_TYPE_OPTIONS.map((o) => o.value);
export const REALTIME_TYPES = EVENT_TYPES_OPTIONS.map((o) => o.value);
export const TELEMETRY_TYPES = TELEMETRY_TYPE_OPTIONS.map((o) => o.value);
export const WIFI_FRAMES_FILTERS = WIFI_FRAMES_FILTER_OPTIONS.map((o) => o.value);
