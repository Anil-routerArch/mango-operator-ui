import type { PlatformType } from '../types/configuration';

export interface RadioFormState {
  enabled: boolean;
  band: '5G' | '2G' | '6G';
  channel: string;
  channelWidth: number;
  channelMode: string;
  txPower: number;
  country: string;
}

export interface SsidFormState {
  id: string;
  name: string;
  security: 'wpa2-psk' | 'wpa3-personal' | 'open' | 'wpa2-enterprise';
  key: string;
  bands: ('2G' | '5G' | '6G')[];
  vlan?: number;
}

export interface SwitchFormState {
  upstreamPort: string;
  downstreamPorts: string;
  vlanId: number;
}

export interface VisualConfigFormState {
  platform: PlatformType;
  radios: {
    radio5G: RadioFormState;
    radio2G: RadioFormState;
    radio6G: RadioFormState;
  };
  wan: {
    addressing: 'dynamic' | 'static';
    subnet?: string;
    ports: string;
  };
  lan: {
    addressing: 'static' | 'dynamic';
    subnet: string;
    dhcpEnabled: boolean;
    ports: string;
  };
  ssids: SsidFormState[];
  services: {
    ssh: boolean;
    sshPort: number;
    lldp: boolean;
    lldpDescription: string;
  };
  metrics: {
    statsInterval: number;
    healthInterval: number;
  };
  switchConfig: SwitchFormState;
}

export const getDefaultVisualState = (platform: PlatformType): VisualConfigFormState => ({
  platform,
  radios: {
    radio5G: {
      enabled: true,
      band: '5G',
      channel: 'auto',
      channelWidth: 80,
      channelMode: 'HE',
      txPower: 20,
      country: 'US',
    },
    radio2G: {
      enabled: true,
      band: '2G',
      channel: 'auto',
      channelWidth: 20,
      channelMode: 'HE',
      txPower: 20,
      country: 'US',
    },
    radio6G: {
      enabled: false,
      band: '6G',
      channel: 'auto',
      channelWidth: 160,
      channelMode: 'HE',
      txPower: 20,
      country: 'US',
    },
  },
  wan: {
    addressing: 'dynamic',
    ports: 'WAN*',
  },
  lan: {
    addressing: 'static',
    subnet: '192.168.1.1/24',
    dhcpEnabled: true,
    ports: 'LAN*',
  },
  ssids: [
    {
      id: 'ssid-default-1',
      name: 'OpenWiFi-Default',
      security: 'wpa2-psk',
      key: 'OpenWiFiDefault123',
      bands: ['2G', '5G'],
      vlan: 0,
    },
  ],
  services: {
    ssh: true,
    sshPort: 22,
    lldp: true,
    lldpDescription: platform === 'switch' ? 'OpenWiFi Switch' : 'OpenWiFi AP',
  },
  metrics: {
    statsInterval: 60,
    healthInterval: 60,
  },
  switchConfig: {
    upstreamPort: '1/1',
    downstreamPorts: '1/2-1/10',
    vlanId: 100,
  },
});

