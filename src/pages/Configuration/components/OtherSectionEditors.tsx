import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import { MOCK_PROFILES } from '../mockData/mockConfigurations';
import type { DeviceConfiguration, SsidInterfaceConfig } from '../types/configuration';

interface SectionProps {
  config: DeviceConfiguration;
  onUpdate: (updated: DeviceConfiguration) => void;
}

export const GeneralSectionEditor: React.FC<SectionProps> = ({ config, onUpdate }) => {
  const general = config.sections.general;

  const handleChange = (key: keyof typeof general, value: string) => {
    onUpdate({
      ...config,
      sections: {
        ...config.sections,
        general: { ...general, [key]: value },
      },
    });
  };

  return (
    <Box flex="1" bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
      <Flex justify="space-between" align="center" mb={4} pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>General Configuration</Text>
        <HStack gap={1.5} px={2.5} py={1} borderRadius="12px" bg="#f0fdf4" border="1px solid" borderColor="#bbf7d0" color="#15803d" fontSize="12px" fontWeight="600">
          <Icon name="check" size={13} color="#15803d" />
          <Text>Valid</Text>
        </HStack>
      </Flex>

      <VStack gap={4} align="stretch" maxW="560px">
        <Box>
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>Configuration Name</Text>
          <Input size="sm" value={general.name} onChange={(e) => handleChange('name', e.target.value)} />
        </Box>
        <Box>
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>Description</Text>
          <Input size="sm" value={general.description} onChange={(e) => handleChange('description', e.target.value)} />
        </Box>
        <Box>
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>Timezone</Text>
          <Input size="sm" value={general.timezone} onChange={(e) => handleChange('timezone', e.target.value)} />
        </Box>
        <Box>
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>Country Regulatory Domain</Text>
          <Input size="sm" value={general.country} onChange={(e) => handleChange('country', e.target.value)} />
        </Box>
      </VStack>
    </Box>
  );
};

