import type {
  ConfigurationProfile,
  DeviceConfiguration,
  RadioBandConfig,
} from '../types/configuration';

export interface PropertyOption {
  id: string;
  name: string;
  address: string;
}

export interface VenueOption {
  id: string;
  name: string;
  propertyId: string;
}

export const MOCK_PROPERTIES_LIST: PropertyOption[] = [
  { id: 'prop-sunrise-001', name: 'Sunrise Apartments', address: '100 Sunset Blvd' },
  { id: 'prop-oakwood-002', name: 'Oakwood Heights', address: '450 Oak St' },
  { id: 'prop-bayview-003', name: 'Bayview Towers', address: '88 Ocean Way' },
];

export const MOCK_VENUES_LIST: VenueOption[] = [
  { id: '2211d28a-a985-434a-ad68-ca5ac4559852', name: 'Building B', propertyId: 'prop-sunrise-001' },
  { id: 'ven-bldg-a', name: 'Building A', propertyId: 'prop-sunrise-001' },
  { id: 'ven-poolside', name: 'Clubhouse & Pool', propertyId: 'prop-sunrise-001' },
  { id: 'ven-oak-tower-1', name: 'Tower 1', propertyId: 'prop-oakwood-002' },
];

export const MOCK_PROFILES: ConfigurationProfile[] = [
  {
    id: '2739c5f8-3b89-4c4a-8cea-e0d4c03bcaef',
    name: 'Radio resource',
    description: 'High-performance 5 GHz radio resource with DFS support and 40MHz channel width.',
    notes: [
      { note: 'Initialized for residential deployment', created: 1788257702, author: 'Admin' },
    ],
    created: 1788257702,
    modified: 1788257702,
    prefix: 'radio',
    deviceGroup: 'ap',
    entity: 'prop-sunrise-001',
    entityName: 'Sunrise Apartments',
    venue: '2211d28a-a985-434a-ad68-ca5ac4559852',
    venueName: 'Building B',
    subscriber: '',
    inventory: '',
    configurations: ['0ad1e83e-e62a-4301-8fc2-ae9af0f38388'],
    status: 'valid',
    configuredFieldsCount: 10,
    variables: [
      {
        prefix: 'radio',
        type: 'json',
        weight: 0,
        value: JSON.stringify({
          'allow-dfs': true,
          band: '5G',
          bandwidth: 10,
          'beacon-interval': 100,
          channel: 'auto',
          'channel-mode': 'HT',
          'channel-width': 40,
          country: 'US',
          'maximum-clients': 64,
          'tx-power': 0,
        }),
      },
    ],
    parsedValues: {
      'allow-dfs': true,
      band: '5G',
      bandwidth: 10,
      'beacon-interval': 100,
      channel: 'auto',
      'channel-mode': 'HT',
      'channel-width': 40,
      country: 'US',
      'maximum-clients': 64,
      'tx-power': 0,
    },
  },
  {
    id: '5de6444a-751b-4891-9bbe-3009ac645003',
    name: 'Resident SSID',
    description: 'Dual-band WPA2/WPA3 private resident network profile with VLAN segmentation.',
    notes: [
      { note: 'Secured WPA2-PSK passphrase updated', created: 1788163485, author: 'Chandan' },
    ],
    created: 1788163485,
    modified: 1788163485,
    prefix: 'interface.ssid',
    deviceGroup: 'ap',
    entity: 'prop-sunrise-001',
    entityName: 'Sunrise Apartments',
    venue: '',
    venueName: '',
    subscriber: '',
    inventory: '',
    configurations: ['0ad1e83e-e62a-4301-8fc2-ae9af0f38388', 'cfg-common-area'],
    status: 'valid',
    configuredFieldsCount: 6,
    variables: [
      {
        prefix: 'interface.ssid',
        type: 'json',
        weight: 0,
        value: JSON.stringify({
          name: 'Resident-WiFi',
          'bss-mode': 'ap',
          'wifi-bands': ['2G', '5G'],
          encryption: {
            protocol: 'WPA2-PSK',
            key: 'ResidentPass2026!',
          },
          ieee80211w: 'optional',
          vlan: 100,
          'key-caching': true,
        }),
      },
    ],
    parsedValues: {
      name: 'Resident-WiFi',
      'bss-mode': 'ap',
      'wifi-bands': '2G, 5G',
      protocol: 'WPA2-PSK',
      key: 'ResidentPass2026!',
      ieee80211w: 'optional',
      vlan: 100,
      'key-caching': true,
    },
  },
  {
    id: 'prof-legacy-24g',
    name: 'Standard 2.4 GHz Radio',
    description: '2.4 GHz coverage profile optimized for legacy IoT devices and residential appliances.',
    notes: [],
    created: 1788000000,
    modified: 1788150000,
    prefix: 'radio',
    deviceGroup: 'ap',
    entity: '',
    entityName: 'Global Scope',
    venue: '',
    venueName: '',
    subscriber: '',
    inventory: '',
    configurations: ['0ad1e83e-e62a-4301-8fc2-ae9af0f38388'],
    status: 'valid',
    configuredFieldsCount: 8,
    variables: [
      {
        prefix: 'radio',
        type: 'json',
        weight: 0,
        value: JSON.stringify({
          'allow-dfs': false,
          band: '2.4G',
          bandwidth: 20,
          'beacon-interval': 100,
          channel: 'auto',
          'channel-mode': 'HT',
          'channel-width': 20,
          country: 'US',
          'maximum-clients': 64,
          'tx-power': 20,
        }),
      },
    ],
    parsedValues: {
      'allow-dfs': false,
      band: '2.4G',
      bandwidth: 20,
      'beacon-interval': 100,
      channel: 'auto',
      'channel-mode': 'HT',
      'channel-width': 20,
      country: 'US',
      'maximum-clients': 64,
      'tx-power': 20,
    },
  },
  {
    id: 'prof-tenant-vlan',
    name: 'Tenant Isolation VLAN',
    description: 'VLAN 100 trunk profile with client isolation enabled.',
    notes: [],
    created: 1787900000,
    modified: 1787900000,
    prefix: 'interface.vlan',
    deviceGroup: 'ap',
    entity: 'prop-sunrise-001',
    entityName: 'Sunrise Apartments',
    venue: '',
    venueName: '',
    subscriber: '',
    inventory: '',
    configurations: ['0ad1e83e-e62a-4301-8fc2-ae9af0f38388'],
    status: 'valid',
    configuredFieldsCount: 2,
    variables: [
      {
        prefix: 'interface.vlan',
        type: 'json',
        weight: 0,
        value: JSON.stringify({
          'vlan-id': 100,
          description: 'Tenant VLAN isolation',
        }),
      },
    ],
    parsedValues: {
      'vlan-id': 100,
      description: 'Tenant VLAN isolation',
    },
  },
  {
    id: 'prof-guest-portal',
    name: 'Public Guest Captive Portal',
    description: 'Captive portal profile for community amenities and guest visitors.',
    notes: [],
    created: 1787800000,
    modified: 1787800000,
    prefix: 'interface.captive',
    deviceGroup: 'ap',
    entity: '',
    entityName: 'Global Scope',
    venue: '',
    venueName: '',
    subscriber: '',
    inventory: '',
    configurations: ['cfg-common-area'],
    status: 'valid',
    configuredFieldsCount: 4,
    variables: [
      {
        prefix: 'interface.captive',
        type: 'json',
        weight: 0,
        value: JSON.stringify({
          url: 'https://guest.mangowifi.net/login',
          timeout: 7200,
          ssl: true,
        }),
      },
    ],
    parsedValues: {
      url: 'https://guest.mangowifi.net/login',
      timeout: 7200,
      ssl: true,
    },
  },
];

