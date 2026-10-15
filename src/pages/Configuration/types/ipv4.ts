import type {
  DhcpReservedAddressItem,
  Ipv4PortForwardItem,
} from '../components/ConfigurationSectionsCard/types';

export type { Ipv4PortForwardItem };

export interface Ipv4ConfigData {
  addressing: 'dynamic' | 'static' | 'none';
  subnet?: string;
  gateway?: string;
  sendHostname?: boolean;
  useDns?: string[];

  // DHCPv4
  dhcpEnabled: boolean;
  leaseFirst?: number;
  leaseCount?: number;
  leaseTime?: string;
  relayServer?: string;
  circuitIdFormat?: string;
  remoteIdFormat?: string;
  reservedAddresses: DhcpReservedAddressItem[];

  // Port Forwarding
  portForward: Ipv4PortForwardItem[];
}

export const DEFAULT_IPV4_CONFIG: Ipv4ConfigData = {
  addressing: 'static',
  subnet: '192.168.1.1/24',
  gateway: '192.168.1.1',
  sendHostname: true,
  useDns: [],

  dhcpEnabled: true,
  leaseFirst: 1,
  leaseCount: 128,
  leaseTime: '6h',
  relayServer: '',
  circuitIdFormat: '',
  remoteIdFormat: '',
  reservedAddresses: [],

  portForward: [],
};

export function parseOwprovIpv4(raw: Record<string, unknown> | undefined): Ipv4ConfigData {
  if (!raw) return { ...DEFAULT_IPV4_CONFIG };

  const addressing = (raw.addressing as 'dynamic' | 'static' | 'none') || 'static';
  const subnet = typeof raw.subnet === 'string' ? raw.subnet : '192.168.1.1/24';
  const gateway = typeof raw.gateway === 'string' ? raw.gateway : '192.168.1.1';
  const sendHostname =
    raw['send-hostname'] !== undefined
      ? Boolean(raw['send-hostname'])
      : raw.sendHostname !== undefined
      ? Boolean(raw.sendHostname)
      : true;

  const dhcpRaw = (
    raw.dhcp && typeof raw.dhcp === 'object' ? raw.dhcp : undefined
  ) as Record<string, unknown> | undefined;

  const dhcpEnabled = Boolean(
    dhcpRaw ||
      raw.dhcpServer ||
      raw['dhcp-leases'] ||
      raw['dhcp-enabled'] ||
      raw.dhcpEnabled
  );

  const leaseFirst =
    dhcpRaw?.['lease-first'] !== undefined
      ? Number(dhcpRaw['lease-first'])
      : raw['dhcp-lease-first'] !== undefined
      ? Number(raw['dhcp-lease-first'])
      : raw.leaseFirst !== undefined
      ? Number(raw.leaseFirst)
      : 1;

  const leaseCount =
    dhcpRaw?.['lease-count'] !== undefined
      ? Number(dhcpRaw['lease-count'])
      : raw['dhcp-lease-count'] !== undefined
      ? Number(raw['dhcp-lease-count'])
      : raw.leaseCount !== undefined
      ? Number(raw.leaseCount)
      : 128;

  const leaseTime = String(
    dhcpRaw?.['lease-time'] ??
      raw['dhcp-lease-time'] ??
      raw.leaseTime ??
      '6h'
  );

  const relayServer = String(
    dhcpRaw?.['relay-server'] ??
      raw['relay-server'] ??
      raw.relayServer ??
      ''
  );

  const circuitIdFormat = String(
    dhcpRaw?.['circuit-id-format'] ??
      raw['circuit-id-format'] ??
      raw.circuitIdFormat ??
      ''
  );

  const remoteIdFormat = String(
    dhcpRaw?.['remote-id-format'] ??
      raw['remote-id-format'] ??
      raw.remoteIdFormat ??
      ''
  );

  const rawLeases = Array.isArray(raw['dhcp-leases'])
    ? (raw['dhcp-leases'] as Record<string, unknown>[])
    : Array.isArray(dhcpRaw?.reservedAddresses)
    ? (dhcpRaw.reservedAddresses as Record<string, unknown>[])
    : [];

  const reservedAddresses: DhcpReservedAddressItem[] = rawLeases.map((l) => ({
    macaddr: String(l.macaddr ?? ''),
    staticLeaseOffset:
      l['static-lease-offset'] !== undefined
        ? Number(l['static-lease-offset'])
        : l.staticLeaseOffset !== undefined
        ? Number(l.staticLeaseOffset)
        : undefined,
    leaseTime: String(l['lease-time'] ?? l.leaseTime ?? '6h'),
    publishHostname: Boolean(
      l['publish-hostname'] !== undefined
        ? l['publish-hostname']
        : l.publishHostname !== undefined
        ? l.publishHostname
        : true
    ),
  }));

  const rawPortForward = Array.isArray(raw['port-forward'])
    ? (raw['port-forward'] as Record<string, unknown>[])
    : Array.isArray(raw.portForward)
    ? (raw.portForward as Record<string, unknown>[])
    : [];

  const portForward: Ipv4PortForwardItem[] = rawPortForward.map((pf, idx) => ({
    id: `pf-${idx}-${Date.now()}`,
    protocol: String(pf.protocol ?? 'any'),
    externalPort: (pf['external-port'] ?? pf.externalPort ?? '') as string | number,
    internalPort: (pf['internal-port'] ?? pf.internalPort ?? '') as string | number,
    internalAddress: String(pf['internal-address'] ?? pf.internalAddress ?? ''),
  }));

  const useDns = Array.isArray(raw['use-dns'])
    ? (raw['use-dns'] as unknown[]).map(String)
    : Array.isArray(raw.useDns)
    ? (raw.useDns as unknown[]).map(String)
    : [];

  return {
    addressing,
    subnet,
    gateway,
    sendHostname,
    useDns,
    dhcpEnabled,
    leaseFirst,
    leaseCount,
    leaseTime,
    relayServer,
    circuitIdFormat,
    remoteIdFormat,
    reservedAddresses,
    portForward,
  };
}