export const buildUCentralJsonFromVisualState = (state: VisualConfigFormState): string => {
  if (state.platform === 'switch') {
    const swDoc = {
      interfaces: [
        {
          name: 'Upstream',
          role: 'upstream',
          ethernet: [{ 'select-ports': [state.switchConfig.upstreamPort || '1/1'] }],
          ipv4: { addressing: 'dynamic' },
        },
        {
          name: `VLAN-${state.switchConfig.vlanId || 100}`,
          role: 'downstream',
          vlan: { id: state.switchConfig.vlanId || 100 },
          ethernet: [{ 'select-ports': [state.switchConfig.downstreamPorts || '1/2-1/10'] }],
          ipv4: {
            addressing: 'static',
            subnet: `10.10.${state.switchConfig.vlanId || 100}.1/24`,
          },
        },
      ],
      metrics: {
        statistics: { interval: state.metrics.statsInterval },
        health: { interval: state.metrics.healthInterval },
      },
      services: {
        ...(state.services.lldp ? { lldp: { describe: state.services.lldpDescription || 'OpenWiFi Switch' } } : {}),
        ...(state.services.ssh ? { ssh: { port: state.services.sshPort || 22 } } : {}),
      },
    };
    return JSON.stringify(swDoc, null, 2);
  }

  if (state.platform === 'olg') {
    const olgDoc = {
      interfaces: [
        {
          name: 'WAN',
          role: 'upstream',
          ipv4: { addressing: state.wan.addressing },
        },
        {
          name: 'LAN',
          role: 'downstream',
          ipv4: {
            addressing: state.lan.addressing,
            subnet: state.lan.subnet || '192.168.10.1/24',
          },
        },
      ],
      nat: {
        snat: [
          {
            src: state.lan.subnet || '192.168.10.0/24',
            dst: '0.0.0.0/0',
            mode: 'masquerade',
          },
        ],
      },
    };
    return JSON.stringify(olgDoc, null, 2);
  }

  // AP Platform
  const activeRadios = [];
  if (state.radios.radio5G.enabled) {
    activeRadios.push({
      band: '5G',
      channel: state.radios.radio5G.channel === 'auto' ? 'auto' : Number(state.radios.radio5G.channel) || 'auto',
      'channel-mode': state.radios.radio5G.channelMode,
      'channel-width': state.radios.radio5G.channelWidth,
      country: state.radios.radio5G.country,
      'tx-power': state.radios.radio5G.txPower,
    });
  }
  if (state.radios.radio2G.enabled) {
    activeRadios.push({
      band: '2G',
      channel: state.radios.radio2G.channel === 'auto' ? 'auto' : Number(state.radios.radio2G.channel) || 'auto',
      'channel-mode': state.radios.radio2G.channelMode,
      'channel-width': state.radios.radio2G.channelWidth,
      country: state.radios.radio2G.country,
      'tx-power': state.radios.radio2G.txPower,
    });
  }
  if (state.radios.radio6G.enabled) {
    activeRadios.push({
      band: '6G',
      channel: state.radios.radio6G.channel === 'auto' ? 'auto' : Number(state.radios.radio6G.channel) || 'auto',
      'channel-mode': state.radios.radio6G.channelMode,
      'channel-width': state.radios.radio6G.channelWidth,
      country: state.radios.radio6G.country,
      'tx-power': state.radios.radio6G.txPower,
    });
  }

  const ssidsPayload = state.ssids.map((s) => ({
    name: s.name,
    security: s.security,
    ...(s.security !== 'open' && s.key ? { key: s.key } : {}),
    'wifi-bands': s.bands,
    ...(s.vlan && s.vlan > 0 ? { vlan: s.vlan } : {}),
  }));

  const apDoc = {
    interfaces: [
      {
        name: 'WAN',
        role: 'upstream',
        services: state.services.lldp ? ['lldp'] : [],
        ethernet: [{ 'select-ports': [state.wan.ports || 'WAN*'] }],
        ipv4: {
          addressing: state.wan.addressing,
          ...(state.wan.addressing === 'static' && state.wan.subnet ? { subnet: state.wan.subnet } : {}),
        },
      },
      {
        name: 'LAN',
        role: 'downstream',
        services: state.services.ssh ? ['ssh'] : [],
        ethernet: [{ 'select-ports': [state.lan.ports || 'LAN*'] }],
        ipv4: {
          addressing: state.lan.addressing,
          subnet: state.lan.subnet,
          ...(state.lan.dhcpEnabled
            ? { dhcp: { 'lease-first': 10, 'lease-count': 100, 'lease-time': '6h' } }
            : {}),
        },
        ssids: ssidsPayload,
      },
    ],
    metrics: {
      statistics: { interval: state.metrics.statsInterval, types: ['ssids', 'lldp', 'clients'] },
      health: { interval: state.metrics.healthInterval },
    },
    services: {
      ...(state.services.lldp ? { lldp: { describe: state.services.lldpDescription || 'OpenWiFi AP' } } : {}),
      ...(state.services.ssh ? { ssh: { port: state.services.sshPort || 22 } } : {}),
    },
    radios: activeRadios,
  };

  return JSON.stringify(apDoc, null, 2);
};