export const SAMPLE_AP_CONFIG_JSON = JSON.stringify(
  {
    interfaces: [
      {
        name: 'WAN',
        role: 'upstream',
        services: ['lldp'],
        ethernet: [{ 'select-ports': ['WAN*'] }],
        ipv4: { addressing: 'dynamic' },
      },
      {
        name: 'LAN',
        role: 'downstream',
        services: ['ssh'],
        ethernet: [{ 'select-ports': ['LAN*'] }],
        ipv4: {
          addressing: 'static',
          subnet: '192.168.1.1/24',
          dhcp: { 'lease-first': 10, 'lease-count': 100, 'lease-time': '6h' },
        },
        ssids: [
          {
            name: 'OpenWiFi-Default',
            security: 'wpa2-psk',
            key: 'OpenWiFiDefault123',
            'wifi-bands': ['2G', '5G'],
          },
        ],
      },
    ],
    metrics: {
      statistics: { interval: 60, types: ['ssids', 'lldp', 'clients'] },
      health: { interval: 60 },
    },
    services: {
      lldp: { describe: 'OpenWiFi AP' },
      ssh: { port: 22 },
    },
    radios: [
      {
        band: '5G',
        channel: 'auto',
        'channel-mode': 'HE',
        'channel-width': 80,
        country: 'US',
      },
      {
        band: '2G',
        channel: 'auto',
        'channel-mode': 'HE',
        'channel-width': 20,
        country: 'US',
      },
    ],
  },
  null,
  2
);