export function buildOwprovIpv4(cfg: Ipv4ConfigData): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    addressing: cfg.addressing,
  };

  if (cfg.addressing === 'static') {
    if (cfg.subnet) obj.subnet = cfg.subnet;
    if (cfg.gateway) obj.gateway = cfg.gateway;
    if (cfg.sendHostname !== undefined) obj['send-hostname'] = cfg.sendHostname;
    if (cfg.useDns && cfg.useDns.length > 0) obj['use-dns'] = cfg.useDns;

    if (cfg.dhcpEnabled) {
      const dhcpObj: Record<string, unknown> = {
        'lease-first': cfg.leaseFirst ?? 1,
        'lease-count': cfg.leaseCount ?? 128,
        'lease-time': cfg.leaseTime || '6h',
      };
      if (cfg.relayServer) dhcpObj['relay-server'] = cfg.relayServer;
      if (cfg.circuitIdFormat) dhcpObj['circuit-id-format'] = cfg.circuitIdFormat;
      if (cfg.remoteIdFormat) dhcpObj['remote-id-format'] = cfg.remoteIdFormat;
      obj.dhcp = dhcpObj;

      if (cfg.reservedAddresses.length > 0) {
        obj['dhcp-leases'] = cfg.reservedAddresses.map((r) => ({
          macaddr: r.macaddr,
          ...(r.staticLeaseOffset !== undefined
            ? { 'static-lease-offset': r.staticLeaseOffset }
            : {}),
          'lease-time': r.leaseTime || '6h',
          'publish-hostname': r.publishHostname,
        }));
      }
    }
  }

  if (cfg.portForward.length > 0) {
    obj['port-forward'] = cfg.portForward.map((pf) => ({
      protocol: pf.protocol,
      'external-port': pf.externalPort,
      'internal-port': pf.internalPort,
      'internal-address': pf.internalAddress,
    }));
  }

  return obj;
}
