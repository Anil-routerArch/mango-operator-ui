export interface RadioConfigData {
  // General
  band: '2G' | '5G' | '5G-lower' | '5G-upper' | '6G' | string;
  bandwidth: number;
  country: string;
  channelMode: 'HT' | 'VHT' | 'HE' | 'EHT' | string;
  channelWidth: number;
  channel: string | number;
  mimo: string;
  txPower: number;
  legacyRates: boolean;
  maximumClients?: number;
  multipleBssid: boolean;

  // Advanced Settings
  allowDfs: boolean;
  beaconRate?: '' | number | string;
  beaconInterval: number;
  hostapdIfaceRaw: string[];
  multicastRate?: '' | number | string;
  ema: boolean;
  bssColor?: number;
  requireMode?: '' | 'HT' | 'VHT' | 'HE' | string;
}

export const DEFAULT_RADIO_CONFIG: RadioConfigData = {
  band: '2G',
  bandwidth: 5,
  country: 'US',
  channelMode: 'HT',
  channelWidth: 40,
  channel: 'auto',
  mimo: '',
  txPower: 0,
  legacyRates: false,
  maximumClients: 64,
  multipleBssid: false,

  allowDfs: true,
  beaconRate: '',
  beaconInterval: 100,
  hostapdIfaceRaw: [],
  multicastRate: '',
  ema: false,
  bssColor: undefined,
  requireMode: '',
};

export function parseOwprovRadio(raw: Record<string, unknown> | undefined): RadioConfigData {
  if (!raw) return { ...DEFAULT_RADIO_CONFIG };

  const band = String(raw.band ?? raw['radio-band'] ?? '2G');
  const bandwidth = Number(raw.bandwidth ?? 5);
  const country = String(raw.country ?? 'US');
  const channelMode = String(raw['channel-mode'] ?? raw.channelMode ?? 'HT');
  const channelWidth = Number(raw['channel-width'] ?? raw.channelWidth ?? 40);
  const channel = (raw.channel !== undefined ? raw.channel : 'auto') as string | number;
  const mimo = String(raw.mimo ?? '');
  const txPower = Number(raw['tx-power'] ?? raw.txPower ?? 0);
  const legacyRates = Boolean(raw['legacy-rates'] ?? raw.legacyRates);
  const maximumClients =
    raw['maximum-clients'] !== undefined
      ? Number(raw['maximum-clients'])
      : raw.maximumClients !== undefined
      ? Number(raw.maximumClients)
      : 64;

  const he = (raw.he ?? raw['he-settings'] ?? {}) as Record<string, unknown>;
  const multipleBssid = Boolean(
    he['multiple-bssid'] ?? raw['multiple-bssid'] ?? raw.multipleBssid
  );
  const ema = Boolean(he.ema ?? raw.ema);
  const bssColor =
    he['bss-color'] !== undefined
      ? Number(he['bss-color'])
      : raw['bss-color'] !== undefined
      ? Number(raw['bss-color'])
      : undefined;

  const allowDfs =
    raw['allow-dfs'] !== undefined ? Boolean(raw['allow-dfs']) : true;

  const rates = (raw.rates ?? {}) as Record<string, unknown>;
  const beaconRate =
    rates.beacon !== undefined
      ? Number(rates.beacon)
      : raw['beacon-rate'] !== undefined
      ? Number(raw['beacon-rate'])
      : '';
  const beaconInterval = Number(
    raw['beacon-interval'] ?? raw.beaconInterval ?? 100
  );

  const rawHostapd = raw['hostapd-iface-raw'] ?? raw.hostapdIfaceRaw;
  const hostapdIfaceRaw = Array.isArray(rawHostapd)
    ? (rawHostapd as unknown[]).map(String)
    : typeof rawHostapd === 'string' && rawHostapd.trim()
    ? rawHostapd.split(',').map((s) => s.trim())
    : [];

  const multicastRate =
    rates.multicast !== undefined
      ? Number(rates.multicast)
      : raw['multicast-rate'] !== undefined
      ? Number(raw['multicast-rate'])
      : '';

  const requireMode = String(raw['require-mode'] ?? raw.requireMode ?? '');

  return {
    band,
    bandwidth,
    country,
    channelMode,
    channelWidth,
    channel,
    mimo,
    txPower,
    legacyRates,
    maximumClients,
    multipleBssid,

    allowDfs,
    beaconRate,
    beaconInterval,
    hostapdIfaceRaw,
    multicastRate,
    ema,
    bssColor,
    requireMode,
  };
}

export function buildOwprovRadio(cfg: RadioConfigData): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    band: cfg.band,
    bandwidth: Number(cfg.bandwidth),
    country: cfg.country,
    'channel-mode': cfg.channelMode,
    'channel-width': Number(cfg.channelWidth),
    channel: cfg.channel === 'auto' ? 'auto' : Number(cfg.channel),
    'tx-power': Number(cfg.txPower),
    'allow-dfs': cfg.allowDfs,
    'beacon-interval': Number(cfg.beaconInterval),
  };

  if (cfg.mimo) obj.mimo = cfg.mimo;
  if (cfg.legacyRates) obj['legacy-rates'] = true;
  if (cfg.maximumClients !== undefined && !isNaN(cfg.maximumClients)) {
    obj['maximum-clients'] = Number(cfg.maximumClients);
  }
  if (cfg.requireMode) obj['require-mode'] = cfg.requireMode;

  const rates: Record<string, number> = {};
  if (cfg.beaconRate !== '' && cfg.beaconRate !== undefined && !isNaN(Number(cfg.beaconRate))) {
    rates.beacon = Number(cfg.beaconRate);
  }
  if (cfg.multicastRate !== '' && cfg.multicastRate !== undefined && !isNaN(Number(cfg.multicastRate))) {
    rates.multicast = Number(cfg.multicastRate);
  }
  if (Object.keys(rates).length > 0) {
    obj.rates = rates;
  }

  const he: Record<string, unknown> = {};
  if (cfg.multipleBssid) he['multiple-bssid'] = true;
  if (cfg.ema) he.ema = true;
  if (cfg.bssColor !== undefined && !isNaN(cfg.bssColor)) {
    he['bss-color'] = Number(cfg.bssColor);
  }
  if (Object.keys(he).length > 0) {
    obj.he = he;
  }

  if (cfg.hostapdIfaceRaw && cfg.hostapdIfaceRaw.length > 0) {
    obj['hostapd-iface-raw'] = cfg.hostapdIfaceRaw;
  }

  return obj;
}