export const SAMPLE_SWITCH_CONFIG_JSON = JSON.stringify(
  {
    interfaces: [
      {
        name: 'Upstream',
        role: 'upstream',
        ethernet: [{ 'select-ports': ['1/1'] }],
        ipv4: { addressing: 'dynamic' },
      },
      {
        name: 'VLAN-100',
        role: 'downstream',
        vlan: { id: 100 },
        ethernet: [{ 'select-ports': ['1/2-1/10'] }],
        ipv4: {
          addressing: 'static',
          subnet: '10.10.100.1/24',
        },
      },
    ],
    metrics: {
      statistics: { interval: 60 },
      health: { interval: 60 },
    },
    services: {
      lldp: { describe: 'OpenWiFi Switch' },
      ssh: { port: 22 },
    },
  },
  null,
  2
);

export const SAMPLE_OLG_CONFIG_JSON = JSON.stringify(
  {
    interfaces: [
      {
        name: 'WAN',
        role: 'upstream',
        ipv4: { addressing: 'dynamic' },
      },
      {
        name: 'LAN',
        role: 'downstream',
        ipv4: {
          addressing: 'static',
          subnet: '192.168.10.1/24',
        },
      },
    ],
    nat: {
      snat: [
        {
          src: '192.168.10.0/24',
          dst: '0.0.0.0/0',
          mode: 'masquerade',
        },
      ],
    },
  },
  null,
  2
);

