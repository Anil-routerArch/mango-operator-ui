import React, { useState } from 'react';
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
import { useConfigurationUiStore } from '@/stores/configurationUiStore';
import { MOCK_PROFILES, MOCK_CONFIGURATIONS } from './mockData/mockConfigurations';
import { CreateProfileModal } from './components/CreateProfileModal';
import { ProfileEditorPage } from './ProfileEditorPage';
import type { ConfigurationProfile } from './types/configuration';

export interface ConfigurationProfilesPageProps {
  embedded?: boolean;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  onNavigateToConfig?: (configId?: string) => void;
}

export const ConfigurationProfilesPage: React.FC<ConfigurationProfilesPageProps> = ({
  embedded = false,
  isCreateOpen = false,
  onCloseCreate,
  onNavigateToConfig,
}) => {
  const { selectedProfileId, setSelectedProfileId } = useConfigurationUiStore();
  const [profiles, setProfiles] = useState<ConfigurationProfile[]>(MOCK_PROFILES);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');

  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const [editingModalProfile, setEditingModalProfile] = useState<ConfigurationProfile | null>(null);

  const isModalOpen = internalModalOpen || Boolean(isCreateOpen);

  const handleOpenCreateModal = () => {
    setEditingModalProfile(null);
    setInternalModalOpen(true);
  };

  const handleCloseModal = () => {
    setInternalModalOpen(false);
    setEditingModalProfile(null);
    onCloseCreate?.();
  };

  const handleSaveProfile = (savedProfile: ConfigurationProfile) => {
    setProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === savedProfile.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedProfile;
        return next;
      }
      return [savedProfile, ...prev];
    });
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
          onSelectConfig={(cfgId) => {
            setSelectedProfileId(null);
            onNavigateToConfig?.(cfgId);
          }}
        />
      );
    }
  }

  const handleOpenEditModal = (profile: ConfigurationProfile) => {
    setEditingModalProfile(profile);
    setInternalModalOpen(true);
  };

  const handleDeleteProfile = (profileId: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  const handleDuplicateProfile = (profile: ConfigurationProfile) => {
    const duplicated: ConfigurationProfile = {
      ...profile,
      id: `prof-${Date.now().toString(36)}`,
      name: `${profile.name} (Copy)`,
      configurations: [],
      created: Math.floor(Date.now() / 1000),
      modified: Math.floor(Date.now() / 1000),
    };
    setProfiles([duplicated, ...profiles]);
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
      (scopeFilter === 'global' && !p.entity && !p.venue) ||
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
          subtitle="Reusable variable blocks (radios, SSIDs, VLANs) in OWPROV scoped globally, per property, or per venue."
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
            <Text fontSize="12px" color={themeColors.text.secondary}>Total Profiles (Variables)</Text>
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
            <Text fontSize="12px" color={themeColors.text.secondary}>SSID Interface Profiles</Text>
            <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>{ssidProfilesCount}</Text>
          </Box>
        </Flex>

        <Flex flex="1" minW="200px" border="1px solid" borderColor={themeColors.kpi.border} borderRadius="6px" bg="#ffffff" p="14px 18px" align="center" gap={4}>
          <Icon name="link" size={26} color="#7c3aed" />
          <Box>
            <Text fontSize="12px" color={themeColors.text.secondary}>Referenced in Configs</Text>
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
              placeholder="Search profiles by name, prefix, or description..."
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
              ]}
            />
          </Box>

          <Box w="180px">
            <SelectDropdown
              value={scopeFilter}
              onChange={setScopeFilter}
              options={[
                { value: 'all', label: 'All Scopes' },
                { value: 'global', label: 'Global Scope' },
                { value: 'property', label: 'Property Scope' },
                { value: 'venue', label: 'Venue Scope' },
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
                Profile Name
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Section Prefix
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Inheritance Scope
              </Box>
              <Box as="th" p="12px 16px" textAlign="left" fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                Referenced By
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
            {filteredProfiles.length === 0 ? (
              <Box as="tr">
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center' }}>
                  <Text fontSize="13px" color={themeColors.text.muted}>
                    No configuration profiles found matching filters.
                  </Text>
                </td>
              </Box>
            ) : (
              filteredProfiles.map((p) => {
                const configNames = p.configurations
                  .map((id) => MOCK_CONFIGURATIONS.find((c) => c.id === id)?.name || id)
                  .join(', ');

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
                          Venue: {p.venueName || 'Building B'}
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
                          Property: {p.entityName || 'Sunrise Apartments'}
                        </Box>
                      ) : (
                        <Box
                          display="inline-block"
                          fontSize="11px"
                          fontWeight="600"
                          px={2}
                          py={0.5}
                          borderRadius="4px"
                          bg="#f1f5f9"
                          color={themeColors.text.secondary}
                        >
                          Global
                        </Box>
                      )}
                    </Box>

                    <Box as="td" p="12px 16px">
                      {p.configurations.length > 0 ? (
                        <HStack gap={1.5}>
                          <Box
                            fontSize="11px"
                            fontWeight="600"
                            px={2}
                            py={0.5}
                            borderRadius="10px"
                            bg="#eff6ff"
                            color={themeColors.brand.accent}
                            title={configNames}
                          >
                            {p.configurations.length} {p.configurations.length === 1 ? 'Config' : 'Configs'}
                          </Box>
                        </HStack>
                      ) : (
                        <Text fontSize="11px" color={themeColors.text.muted}>
                          Unused
                        </Text>
                      )}
                    </Box>

                    <Box as="td" p="12px 16px" fontSize="12px" color={themeColors.text.secondary}>
                      {new Date(p.modified * 1000).toLocaleDateString()}
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
                          title="Duplicate profile"
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
                          title="Delete profile"
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
