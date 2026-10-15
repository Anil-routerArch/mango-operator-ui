import React, { useEffect, useMemo, useState } from 'react';
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
import { useConfigurationUiStore } from '@/stores/configurationUiStore';
import { useGetEntities, useGetVenues } from '@/api';
import {
  getAllVariableBlocks,
  createVariableBlock,
  updateVariableBlock,
  deleteVariableBlock,
  type VariableBlockApiResponse,
} from '@/api/modularConfigurations';
import { CreateProfileModal } from './components/CreateProfileModal';
import { ProfileEditorPage } from './ProfileEditorPage';
import type {
  ConfigurationProfile,
  VariablePrefixType,
  ProfileSettingsValue,
} from './types/configuration';

export interface ConfigurationProfilesPageProps {
  embedded?: boolean;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  onNavigateToConfig?: (configId?: string) => void;
}

function mapRawVariableToProfile(
  raw: VariableBlockApiResponse,
  entityNameMap: Map<string, string>,
  venueNameMap: Map<string, string>
): ConfigurationProfile {
  const firstVar = raw.variables?.[0];
  let prefix: VariablePrefixType = 'custom';
  let parsedValues: Record<string, ProfileSettingsValue> = {};

  if (firstVar) {
    if (firstVar.prefix) {
      prefix = firstVar.prefix as VariablePrefixType;
    }
    if (typeof firstVar.value === 'string') {
      try {
        parsedValues = JSON.parse(firstVar.value);
      } catch {
        parsedValues = { raw: firstVar.value };
      }
    } else if (firstVar.value && typeof firstVar.value === 'object') {
      parsedValues = firstVar.value as Record<string, ProfileSettingsValue>;
    }
  }

  const entId = raw.entity || '';
  const venId = raw.venue || '';

  return {
    id: raw.id,
    name: raw.name || 'Unnamed Variable',
    description: raw.description || '',
    notes: (raw.notes || []).map((n) => ({
      note: typeof n === 'string' ? n : n.note || '',
      created: typeof n === 'object' ? n.created || 0 : 0,
      author: typeof n === 'object' ? n.author || '' : '',
    })),
    created: raw.created || 0,
    modified: raw.modified || 0,
    variables: (raw.variables || []).map((v) => ({
      prefix: v.prefix || '',
      type: v.type || 'json',
      weight: v.weight ?? 0,
      value: typeof v.value === 'string' ? v.value : JSON.stringify(v.value),
    })),
    entity: entId,
    entityName:
      entityNameMap.get(entId) ||
      (raw.entityName as string) ||
      (entId ? `${entId.slice(0, 8)}...` : ''),
    venue: venId,
    venueName:
      venueNameMap.get(venId) ||
      (raw.venueName as string) ||
      (venId ? `${venId.slice(0, 8)}...` : ''),
    subscriber: raw.subscriber || '',
    inventory: raw.inventory || '',
    configurations: raw.configurations || [],
    deviceGroup: (raw.deviceGroup as string) || 'ap',
    prefix,
    parsedValues,
    status: 'valid',
    configuredFieldsCount: Object.keys(parsedValues).length,
  };
}

