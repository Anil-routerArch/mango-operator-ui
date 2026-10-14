import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Text,
} from '@chakra-ui/react';
import { Header } from '@/layout/Header';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import {
  getDefaultConfigurations,
  deleteDefaultConfiguration,
  getModularConfigurations,
  deleteModularConfiguration,
  getVariableBlocksSelect,
  useGetEntities,
  useGetVenues,
  type DefaultConfigurationApiResponse,
  type ModularConfigurationApiResponse,
} from '@/api';
import { SelectConfigTypeModal } from './components/SelectConfigTypeModal';
import { DefaultConfigModal } from './components/DefaultConfigModal';
import { ModularConfigModal } from './components/ModularConfigModal';
import type { DeviceConfiguration } from './types/configuration';

const mapOwgwDefaultConfigToDeviceConfig = (cfg: DefaultConfigurationApiResponse): DeviceConfiguration => {
  const configStr =
    typeof cfg.configuration === 'string'
      ? cfg.configuration
      : JSON.stringify(cfg.configuration, null, 2);
  return {
    id: `owgw-${cfg.name}`,
    name: cfg.name,
    description: cfg.description || 'OWGW Default Configuration',
    notes: [],
    created: cfg.created || Math.floor(Date.now() / 1000),
    modified: cfg.lastModified || Math.floor(Date.now() / 1000),
    devicetypes: cfg.modelIds && cfg.modelIds.length > 0 ? cfg.modelIds : ['*'],
    configuration: [],
    inuse: [],
    variables: [],
    devicerules: {
      firmwareUpgrade: 'inherit',
      rcOnly: 'inherit',
      rrm: 'inherit',
    },
    tags: ['default-config', cfg.platform || 'ap'],
    subscriberonly: false,
    entity: '',
    venue: '',
    subscriber: '',
    version: 1,
    status: 'active',
    validation: 'passed',
    assignments: [],
    configType: 'default',
    platform: (cfg.platform as 'ap' | 'switch' | 'olg') || 'ap',
    rawConfigurationJson: configStr,
    sections: {
      general: {
        name: cfg.name,
        description: cfg.description || '',
        timezone: 'UTC',
        country: 'US',
      },
      radios: { bands: [] },
      interfaces: { ssids: [] },
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
  };
};

const mapOwprovModularConfigToDeviceConfig = (cfg: ModularConfigurationApiResponse): DeviceConfiguration => {
  return {
    id: cfg.id,
    name: cfg.name,
    description: cfg.description || 'OWPROV Modular Configuration',
    notes: (cfg.notes || []).map((n) => ({
      note: n.note,
      created: n.created || Math.floor(Date.now() / 1000),
      author: n.author,
    })),
    created: cfg.created || Math.floor(Date.now() / 1000),
    modified: cfg.modified || Math.floor(Date.now() / 1000),
    devicetypes: cfg.deviceTypes && cfg.deviceTypes.length > 0 ? cfg.deviceTypes : ['*'],
    configuration: (cfg.configuration || []).map((b) => ({
      name: b.name,
      description: b.description || '',
      weight: b.weight,
      configuration: typeof b.configuration === 'string' ? b.configuration : JSON.stringify(b.configuration),
    })),
    inuse: cfg.inUse || [],
    variables: cfg.variables || [],
    devicerules: {
      firmwareUpgrade: (cfg.deviceRules?.firmwareUpgrade as 'inherit' | 'yes' | 'no') || 'inherit',
      rcOnly: (cfg.deviceRules?.rcOnly as 'inherit' | 'yes' | 'no') || 'inherit',
      rrm: (cfg.deviceRules?.rrm as 'inherit' | 'yes' | 'no') || 'inherit',
    },
    tags: cfg.tags || ['owprov', 'modular-config', cfg.deviceGroup || 'ap'],
    subscriberonly: Boolean(cfg.subscriberOnly),
    entity: cfg.entity || '',
    venue: cfg.venue || '',
    subscriber: cfg.subscriber || '',
    version: 1,
    status: 'active',
    validation: 'passed',
    assignments: [],
    configType: 'modular',
    platform: (cfg.deviceGroup as 'ap' | 'switch' | 'olg') || 'ap',
    deviceGroup: cfg.deviceGroup || 'ap',
    sections: {
      general: {
        name: cfg.name,
        description: cfg.description || '',
        timezone: 'UTC',
        country: 'US',
      },
      radios: { bands: [] },
      interfaces: { ssids: [] },
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
  };
};

export interface ConfigurationsPageProps {
  embedded?: boolean;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  onNavigateToProfile?: (profileId?: string) => void;
}

export const ConfigurationsPage: React.FC<ConfigurationsPageProps> = ({
  embedded = false,
  isCreateOpen = false,
  onCloseCreate,
}) => {

  const [configurations, setConfigurations] = useState<DeviceConfiguration[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  // Live Entities and Venues from OWPROV for resolving names
  const { data: entities = [] } = useGetEntities();
  const { data: venues = [] } = useGetVenues();

  const entityNameMap = useMemo(() => new Map(entities.map((e) => [e.id, e.name])), [entities]);
  const venueNameMap = useMemo(() => new Map(venues.map((v) => [v.id, v.name])), [venues]);

  // Collect all unique referenced variable UUIDs across loaded configurations
  const referencedVariableIds = useMemo(() => {
    const set = new Set<string>();
    configurations.forEach((c) => {
      c.variables?.forEach((id) => {
        if (id && id.trim()) set.add(id.trim());
      });
    });
    return Array.from(set);
  }, [configurations]);

  const [variableNameMap, setVariableNameMap] = useState<Map<string, string>>(new Map());

  // Fetch only the referenced variable blocks using targeted select query
  useEffect(() => {
    if (referencedVariableIds.length === 0) return;
    let isMounted = true;
    getVariableBlocksSelect(referencedVariableIds)
      .then((blocks) => {
        if (isMounted && blocks.length > 0) {
          setVariableNameMap((prev) => {
            const next = new Map(prev);
            blocks.forEach((b) => {
              if (b.id && b.name) {
                next.set(b.id, b.name);
              }
            });
            return next;
          });
        }
      })
      .catch((err) => {
        console.warn('Failed to resolve variable block names:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [referencedVariableIds]);

  const [isSelectTypeModalOpen, setIsSelectTypeModalOpen] = useState(false);
  const [isDefaultConfigModalOpen, setIsDefaultConfigModalOpen] = useState(false);
  const [editingDefaultConfig, setEditingDefaultConfig] = useState<DeviceConfiguration | null>(null);

  const [isModularConfigModalOpen, setIsModularConfigModalOpen] = useState(false);
  const [editingModularConfig, setEditingModularConfig] = useState<DeviceConfiguration | null>(null);

  // Load live default configurations from OWGW and modular configurations from OWPROV on mount
  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      getDefaultConfigurations(),
      getModularConfigurations(),
    ])
      .then(([defaultRes, modularRes]) => {
        if (!isMounted) return;
        const liveConfigs: DeviceConfiguration[] = [];

        // 1. Live OWGW Default Configurations
        if (defaultRes.status === 'fulfilled' && Array.isArray(defaultRes.value)) {
          liveConfigs.push(...defaultRes.value.map(mapOwgwDefaultConfigToDeviceConfig));
        } else if (defaultRes.status === 'rejected') {
          console.warn('Could not fetch default configurations from OWGW:', defaultRes.reason);
        }

        // 2. Live OWPROV Modular Configurations
        if (modularRes.status === 'fulfilled' && Array.isArray(modularRes.value)) {
          liveConfigs.push(...modularRes.value.map(mapOwprovModularConfigToDeviceConfig));
        } else if (modularRes.status === 'rejected') {
          console.warn('Could not fetch modular configurations from OWPROV:', modularRes.reason);
        }

        setConfigurations(liveConfigs);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingConfigs(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isTypeModalOpen = isSelectTypeModalOpen || Boolean(isCreateOpen);

  const handleSaveDefaultConfig = (saved: DeviceConfiguration) => {
    setConfigurations((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  const handleSaveModularConfig = (saved: DeviceConfiguration) => {
    setConfigurations((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id || c.name === saved.name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  // Filter configurations
  const filteredConfigs = configurations.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());

    const matchesScope =
      scopeFilter === 'all' ||
      (scopeFilter === 'default' && c.configType === 'default') ||
      (scopeFilter === 'unassigned' && c.configType !== 'default' && !c.entity && !c.venue) ||
      (scopeFilter === 'property' && Boolean(c.entity) && !c.venue) ||
      (scopeFilter === 'venue' && Boolean(c.venue));

    const matchesStatus =
      statusFilter === 'all' || c.status === statusFilter;

    const matchesFormat =
      formatFilter === 'all' ||
      (formatFilter === 'default' && c.configType === 'default') ||
      (formatFilter === 'modular' && c.configType !== 'default');

    const rawPlatform = (c.platform || c.deviceGroup || 'ap').toLowerCase();
    const matchesPlatform =
      platformFilter === 'all' || rawPlatform === platformFilter.toLowerCase();

    return matchesSearch && matchesScope && matchesStatus && matchesFormat && matchesPlatform;
  });

  const handleDeleteConfig = async (id: string) => {
    const target = configurations.find((c) => c.id === id);
    if (target?.configType === 'default') {
      try {
        await deleteDefaultConfiguration(target.name);
      } catch (err) {
        console.warn('Failed to delete default configuration on OWGW:', err);
      }
    } else {
      try {
        await deleteModularConfiguration(id);
      } catch (err) {
        console.warn('Failed to delete modular configuration on OWPROV:', err);
      }
    }
    setConfigurations((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <Box>
      {/* Header - only if not embedded in unified page */}
      {!embedded && (
        <Header
          title="Configurations"
          subtitle="Device configurations and master templates defining radios, interfaces, and services with reusable profile blocks."
          primaryAction={{
            label: 'Create Configuration',
            onClick: () => setIsSelectTypeModalOpen(true),
          }}
        />
      )}

      {/* KPI Stats Bar */}
      <Flex gap={4} mb={6} wrap="wrap">
        <Flex flex="1" minW="200px" border="1px solid" borderColor={themeColors.kpi.border} borderRadius="6px" bg="#ffffff" p="14px 18px" align="center" gap={4}>
          <Icon name="sliders" size={26} color={themeColors.brand.accent} />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>All Configurations</Text>
            <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>{configurations.length}</Text>
          </Box>
        </Flex>

        <Flex flex="1" minW="200px" border="1px solid" borderColor={themeColors.kpi.border} borderRadius="6px" bg="#ffffff" p="14px 18px" align="center" gap={4}>
          <Icon name="device" size={26} color="#0891b2" />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>OWGW Defaults</Text>
            <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>
              {configurations.filter((c) => c.configType === 'default').length}
            </Text>
          </Box>
        </Flex>

        <Flex flex="1" minW="200px" border="1px solid" borderColor={themeColors.kpi.border} borderRadius="6px" bg="#ffffff" p="14px 18px" align="center" gap={4}>
          <Icon name="layers" size={26} color="#0284c7" />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>OWPROV Modular</Text>
            <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>
              {configurations.filter((c) => c.configType !== 'default').length}
            </Text>
          </Box>
        </Flex>

        <Flex flex="1" minW="200px" border="1px solid" borderColor={themeColors.kpi.border} borderRadius="6px" bg="#ffffff" p="14px 18px" align="center" gap={4}>
          <Icon name="check" size={26} color="#16a34a" />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>Active Status</Text>
            <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>
              {configurations.filter((c) => c.status === 'active').length}
            </Text>
          </Box>
        </Flex>
      </Flex>

      {/* Filter and Search Bar */}
      <Box
        bg="#ffffff"
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="6px"
        p={4}
        mb={4}
      >
        <Flex gap={3} wrap="wrap" align="center">
          <Box flex="2" minW="240px">
            <Input
              size="sm"
              placeholder="Search configurations by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="#ffffff"
            />
          </Box>

          <Box w="150px">
            <SelectDropdown
              value={formatFilter}
              onChange={setFormatFilter}
              options={[
                { value: 'all', label: 'All Formats' },
                { value: 'default', label: 'OWGW Default (JSON)' },
                { value: 'modular', label: 'OWPROV Modular' },
              ]}
            />
          </Box>

          <Box w="140px">
            <SelectDropdown
              value={platformFilter}
              onChange={setPlatformFilter}
              options={[
                { value: 'all', label: 'All Platforms' },
                { value: 'ap', label: 'AP' },
                { value: 'switch', label: 'Switch' },
                { value: 'olg', label: 'OLG' },
              ]}
            />
          </Box>

          <Box w="180px">
            <SelectDropdown
              value={scopeFilter}
              onChange={setScopeFilter}
              options={[
                { value: 'all', label: 'All Scopes' },
                { value: 'default', label: 'Default' },
                { value: 'unassigned', label: 'Unassigned' },
                { value: 'property', label: 'Entity Scope' },
                { value: 'venue', label: 'Venue Scope' },
              ]}
            />
          </Box>

          <Box w="180px">
            <SelectDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
          </Box>
        </Flex>
      </Box>

      {/* Configurations Table */}
      <Box
        bg="#ffffff"
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="6px"
        overflow="hidden"
      >
        <Box as="table" w="100%" style={{ borderCollapse: 'collapse' }}>
          <Box as="thead" bg="#f8fafc" borderBottom="1px solid" borderColor={themeColors.panel.divider}>
            <Box as="tr">
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Configuration Name
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Platform
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Device Types
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Scope Assignment
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Referenced Profiles (__variableBlock)
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Device Rules
              </Box>
              <Box as="th" p="12px 16px" textAlign="right" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Actions
              </Box>
            </Box>
          </Box>

          <Box as="tbody">
            {filteredConfigs.length === 0 ? (
              <Box as="tr">
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center' }}>
                  <Text fontSize="13px" color={themeColors.text.muted}>
                    {isLoadingConfigs ? 'Loading configurations...' : 'No configurations found.'}
                  </Text>
                </td>
              </Box>
            ) : (
              filteredConfigs.map((c) => {
                return (
                  <Box
                    as="tr"
                    key={c.id}
                    borderBottom="1px solid"
                    borderColor={themeColors.panel.divider}
                    _hover={{ bg: '#f8fafc' }}
                  >
                    <Box as="td" p="12px 16px">
                      <HStack gap={2.5}>
                        <Icon
                          name={c.configType === 'default' ? 'device' : 'sliders'}
                          size={16}
                          color={c.configType === 'default' ? '#0891b2' : themeColors.brand.accent}
                        />
                        <Box>
                          <HStack gap={1.5} align="center">
                            <Text
                              fontSize="13px"
                              fontWeight="600"
                              color={themeColors.brand.accent}
                              cursor="pointer"
                              _hover={{ textDecoration: 'underline' }}
                              onClick={() => {
                                if (c.configType === 'default') {
                                  setEditingDefaultConfig(c);
                                  setIsDefaultConfigModalOpen(true);
                                } else {
                                  setEditingModularConfig(c);
                                  setIsModularConfigModalOpen(true);
                                }
                              }}
                            >
                              {c.name}
                            </Text>
                            {c.configType === 'default' ? (
                              <Box
                                fontSize="9px"
                                fontWeight="700"
                                px={1.5}
                                py={0.2}
                                borderRadius="3px"
                                bg="#f1f5f9"
                                color="#0891b2"
                                border="1px solid"
                                borderColor="rgba(8, 145, 178, 0.2)"
                              >
                                DEFAULT
                              </Box>
                            ) : (
                              <Box
                                fontSize="9px"
                                fontWeight="700"
                                px={1.5}
                                py={0.2}
                                borderRadius="3px"
                                bg="rgba(14, 165, 233, 0.08)"
                                color="#0284c7"
                                border="1px solid"
                                borderColor="rgba(2, 132, 199, 0.2)"
                              >
                                MODULAR
                              </Box>
                            )}
                          </HStack>
                          <Text fontSize="11px" color={themeColors.text.muted} lineClamp={1} maxW="300px">
                            {c.description || 'Master device configuration'}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>

                    <Box as="td" p="12px 16px">
                      {(() => {
                        const raw = (c.platform || c.deviceGroup || 'ap').toLowerCase();
                        const label = raw.toUpperCase();
                        const isAp = raw === 'ap';
                        const isSwitch = raw === 'switch';
                        const isOlg = raw === 'olg';

                        const badgeBg = isAp ? '#eff6ff' : isSwitch ? '#faf5ff' : isOlg ? '#f0fdfa' : '#f8fafc';
                        const badgeColor = isAp ? '#1d4ed8' : isSwitch ? '#7e22ce' : isOlg ? '#0f766e' : '#334155';
                        const badgeBorder = isAp ? '#bfdbfe' : isSwitch ? '#e9d5ff' : isOlg ? '#99f6e4' : '#e2e8f0';

                        return (
                          <Box
                            display="inline-block"
                            fontSize="11px"
                            fontWeight="700"
                            px={2}
                            py={0.5}
                            borderRadius="4px"
                            bg={badgeBg}
                            color={badgeColor}
                            border="1px solid"
                            borderColor={badgeBorder}
                            fontFamily="monospace"
                          >
                            {label}
                          </Box>
                        );
                      })()}
                    </Box>

                    <Box as="td" p="12px 16px">
                      <HStack gap={1}>
                        {c.devicetypes.map((dt, idx) => (
                          <Box
                            key={idx}
                            fontSize="11px"
                            fontWeight="600"
                            px={2}
                            py={0.5}
                            borderRadius="4px"
                            bg="#f1f5f9"
                            color={themeColors.text.secondary}
                            fontFamily="monospace"
                          >
                            {dt}
                          </Box>
                        ))}
                      </HStack>
                    </Box>

                    <Box as="td" p="12px 16px">
                      {c.configType === 'default' ? (
                        <Box
                          display="inline-block"
                          fontSize="11px"
                          fontWeight="600"
                          px={2}
                          py={0.5}
                          borderRadius="4px"
                          bg="#e0f2fe"
                          color="#0369a1"
                          border="1px solid #bae6fd"
                        >
                          Default
                        </Box>
                      ) : c.venue ? (
                        <Box
                          display="inline-block"
                          fontSize="11px"
                          fontWeight="600"
                          px={2}
                          py={0.5}
                          borderRadius="4px"
                          bg="#f3e8ff"
                          color="#7e22ce"
                        >
                          Venue: {venueNameMap.get(c.venue) || c.venueName || (c.venue.length > 8 ? `${c.venue.slice(0, 8)}...` : c.venue)}
                        </Box>
                      ) : c.entity ? (
                        <Box
                          display="inline-block"
                          fontSize="11px"
                          fontWeight="600"
                          px={2}
                          py={0.5}
                          borderRadius="4px"
                          bg="#dcfce7"
                          color="#166534"
                        >
                          Entity: {entityNameMap.get(c.entity) || c.entityName || (c.entity.length > 8 ? `${c.entity.slice(0, 8)}...` : c.entity)}
                        </Box>
                      ) : (
                        <Text fontSize="12px" color={themeColors.text.muted}>
                          —
                        </Text>
                      )}
                    </Box>

                    <Box as="td" p="12px 16px">
                      {c.configType === 'default' || c.variables.length === 0 ? (
                        <Text fontSize="12px" color={themeColors.text.muted}>
                          None
                        </Text>
                      ) : (
                        <HStack gap={1.5} wrap="wrap" maxW="240px">
                          {c.variables.map((vId) => {
                            const humanName = variableNameMap.get(vId);
                            return (
                              <Box
                                key={vId}
                                fontSize="11px"
                                fontWeight="600"
                                px={2}
                                py={0.5}
                                borderRadius="4px"
                                bg="#eff6ff"
                                color={themeColors.brand.accent}
                                border="1px solid"
                                borderColor="#bfdbfe"
                                title={`Variable Block UUID: ${vId}`}
                              >
                                {humanName || `${vId.substring(0, 8)}...`}
                              </Box>
                            );
                          })}
                        </HStack>
                      )}
                    </Box>

                    <Box as="td" p="12px 16px" fontSize="11px" color={themeColors.text.secondary}>
                      {c.configType === 'default' ? (
                        <Text fontSize="12px" color={themeColors.text.muted}>
                          N/A
                        </Text>
                      ) : (
                        <>
                          <Text>FW: <Text as="span" fontWeight="600">{c.devicerules?.firmwareUpgrade || 'inherit'}</Text></Text>
                          <Text>RRM: <Text as="span" fontWeight="600">{c.devicerules?.rrm || 'inherit'}</Text></Text>
                        </>
                      )}
                    </Box>

                    <Box as="td" p="12px 16px" textAlign="right">
                      <HStack gap={1} justify="flex-end">
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor={themeColors.panel.border}
                          onClick={() => {
                            if (c.configType === 'default') {
                              setEditingDefaultConfig(c);
                              setIsDefaultConfigModalOpen(true);
                            } else {
                              setEditingModularConfig(c);
                              setIsModularConfigModalOpen(true);
                            }
                          }}
                        >
                          <Icon name="edit" size={12} />
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor={themeColors.panel.border}
                          color="#dc2626"
                          _hover={{ bg: '#fee2e2' }}
                          onClick={() => handleDeleteConfig(c.id)}
                          title="Delete configuration"
                        >
                          <Icon name="trash" size={12} color="#dc2626" />
                        </Button>
                      </HStack>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Box>

      {/* Select Configuration Type Choice Modal */}
      <SelectConfigTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => {
          setIsSelectTypeModalOpen(false);
          onCloseCreate?.();
        }}
        onSelectType={(type) => {
          setIsSelectTypeModalOpen(false);
          onCloseCreate?.();
          if (type === 'default') {
            setEditingDefaultConfig(null);
            setIsDefaultConfigModalOpen(true);
          } else {
            setEditingModularConfig(null);
            setIsModularConfigModalOpen(true);
          }
        }}
      />

      {/* OWGW Default Configuration Modal (Create & Edit) */}
      <DefaultConfigModal
        key={editingDefaultConfig?.id || (isDefaultConfigModalOpen ? 'open-new-default' : 'closed-default')}
        isOpen={isDefaultConfigModalOpen}
        onClose={() => {
          setIsDefaultConfigModalOpen(false);
          setEditingDefaultConfig(null);
        }}
        onSave={handleSaveDefaultConfig}
        initialConfig={editingDefaultConfig}
      />

      {/* OWPROV Modular Configuration Modal (Create & Edit) */}
      <ModularConfigModal
        key={editingModularConfig?.id || (isModularConfigModalOpen ? 'open-new-modular' : 'closed-modular')}
        isOpen={isModularConfigModalOpen}
        onClose={() => {
          setIsModularConfigModalOpen(false);
          setEditingModularConfig(null);
        }}
        onSave={handleSaveModularConfig}
        initialConfig={editingModularConfig}
      />
    </Box>
  );
};

export default ConfigurationsPage;