export const parseUCentralJsonToVisualState = (
  rawJson: string,
  platform: PlatformType
): VisualConfigFormState => {
  const base = getDefaultVisualState(platform);
  if (!rawJson) return base;

  try {
    const obj = JSON.parse(rawJson);
    if (!obj || typeof obj !== 'object') return base;

    // Radios
    if (Array.isArray(obj.radios)) {
      for (const r of obj.radios) {
        const bandUpper = String(r.band || '').toUpperCase();
        if (bandUpper === '5G') {
          base.radios.radio5G = {
            enabled: true,
            band: '5G',
            channel: r.channel != null ? String(r.channel) : 'auto',
            channelWidth: Number(r['channel-width']) || 80,
            channelMode: String(r['channel-mode'] || 'HE'),
            txPower: Number(r['tx-power']) || 20,
            country: String(r.country || 'US'),
          };
        } else if (bandUpper === '2G') {
          base.radios.radio2G = {
            enabled: true,
            band: '2G',
            channel: r.channel != null ? String(r.channel) : 'auto',
            channelWidth: Number(r['channel-width']) || 20,
            channelMode: String(r['channel-mode'] || 'HE'),
            txPower: Number(r['tx-power']) || 20,
            country: String(r.country || 'US'),
          };
        } else if (bandUpper === '6G') {
          base.radios.radio6G = {
            enabled: true,
            band: '6G',
            channel: r.channel != null ? String(r.channel) : 'auto',
            channelWidth: Number(r['channel-width']) || 160,
            channelMode: String(r['channel-mode'] || 'HE'),
            txPower: Number(r['tx-power']) || 20,
            country: String(r.country || 'US'),
          };
        }
      }
    }

    // Interfaces
    if (Array.isArray(obj.interfaces)) {
      for (const iface of obj.interfaces) {
        if (iface.role === 'upstream') {
          base.wan.addressing = iface.ipv4?.addressing === 'static' ? 'static' : 'dynamic';
          if (iface.ipv4?.subnet) base.wan.subnet = String(iface.ipv4.subnet);
          if (Array.isArray(iface.ethernet) && iface.ethernet[0]?.['select-ports']?.[0]) {
            base.wan.ports = String(iface.ethernet[0]['select-ports'][0]);
          }
        } else if (iface.role === 'downstream') {
          base.lan.addressing = iface.ipv4?.addressing === 'dynamic' ? 'dynamic' : 'static';
          if (iface.ipv4?.subnet) base.lan.subnet = String(iface.ipv4.subnet);
          base.lan.dhcpEnabled = Boolean(iface.ipv4?.dhcp);
          if (Array.isArray(iface.ethernet) && iface.ethernet[0]?.['select-ports']?.[0]) {
            base.lan.ports = String(iface.ethernet[0]['select-ports'][0]);
          }

          if (Array.isArray(iface.ssids) && iface.ssids.length > 0) {
            base.ssids = iface.ssids.map((s: Record<string, unknown>, idx: number) => ({
              id: `ssid-parsed-${idx}`,
              name: String(s.name || `SSID-${idx + 1}`),
              security: (['wpa2-psk', 'wpa3-personal', 'open', 'wpa2-enterprise'].includes(String(s.security))
                ? String(s.security)
                : 'wpa2-psk') as SsidFormState['security'],
              key: String(s.key || ''),
              bands: (Array.isArray(s['wifi-bands'])
                ? s['wifi-bands'].map((b) => String(b))
                : ['2G', '5G']) as ('2G' | '5G' | '6G')[],
              vlan: Number(s.vlan) || 0,
            }));
          }
        }
      }
    }

    // Services
    if (obj.services) {
      base.services.ssh = Boolean(obj.services.ssh);
      if (obj.services.ssh?.port) base.services.sshPort = Number(obj.services.ssh.port);
      base.services.lldp = Boolean(obj.services.lldp);
      if (obj.services.lldp?.describe) base.services.lldpDescription = String(obj.services.lldp.describe);
    }

    // Metrics
    if (obj.metrics) {
      if (obj.metrics.statistics?.interval) base.metrics.statsInterval = Number(obj.metrics.statistics.interval);
      if (obj.metrics.health?.interval) base.metrics.healthInterval = Number(obj.metrics.health.interval);
    }

    return base;
  } catch {
    return base;
  }
};