export const InterfacesSectionEditor: React.FC<SectionProps> = ({ config, onUpdate }) => {
  const ssids = config.sections.interfaces.ssids;
  const ssidProfiles = MOCK_PROFILES.filter((p) => p.prefix === 'interface.ssid');

  const [expandedSsidIdx, setExpandedSsidIdx] = useState<number>(0);

  const handleSelectProfile = (idx: number, profileId: string) => {
    const prof = ssidProfiles.find((p) => p.id === profileId);
    const updated = [...ssids];
    if (prof) {
      updated[idx] = {
        ...updated[idx],
        profileId: prof.id,
        profileName: prof.name,
        ssid: String(prof.parsedValues.name || 'Resident-WiFi'),
        security: String(prof.parsedValues.protocol || 'WPA2-PSK'),
        vlan: Number(prof.parsedValues.vlan || 100),
        overridden: false,
      };
    } else {
      updated[idx] = {
        ...updated[idx],
        profileId: undefined,
        profileName: undefined,
        overridden: false,
      };
    }

    onUpdate({
      ...config,
      sections: {
        ...config.sections,
        interfaces: { ssids: updated },
      },
    });
  };

  const handleToggleOverride = (idx: number) => {
    const updated = [...ssids];
    const willOverride = !updated[idx].overridden;
    updated[idx] = {
      ...updated[idx],
      overridden: willOverride,
    };
    onUpdate({
      ...config,
      sections: {
        ...config.sections,
        interfaces: { ssids: updated },
      },
    });
  };

  const handleSsidFieldChange = (
    idx: number,
    field: keyof SsidInterfaceConfig,
    val: string | number | boolean
  ) => {
    const updated = [...ssids];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
      overridden: true,
    };
    onUpdate({
      ...config,
      sections: {
        ...config.sections,
        interfaces: { ssids: updated },
      },
    });
  };

  const handleResetSsidToProfile = (idx: number) => {
    const s = ssids[idx];
    const prof = ssidProfiles.find((p) => p.id === s.profileId);
    if (prof) {
      const updated = [...ssids];
      updated[idx] = {
        ...updated[idx],
        ssid: String(prof.parsedValues.name || 'Resident-WiFi'),
        security: String(prof.parsedValues.protocol || 'WPA2-PSK'),
        vlan: Number(prof.parsedValues.vlan || 100),
        overridden: false,
      };
      onUpdate({
        ...config,
        sections: {
          ...config.sections,
          interfaces: { ssids: updated },
        },
      });
    }
  };

  const handleAddSsid = () => {
    const newSsid: SsidInterfaceConfig = {
      name: `SSID Interface ${ssids.length + 1}`,
      ssid: 'New-Network',
      security: 'WPA2-PSK',
      vlan: 100 + ssids.length * 10,
      overridden: false,
    };
    onUpdate({
      ...config,
      sections: {
        ...config.sections,
        interfaces: { ssids: [...ssids, newSsid] },
      },
    });
    setExpandedSsidIdx(ssids.length);
  };

  const profileOptions = [
    { value: '', label: 'None (Standalone / Unlinked)' },
    ...ssidProfiles.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.entityName || 'Global'})`,
    })),
  ];

  return (
    <Box flex="1" bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
      <Flex justify="space-between" align="center" mb={4} pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <HStack gap={3}>
          <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>Interfaces & SSIDs</Text>
        </HStack>
        <Button size="xs" variant="outline" borderColor={themeColors.brand.accent} color={themeColors.brand.accent} onClick={handleAddSsid}>
          <Icon name="plus" size={12} />
          Add SSID
        </Button>
      </Flex>

      <VStack gap={4} align="stretch">
        {ssids.map((s, idx) => {
          const isExpanded = expandedSsidIdx === idx;

          return (
            <Box key={idx} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" overflow="hidden">
              <Flex
                justify="space-between"
                align="center"
                p="12px 16px"
                bg={isExpanded ? '#f8fafc' : '#ffffff'}
                cursor="pointer"
                userSelect="none"
                onClick={() => setExpandedSsidIdx(isExpanded ? -1 : idx)}
              >
                <HStack gap={3}>
                  <Box color={themeColors.text.secondary}>
                    <Icon name={isExpanded ? 'chevronDown' : 'chevronRight'} size={16} />
                  </Box>
                  <Text fontSize="14px" fontWeight="600" color={themeColors.text.title}>{s.name}</Text>
                </HStack>
                <HStack gap={3}>
                  {s.profileName && (
                    <Box fontSize="11px" fontWeight="600" px={2} py={0.5} borderRadius="4px" bg="#dcfce7" color="#166534">
                      Profile: {s.profileName}
                    </Box>
                  )}
                  {s.overridden && (
                    <Box fontSize="11px" fontWeight="600" px={2} py={0.5} borderRadius="4px" bg="#fef3c7" color="#b45309">
                      Overridden locally
                    </Box>
                  )}
                </HStack>
              </Flex>

              {isExpanded && (
                <Box p={4} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                  {/* Linked Profile Selector */}
                  <Box bg="#f8fafc" border="1px solid" borderColor="#cbd5e1" borderRadius="6px" p={4} mb={4}>
                    <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={2}>
                      Linked SSID Profile (__variableBlock)
                    </Text>
                    <SelectDropdown
                      value={s.profileId || ''}
                      onChange={(val) => handleSelectProfile(idx, val)}
                      options={profileOptions}
                      w="100%"
                      h="34px"
                    />
                    <Text fontSize="11px" color={themeColors.text.secondary} mt={2}>
                      Select a reusable SSID VariableBlock to inherit standard encryption and network isolation settings.
                    </Text>
                  </Box>

                  {/* Settings Override Form */}
                  <VStack gap={3} align="stretch">
                    <Flex gap={3}>
                      <Box flex="1">
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                            SSID Broadcast Name
                          </Text>
                          {s.profileName && !s.overridden && <Icon name="lock" size={12} color={themeColors.text.muted} />}
                        </HStack>
                        <Input
                          size="sm"
                          value={s.ssid}
                          onChange={(e) => handleSsidFieldChange(idx, 'ssid', e.target.value)}
                          bg="#ffffff"
                        />
                      </Box>
                      <Box flex="1">
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                            Security Protocol
                          </Text>
                          {s.profileName && !s.overridden && <Icon name="lock" size={12} color={themeColors.text.muted} />}
                        </HStack>
                        <Input
                          size="sm"
                          value={s.security}
                          onChange={(e) => handleSsidFieldChange(idx, 'security', e.target.value)}
                          bg="#ffffff"
                        />
                      </Box>
                      <Box w="120px">
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                            VLAN ID
                          </Text>
                          {s.profileName && !s.overridden && <Icon name="lock" size={12} color={themeColors.text.muted} />}
                        </HStack>
                        <Input
                          size="sm"
                          type="number"
                          value={s.vlan}
                          onChange={(e) => handleSsidFieldChange(idx, 'vlan', Number(e.target.value))}
                          bg="#ffffff"
                        />
                      </Box>
                    </Flex>

                    {s.profileName && (
                      <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                        <HStack gap={2}>
                          <Box
                            as="button"
                            w="36px"
                            h="20px"
                            borderRadius="10px"
                            bg={s.overridden ? themeColors.brand.accent : '#cbd5e1'}
                            position="relative"
                            cursor="pointer"
                            onClick={() => handleToggleOverride(idx)}
                          >
                            <Box
                              w="16px"
                              h="16px"
                              borderRadius="50%"
                              bg="#ffffff"
                              position="absolute"
                              top="2px"
                              left={s.overridden ? '18px' : '2px'}
                              transition="left 0.2s"
                            />
                          </Box>
                          <Text fontSize="12px" color={themeColors.text.secondary}>
                            {s.overridden ? 'Local overrides active' : 'Inheriting from profile'}
                          </Text>
                        </HStack>

                        {s.overridden && (
                          <Button size="xs" variant="plain" color={themeColors.brand.accent} onClick={() => handleResetSsidToProfile(idx)}>
                            Reset to profile
                          </Button>
                        )}
                      </Flex>
                    )}
                  </VStack>
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};

export const ServicesSectionEditor: React.FC<SectionProps> = ({ config, onUpdate }) => {
  const services = config.sections.services;

  const handleToggle = (key: keyof typeof services) => {
    onUpdate({
      ...config,
      sections: {
        ...config.sections,
        services: { ...services, [key]: !services[key] },
      },
    });
  };

  return (
    <Box flex="1" bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
      <Flex justify="space-between" align="center" mb={4} pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>Network Services</Text>
        <HStack gap={1.5} px={2.5} py={1} borderRadius="12px" bg="#f0fdf4" border="1px solid" borderColor="#bbf7d0" color="#15803d" fontSize="12px" fontWeight="600">
          <Icon name="check" size={13} color="#15803d" />
          <Text>Valid</Text>
        </HStack>
      </Flex>
      <VStack gap={3} align="stretch" fontSize="13px">
        <Flex justify="space-between" align="center" p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="4px">
          <Box>
            <Text fontWeight="600">SSH Management Daemon</Text>
            <Text fontSize="11px" color={themeColors.text.muted}>Secure shell administrative access to AP unit.</Text>
          </Box>
          <Box
            as="button"
            w="36px"
            h="20px"
            borderRadius="10px"
            bg={services.ssh ? themeColors.brand.accent : '#cbd5e1'}
            position="relative"
            cursor="pointer"
            onClick={() => handleToggle('ssh')}
          >
            <Box
              w="16px"
              h="16px"
              borderRadius="50%"
              bg="#ffffff"
              position="absolute"
              top="2px"
              left={services.ssh ? '18px' : '2px'}
              transition="left 0.2s"
            />
          </Box>
        </Flex>

        <Flex justify="space-between" align="center" p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="4px">
          <Box>
            <Text fontWeight="600">LLDP (Link Layer Discovery Protocol)</Text>
            <Text fontSize="11px" color={themeColors.text.muted}>Advertise device identity to switch fabric.</Text>
          </Box>
          <Box
            as="button"
            w="36px"
            h="20px"
            borderRadius="10px"
            bg={services.lldp ? themeColors.brand.accent : '#cbd5e1'}
            position="relative"
            cursor="pointer"
            onClick={() => handleToggle('lldp')}
          >
            <Box
              w="16px"
              h="16px"
              borderRadius="50%"
              bg="#ffffff"
              position="absolute"
              top="2px"
              left={services.lldp ? '18px' : '2px'}
              transition="left 0.2s"
            />
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
};

export const MetricsSectionEditor: React.FC<SectionProps> = ({ config, onUpdate }) => {
  const metrics = config.sections.metrics;

  return (
    <Box flex="1" bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
      <Flex justify="space-between" align="center" mb={4} pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>Telemetry & Metrics</Text>
      </Flex>
      <VStack gap={4} align="stretch" maxW="400px">
        <Box>
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>Reporting Interval (seconds)</Text>
          <Input
            size="sm"
            type="number"
            value={metrics.interval}
            onChange={(e) =>
              onUpdate({
                ...config,
                sections: {
                  ...config.sections,
                  metrics: { ...metrics, interval: Number(e.target.value) },
                },
              })
            }
          />
        </Box>
      </VStack>
    </Box>
  );
};

export const UnitSectionEditor: React.FC<SectionProps> = ({ config, onUpdate }) => {
  const unit = config.sections.unit;

  const handleToggle = (key: keyof typeof unit) => {
    onUpdate({
      ...config,
      sections: {
        ...config.sections,
        unit: { ...unit, [key]: !unit[key] },
      },
    });
  };

  return (
    <Box flex="1" bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
      <Flex justify="space-between" align="center" mb={4} pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>Physical Unit Settings</Text>
      </Flex>
      <VStack gap={3} align="stretch" fontSize="13px">
        <Flex justify="space-between" align="center" p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="4px">
          <Box>
            <Text fontWeight="600">Front LED Status Lights</Text>
            <Text fontSize="11px" color={themeColors.text.muted}>Turn off LEDs for dark residential bedroom deployments.</Text>
          </Box>
          <Box
            as="button"
            w="36px"
            h="20px"
            borderRadius="10px"
            bg={unit.leds ? themeColors.brand.accent : '#cbd5e1'}
            position="relative"
            cursor="pointer"
            onClick={() => handleToggle('leds')}
          >
            <Box
              w="16px"
              h="16px"
              borderRadius="50%"
              bg="#ffffff"
              position="absolute"
              top="2px"
              left={unit.leds ? '18px' : '2px'}
              transition="left 0.2s"
            />
          </Box>
        </Flex>
      </VStack>
    </Box>
  );
};
