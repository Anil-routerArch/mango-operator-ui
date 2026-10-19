import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Header } from '@/layout/Header';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import {
  getDefaultConfigurations,
  deleteDefaultConfiguration,
  getModularConfigurations,
  deleteModularConfiguration,
  getVariableBlocksSelect,
  getAllVariableBlocks,
  useGetEntities,
  useGetVenues,
  type DefaultConfigurationApiResponse,
  type ModularConfigurationApiResponse,
} from '@/api';
import { extractVariableBlockUuids } from './utils/variableExtractor';
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
    variables: extractVariableBlockUuids(cfg.configuration),
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
    name: cfg.name || 'Unnamed Configuration',
    description: cfg.description || 'OWPROV Modular Configuration',
    notes: (cfg.notes || []).map((n) => ({
      note: typeof n === 'string' ? n : n?.note || '',
      created: typeof n === 'object' && n ? n.created || Math.floor(Date.now() / 1000) : Math.floor(Date.now() / 1000),
      author: typeof n === 'object' && n ? n.author : undefined,
    })),
    created: cfg.created || Math.floor(Date.now() / 1000),
    modified: cfg.modified || Math.floor(Date.now() / 1000),
    devicetypes: cfg.deviceTypes && cfg.deviceTypes.length > 0 ? cfg.deviceTypes : ['*'],
    configuration: (cfg.configuration || []).filter(Boolean).map((b) => ({
      name: b?.name || '',
      description: b?.description || '',
      weight: typeof b?.weight === 'number' ? b.weight : 0,
      configuration: typeof b?.configuration === 'string' ? b.configuration : JSON.stringify(b?.configuration || {}),
    })),
    inuse: cfg.inUse || [],
    variables: extractVariableBlockUuids(cfg.configuration),
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
  onNavigateToProfile,
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
    return Array.from(set).sort();
  }, [configurations]);

  const serializedVariableIds = useMemo(
    () => referencedVariableIds.join(','),
    [referencedVariableIds]
  );

  const [variableNameMap, setVariableNameMap] = useState<Map<string, string>>(new Map());

  // Fetch only the referenced variable blocks using targeted select query, with fallback
  useEffect(() => {
    if (!serializedVariableIds) return;
    const targetIds = serializedVariableIds.split(',').filter(Boolean);
    if (targetIds.length === 0) return;
    let isMounted = true;

    getVariableBlocksSelect(targetIds)
      .then((blocks) => {
        if (!isMounted) return;
        const resolvedMap = new Map<string, string>();
        blocks.forEach((b) => {
          if (b.id && b.name) {
            resolvedMap.set(b.id, b.name);
          }
        });

        // Check if all referenced IDs were found in select response
        const hasMissing = targetIds.some((id) => !resolvedMap.has(id));
        if (hasMissing) {
          getAllVariableBlocks()
            .then((allBlocks) => {
              if (!isMounted) return;
              setVariableNameMap((prev) => {
                const next = new Map(prev);
                allBlocks.forEach((b) => {
                  if (b.id && b.name) next.set(b.id, b.name);
                });
                return next;
              });
            })
            .catch(() => {});
        }

        setVariableNameMap((prev) => {
          const next = new Map(prev);
          resolvedMap.forEach((name, id) => next.set(id, name));
          return next;
        });
      })
      .catch(() => {
        getAllVariableBlocks()
          .then((allBlocks) => {
            if (!isMounted) return;
            setVariableNameMap((prev) => {
              const next = new Map(prev);
              allBlocks.forEach((b) => {
                if (b.id && b.name) next.set(b.id, b.name);
              });
              return next;
            });
          })
          .catch((err) => {
            console.warn('Failed to resolve variable block names:', err);
          });
      });

    return () => {
      isMounted = false;
    };
  }, [serializedVariableIds]);

  const [isSelectTypeModalOpen, setIsSelectTypeModalOpen] = useState(false);
  const [isDefaultConfigModalOpen, setIsDefaultConfigModalOpen] = useState(false);
  const [editingDefaultConfig, setEditingDefaultConfig] = useState<DeviceConfiguration | null>(null);

  const [isModularConfigModalOpen, setIsModularConfigModalOpen] = useState(false);
  const [editingModularConfig, setEditingModularConfig] = useState<DeviceConfiguration | null>(null);

  const [inUseModalConfig, setInUseModalConfig] = useState<DeviceConfiguration | null>(null);
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState<DeviceConfiguration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const idx = prev.findIndex((c) => c.id === saved.id);
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
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase());

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

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('configurations_page_size');
      if (stored) {
        const parsed = Number(stored);
        if ([5, 10, 20, 50].includes(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return 10;
  });

  useEffect(() => {
    try {
      localStorage.setItem('configurations_page_size', String(pageSize));
    } catch {
      // ignore
    }
  }, [pageSize]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, scopeFilter, statusFilter, formatFilter, platformFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredConfigs.length / pageSize));

  const paginatedConfigs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredConfigs.slice(startIndex, startIndex + pageSize);
  }, [filteredConfigs, currentPage, pageSize]);

  const handleRequestDelete = (cfg: DeviceConfiguration) => {
    if (cfg.inuse && cfg.inuse.length > 0) {
      setInUseModalConfig(cfg);
      return;
    }
    setDeleteConfirmConfig(cfg);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmConfig) return;
    try {
      setIsDeleting(true);
      if (deleteConfirmConfig.configType === 'default') {
        await deleteDefaultConfiguration(deleteConfirmConfig.name);
      } else {
        await deleteModularConfiguration(deleteConfirmConfig.id);
      }
      setConfigurations((prev) => prev.filter((c) => c.id !== deleteConfirmConfig.id));
      toaster.success({
        title: 'Configuration Deleted',
        description: `Configuration "${deleteConfirmConfig.name}" was deleted successfully.`,
      });
      setDeleteConfirmConfig(null);
    } catch (err: unknown) {
      console.error('Failed to delete configuration:', err);
      const errorMsg =
        (err as { response?: { data?: { ErrorDescription?: string } } })?.response?.data
          ?.ErrorDescription ||
        (err as Error)?.message ||
        'Failed to delete configuration.';
      toaster.error({
        title: 'Delete Failed',
        description: errorMsg,
      });
    } finally {
      setIsDeleting(false);
    }
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
              paginatedConfigs.map((c) => {
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
                        {(c.devicetypes || []).map((dt, idx) => (
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
                      {c.configType === 'default' || !c.variables || c.variables.length === 0 ? (
                        <Text fontSize="12px" color={themeColors.text.muted}>
                          None
                        </Text>
                      ) : (
                        <HStack gap={1.5} wrap="wrap" maxW="240px">
                          {(c.variables || []).map((vId) => {
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
                                cursor={onNavigateToProfile ? 'pointer' : 'default'}
                                _hover={onNavigateToProfile ? { textDecoration: 'underline', bg: '#dbeafe' } : undefined}
                                onClick={() => onNavigateToProfile?.(vId)}
                                title={`Variable Block: ${humanName || vId}\nUUID: ${vId}`}
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
                          onClick={() => handleRequestDelete(c)}
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

        {/* Pagination Bar */}
        {filteredConfigs.length > 0 && (
          <Flex
            justify="space-between"
            align="center"
            px={4}
            py={3}
            borderTop="1px solid"
            borderColor={themeColors.panel.divider}
            fontSize="12px"
            color={themeColors.text.secondary}
            wrap="wrap"
            gap={2}
          >
            <HStack gap={3} align="center">
              <Text>
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredConfigs.length)} of {filteredConfigs.length}
              </Text>

              {/* Rows Per Page Selector */}
              <HStack gap={1} align="center">
                <Text fontSize="11px" color={themeColors.text.muted}>Rows:</Text>
                <SelectDropdown
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                  options={[5, 10, 20, 50]}
                  w="66px"
                  h="26px"
                  fontSize="11px"
                  borderColor={themeColors.panel.border}
                />
              </HStack>
            </HStack>

            {totalPages > 1 && (
              <HStack gap={1}>
                {/* Previous Page */}
                <Button
                  size="xs"
                  w="28px"
                  h="28px"
                  minW="28px"
                  p={0}
                  variant="outline"
                  borderColor={themeColors.panel.border}
                  color={themeColors.text.secondary}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  cursor={currentPage <= 1 ? 'not-allowed' : 'pointer'}
                  borderRadius="4px"
                  bg="#ffffff"
                  _hover={{ borderColor: themeColors.brand.accent }}
                  aria-label="Previous page"
                >
                  <Icon name="chevronLeft" size={14} />
                </Button>

                {/* Numbered Page Buttons */}
                {(() => {
                  const pages: (number | string)[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 4) {
                      pages.push(1, 2, 3, 4, 5, '...', totalPages);
                    } else if (currentPage >= totalPages - 3) {
                      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                    }
                  }
                  return pages.map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <Text key={`ellipsis-${idx}`} px={1} color={themeColors.text.muted} fontSize="12px">
                          ...
                        </Text>
                      );
                    }
                    const num = pageNum as number;
                    const isActive = num === currentPage;
                    return (
                      <Button
                        key={num}
                        size="xs"
                        w="28px"
                        h="28px"
                        minW="28px"
                        p={0}
                        fontSize="12px"
                        fontWeight={isActive ? '700' : '400'}
                        bg="#ffffff"
                        color={isActive ? themeColors.brand.accent : themeColors.text.secondary}
                        border="1px solid"
                        borderColor={isActive ? themeColors.brand.accent : themeColors.panel.border}
                        borderRadius="4px"
                        onClick={() => setCurrentPage(num)}
                        cursor="pointer"
                        _hover={{
                          borderColor: themeColors.brand.accent,
                          color: themeColors.brand.accent,
                        }}
                      >
                        {num}
                      </Button>
                    );
                  });
                })()}

                {/* Next Page */}
                <Button
                  size="xs"
                  w="28px"
                  h="28px"
                  minW="28px"
                  p={0}
                  variant="outline"
                  borderColor={themeColors.panel.border}
                  color={themeColors.text.secondary}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  cursor={currentPage >= totalPages ? 'not-allowed' : 'pointer'}
                  borderRadius="4px"
                  bg="#ffffff"
                  _hover={{ borderColor: themeColors.brand.accent }}
                  aria-label="Next page"
                >
                  <Icon name="chevronRight" size={14} />
                </Button>
              </HStack>
            )}
          </Flex>
        )}
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

      {/* In-Use Warning Modal */}
      {inUseModalConfig && (
        <Box
          position="fixed"
          inset="0"
          bg="rgba(5, 12, 23, 0.54)"
          display="grid"
          placeItems="center"
          zIndex="1200"
          p={4}
        >
          <Box
            w="min(480px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.3)"
            overflow="hidden"
          >
            <Flex
              justify="space-between"
              align="center"
              p={5}
              pb={3}
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <HStack gap={2}>
                <Flex
                  w="30px"
                  h="30px"
                  borderRadius="50%"
                  bg="#fef3c7"
                  color="#d97706"
                  align="center"
                  justify="center"
                >
                  <Icon name="alertTriangle" size={16} />
                </Flex>
                <Text fontSize="16px" fontWeight="700" color="#0f172a">
                  Configuration In Use
                </Text>
              </HStack>
              <Button
                variant="plain"
                size="xs"
                p={1}
                cursor="pointer"
                onClick={() => setInUseModalConfig(null)}
              >
                <Icon name="x" size={18} />
              </Button>
            </Flex>

            <Box p={5}>
              <Text fontSize="13px" color="#334155" mb={3} lineHeight="1.5">
                Cannot delete <strong>"{inUseModalConfig.name}"</strong> because it is currently assigned to or in use by <strong>{inUseModalConfig.inuse.length}</strong> entity/venue/device(s):
              </Text>
              <Box
                maxH="160px"
                overflowY="auto"
                bg="#f8fafc"
                border="1px solid"
                borderColor={themeColors.panel.border}
                borderRadius="6px"
                p={3}
                mb={3}
              >
                <VStack align="stretch" gap={1.5}>
                  {inUseModalConfig.inuse.map((item, idx) => (
                    <HStack key={idx} justify="space-between" fontSize="12px">
                      <Text fontFamily="monospace" color="#0f172a" fontWeight="500">
                        {item}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
              <Text fontSize="12px" color="#64748b" lineHeight="1.5">
                OWPROV enforces referential integrity. Please unassign or remove this configuration from the resources above before deleting it.
              </Text>
            </Box>

            <Flex
              justify="flex-end"
              p={4}
              bg="#f8fafc"
              borderTop="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <Button
                size="sm"
                bg={themeColors.brand.primary}
                color="#ffffff"
                _hover={{ opacity: 0.9 }}
                onClick={() => setInUseModalConfig(null)}
              >
                Understood
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmConfig && (
        <Box
          position="fixed"
          inset="0"
          bg="rgba(5, 12, 23, 0.54)"
          display="grid"
          placeItems="center"
          zIndex="1200"
          p={4}
        >
          <Box
            w="min(460px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.3)"
            overflow="hidden"
          >
            <Flex
              justify="space-between"
              align="center"
              p={5}
              pb={3}
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <HStack gap={2}>
                <Flex
                  w="30px"
                  h="30px"
                  borderRadius="50%"
                  bg="#fee2e2"
                  color="#dc2626"
                  align="center"
                  justify="center"
                >
                  <Icon name="trash" size={16} />
                </Flex>
                <Text fontSize="16px" fontWeight="700" color="#0f172a">
                  Delete Configuration
                </Text>
              </HStack>
              <Button
                variant="plain"
                size="xs"
                p={1}
                cursor="pointer"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmConfig(null)}
              >
                <Icon name="x" size={18} />
              </Button>
            </Flex>

            <Box p={5}>
              <Text fontSize="13px" color="#334155" mb={2} lineHeight="1.5">
                Are you sure you want to delete configuration <strong>"{deleteConfirmConfig.name}"</strong>?
              </Text>
              <Text fontSize="12px" color="#64748b" lineHeight="1.5">
                This action cannot be undone. The configuration will be permanently removed from{' '}
                {deleteConfirmConfig.configType === 'default' ? 'OWGW' : 'OWPROV'}.
              </Text>
            </Box>

            <Flex
              justify="flex-end"
              gap={3}
              p={4}
              bg="#f8fafc"
              borderTop="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <Button
                variant="outline"
                size="sm"
                borderColor={themeColors.panel.border}
                color={themeColors.text.primary}
                disabled={isDeleting}
                onClick={() => setDeleteConfirmConfig(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                bg="#dc2626"
                color="#ffffff"
                _hover={{ bg: '#b91c1c' }}
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? (
                  <HStack gap={1.5}>
                    <Spinner size="xs" color="#ffffff" />
                    <Text>Deleting...</Text>
                  </HStack>
                ) : (
                  'Delete Configuration'
                )}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ConfigurationsPage;
