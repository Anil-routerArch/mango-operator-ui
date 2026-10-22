export interface RadiusLocalUser {
  id?: string;
  mac: string;
  userName: string;
  password?: string;
  vlanId: number;
}

export interface RadiusServerConfig {
  host: string;
  port: number;
  secret: string;
}

export interface RadiusConfigData {
  // Authentication
  authentication: RadiusServerConfig & {
    macFilter?: boolean;
  };

  // Accounting
  accountingEnabled: boolean;
  accounting?: RadiusServerConfig;

  // Dynamic Authorization
  dynamicAuthorizationEnabled: boolean;
  dynamicAuthorization?: RadiusServerConfig;

  // General RADIUS
  nasIdentifier?: string;
  chargeableUserId?: boolean;

  // Local RADIUS
  localEnabled: boolean;
  serverIdentity?: string;
  users: RadiusLocalUser[];
}

export const DEFAULT_RADIUS_CONFIG: RadiusConfigData = {
  authentication: {
    host: '192.168.178.192',
    port: 1812,
    secret: '',
    macFilter: true,
  },
  accountingEnabled: true,
  accounting: {
    host: '192.168.178.192',
    port: 1813,
    secret: '',
  },
  dynamicAuthorizationEnabled: true,
  dynamicAuthorization: {
    host: '192.168.178.192',
    port: 1814,
    secret: '',
  },
  nasIdentifier: '',
  chargeableUserId: true,
  localEnabled: true,
  serverIdentity: 'uCentral',
  users: [],
};

export function parseOwprovRadius(raw: Record<string, unknown> | undefined): RadiusConfigData {
  if (!raw) return { ...DEFAULT_RADIUS_CONFIG };

  // Authentication
  const authRaw = (raw.authentication ?? {}) as Record<string, unknown>;
  const authHost = String(
    authRaw.host ?? raw['authentication.host'] ?? raw.authHost ?? '192.168.178.192'
  );
  const authPort = Number(
    authRaw.port ?? raw['authentication.port'] ?? raw.authPort ?? 1812
  );
  const authSecret = String(
    authRaw.secret ?? raw['authentication.secret'] ?? raw.authSecret ?? ''
  );
  const authMacFilter = Boolean(
    authRaw['mac-filter'] ??
      raw['authentication.mac-filter'] ??
      raw.macFilter ??
      true
  );

  // Accounting
  const acctRaw = raw.accounting as Record<string, unknown> | undefined;
  const accountingEnabled = Boolean(
    acctRaw ||
      raw['accounting.host'] ||
      raw.accountingEnabled ||
      raw.acctHost
  );
  const acctHost = String(
    acctRaw?.host ?? raw['accounting.host'] ?? raw.acctHost ?? '192.168.178.192'
  );
  const acctPort = Number(
    acctRaw?.port ?? raw['accounting.port'] ?? raw.acctPort ?? 1813
  );
  const acctSecret = String(
    acctRaw?.secret ?? raw['accounting.secret'] ?? raw.acctSecret ?? ''
  );

  // Dynamic Authorization
  const dynRaw = (raw['dynamic-authorization'] ?? raw.dynamicAuthorization) as
    | Record<string, unknown>
    | undefined;
  const dynamicAuthorizationEnabled = Boolean(
    dynRaw ||
      raw['dynamic-authorization.host'] ||
      raw.dynamicAuthorizationEnabled
  );
  const dynHost = String(
    dynRaw?.host ??
      raw['dynamic-authorization.host'] ??
      '192.168.178.192'
  );
  const dynPort = Number(
    dynRaw?.port ?? raw['dynamic-authorization.port'] ?? 1814
  );
  const dynSecret = String(
    dynRaw?.secret ?? raw['dynamic-authorization.secret'] ?? ''
  );

  // General
  const nasIdentifier = String(
    raw['nas-identifier'] ?? raw.nasIdentifier ?? ''
  );
  const chargeableUserId =
    raw['chargeable-user-id'] !== undefined
      ? Boolean(raw['chargeable-user-id'])
      : raw.chargeableUserId !== undefined
      ? Boolean(raw.chargeableUserId)
      : true;

  // Local RADIUS
  const localRaw = raw.local as Record<string, unknown> | undefined;
  const localEnabled = Boolean(localRaw || raw.localEnabled || raw.localUsers);
  const serverIdentity = String(
    localRaw?.['server-identity'] ??
      raw['local.server-identity'] ??
      raw.serverIdentity ??
      'uCentral'
  );

  const rawUsers = Array.isArray(localRaw?.users)
    ? (localRaw.users as Record<string, unknown>[])
    : Array.isArray(raw.localUsers)
    ? (raw.localUsers as Record<string, unknown>[])
    : [];

  const users: RadiusLocalUser[] = rawUsers.map((u, idx) => ({
    id: `u-${idx}-${Date.now()}`,
    mac: String(u.mac ?? ''),
    userName: String(u['user-name'] ?? u.userName ?? ''),
    password: u.password !== undefined ? String(u.password) : '',
    vlanId: Number(u['vlan-id'] ?? u.vlanId ?? 100),
  }));

  return {
    authentication: {
      host: authHost,
      port: authPort,
      secret: authSecret,
      macFilter: authMacFilter,
    },
    accountingEnabled,
    accounting: {
      host: acctHost,
      port: acctPort,
      secret: acctSecret,
    },
    dynamicAuthorizationEnabled,
    dynamicAuthorization: {
      host: dynHost,
      port: dynPort,
      secret: dynSecret,
    },
    nasIdentifier,
    chargeableUserId,
    localEnabled,
    serverIdentity,
    users,
  };
}

export function buildOwprovRadius(cfg: RadiusConfigData): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    authentication: {
      host: cfg.authentication.host,
      port: Number(cfg.authentication.port),
      secret: cfg.authentication.secret,
      ...(cfg.authentication.macFilter !== undefined
        ? { 'mac-filter': cfg.authentication.macFilter }
        : {}),
    },
  };

  if (cfg.accountingEnabled && cfg.accounting) {
    obj.accounting = {
      host: cfg.accounting.host,
      port: Number(cfg.accounting.port),
      secret: cfg.accounting.secret,
    };
  }

  if (cfg.dynamicAuthorizationEnabled && cfg.dynamicAuthorization) {
    obj['dynamic-authorization'] = {
      host: cfg.dynamicAuthorization.host,
      port: Number(cfg.dynamicAuthorization.port),
      secret: cfg.dynamicAuthorization.secret,
    };
  }

  if (cfg.nasIdentifier) {
    obj['nas-identifier'] = cfg.nasIdentifier;
  }
  if (cfg.chargeableUserId !== undefined) {
    obj['chargeable-user-id'] = cfg.chargeableUserId;
  }

  if (cfg.localEnabled) {
    obj.local = {
      'server-identity': cfg.serverIdentity || 'uCentral',
      users: (cfg.users || []).map((u) => ({
        mac: u.mac,
        'user-name': u.userName,
        password: u.password || '',
        'vlan-id': Number(u.vlanId) || 100,
      })),
    };
  }

  return obj;
}

