export interface PassPointIcon {
  width: number;
  height: number;
  type: string;
  language: string;
  icon: string; // base64 string
}

export interface PassPointConfig {
  enabled: boolean;
  venueName: string[];
  venueUrl: string[];
  venueGroup: number;
  venueType: number;
  accessNetworkType: number;
  authType: {
    type: string;
    url?: string;
  };
  domainName: string[];
  naiRealm: string[];
  osen: boolean;
  anqpDomain: number;
  anqp3gppCellNet: string[];
  friendlyName: string[];
  internet: boolean;
  asra: boolean;
  esr: boolean;
  uesa: boolean;
  hessid: string;
  roamingConsortium: string[];
  disableDgaf: boolean;
  ipaddrTypeAvailable?: number;
  wanMetrics: {
    type: 'up' | 'down' | 'testing';
    downlink: number;
    uplink: number;
  };
  connectionCapability: string[];
  icons: PassPointIcon[];
}

export const DEFAULT_PASSPOINT_CONFIG: PassPointConfig = {
  enabled: false,
  venueName: [],
  venueUrl: [],
  venueGroup: 1,
  venueType: 1,
  accessNetworkType: 0,
  authType: {
    type: 'terms-and-conditions',
    url: '',
  },
  domainName: [],
  naiRealm: [],
  osen: false,
  anqpDomain: 8888,
  anqp3gppCellNet: [],
  friendlyName: [],
  internet: true,
  asra: false,
  esr: false,
  uesa: false,
  hessid: '',
  roamingConsortium: [],
  disableDgaf: false,
  ipaddrTypeAvailable: undefined,
  wanMetrics: {
    type: 'up',
    downlink: 20000,
    uplink: 20000,
  },
  connectionCapability: [],
  icons: [],
};

const toStrArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String).filter((s) => s.trim().length > 0);
  if (typeof v === 'string' && v.trim().length > 0) return [v.trim()];
  return [];
};

export function parseOwprovPasspoint(raw: Record<string, unknown> | undefined): PassPointConfig {
  if (!raw) return { ...DEFAULT_PASSPOINT_CONFIG };

  const rawAuth = (raw['auth-type'] as Record<string, unknown>) || {};
  const rawWan = (raw['wan-metrics'] as Record<string, unknown>) || {};

  return {
    enabled: true,
    venueName: toStrArray(raw['venue-name'] ?? raw.venueName),
    venueUrl: toStrArray(raw['venue-url'] ?? raw.venueUrl),
    venueGroup: typeof (raw['venue-group'] ?? raw.venueGroup) === 'number' ? Number(raw['venue-group'] ?? raw.venueGroup) : 1,
    venueType: typeof (raw['venue-type'] ?? raw.venueType) === 'number' ? Number(raw['venue-type'] ?? raw.venueType) : 1,
    accessNetworkType: typeof (raw['access-network-type'] ?? raw.accessNetworkType) === 'number' ? Number(raw['access-network-type'] ?? raw.accessNetworkType) : 0,
    authType: {
      type: String(rawAuth.type || 'terms-and-conditions'),
      url: String(rawAuth.url || rawAuth.uri || ''),
    },
    domainName: toStrArray(raw['domain-name'] ?? raw.domainName),
    naiRealm: toStrArray(raw['nai-realm'] ?? raw.naiRealm),
    osen: Boolean(raw.osen),
    anqpDomain: typeof (raw['anqp-domain'] ?? raw.anqpDomain) === 'number' ? Number(raw['anqp-domain'] ?? raw.anqpDomain) : 8888,
    anqp3gppCellNet: toStrArray(raw['anqp-3gpp-cell-net'] ?? raw.anqp3gppCellNet),
    friendlyName: toStrArray(raw['friendly-name'] ?? raw.friendlyName),
    internet: (raw.internet !== undefined) ? Boolean(raw.internet) : true,
    asra: Boolean(raw.asra),
    esr: Boolean(raw.esr),
    uesa: Boolean(raw.uesa),
    hessid: String(raw.hessid || ''),
    roamingConsortium: toStrArray(raw['roaming-consortium'] ?? raw.roamingConsortium),
    disableDgaf: Boolean(raw['disable-dgaf'] ?? raw.disableDgaf),
    ipaddrTypeAvailable:
      raw['ipaddr-type-available'] !== undefined
        ? Number(raw['ipaddr-type-available'])
        : (raw.ipaddrTypeAvailable !== undefined ? Number(raw.ipaddrTypeAvailable) : undefined),
    wanMetrics: {
      type: ((rawWan.type || rawWan.info || 'up') as 'up' | 'down' | 'testing'),
      downlink: typeof rawWan.downlink === 'number' ? rawWan.downlink : 20000,
      uplink: typeof rawWan.uplink === 'number' ? rawWan.uplink : 20000,
    },
    connectionCapability: toStrArray(raw['connection-capability'] ?? raw.connectionCapability),
    icons: Array.isArray(raw.icons) ? (raw.icons as PassPointIcon[]) : [],
  };
}

export function buildOwprovPasspoint(cfg: PassPointConfig): Record<string, unknown> | undefined {
  if (!cfg.enabled) return undefined;

  const res: Record<string, unknown> = {
    'venue-group': cfg.venueGroup,
    'venue-type': cfg.venueType,
    'access-network-type': cfg.accessNetworkType,
    'auth-type': {
      type: cfg.authType.type || 'terms-and-conditions',
      ...(cfg.authType.url ? { url: cfg.authType.url, uri: cfg.authType.url } : {}),
    },
    'anqp-domain': cfg.anqpDomain,
    internet: cfg.internet,
    'wan-metrics': {
      type: cfg.wanMetrics.type || 'up',
      info: cfg.wanMetrics.type || 'up',
      downlink: Number(cfg.wanMetrics.downlink) || 20000,
      uplink: Number(cfg.wanMetrics.uplink) || 20000,
    },
  };

  if (cfg.venueName.length > 0) res['venue-name'] = cfg.venueName;
  if (cfg.venueUrl.length > 0) res['venue-url'] = cfg.venueUrl;
  if (cfg.domainName.length > 0) res['domain-name'] = cfg.domainName;
  if (cfg.naiRealm.length > 0) res['nai-realm'] = cfg.naiRealm;
  if (cfg.osen) res.osen = true;
  if (cfg.anqp3gppCellNet.length > 0) res['anqp-3gpp-cell-net'] = cfg.anqp3gppCellNet;
  if (cfg.friendlyName.length > 0) res['friendly-name'] = cfg.friendlyName;
  if (cfg.asra) res.asra = true;
  if (cfg.esr) res.esr = true;
  if (cfg.uesa) res.uesa = true;
  if (cfg.hessid) res.hessid = cfg.hessid;
  if (cfg.roamingConsortium.length > 0) res['roaming-consortium'] = cfg.roamingConsortium;
  if (cfg.disableDgaf) res['disable-dgaf'] = true;
  if (cfg.ipaddrTypeAvailable !== undefined && !isNaN(cfg.ipaddrTypeAvailable)) {
    res['ipaddr-type-available'] = cfg.ipaddrTypeAvailable;
  }
  if (cfg.connectionCapability.length > 0) res['connection-capability'] = cfg.connectionCapability;
  if (cfg.icons.length > 0) res.icons = cfg.icons;

  return res;
}