export const MOCK_CONFIGURATIONS: DeviceConfiguration[] = [
  // OWGW Default Configuration (Raw JSON template)
  {
    id: 'cfg-owgw-default-ap-01',
    name: 'Default-AP-Gateway',
    description: 'OWGW Gateway default configuration for all AP models (dual-band HE & WAN/LAN)',
    configType: 'default',
    platform: 'ap',
    devicetypes: ['*'],
    rawConfigurationJson: SAMPLE_AP_CONFIG_JSON,
    notes: [
      { note: 'Synchronized from OWGW default configurations', created: 1788200000, author: 'System' },
    ],
    created: 1788200000,
    modified: 1788200000,
    entity: '',
    venue: '',
    subscriber: '',
    subscriberonly: false,
    inuse: ['ap-unit-101'],
    variables: [],
    devicerules: {
      firmwareUpgrade: 'inherit',
      rcOnly: 'inherit',
      rrm: 'inherit',
    },
    tags: ['owgw', 'default-config', 'ap'],
    version: 1,
    status: 'active',
    validation: 'passed',
    assignments: [],
    configuration: [],
    sections: {
      general: {
        name: 'Default-AP-Gateway',
        description: 'OWGW Gateway default configuration for all AP models',
        timezone: 'UTC-5 (EST)',
        country: 'US',
      },
      radios: { bands: [] },
      interfaces: { ssids: [] },
      services: { ssh: true, lldp: true },
      metrics: { interval: 60, reporting: true },
      unit: { leds: true, poeOut: false },
    },
  },
  // OWGW Default Switch Configuration
  {
    id: 'cfg-owgw-default-sw-02',
    name: 'Default-Switch-Gateway',
    description: 'OWGW Gateway default configuration for EdgeCore managed switches',
    configType: 'default',
    platform: 'switch',
    devicetypes: ['edgecore_ecs4100-12ph', '*'],
    rawConfigurationJson: SAMPLE_SWITCH_CONFIG_JSON,
    notes: [],
    created: 1788190000,
    modified: 1788190000,
    entity: '',
    venue: '',
    subscriber: '',
    subscriberonly: false,
    inuse: [],
    variables: [],
    devicerules: {
      firmwareUpgrade: 'inherit',
      rcOnly: 'inherit',
      rrm: 'inherit',
    },
    tags: ['owgw', 'default-config', 'switch'],
    version: 1,
    status: 'active',
    validation: 'passed',
    assignments: [],
    configuration: [],
    sections: {
      general: {
        name: 'Default-Switch-Gateway',
        description: 'OWGW Gateway default configuration for EdgeCore managed switches',
        timezone: 'UTC-5 (EST)',
        country: 'US',
      },
      radios: { bands: [] },
      interfaces: { ssids: [] },
      services: { ssh: true, lldp: true },
      metrics: { interval: 60, reporting: true },
      unit: { leds: true, poeOut: false },
    },
  },
  // OWPROV Modular Configuration (Visual builder with variable block)
  {
    id: '0ad1e83e-e62a-4301-8fc2-ae9af0f38388',
    name: 'Chandan-Master-Template',
    description: 'Master config referencing variable block for radios and dynamic SSIDs',
    configType: 'modular',
    platform: 'ap',
    deviceGroup: 'ap',
    notes: [
      { note: 'Assigned to Sunrise Apartments Building B', created: 1788163485, author: 'Chandan' },
    ],
    created: 1788163485,
    modified: 1788163485,
    devicetypes: ['*'],
    entity: 'prop-sunrise-001',
    entityName: 'Sunrise Apartments',
    venue: '2211d28a-a985-434a-ad68-ca5ac4559852',
    venueName: 'Building B',
    subscriber: '',
    subscriberonly: false,
    inuse: ['ap-unit-101', 'ap-unit-102', 'ap-unit-103'],
    variables: ['5de6444a-751b-4891-9bbe-3009ac645003', '2739c5f8-3b89-4c4a-8cea-e0d4c03bcaef', 'prof-legacy-24g'],
    devicerules: {
      firmwareUpgrade: 'inherit',
      rcOnly: 'inherit',
      rrm: 'inherit',
    },
    tags: ['residential', 'mdu', 'master-template'],
    configuration: [
      {
        name: 'Interface-Block',
        description: 'Dynamic SSID interface referencing variable block',
        weight: 1,
        configuration: JSON.stringify({
          interfaces: [
            {
              ssids: [
                {
                  __variableBlock: ['5de6444a-751b-4891-9bbe-3009ac645003'],
                },
              ],
            },
          ],
        }),
      },
      {
        name: 'Radios-Block',
        description: 'Dual-band radios referencing Radio resource with local tx-power override',
        weight: 1,
        configuration: JSON.stringify({
          radios: [
            {
              __variableBlock: ['2739c5f8-3b89-4c4a-8cea-e0d4c03bcaef'],
              'tx-power': 20, // Local override!
            },
            {
              __variableBlock: ['prof-legacy-24g'],
            },
          ],
        }),
      },
    ],
    version: 14,
    status: 'active',
    validation: 'passed',
    assignments: [
      { id: 'prop-sunrise-001', name: 'Sunrise Apartments', type: 'property' },
      { id: '2211d28a-a985-434a-ad68-ca5ac4559852', name: 'Building B', type: 'venue' },
      { id: 'ap-unit-101', name: 'AP-B-101', type: 'device' },
    ],
    sections: {
      general: {
        name: 'Chandan-Master-Template',
        description: 'Master config referencing variable block for radios and dynamic SSIDs',
        timezone: 'UTC-5 (EST)',
        country: 'US',
      },
      radios: {
        bands: [
          {
            band: '5 GHz',
            enabled: true,
            profileId: '2739c5f8-3b89-4c4a-8cea-e0d4c03bcaef',
            profileName: 'Radio resource',
            inheritedSettingsCount: 9,
            fields: [
              { key: 'enabled', label: 'Enabled', effectiveValue: true, source: 'Radio resource', overridden: false, profileDefaultValue: true },
              { key: 'band', label: 'Band', effectiveValue: '5 GHz', source: 'Radio resource', overridden: false, profileDefaultValue: '5 GHz' },
              { key: 'channel', label: 'Channel', effectiveValue: 'auto', source: 'Radio resource', overridden: false, profileDefaultValue: 'auto' },
              { key: 'channel-width', label: 'Channel Width', effectiveValue: '40 MHz', source: 'Radio resource', overridden: false, profileDefaultValue: '40 MHz' },
              { key: 'channel-mode', label: 'Channel Mode', effectiveValue: 'HT', source: 'Radio resource', overridden: false, profileDefaultValue: 'HT' },
              { key: 'tx-power', label: 'TX Power', effectiveValue: 20, source: 'Overridden here', overridden: true, profileDefaultValue: 0 },
              { key: 'country', label: 'Country', effectiveValue: 'US', source: 'Radio resource', overridden: false, profileDefaultValue: 'US' },
              { key: 'allow-dfs', label: 'Allow DFS', effectiveValue: true, source: 'Radio resource', overridden: false, profileDefaultValue: true },
              { key: 'maximum-clients', label: 'Maximum Clients', effectiveValue: 64, source: 'Radio resource', overridden: false, profileDefaultValue: 64 },
              { key: 'beacon-interval', label: 'Beacon Interval', effectiveValue: '100 ms', source: 'Radio resource', overridden: false, profileDefaultValue: '100 ms' },
            ],
          },
          {
            band: '2.4 GHz',
            enabled: true,
            profileId: 'prof-legacy-24g',
            profileName: 'Standard 2.4 GHz Radio',
            inheritedSettingsCount: 8,
            fields: [
              { key: 'enabled', label: 'Enabled', effectiveValue: true, source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: true },
              { key: 'band', label: 'Band', effectiveValue: '2.4 GHz', source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: '2.4 GHz' },
              { key: 'channel', label: 'Channel', effectiveValue: 'auto', source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: 'auto' },
              { key: 'channel-width', label: 'Channel Width', effectiveValue: '20 MHz', source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: '20 MHz' },
              { key: 'tx-power', label: 'TX Power', effectiveValue: 20, source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: 20 },
              { key: 'country', label: 'Country', effectiveValue: 'US', source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: 'US' },
              { key: 'allow-dfs', label: 'Allow DFS', effectiveValue: false, source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: false },
              { key: 'beacon-interval', label: 'Beacon Interval', effectiveValue: '100 ms', source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: '100 ms' },
            ],
          },
          {
            band: '6 GHz',
            enabled: false,
            inheritedSettingsCount: 0,
            fields: [
              { key: 'enabled', label: 'Enabled', effectiveValue: false, source: 'Default', overridden: false, profileDefaultValue: false },
            ],
          },
        ] as RadioBandConfig[],
      },
      interfaces: {
        ssids: [
          {
            name: 'Resident Private Wi-Fi',
            ssid: 'Resident-WiFi',
            security: 'WPA2-PSK',
            vlan: 100,
            profileId: '5de6444a-751b-4891-9bbe-3009ac645003',
            profileName: 'Resident SSID',
            overridden: false,
          },
        ],
      },
      services: {
        ssh: true,
        lldp: true,
      },
      metrics: {
        interval: 60,
        reporting: true,
      },
      unit: {
        leds: true,
        poeOut: false,
      },
    },
  },
  {
    id: 'cfg-common-area',
    name: 'Common Area Wi-Fi Template',
    description: 'Shared common area and clubhouse Wi-Fi with isolated captive portal',
    configType: 'modular',
    platform: 'ap',
    deviceGroup: 'ap',
    notes: [],
    created: 1788100000,
    modified: 1788150000,
    devicetypes: ['*'],
    entity: '',
    entityName: 'Global Scope',
    venue: '',
    venueName: '',
    subscriber: '',
    subscriberonly: false,
    inuse: ['ap-clubhouse-01', 'ap-pool-01'],
    variables: ['prof-guest-portal', 'prof-legacy-24g'],
    devicerules: {
      firmwareUpgrade: 'inherit',
      rcOnly: 'inherit',
      rrm: 'inherit',
    },
    tags: ['common-area', 'guest'],
    configuration: [
      {
        name: 'Guest-Captive-Block',
        description: 'Captive portal configuration',
        weight: 1,
        configuration: JSON.stringify({
          interfaces: [
            {
              ssids: [
                {
                  __variableBlock: ['prof-guest-portal'],
                },
              ],
            },
          ],
        }),
      },
    ],
    version: 8,
    status: 'active',
    validation: 'passed',
    assignments: [
      { id: 'ven-poolside', name: 'Clubhouse & Pool', type: 'venue' },
    ],
    sections: {
      general: {
        name: 'Common Area Wi-Fi Template',
        description: 'Shared common area and clubhouse Wi-Fi with isolated captive portal',
        timezone: 'UTC-5 (EST)',
        country: 'US',
      },
      radios: {
        bands: [
          {
            band: '5 GHz',
            enabled: true,
            profileId: '2739c5f8-3b89-4c4a-8cea-e0d4c03bcaef',
            profileName: 'Radio resource',
            inheritedSettingsCount: 8,
            fields: [
              { key: 'enabled', label: 'Enabled', effectiveValue: true, source: 'Radio resource', overridden: false, profileDefaultValue: true },
              { key: 'channel', label: 'Channel', effectiveValue: 'auto', source: 'Radio resource', overridden: false, profileDefaultValue: 'auto' },
              { key: 'tx-power', label: 'TX Power', effectiveValue: 0, source: 'Radio resource', overridden: false, profileDefaultValue: 0 },
            ],
          },
          {
            band: '2.4 GHz',
            enabled: true,
            profileId: 'prof-legacy-24g',
            profileName: 'Standard 2.4 GHz Radio',
            inheritedSettingsCount: 7,
            fields: [
              { key: 'enabled', label: 'Enabled', effectiveValue: true, source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: true },
              { key: 'channel', label: 'Channel', effectiveValue: 'auto', source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: 'auto' },
              { key: 'tx-power', label: 'TX Power', effectiveValue: 20, source: 'Standard 2.4 GHz Radio', overridden: false, profileDefaultValue: 20 },
            ],
          },
          {
            band: '6 GHz',
            enabled: false,
            inheritedSettingsCount: 0,
            fields: [
              { key: 'enabled', label: 'Enabled', effectiveValue: false, source: 'Default', overridden: false, profileDefaultValue: false },
            ],
          },
        ] as RadioBandConfig[],
      },
      interfaces: {
        ssids: [
          {
            name: 'Mango-Guest',
            ssid: 'Mango-Guest',
            security: 'Open Captive Portal',
            vlan: 200,
            profileId: 'prof-guest-portal',
            profileName: 'Public Guest Captive Portal',
            overridden: false,
          },
        ],
      },
      services: {
        ssh: true,
        lldp: true,
      },
      metrics: {
        interval: 60,
        reporting: true,
      },
      unit: {
        leds: true,
        poeOut: false,
      },
    },
  },
];
