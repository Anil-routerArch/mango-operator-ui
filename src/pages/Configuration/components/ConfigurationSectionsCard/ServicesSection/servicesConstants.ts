export const SERVICES_OPTIONS = [
  { value: 'airtime-policies', label: 'airtime-policies' },
  { value: 'data-plane', label: 'data-plane' },
  { value: 'dhcp-relay', label: 'dhcp-relay' },
  { value: 'facebook-wifi', label: 'facebook-wifi' },
  { value: 'fingerprint', label: 'fingerprint' },
  { value: 'gps', label: 'gps' },
  { value: 'http', label: 'http' },
  { value: 'ieee8021x', label: 'ieee8021x' },
  { value: 'igmp', label: 'igmp' },
  { value: 'lldp', label: 'lldp' },
  { value: 'log', label: 'log' },
  { value: 'mdns', label: 'mdns' },
  { value: 'ntp', label: 'ntp' },
  { value: 'online-check', label: 'online-check' },
  { value: 'open-flow', label: 'open-flow' },
  { value: 'quality-of-service', label: 'quality-of-service' },
  { value: 'radius-proxy', label: 'radius-proxy' },
  { value: 'rtty', label: 'rtty' },
  { value: 'ssh', label: 'ssh' },
  { value: 'wifi-steering', label: 'wifi-steering' },
];

export const FINGERPRINT_MODES = [
  { value: 'always', label: 'Always' },
  { value: 'polled', label: 'Polled' },
  { value: 'final', label: 'Final' },
  { value: 'raw-data', label: 'Raw Data' },
];

export const GPS_BAUD_RATES = [2400, 4800, 9600, 19200, 38400, 57600, 115200];
export const LOG_PROTOS = ['udp', 'tcp'];
export const ONLINE_CHECK_ACTIONS = [
  { value: 'wifi', label: 'wifi' },
  { value: 'leds', label: 'leds' },
];
export const OPEN_FLOW_MODES = [
  { value: 'pssl', label: 'pssl' },
  { value: 'ptcp', label: 'ptcp' },
  { value: 'ssl', label: 'ssl' },
  { value: 'tcp', label: 'tcp' },
];
export const WIFI_STEERING_MODES = [
  { value: 'local', label: 'local' },
  { value: 'cloud', label: 'cloud' },
];

export const DHCP_RELAY_SELECT_PORTS_OPTIONS = [
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

export const DHCP_RELAY_CIRCUIT_ID_OPTIONS = [
  { label: 'VLAN ID', value: 'vlan-id' },
  { label: 'AP MAC Address', value: 'ap-mac' },
  { label: 'SSID', value: 'ssid' },
];

export const DHCP_RELAY_REMOTE_ID_OPTIONS = [
  { label: 'AP MAC Address', value: 'ap-mac' },
  { label: 'SSID', value: 'ssid' },
  { label: 'VLAN ID', value: 'vlan-id' },
];

export const QOS_SELECT_PORTS_OPTIONS = DHCP_RELAY_SELECT_PORTS_OPTIONS;

export const CLASSIFIER_PROTO_OPTS = [
  { value: 'any', label: 'any' },
  { value: 'tcp', label: 'tcp' },
  { value: 'udp', label: 'udp' },
];

export const DSCP_OPTIONS = [
  { value: 'CS0', label: 'CS0' },
  { value: 'CS1', label: 'CS1' },
  { value: 'CS2', label: 'CS2' },
  { value: 'CS3', label: 'CS3' },
  { value: 'CS4', label: 'CS4' },
  { value: 'CS5', label: 'CS5' },
  { value: 'CS6', label: 'CS6' },
  { value: 'CS7', label: 'CS7' },
  { value: 'AF11', label: 'AF11' },
  { value: 'AF12', label: 'AF12' },
  { value: 'AF13', label: 'AF13' },
  { value: 'AF21', label: 'AF21' },
  { value: 'AF22', label: 'AF22' },
  { value: 'AF23', label: 'AF23' },
  { value: 'AF31', label: 'AF31' },
  { value: 'AF32', label: 'AF32' },
  { value: 'AF33', label: 'AF33' },
  { value: 'AF41', label: 'AF41' },
  { value: 'AF42', label: 'AF42' },
  { value: 'AF43', label: 'AF43' },
  { value: 'DF', label: 'DF' },
  { value: 'EF', label: 'EF' },
  { value: 'VA', label: 'VA' },
  { value: 'LE', label: 'LE' },
];

