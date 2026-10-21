import type { SnatRule, DnatRule } from '../types';

export const PROTOCOL_OPTIONS = [
  { value: 'all', label: 'all' },
  { value: 'tcp', label: 'tcp' },
  { value: 'udp', label: 'udp' },
];

export const PORT_MAPPING_OPTIONS = [
  { value: 'none', label: 'none' },
  { value: 'random', label: 'random' },
];

export const ADDRESS_MAPPING_OPTIONS = [
  { value: 'random', label: 'random' },
  { value: 'none', label: 'none' },
];

export const getDefaultSnatRule = (ruleId: number): SnatRule => ({
  'rule-id': ruleId,
  description: '',
  disable: false,
  protocol: 'all',
  'out-interface': {
    name: '',
  },
  source: {
    address: '',
    port: '',
  },
  translation: {
    address: '',
  },
});

export const getDefaultDnatRule = (ruleId: number): DnatRule => ({
  'rule-id': ruleId,
  description: '',
  disable: false,
  protocol: 'all',
  'in-interface': {
    name: '',
  },
  source: {
    address: '',
    port: '',
  },
  translation: {
    address: '',
  },
});

