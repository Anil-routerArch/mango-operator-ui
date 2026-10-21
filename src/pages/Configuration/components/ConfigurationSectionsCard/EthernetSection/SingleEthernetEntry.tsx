import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Spacer,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { ToggleSwitch } from '../ToggleSwitch';
import {
  DUPLEX_OPTIONS,
  ETHERNET_PORT_OPTIONS,
  LLDP_ADMIN_STATUS_OPTIONS,
  LLDP_TLV_FIELDS,
  POE_DETECTION_OPTIONS,
  POE_PRIORITY_OPTIONS,
  SPEED_OPTIONS,
  VOICE_VLAN_DETECT_OPTIONS,
  VOICE_VLAN_MODE_OPTIONS,
  DEFAULT_DHCP_SNOOP_PORT,
  DEFAULT_LLDP,
  DEFAULT_POE,
  DEFAULT_STORM_CONTROL,
  DEFAULT_VOICE_VLAN,
  DEFAULT_BPDU_GUARD,
} from './ethernetConstants';
import type { EthernetPortEntry } from '../types';

export interface SingleEthernetEntryProps {
  index: number;
  entry: EthernetPortEntry;
  onChange: (updated: EthernetPortEntry) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const SingleEthernetEntry: React.FC<SingleEthernetEntryProps> = ({
  index,
  entry,
  onChange,
  onDelete,
  disabled = false,
}) => {
  const [showLldp, setShowLldp] = useState<boolean>(Boolean(entry['lldp-interface-config']));
  const [showBpduGuard, setShowBpduGuard] = useState<boolean>(Boolean(entry['bpdu-guard']));
  const [showDhcpSnoop, setShowDhcpSnoop] = useState<boolean>(Boolean(entry['dhcp-snoop-port']));
  const [showStormControl, setShowStormControl] = useState<boolean>(Boolean(entry['storm-control']));
  const [showPoe, setShowPoe] = useState<boolean>(Boolean(entry.poe));
  const [showVoiceVlan, setShowVoiceVlan] = useState<boolean>(Boolean(entry['voice-vlan-intf-config']));
  const [tlvFilter, setTlvFilter] = useState('');

  const toggleLldp = (checked: boolean) => {
    setShowLldp(checked);
    onChange({
      ...entry,
      'lldp-interface-config': checked ? { ...DEFAULT_LLDP } : undefined,
    });
  };

  const toggleBpduGuard = (checked: boolean) => {
    setShowBpduGuard(checked);
    onChange({
      ...entry,
      'bpdu-guard': checked ? { ...DEFAULT_BPDU_GUARD } : undefined,
    });
  };

  const toggleDhcpSnoop = (checked: boolean) => {
    setShowDhcpSnoop(checked);
    onChange({
      ...entry,
      'dhcp-snoop-port': checked ? { ...DEFAULT_DHCP_SNOOP_PORT } : undefined,
    });
  };

  const toggleStormControl = (checked: boolean) => {
    setShowStormControl(checked);
    onChange({
      ...entry,
      'storm-control': checked ? { ...DEFAULT_STORM_CONTROL } : undefined,
    });
  };

  const togglePoe = (checked: boolean) => {
    setShowPoe(checked);
    onChange({
      ...entry,
      poe: checked ? { ...DEFAULT_POE } : undefined,
    });
  };

  const toggleVoiceVlan = (checked: boolean) => {
    setShowVoiceVlan(checked);
    onChange({
      ...entry,
      'voice-vlan-intf-config': checked ? { ...DEFAULT_VOICE_VLAN } : undefined,
    });
  };

  const filteredTlvs = LLDP_TLV_FIELDS.filter(
    (field) =>
      field.label.toLowerCase().includes(tlvFilter.toLowerCase()) ||
      field.name.toLowerCase().includes(tlvFilter.toLowerCase())
  );

  return (
    <VStack gap={4} align="stretch" w="100%">
      {/* Header */}
      <Flex align="center" justify="space-between" pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <HStack gap={2}>
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
            Port Rule #{index + 1}
          </Text>
          <Box
            px={2}
            py={0.5}
            borderRadius="4px"
            bg="#f1f5f9"
            color={themeColors.text.secondary}
            fontSize="11px"
            fontWeight="600"
          >
            {(entry['select-ports'] || []).length} Port{(entry['select-ports'] || []).length !== 1 ? 's' : ''} Selected
          </Box>
        </HStack>
        <Spacer />
        <Button
          size="sm"
          variant="outline"
          borderColor="#fca5a5"
          color="#dc2626"
          _hover={{ bg: '#fef2f2' }}
          onClick={onDelete}
          disabled={disabled}
        >
          <Icon name="trash" size={14} />
          <Text ml={1.5} fontSize="12px" fontWeight="600">Delete Rule</Text>
        </Button>
      </Flex>

      {/* Select Ports */}
      <Box>
        <MultiSelectDropdown
          label="select-ports"
          isRequired
          options={ETHERNET_PORT_OPTIONS}
          value={entry['select-ports'] || []}
          onChange={(selected) => onChange({ ...entry, 'select-ports': selected })}
          placeholder="Select Ethernet ports..."
          disabled={disabled}
        />
      </Box>

      {/* Top Fields Grid: Speed, Duplex, Edge-port, Enabled */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} p={3} bg="#f8fafc" borderRadius="8px" border="1px solid" borderColor="#e2e8f0">
        <Box>
          <HStack gap={1} mb={1}>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
              speed
            </Text>
            <Text as="span" color="#dc2626">*</Text>
          </HStack>
          <SelectDropdown
            value={entry.speed || 1000}
            onChange={(val) => onChange({ ...entry, speed: Number(val) || 1000 })}
            options={SPEED_OPTIONS}
            disabled={disabled}
            size="sm"
            w="100%"
          />
        </Box>

        <Box>
          <HStack gap={1} mb={1}>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
              duplex
            </Text>
            <Text as="span" color="#dc2626">*</Text>
          </HStack>
          <SelectDropdown
            value={entry.duplex || 'full'}
            onChange={(val) => onChange({ ...entry, duplex: val as 'full' | 'half' })}
            options={DUPLEX_OPTIONS}
            disabled={disabled}
            size="sm"
            w="100%"
          />
        </Box>

        <Box>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            edge-port
          </Text>
          <HStack align="center" h="32px">
            <ToggleSwitch
              checked={Boolean(entry['edge-port'])}
              onChange={(val) => onChange({ ...entry, 'edge-port': val })}
              disabled={disabled}
            />
            <Text fontSize="12px" color={entry['edge-port'] ? '#15803d' : themeColors.text.secondary}>
              {entry['edge-port'] ? 'True' : 'False'}
            </Text>
          </HStack>
        </Box>

        <Box>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            enabled
          </Text>
          <HStack align="center" h="32px">
            <ToggleSwitch
              checked={entry.enabled !== false}
              onChange={(val) => onChange({ ...entry, enabled: val })}
              disabled={disabled}
            />
            <Text fontSize="12px" color={entry.enabled !== false ? '#15803d' : '#dc2626'}>
              {entry.enabled !== false ? 'Enabled' : 'Disabled'}
            </Text>
          </HStack>
        </Box>
      </SimpleGrid>

      {/* 1. LLDP Interface Config */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showLldp ? 3 : 0}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            lldp-interface-config
          </Text>
          <ToggleSwitch
            checked={showLldp}
            onChange={toggleLldp}
            disabled={disabled}
          />
        </Flex>

        {showLldp && (
          <VStack gap={3} align="stretch" pt={1}>
            <Box maxW="320px">
              <HStack gap={1} mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  lldp-admin-status
                </Text>
                <Text as="span" color="#dc2626">*</Text>
              </HStack>
              <SelectDropdown
                value={entry['lldp-interface-config']?.['lldp-admin-status'] || 'rx-tx'}
                onChange={(val) =>
                  onChange({
                    ...entry,
                    'lldp-interface-config': {
                      ...(entry['lldp-interface-config'] || {}),
                      'lldp-admin-status': val as any,
                    },
                  })
                }
                options={LLDP_ADMIN_STATUS_OPTIONS}
                disabled={disabled}
                size="sm"
                w="100%"
              />
            </Box>

            {/* TLVs Selection Grid */}
            <Box pt={2}>
              <Flex align="center" justify="space-between" mb={2}>
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
                  Enabled TLVs (Type-Length-Values)
                </Text>
                <Input
                  size="xs"
                  placeholder="Filter TLVs..."
                  value={tlvFilter}
                  onChange={(e) => setTlvFilter(e.target.value)}
                  maxW="180px"
                  borderRadius="4px"
                />
              </Flex>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={2} p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor="#e2e8f0" maxH="220px" overflowY="auto">
                {filteredTlvs.map((tlv) => {
                  const isChecked = Boolean(entry['lldp-interface-config']?.[tlv.name]);
                  return (
                    <HStack
                      key={tlv.name}
                      as="label"
                      cursor="pointer"
                      gap={2}
                      p="4px 8px"
                      borderRadius="4px"
                      bg={isChecked ? '#eff6ff' : 'transparent'}
                      _hover={{ bg: '#f1f5f9' }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onChange({
                            ...entry,
                            'lldp-interface-config': {
                              ...(entry['lldp-interface-config'] || {}),
                              [tlv.name]: e.target.checked,
                            },
                          })
                        }
                        disabled={disabled}
                      />
                      <Text
                        fontSize="11px"
                        fontWeight="500"
                        color={themeColors.text.title}
                        title={tlv.name}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                      >
                        {tlv.label}
                      </Text>
                    </HStack>
                  );
                })}
              </SimpleGrid>
            </Box>
          </VStack>
        )}
      </Box>

      {/* 2. BPDU Guard */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showBpduGuard ? 3 : 0}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            bpdu guard
          </Text>
          <ToggleSwitch
            checked={showBpduGuard}
            onChange={toggleBpduGuard}
            disabled={disabled}
          />
        </Flex>

        {showBpduGuard && (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} pt={1}>
            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                enable
              </Text>
              <HStack align="center" h="32px">
                <ToggleSwitch
                  checked={Boolean(entry['bpdu-guard']?.enabled)}
                  onChange={(val) =>
                    onChange({
                      ...entry,
                      'bpdu-guard': {
                        ...(entry['bpdu-guard'] || { 'auto-recovery-intvl-secs': 300 }),
                        enabled: val,
                      },
                    })
                  }
                  disabled={disabled}
                />
                <Text fontSize="12px" color={entry['bpdu-guard']?.enabled ? '#15803d' : themeColors.text.secondary}>
                  {entry['bpdu-guard']?.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </HStack>
            </Box>

            <Box>
              <HStack gap={1} mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  auto-recovery-intvl-secs
                </Text>
                <Text as="span" color="#dc2626">*</Text>
              </HStack>
              <Input
                size="sm"
                type="number"
                min={0}
                value={entry['bpdu-guard']?.['auto-recovery-intvl-secs'] ?? 300}
                onChange={(e) =>
                  onChange({
                    ...entry,
                    'bpdu-guard': {
                      ...(entry['bpdu-guard'] || { enabled: true }),
                      'auto-recovery-intvl-secs': Math.max(0, parseInt(e.target.value, 10) || 0),
                    },
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          </SimpleGrid>
        )}
      </Box>

      {/* 3. DHCP Snoop Port */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showDhcpSnoop ? 3 : 0}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            dhcp snoop port
          </Text>
          <ToggleSwitch
            checked={showDhcpSnoop}
            onChange={toggleDhcpSnoop}
            disabled={disabled}
          />
        </Flex>

        {showDhcpSnoop && (
          <Box pt={1}>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              dhcp-snoop-port-trust
            </Text>
            <HStack align="center" h="32px">
              <ToggleSwitch
                checked={Boolean(entry['dhcp-snoop-port']?.['dhcp-snoop-port-trust'])}
                onChange={(val) =>
                  onChange({
                    ...entry,
                    'dhcp-snoop-port': {
                      'dhcp-snoop-port-trust': val,
                    },
                  })
                }
                disabled={disabled}
              />
              <Text fontSize="12px" color={entry['dhcp-snoop-port']?.['dhcp-snoop-port-trust'] ? '#15803d' : themeColors.text.secondary}>
                {entry['dhcp-snoop-port']?.['dhcp-snoop-port-trust'] ? 'Trusted' : 'Untrusted'}
              </Text>
            </HStack>
          </Box>
        )}
      </Box>

      {/* 4. Storm Control */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showStormControl ? 3 : 0}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            storm control
          </Text>
          <ToggleSwitch
            checked={showStormControl}
            onChange={toggleStormControl}
            disabled={disabled}
          />
        </Flex>

        {showStormControl && (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} pt={1}>
            <Box>
              <HStack gap={1} mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  broadcast-pps
                </Text>
                <Text as="span" color="#dc2626">*</Text>
              </HStack>
              <Input
                size="sm"
                type="number"
                min={0}
                value={entry['storm-control']?.['broadcast-pps'] ?? 500}
                onChange={(e) =>
                  onChange({
                    ...entry,
                    'storm-control': {
                      ...(entry['storm-control'] || DEFAULT_STORM_CONTROL),
                      'broadcast-pps': Math.max(0, parseInt(e.target.value, 10) || 0),
                    },
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>

            <Box>
              <HStack gap={1} mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  multicast-pps
                </Text>
                <Text as="span" color="#dc2626">*</Text>
              </HStack>
              <Input
                size="sm"
                type="number"
                min={0}
                value={entry['storm-control']?.['multicast-pps'] ?? 500}
                onChange={(e) =>
                  onChange({
                    ...entry,
                    'storm-control': {
                      ...(entry['storm-control'] || DEFAULT_STORM_CONTROL),
                      'multicast-pps': Math.max(0, parseInt(e.target.value, 10) || 0),
                    },
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>

            <Box>
              <HStack gap={1} mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  unknown-unicast-pps
                </Text>
                <Text as="span" color="#dc2626">*</Text>
              </HStack>
              <Input
                size="sm"
                type="number"
                min={0}
                value={entry['storm-control']?.['unknown-unicast-pps'] ?? 500}
                onChange={(e) =>
                  onChange({
                    ...entry,
                    'storm-control': {
                      ...(entry['storm-control'] || DEFAULT_STORM_CONTROL),
                      'unknown-unicast-pps': Math.max(0, parseInt(e.target.value, 10) || 0),
                    },
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          </SimpleGrid>
        )}
      </Box>

      {/* 5. PoE */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showPoe ? 3 : 0}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            poe (Power over Ethernet)
          </Text>
          <ToggleSwitch
            checked={showPoe}
            onChange={togglePoe}
            disabled={disabled}
          />
        </Flex>

        {showPoe && (
          <VStack gap={3} align="stretch" pt={1}>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  admin-mode
                </Text>
                <HStack align="center" h="32px">
                  <ToggleSwitch
                    checked={entry.poe?.['admin-mode'] !== false}
                    onChange={(val) =>
                      onChange({
                        ...entry,
                        poe: {
                          ...(entry.poe || DEFAULT_POE),
                          'admin-mode': val,
                        },
                      })
                    }
                    disabled={disabled}
                  />
                  <Text fontSize="12px" color={entry.poe?.['admin-mode'] !== false ? '#15803d' : '#dc2626'}>
                    {entry.poe?.['admin-mode'] !== false ? 'Enabled' : 'Disabled'}
                  </Text>
                </HStack>
              </Box>

              <Box>
                <HStack gap={1} mb={1}>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                    detection
                  </Text>
                  <Text as="span" color="#dc2626">*</Text>
                </HStack>
                <SelectDropdown
                  value={entry.poe?.detection || '4pt-dot3af'}
                  onChange={(val) =>
                    onChange({
                      ...entry,
                      poe: {
                        ...(entry.poe || DEFAULT_POE),
                        detection: String(val),
                      },
                    })
                  }
                  options={POE_DETECTION_OPTIONS}
                  disabled={disabled}
                  size="sm"
                  w="100%"
                />
              </Box>

              <Box>
                <HStack gap={1} mb={1}>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                    power-limit (mW)
                  </Text>
                  <Text as="span" color="#dc2626">*</Text>
                </HStack>
                <Input
                  size="sm"
                  type="number"
                  min={0}
                  value={entry.poe?.['power-limit'] ?? 30000}
                  onChange={(e) =>
                    onChange({
                      ...entry,
                      poe: {
                        ...(entry.poe || DEFAULT_POE),
                        'power-limit': Math.max(0, parseInt(e.target.value, 10) || 0),
                      },
                    })
                  }
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>

              <Box>
                <HStack gap={1} mb={1}>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                    priority
                  </Text>
                  <Text as="span" color="#dc2626">*</Text>
                </HStack>
                <SelectDropdown
                  value={entry.poe?.priority || 'high'}
                  onChange={(val) =>
                    onChange({
                      ...entry,
                      poe: {
                        ...(entry.poe || DEFAULT_POE),
                        priority: String(val),
                      },
                    })
                  }
                  options={POE_PRIORITY_OPTIONS}
                  disabled={disabled}
                  size="sm"
                  w="100%"
                />
              </Box>

              <Box>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  do-reset
                </Text>
                <HStack align="center" h="32px">
                  <ToggleSwitch
                    checked={Boolean(entry.poe?.['do-reset'])}
                    onChange={(val) =>
                      onChange({
                        ...entry,
                        poe: {
                          ...(entry.poe || DEFAULT_POE),
                          'do-reset': val,
                        },
                      })
                    }
                    disabled={disabled}
                  />
                  <Text fontSize="12px" color={entry.poe?.['do-reset'] ? '#15803d' : themeColors.text.secondary}>
                    {entry.poe?.['do-reset'] ? 'True' : 'False'}
                  </Text>
                </HStack>
              </Box>
            </SimpleGrid>
          </VStack>
        )}
      </Box>

      {/* 6. Voice VLAN */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        p={4}
      >
        <Flex align="center" justify="space-between" mb={showVoiceVlan ? 3 : 0}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            voice vlan (voice-vlan-intf-config)
          </Text>
          <ToggleSwitch
            checked={showVoiceVlan}
            onChange={toggleVoiceVlan}
            disabled={disabled}
          />
        </Flex>

        {showVoiceVlan && (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} pt={1}>
            <Box>
              <HStack gap={1} mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  mode
                </Text>
                <Text as="span" color="#dc2626">*</Text>
              </HStack>
              <SelectDropdown
                value={entry['voice-vlan-intf-config']?.['voice-vlan-intf-mode'] || 'auto'}
                onChange={(val) =>
                  onChange({
                    ...entry,
                    'voice-vlan-intf-config': {
                      ...(entry['voice-vlan-intf-config'] || DEFAULT_VOICE_VLAN),
                      'voice-vlan-intf-mode': String(val),
                    },
                  })
                }
                options={VOICE_VLAN_MODE_OPTIONS}
                disabled={disabled}
                size="sm"
                w="100%"
              />
            </Box>

            <Box>
              <HStack gap={1} mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  priority (0-6)
                </Text>
                <Text as="span" color="#dc2626">*</Text>
              </HStack>
              <Input
                size="sm"
                type="number"
                min={0}
                max={6}
                value={entry['voice-vlan-intf-config']?.['voice-vlan-intf-priority'] ?? 6}
                onChange={(e) =>
                  onChange({
                    ...entry,
                    'voice-vlan-intf-config': {
                      ...(entry['voice-vlan-intf-config'] || DEFAULT_VOICE_VLAN),
                      'voice-vlan-intf-priority': Math.min(6, Math.max(0, parseInt(e.target.value, 10) || 0)),
                    },
                  })
                }
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>

            <Box>
              <HStack gap={1} mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  detect-voice
                </Text>
                <Text as="span" color="#dc2626">*</Text>
              </HStack>
              <SelectDropdown
                value={entry['voice-vlan-intf-config']?.['voice-vlan-intf-detect-voice'] || 'oui'}
                onChange={(val) =>
                  onChange({
                    ...entry,
                    'voice-vlan-intf-config': {
                      ...(entry['voice-vlan-intf-config'] || DEFAULT_VOICE_VLAN),
                      'voice-vlan-intf-detect-voice': String(val),
                    },
                  })
                }
                options={VOICE_VLAN_DETECT_OPTIONS}
                disabled={disabled}
                size="sm"
                w="100%"
              />
            </Box>

            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                security
              </Text>
              <HStack align="center" h="32px">
                <ToggleSwitch
                  checked={Boolean(entry['voice-vlan-intf-config']?.['voice-vlan-intf-security'])}
                  onChange={(val) =>
                    onChange({
                      ...entry,
                      'voice-vlan-intf-config': {
                        ...(entry['voice-vlan-intf-config'] || DEFAULT_VOICE_VLAN),
                        'voice-vlan-intf-security': val,
                      },
                    })
                  }
                  disabled={disabled}
                />
                <Text fontSize="12px" color={entry['voice-vlan-intf-config']?.['voice-vlan-intf-security'] ? '#15803d' : themeColors.text.secondary}>
                  {entry['voice-vlan-intf-config']?.['voice-vlan-intf-security'] ? 'Enabled' : 'Disabled'}
                </Text>
              </HStack>
            </Box>
          </SimpleGrid>
        )}
      </Box>
    </VStack>
  );
};

