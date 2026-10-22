export type CaptiveAuthMode =
  | 'none'
  | 'click-to-continue'
  | 'radius'
  | 'credentials'
  | 'uam';

export interface CaptiveCredential {
  username: string;
  password: string;
}

export interface CaptivePortalConfig {
  authMode: CaptiveAuthMode;
  walledGardenFqdn: string[];
  walledGardenIpaddr: string[];
  webRoot?: string; // base64
  webRootFileName?: string;
  idleTimeout?: number;
  sessionTimeout?: number;

  // Radius fields (radius and uam)
  authServer?: string;
  authSecret?: string;
  authPort?: number;
  acctServer?: string;
  acctSecret?: string;
  acctPort?: number;
  acctInterval?: number;

  // Credentials fields (credentials mode)
  credentials: CaptiveCredential[];

  // UAM fields (uam mode)
  uamServer?: string;
  uamSecret?: string;
  uamPort?: number;
  nasid?: string;
  nasmac?: string;
  macFormat?: string;
  ssid?: string;
  finalRedirectUrl?: string;
  macAuth?: boolean;
}

export const DEFAULT_CAPTIVE_PORTAL_CONFIG: CaptivePortalConfig = {
  authMode: 'none',
  walledGardenFqdn: [],
  walledGardenIpaddr: [],
  webRoot: undefined,
  webRootFileName: undefined,
  idleTimeout: 600,
  sessionTimeout: undefined,

  authServer: '192.168.1.10',
  authSecret: '',
  authPort: 1812,
  acctServer: '',
  acctSecret: '',
  acctPort: 1812,
  acctInterval: 600,

  credentials: [],

  uamServer: 'https://YOUR-LOGIN-ADDRESS.YOURS',
  uamSecret: '',
  uamPort: 3990,
  nasid: 'TestLab',
  nasmac: '',
  macFormat: 'aabbccddeeff',
  ssid: '',
  finalRedirectUrl: '',
  macAuth: false,
};

const toStrArray = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String).filter((s) => s.trim().length > 0);
  if (typeof v === 'string' && v.trim().length > 0) return [v.trim()];
  return [];
};

export function parseOwprovCaptive(raw: Record<string, unknown> | undefined): CaptivePortalConfig {
  if (!raw) return { ...DEFAULT_CAPTIVE_PORTAL_CONFIG };

  const mode = (raw['auth-mode'] || raw.authMode || raw.mode || 'none') as string;
  const authMode: CaptiveAuthMode =
    mode === 'click' ? 'click-to-continue' : (mode as CaptiveAuthMode);

  const rawCreds = Array.isArray(raw.credentials)
    ? (raw.credentials as Record<string, unknown>[])
    : [];
  const credentials: CaptiveCredential[] = rawCreds.map((c) => ({
    username: String(c.username || ''),
    password: String(c.password || ''),
  }));

  return {
    authMode: ['none', 'click-to-continue', 'radius', 'credentials', 'uam'].includes(authMode)
      ? authMode
      : 'none',
    walledGardenFqdn: toStrArray(raw['walled-garden-fqdn'] ?? raw.walledGardenFqdn),
    walledGardenIpaddr: toStrArray(raw['walled-garden-ipaddr'] ?? raw.walledGardenIpaddr),
    webRoot:
      typeof raw['web-root'] === 'string'
        ? raw['web-root']
        : (typeof raw.webRoot === 'string' ? raw.webRoot : undefined),
    webRootFileName:
      typeof raw['web-root-filename'] === 'string'
        ? raw['web-root-filename']
        : undefined,
    idleTimeout:
      raw['idle-timeout'] !== undefined
        ? Number(raw['idle-timeout'])
        : (raw.idleTimeout !== undefined ? Number(raw.idleTimeout) : 600),
    sessionTimeout:
      raw['session-timeout'] !== undefined
        ? Number(raw['session-timeout'])
        : (raw.sessionTimeout !== undefined ? Number(raw.sessionTimeout) : undefined),

    authServer: String(raw['auth-server'] ?? raw.authServer ?? '192.168.1.10'),
    authSecret: String(raw['auth-secret'] ?? raw.authSecret ?? ''),
    authPort:
      raw['auth-port'] !== undefined
        ? Number(raw['auth-port'])
        : (raw.authPort !== undefined ? Number(raw.authPort) : 1812),
    acctServer: String(raw['acct-server'] ?? raw.acctServer ?? ''),
    acctSecret: String(raw['acct-secret'] ?? raw.acctSecret ?? ''),
    acctPort:
      raw['acct-port'] !== undefined
        ? Number(raw['acct-port'])
        : (raw.acctPort !== undefined ? Number(raw.acctPort) : 1812),
    acctInterval:
      raw['acct-interval'] !== undefined
        ? Number(raw['acct-interval'])
        : (raw.acctInterval !== undefined ? Number(raw.acctInterval) : 600),

    credentials,

    uamServer: String(raw['uam-server'] ?? raw.uamServer ?? 'https://YOUR-LOGIN-ADDRESS.YOURS'),
    uamSecret: String(raw['uam-secret'] ?? raw.uamSecret ?? ''),
    uamPort:
      raw['uam-port'] !== undefined
        ? Number(raw['uam-port'])
        : (raw.uamPort !== undefined ? Number(raw.uamPort) : 3990),
    nasid: String(raw.nasid ?? 'TestLab'),
    nasmac: String(raw.nasmac ?? ''),
    macFormat: String(raw['mac-format'] ?? raw.macFormat ?? 'aabbccddeeff'),
    ssid: String(raw.ssid ?? ''),
    finalRedirectUrl: String(raw['final-redirect-url'] ?? raw.finalRedirectUrl ?? ''),
    macAuth: Boolean(raw['mac-auth'] ?? raw.macAuth),
  };
}

