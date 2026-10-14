export type ConfigSectionType = 'general' | 'radios' | 'interfaces' | 'services' | 'metrics' | 'unit';

export type VariablePrefixType =
  | 'radio'
  | 'interface.ssid'
  | 'interface.vlan'
  | 'interface.ipv4'
  | 'interface.captive'
  | 'interface.tunnel'
  | 'interface.ssid.radius'
  | 'interface.ssid.openroaming';

export type ProfileSettingsValue = string | number | boolean | string[] | Record<string, unknown>;

export interface ProfileSettingField {
  key: string;
  label: string;
  effectiveValue: ProfileSettingsValue;
  source: string; // e.g. "Radio resource" or "Overridden here"
  overridden: boolean;
  profileDefaultValue: ProfileSettingsValue;
}

export interface RadioBandConfig {
  band: '5 GHz' | '2.4 GHz' | '6 GHz';
  enabled: boolean;
  profileId?: string;
  profileName?: string;
  inheritedSettingsCount?: number;
  fields: ProfileSettingField[];
}

export interface ConfigurationAssignment {
  id: string;
  name: string;
  type: 'property' | 'venue' | 'device';
}

// OWPROV Variable Element inside variables table
export interface VariableBlockElement {
  prefix: VariablePrefixType;
  type: 'json';
  value: string; // Serialized JSON string of the configuration section
  weight: number;
}

export interface NoteItem {
  note: string;
  created: number; // Unix timestamp
  author?: string;
}

// Corresponds directly to OWPROV 'variables' table
export interface ConfigurationProfile {
  id: string; // UUID
  name: string;
  description: string;
  notes: NoteItem[];
  created: number;
  modified: number;
  variables: VariableBlockElement[];
  entity: string; // Property UUID (or empty string for Global)
  entityName?: string;
  venue: string; // Venue UUID (or empty string)
  venueName?: string;
  subscriber: string;
  inventory: string;
  configurations: string[]; // List of Configuration UUIDs referencing this variable block
  deviceGroup: string; // Default 'ap'
  // Convenience parsed properties for UI display
  prefix: VariablePrefixType;
  parsedValues: Record<string, ProfileSettingsValue>;
  status?: 'valid' | 'invalid';
  configuredFieldsCount?: number;
}

// OWPROV Section element inside configurations table
export interface ConfigurationBlockElement {
  name: string;
  description: string;
  weight: number;
  configuration: string; // Serialized JSON string containing sections, __variableBlock and overrides
}

export interface DeviceRules {
  firmwareUpgrade: 'inherit' | 'yes' | 'no';
  rcOnly: 'inherit' | 'yes' | 'no';
  rrm: 'inherit' | 'yes' | 'no';
}

export interface SsidInterfaceConfig {
  name: string;
  ssid: string;
  security: string;
  vlan: number;
  profileId?: string;
  profileName?: string;
  overridden?: boolean;
  overrides?: Record<string, ProfileSettingsValue>;
}

export type ConfigurationType = 'default' | 'modular';
export type PlatformType = 'ap' | 'switch' | 'olg';

// Corresponds to OWPROV 'configurations' or OWGW 'default_configurations'
export interface DeviceConfiguration {
  id: string; // UUID
  name: string;
  description: string;
  configType?: ConfigurationType; // 'default' (OWGW JSON) or 'modular' (OWPROV visual)
  platform?: PlatformType; // 'ap' | 'switch' | 'olg'
  deviceGroup?: string; // OWPROV device group (e.g. 'ap', 'switch', 'olg')
  rawConfigurationJson?: string; // Raw uCentral JSON for OWGW Default Configurations
  notes: NoteItem[];
  created: number;
  modified: number;
  devicetypes: string[]; // e.g. ["*"] or ["ap"]
  configuration: ConfigurationBlockElement[];
  inuse: string[];
  variables: string[]; // Array of UUIDs of referenced VariableBlocks
  devicerules: DeviceRules;
  tags: string[];
  subscriberonly: boolean;
  entity: string; // Property UUID
  entityName?: string;
  venue: string; // Venue UUID
  venueName?: string;
  subscriber: string;
  // UI helpers & parsed sections
  version: number;
  status: 'active' | 'draft' | 'archived';
  validation: 'passed' | 'warning' | 'failed';
  assignments: ConfigurationAssignment[];
  sections: {
    general: {
      name: string;
      description: string;
      timezone: string;
      country: string;
    };
    radios: {
      bands: RadioBandConfig[];
    };
    interfaces: {
      ssids: SsidInterfaceConfig[];
    };
    services: {
      ssh: boolean;
      lldp: boolean;
    };
    metrics: {
      interval: number;
      reporting: boolean;
    };
    unit: {
      leds: boolean;
      poeOut: boolean;
    };
  };
}

export interface ConfigDiffItem {
  field: string;
  before: string;
  after: string;
  source: string;
}
