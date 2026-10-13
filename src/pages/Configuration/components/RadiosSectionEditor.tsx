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
import type {
  RadioBandConfig,
  ConfigurationProfile,
  ProfileSettingField,
} from '../types/configuration';

interface RadiosSectionEditorProps {
  bands: RadioBandConfig[];
  onUpdateBands: (bands: RadioBandConfig[]) => void;
  onViewProfile?: (profileId: string) => void;
  availableProfiles?: ConfigurationProfile[];
}

export const RadiosSectionEditor: React.FC<RadiosSectionEditorProps> = ({
  bands,
  onUpdateBands,
  onViewProfile,
  availableProfiles = MOCK_PROFILES.filter((p) => p.prefix === 'radio'),
}) => {
  const [expandedBand, setExpandedBand] = useState<string>('5 GHz');

  const handleToggleOverride = (bandName: string, fieldKey: string) => {
    const updated = bands.map((b) => {
      if (b.band !== bandName) return b;
      const updatedFields = b.fields.map((f) => {
        if (f.key !== fieldKey) return f;
        const willOverride = !f.overridden;
        return {
          ...f,
          overridden: willOverride,
          source: willOverride ? 'Overridden here' : (b.profileName || 'Default'),
          effectiveValue: willOverride ? f.effectiveValue : f.profileDefaultValue,
        };
      });
      return { ...b, fields: updatedFields };
    });
    onUpdateBands(updated);
  };

  const handleFieldChange = (bandName: string, fieldKey: string, newValue: string | number | boolean) => {
    const updated = bands.map((b) => {
      if (b.band !== bandName) return b;
      const updatedFields = b.fields.map((f) => {
        if (f.key !== fieldKey) return f;
        return {
          ...f,
          effectiveValue: newValue,
          overridden: true,
          source: 'Overridden here',
        };
      });
      return { ...b, fields: updatedFields };
    });
    onUpdateBands(updated);
  };

  const handleResetToProfile = (bandName: string, fieldKey: string) => {
    const updated = bands.map((b) => {
      if (b.band !== bandName) return b;
      const updatedFields = b.fields.map((f) => {
        if (f.key !== fieldKey) return f;
        return {
          ...f,
          overridden: false,
          effectiveValue: f.profileDefaultValue,
          source: b.profileName || 'Profile',
        };
      });
      return { ...b, fields: updatedFields };
    });
    onUpdateBands(updated);
  };

  const handleSelectProfileForBand = (bandName: string, profileId: string) => {
    const selectedProf = availableProfiles.find((p) => p.id === profileId);

    const updated = bands.map((b) => {
      if (b.band !== bandName) return b;

      if (!selectedProf) {
        return {
          ...b,
          profileId: undefined,
          profileName: undefined,
          inheritedSettingsCount: 0,
        };
      }

      const pValues = selectedProf.parsedValues;
      const newFields: ProfileSettingField[] = [
        {
          key: 'enabled',
          label: 'Enabled',
          effectiveValue: true,
          source: selectedProf.name,
          overridden: false,
          profileDefaultValue: true,
        },
        {
          key: 'channel',
          label: 'Channel',
          effectiveValue: pValues.channel !== undefined ? String(pValues.channel) : 'auto',
          source: selectedProf.name,
          overridden: false,
          profileDefaultValue: pValues.channel !== undefined ? String(pValues.channel) : 'auto',
        },
        {
          key: 'channel-width',
          label: 'Channel Width',
          effectiveValue: pValues['channel-width'] ? `${pValues['channel-width']} MHz` : '40 MHz',
          source: selectedProf.name,
          overridden: false,
          profileDefaultValue: pValues['channel-width'] ? `${pValues['channel-width']} MHz` : '40 MHz',
        },
        {
          key: 'channel-mode',
          label: 'Channel Mode',
          effectiveValue: pValues['channel-mode'] ? String(pValues['channel-mode']) : 'HT',
          source: selectedProf.name,
          overridden: false,
          profileDefaultValue: pValues['channel-mode'] ? String(pValues['channel-mode']) : 'HT',
        },
        {
          key: 'tx-power',
          label: 'TX Power (dBm)',
          effectiveValue: pValues['tx-power'] !== undefined ? Number(pValues['tx-power']) : 0,
          source: selectedProf.name,
          overridden: false,
          profileDefaultValue: pValues['tx-power'] !== undefined ? Number(pValues['tx-power']) : 0,
        },
        {
          key: 'country',
          label: 'Country',
          effectiveValue: pValues.country ? String(pValues.country) : 'US',
          source: selectedProf.name,
          overridden: false,
          profileDefaultValue: pValues.country ? String(pValues.country) : 'US',
        },
        {
          key: 'allow-dfs',
          label: 'Allow DFS',
          effectiveValue: pValues['allow-dfs'] !== undefined ? Boolean(pValues['allow-dfs']) : true,
          source: selectedProf.name,
          overridden: false,
          profileDefaultValue: pValues['allow-dfs'] !== undefined ? Boolean(pValues['allow-dfs']) : true,
        },
        {
          key: 'maximum-clients',
          label: 'Maximum Clients',
          effectiveValue: pValues['maximum-clients'] ? Number(pValues['maximum-clients']) : 64,
          source: selectedProf.name,
          overridden: false,
          profileDefaultValue: pValues['maximum-clients'] ? Number(pValues['maximum-clients']) : 64,
        },
        {
          key: 'beacon-interval',
          label: 'Beacon Interval',
          effectiveValue: pValues['beacon-interval'] ? `${pValues['beacon-interval']} ms` : '100 ms',
          source: selectedProf.name,
          overridden: false,
          profileDefaultValue: pValues['beacon-interval'] ? `${pValues['beacon-interval']} ms` : '100 ms',
        },
      ];

      return {
        ...b,
        profileId: selectedProf.id,
        profileName: selectedProf.name,
        inheritedSettingsCount: newFields.length,
        fields: newFields,
      };
    });

    onUpdateBands(updated);
  };

  const profileOptions = [
    { value: '', label: 'None (Standalone / Unlinked)' },
    ...availableProfiles.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.entityName || 'Global'})`,
    })),
  ];

  return (
    <Box
      flex="1"
      bg="#ffffff"
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="6px"
      p={5}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4} pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <HStack gap={3}>
          <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
            Radios
          </Text>
        </HStack>
        <HStack
          gap={1.5}
          px={2.5}
          py={1}
          borderRadius="12px"
          bg="#f0fdf4"
          border="1px solid"
          borderColor="#bbf7d0"
          color="#15803d"
          fontSize="12px"
          fontWeight="600"
        >
          <Icon name="check" size={13} color="#15803d" />
          <Text>Valid</Text>
        </HStack>
      </Flex>

      {/* Radio Accordions */}
      <VStack gap={4} align="stretch">
        {bands.map((band) => {
          const isExpanded = expandedBand === band.band;

          return (
            <Box
              key={band.band}
              border="1px solid"
              borderColor={themeColors.panel.border}
              borderRadius="6px"
              overflow="hidden"
            >
              {/* Accordion Header */}
              <Flex
                align="center"
                justify="space-between"
                px={4}
                py={3}
                bg={isExpanded ? '#f8fafc' : '#ffffff'}
                cursor="pointer"
                userSelect="none"
                onClick={() => setExpandedBand(isExpanded ? '' : band.band)}
                _hover={{ bg: '#f8fafc' }}
              >
                <HStack gap={3}>
                  <Box color={themeColors.text.secondary}>
                    <Icon name={isExpanded ? 'chevronDown' : 'chevronRight'} size={16} />
                  </Box>
                  <Text fontSize="14px" fontWeight="600" color={themeColors.text.title}>
                    {band.band} Radio
                  </Text>
                </HStack>

                <HStack gap={3}>
                  {band.profileName && (
                    <Box
                      fontSize="11px"
                      fontWeight="500"
                      px={2}
                      py={0.5}
                      borderRadius="4px"
                      bg="#f1f5f9"
                      color={themeColors.text.secondary}
                    >
                      {band.profileName}
                    </Box>
                  )}
                  {band.inheritedSettingsCount && (
                    <Box
                      fontSize="11px"
                      fontWeight="600"
                      px={2}
                      py={0.5}
                      borderRadius="4px"
                      bg="#f0fdf4"
                      color="#15803d"
                    >
                      {band.inheritedSettingsCount} settings inherited
                    </Box>
                  )}
                  {!band.enabled && (
                    <Text fontSize="12px" color={themeColors.text.muted}>
                      Disabled
                    </Text>
                  )}
                </HStack>
              </Flex>

              {/* Accordion Body */}
              {isExpanded && (
                <Box p={4} borderTop="1px solid" borderColor={themeColors.panel.divider}>
                  {/* Configuration Profile Selector Card */}
                  <Box
                    bg="#f8fafc"
                    border="1px solid"
                    borderColor="#cbd5e1"
                    borderRadius="6px"
                    p={4}
                    mb={4}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
                        Linked Reusable Profile (__variableBlock)
                      </Text>
                      {band.profileId && onViewProfile && (
                        <Button
                          variant="plain"
                          size="xs"
                          color={themeColors.brand.accent}
                          fontSize="12px"
                          fontWeight="500"
                          p={0}
                          h="auto"
                          onClick={() => onViewProfile(band.profileId!)}
                        >
                          View profile details
                        </Button>
                      )}
                    </Flex>

                    <Flex align="center" gap={3} mb={1.5}>
                      <Box flex="1">
                        <SelectDropdown
                          value={band.profileId || ''}
                          onChange={(val) => handleSelectProfileForBand(band.band, val)}
                          options={profileOptions}
                          w="100%"
                          h="34px"
                        />
                      </Box>
                      {band.inheritedSettingsCount ? (
                        <Box
                          fontSize="11px"
                          fontWeight="600"
                          px={2.5}
                          py={1}
                          borderRadius="4px"
                          bg="#dcfce7"
                          color="#166534"
                          whiteSpace="nowrap"
                        >
                          {band.inheritedSettingsCount} settings inherited
                        </Box>
                      ) : null}
                    </Flex>

                    <Text fontSize="11px" color={themeColors.text.secondary}>
                      Changes to the profile flow into this configuration unless a value is overridden locally below.
                    </Text>
                  </Box>

                  {/* Settings Override Table */}
                  <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" overflow="hidden">
                    <Box as="table" w="100%" style={{ borderCollapse: 'collapse' }}>
                      <Box as="thead" bg="#f8fafc" borderBottom="1px solid" borderColor={themeColors.panel.divider}>
                        <Box as="tr">
                          <Box as="th" p="10px 14px" textAlign="left" fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                            Setting
                          </Box>
                          <Box as="th" p="10px 14px" textAlign="left" fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                            Effective Value
                          </Box>
                          <Box as="th" p="10px 14px" textAlign="left" fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                            Source
                          </Box>
                          <Box as="th" p="10px 14px" textAlign="center" fontSize="11px" fontWeight="600" color={themeColors.text.secondary} w="120px">
                            Override
                          </Box>
                          <Box as="th" p="10px 14px" textAlign="right" fontSize="11px" fontWeight="600" color={themeColors.text.secondary} w="140px">
                            Actions
                          </Box>
                        </Box>
                      </Box>

                      <Box as="tbody">
                        {band.fields.map((field) => (
                          <Box
                            as="tr"
                            key={field.key}
                            borderBottom="1px solid"
                            borderColor={themeColors.panel.divider}
                            bg={field.overridden ? '#fffbeb' : '#ffffff'}
                          >
                            <Box as="td" p="10px 14px" fontSize="12px" fontWeight="500" color={themeColors.text.primary}>
                              <HStack gap={2}>
                                {!field.overridden && (
                                  <Box color={themeColors.text.muted}>
                                    <Icon name="lock" size={12} />
                                  </Box>
                                )}
                                <Text>{field.label}</Text>
                              </HStack>
                            </Box>

                            <Box as="td" p="10px 14px" fontSize="12px">
                              {field.overridden ? (
                                <Input
                                  size="xs"
                                  value={String(field.effectiveValue)}
                                  onChange={(e) => handleFieldChange(band.band, field.key, e.target.value)}
                                  maxW="140px"
                                  bg="#ffffff"
                                  borderColor="#f59e0b"
                                />
                              ) : (
                                <Text fontWeight="600" color={themeColors.text.primary}>
                                  {typeof field.effectiveValue === 'boolean'
                                    ? field.effectiveValue ? 'Enabled' : 'Disabled'
                                    : String(field.effectiveValue)}
                                </Text>
                              )}
                            </Box>

                            <Box as="td" p="10px 14px" fontSize="11px">
                              <Box
                                display="inline-block"
                                px={2}
                                py={0.5}
                                borderRadius="4px"
                                fontSize="11px"
                                fontWeight="600"
                                bg={field.overridden ? '#fef3c7' : '#f1f5f9'}
                                color={field.overridden ? '#b45309' : themeColors.text.secondary}
                              >
                                {field.source}
                              </Box>
                            </Box>

                            {/* Toggle Switch */}
                            <Box as="td" p="10px 14px" textAlign="center">
                              <Box
                                as="button"
                                w="36px"
                                h="20px"
                                borderRadius="10px"
                                bg={field.overridden ? themeColors.brand.accent : '#cbd5e1'}
                                position="relative"
                                transition="background-color 0.2s"
                                cursor="pointer"
                                onClick={() => handleToggleOverride(band.band, field.key)}
                                aria-label={`Toggle override for ${field.label}`}
                              >
                                <Box
                                  w="16px"
                                  h="16px"
                                  borderRadius="50%"
                                  bg="#ffffff"
                                  position="absolute"
                                  top="2px"
                                  left={field.overridden ? '18px' : '2px'}
                                  transition="left 0.2s"
                                  boxShadow="0 1px 2px rgba(0,0,0,0.2)"
                                />
                              </Box>
                            </Box>

                            {/* Action: Reset */}
                            <Box as="td" p="10px 14px" textAlign="right">
                              {field.overridden ? (
                                <Button
                                  variant="plain"
                                  size="xs"
                                  fontSize="11px"
                                  color={themeColors.brand.accent}
                                  fontWeight="600"
                                  p={0}
                                  h="auto"
                                  onClick={() => handleResetToProfile(band.band, field.key)}
                                >
                                  Reset to profile
                                </Button>
                              ) : (
                                <Text fontSize="11px" color={themeColors.text.muted}>
                                  Locked
                                </Text>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
};