export function buildOwprovCaptive(cfg: CaptivePortalConfig): Record<string, unknown> | undefined {
  if (cfg.authMode === 'none') return undefined;

  const obj: Record<string, unknown> = {
    'auth-mode': cfg.authMode,
  };

  if (cfg.walledGardenFqdn.length > 0) {
    obj['walled-garden-fqdn'] = cfg.walledGardenFqdn;
  }
  if (cfg.walledGardenIpaddr.length > 0) {
    obj['walled-garden-ipaddr'] = cfg.walledGardenIpaddr;
  }
  if (cfg.webRoot) {
    obj['web-root'] = cfg.webRoot;
    if (cfg.webRootFileName) {
      obj['web-root-filename'] = cfg.webRootFileName;
    }
  }
  if (cfg.idleTimeout !== undefined && !isNaN(cfg.idleTimeout)) {
    obj['idle-timeout'] = cfg.idleTimeout;
  }
  if (cfg.sessionTimeout !== undefined && !isNaN(cfg.sessionTimeout)) {
    obj['session-timeout'] = cfg.sessionTimeout;
  }

  if (cfg.authMode === 'credentials') {
    if (cfg.credentials.length > 0) {
      obj.credentials = cfg.credentials;
    }
  }

  if (cfg.authMode === 'uam') {
    if (cfg.uamServer) obj['uam-server'] = cfg.uamServer;
    if (cfg.uamSecret) obj['uam-secret'] = cfg.uamSecret;
    if (cfg.uamPort !== undefined) obj['uam-port'] = cfg.uamPort;
    if (cfg.nasid) obj.nasid = cfg.nasid;
    if (cfg.nasmac) obj.nasmac = cfg.nasmac;
    if (cfg.macFormat) obj['mac-format'] = cfg.macFormat;
    if (cfg.ssid) obj.ssid = cfg.ssid;
    if (cfg.finalRedirectUrl) obj['final-redirect-url'] = cfg.finalRedirectUrl;
    if (cfg.macAuth !== undefined) obj['mac-auth'] = cfg.macAuth;
  }

  if (cfg.authMode === 'radius' || cfg.authMode === 'uam') {
    if (cfg.authServer) obj['auth-server'] = cfg.authServer;
    if (cfg.authSecret) obj['auth-secret'] = cfg.authSecret;
    if (cfg.authPort !== undefined) obj['auth-port'] = cfg.authPort;
    if (cfg.acctServer) obj['acct-server'] = cfg.acctServer;
    if (cfg.acctSecret) obj['acct-secret'] = cfg.acctSecret;
    if (cfg.acctPort !== undefined) obj['acct-port'] = cfg.acctPort;
    if (cfg.acctInterval !== undefined) obj['acct-interval'] = cfg.acctInterval;
  }

  return obj;
}