export const ConfigurationProfilesPage: React.FC<ConfigurationProfilesPageProps> = ({
  embedded = false,
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const { selectedProfileId, setSelectedProfileId } = useConfigurationUiStore();
  const [profiles, setProfiles] = useState<ConfigurationProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  // Live entities and venues
  const { data: entities = [] } = useGetEntities();
  const { data: venues = [] } = useGetVenues();
  const entityNameMap = useMemo(
    () => new Map(entities.map((e) => [e.id, e.name])),
    [entities]
  );
  const venueNameMap = useMemo(
    () => new Map(venues.map((v) => [v.id, v.name])),
    [venues]
  );

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [editingModalProfile, setEditingModalProfile] = useState<ConfigurationProfile | null>(null);
  const isModalOpen = internalModalOpen || Boolean(isCreateOpen);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    getAllVariableBlocks()
      .then((blocks) => {
        if (!isMounted) return;
        const mapped = blocks.map((b) =>
          mapRawVariableToProfile(b, entityNameMap, venueNameMap)
        );
        setProfiles(mapped);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        console.error('Failed to load variables from OWPROV:', err);
        const msg =
          (err as { response?: { data?: { ErrorDescription?: string } } })?.response?.data
            ?.ErrorDescription ||
          (err as Error)?.message ||
          'Failed to load variables from OWPROV.';
        setError(msg);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [entityNameMap, venueNameMap, reloadKey]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const handleOpenCreateModal = () => {
    setEditingModalProfile(null);
    setInternalModalOpen(true);
  };

  const handleCloseModal = () => {
    setInternalModalOpen(false);
    setEditingModalProfile(null);
    onCloseCreate?.();
  };

  const handleSaveProfile = async (savedProfile: ConfigurationProfile) => {
    try {
      const payload: Partial<VariableBlockApiResponse> = {
        name: savedProfile.name,
        description: savedProfile.description,
        entity: savedProfile.venue ? undefined : (savedProfile.entity || undefined),
        venue: savedProfile.venue || undefined,
        variables: savedProfile.variables.map((v) => ({
          prefix: v.prefix,
          type: v.type || 'json',
          weight: v.weight || 0,
          value: typeof v.value === 'string' ? v.value : JSON.stringify(v.value),
        })),
        notes: savedProfile.notes,
      };

      const isExisting = profiles.some((p) => p.id === savedProfile.id);
      let result: VariableBlockApiResponse;
      if (isExisting) {
        result = await updateVariableBlock(savedProfile.id, payload);
      } else {
        result = await createVariableBlock(payload);
      }

      const mapped = mapRawVariableToProfile(result, entityNameMap, venueNameMap);
      setProfiles((prev) => {
        const idx = prev.findIndex((p) => p.id === mapped.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = mapped;
          return next;
        }
        return [mapped, ...prev];
      });
    } catch (err: unknown) {
      console.error('Failed to save variable block:', err);
      const errorMsg =
        (err as { response?: { data?: { ErrorDescription?: string } } })?.response?.data
          ?.ErrorDescription ||
        (err as Error)?.message ||
        'Failed to save variable to OWPROV.';
      alert(errorMsg);
    }
  };

  // If a profile detail page is opened
  if (selectedProfileId) {
    const activeProfile = profiles.find((p) => p.id === selectedProfileId);
    if (activeProfile) {
      return (
        <ProfileEditorPage
          profile={activeProfile}
          onBack={() => setSelectedProfileId(null)}
          onSave={handleSaveProfile}
        />
      );
    }
  }

  const handleOpenEditModal = (profile: ConfigurationProfile) => {
    setEditingModalProfile(profile);
    setInternalModalOpen(true);
  };

  const handleDeleteProfile = async (profileId: string) => {
    const target = profiles.find((p) => p.id === profileId);
    if (target && target.configurations && target.configurations.length > 0) {
      alert(
        `Cannot delete variable "${target.name}": it is currently in use by ${target.configurations.length} configuration(s). Please remove it from those configurations before deleting.`
      );
      return;
    }

    const confirmMsg = `Are you sure you want to delete variable "${target?.name || profileId}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteVariableBlock(profileId);
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch (err: unknown) {
      console.error('Failed to delete variable from OWPROV:', err);
      const errorMsg =
        (err as { response?: { data?: { ErrorDescription?: string } } })?.response?.data
          ?.ErrorDescription ||
        (err as Error)?.message ||
        'Failed to delete variable from OWPROV.';
      alert(errorMsg);
    }
  };

  const handleDuplicateProfile = async (profile: ConfigurationProfile) => {
    try {
      const payload: Partial<VariableBlockApiResponse> = {
        name: `${profile.name} (Copy)`,
        description: profile.description,
        entity: profile.venue ? undefined : (profile.entity || undefined),
        venue: profile.venue || undefined,
        variables: profile.variables.map((v) => ({
          prefix: v.prefix,
          type: v.type || 'json',
          weight: v.weight || 0,
          value: typeof v.value === 'string' ? v.value : JSON.stringify(v.value),
        })),
      };
      const created = await createVariableBlock(payload);
      const mapped = mapRawVariableToProfile(created, entityNameMap, venueNameMap);
      setProfiles((prev) => [mapped, ...prev]);
    } catch (err: unknown) {
      console.error('Failed to duplicate variable:', err);
      const errorMsg =
        (err as { response?: { data?: { ErrorDescription?: string } } })?.response?.data
          ?.ErrorDescription ||
        (err as Error)?.message ||
        'Failed to duplicate variable.';
      alert(errorMsg);
    }
  };

  // Filter profiles
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.prefix.toLowerCase().includes(search.toLowerCase());

    const matchesSection =
      sectionFilter === 'all' || p.prefix === sectionFilter;

    const matchesScope =
      scopeFilter === 'all' ||
      (scopeFilter === 'unassigned' && !p.entity && !p.venue) ||
      (scopeFilter === 'property' && Boolean(p.entity) && !p.venue) ||
      (scopeFilter === 'venue' && Boolean(p.venue));

    return matchesSearch && matchesSection && matchesScope;
  });

  const radioProfilesCount = profiles.filter((p) => p.prefix === 'radio').length;
  const ssidProfilesCount = profiles.filter((p) => p.prefix.startsWith('interface.ssid')).length;
  const inUseCount = profiles.filter((p) => p.configurations.length > 0).length;

  return (
    <Box>
      {/* Header - only if not embedded in unified page */}
      {!embedded && (
        <Header
          title="Configuration Profiles"
          subtitle="Reusable variable blocks (radios, SSIDs, VLANs) in OWPROV scoped to entity, venue, or unassigned."
          primaryAction={{
            label: 'Create Profile',
            onClick: handleOpenCreateModal,
          }}
        />
      )}

      {/* KPI Stats Bar */}
      <Flex gap={4} mb={6} wrap="wrap">
        <Flex flex="1" minW="200px" border="1px solid" borderColor={themeColors.kpi.border} borderRadius="6px" bg="#ffffff" p="14px 18px" align="center" gap={4}>
          <Icon name="layers" size={26} color={themeColors.brand.accent} />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>Total Variables</Text>
            <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>{profiles.length}</Text>
          </Box>
        </Flex>

        <Flex flex="1" minW="200px" border="1px solid" borderColor={themeColors.kpi.border} borderRadius="6px" bg="#ffffff" p="14px 18px" align="center" gap={4}>
          <Icon name="radio" size={26} color="#0891b2" />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>Radio Profiles</Text>
            <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>{radioProfilesCount}</Text>
          </Box>
        </Flex>

        <Flex flex="1" minW="200px" border="1px solid" borderColor={themeColors.kpi.border} borderRadius="6px" bg="#ffffff" p="14px 18px" align="center" gap={4}>
          <Icon name="sliders" size={26} color="#16a34a" />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>SSID Profiles</Text>
            <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>{ssidProfilesCount}</Text>
          </Box>
        </Flex>

        <Flex flex="1" minW="200px" border="1px solid" borderColor={themeColors.kpi.border} borderRadius="6px" bg="#ffffff" p="14px 18px" align="center" gap={4}>
          <Icon name="link" size={26} color="#7c3aed" />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>In Use in Configs</Text>
            <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>{inUseCount}</Text>
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
              placeholder="Search variables by name, prefix, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              bg="#ffffff"
            />
          </Box>

          <Box w="200px">
            <SelectDropdown
              value={sectionFilter}
              onChange={setSectionFilter}
              options={[
                { value: 'all', label: 'All Sections' },
                { value: 'radio', label: 'Radio (radio)' },
                { value: 'interface.ssid', label: 'SSID (interface.ssid)' },
                { value: 'interface.vlan', label: 'VLAN (interface.vlan)' },
                { value: 'interface.ipv4', label: 'IPv4 (interface.ipv4)' },
                { value: 'interface.captive', label: 'Captive (interface.captive)' },
                { value: 'interface.tunnel', label: 'Tunnel (interface.tunnel)' },
              ]}
            />
          </Box>

          <Box w="180px">
            <SelectDropdown
              value={scopeFilter}
              onChange={setScopeFilter}
              options={[
                { value: 'all', label: 'All Scopes' },
                { value: 'property', label: 'Entity Scoped' },
                { value: 'venue', label: 'Venue Scoped' },
                { value: 'unassigned', label: 'Unassigned' },
              ]}
            />
          </Box>
        </Flex>
      </Box>

      {/* Profiles Table */}
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
                Variable / Profile Name
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Section Prefix
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Scope
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Last Modified
              </Box>
              <Box as="th" p="12px 16px" textAlign="right" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Actions
              </Box>
            </Box>
          </Box>

          <Box as="tbody">
            {isLoading ? (
              <Box as="tr">
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>
                  <VStack gap={3} justify="center">
                    <Spinner size="md" color={themeColors.brand.accent} />
                    <Text fontSize="13px" color={themeColors.text.muted}>
                      Loading variables from OWPROV...
                    </Text>
                  </VStack>
                </td>
              </Box>
            ) : error ? (
              <Box as="tr">
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center' }}>
                  <VStack gap={2} justify="center">
                    <Text fontSize="13px" color="#dc2626" fontWeight="600">
                      {error}
                    </Text>
                    <Button size="xs" variant="outline" onClick={handleRetry}>
                      Retry
                    </Button>
                  </VStack>
                </td>
              </Box>
            ) : filteredProfiles.length === 0 ? (
              <Box as="tr">
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center' }}>
                  <Text fontSize="13px" color={themeColors.text.muted}>
                    No variables found in OWPROV matching filters.
                  </Text>
                </td>
              </Box>
            ) : (
              filteredProfiles.map((p) => {
                return (
                  <Box
                    as="tr"
                    key={p.id}
                    borderBottom="1px solid"
                    borderColor={themeColors.panel.divider}
                    _hover={{ bg: '#f8fafc' }}
                  >
                    <Box as="td" p="12px 16px">
                      <HStack gap={2.5}>
                        <Icon
                          name={p.prefix === 'radio' ? 'radio' : 'layers'}
                          size={16}
                          color={themeColors.brand.accent}
                        />
                        <Box>
                          <Text
                            fontSize="13px"
                            fontWeight="600"
                            color={themeColors.brand.accent}
                            cursor="pointer"
                            _hover={{ textDecoration: 'underline' }}
                            onClick={() => setSelectedProfileId(p.id)}
                            title={`Variable ID: ${p.id}`}
                          >
                            {p.name}
                          </Text>
                          <Text fontSize="11px" color={themeColors.text.muted} lineClamp={1} maxW="360px">
                            {p.description || 'No description provided'}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>

                    <Box as="td" p="12px 16px">
                      <Box
                        display="inline-block"
                        fontSize="11px"
                        fontWeight="600"
                        px={2}
                        py={0.5}
                        borderRadius="4px"
                        bg="#f1f5f9"
                        color={themeColors.text.secondary}
                        fontFamily="monospace"
                      >
                        {p.prefix}
                      </Box>
                    </Box>

                    <Box as="td" p="12px 16px">
                      {p.venue ? (
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
                          Venue: {p.venueName || venueNameMap.get(p.venue) || (p.venue.length > 8 ? `${p.venue.slice(0, 8)}...` : p.venue)}
                        </Box>
                      ) : p.entity ? (
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
                          Entity: {p.entityName || entityNameMap.get(p.entity) || (p.entity.length > 8 ? `${p.entity.slice(0, 8)}...` : p.entity)}
                        </Box>
                      ) : (
                        <Text fontSize="12px" color={themeColors.text.muted}>
                          —
                        </Text>
                      )}
                    </Box>

                    <Box as="td" p="12px 16px" fontSize="12px" color={themeColors.text.secondary}>
                      {p.modified ? new Date(p.modified * 1000).toLocaleDateString() : '—'}
                    </Box>

                    <Box as="td" p="12px 16px" textAlign="right">
                      <HStack gap={1} justify="flex-end">
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor={themeColors.panel.border}
                          onClick={() => handleOpenEditModal(p)}
                        >
                          <Icon name="edit" size={12} />
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor={themeColors.panel.border}
                          onClick={() => handleDuplicateProfile(p)}
                          title="Duplicate variable"
                        >
                          <Icon name="copy" size={12} />
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor={themeColors.panel.border}
                          color="#dc2626"
                          _hover={{ bg: '#fee2e2' }}
                          onClick={() => handleDeleteProfile(p.id)}
                          title="Delete variable"
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

      {/* Modal for Creating & Quick-Editing Profile */}
      <CreateProfileModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProfile}
        initialProfile={editingModalProfile}
      />
    </Box>
  );
};

export default ConfigurationProfilesPage;

