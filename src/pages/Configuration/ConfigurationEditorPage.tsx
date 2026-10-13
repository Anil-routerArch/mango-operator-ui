import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import { InheritanceBanner } from './components/InheritanceBanner';
import { SectionSidebar } from './components/SectionSidebar';
import { RadiosSectionEditor } from './components/RadiosSectionEditor';
import {
  GeneralSectionEditor,
  InterfacesSectionEditor,
  ServicesSectionEditor,
  MetricsSectionEditor,
  UnitSectionEditor,
} from './components/OtherSectionEditors';
import { ConfigurationSummaryCard } from './components/ConfigurationSummaryCard';
import { DiffPreviewModal } from './components/DiffPreviewModal';
import { DeployConfigModal } from './components/DeployConfigModal';
import {
  MOCK_PROPERTIES_LIST,
  MOCK_VENUES_LIST,
} from './mockData/mockConfigurations';
import type {
  DeviceConfiguration,
  ConfigSectionType,
  RadioBandConfig,
} from './types/configuration';

interface ConfigurationEditorPageProps {
  config: DeviceConfiguration;
  isNewConfig?: boolean;
  onBack: () => void;
  onSaveSuccess?: (savedConfig: DeviceConfiguration) => void;
  onViewProfile?: (profileId: string) => void;
  onManageProfiles?: () => void;
}

export const ConfigurationEditorPage: React.FC<ConfigurationEditorPageProps> = ({
  config: initialConfig,
  isNewConfig = false,
  onBack,
  onSaveSuccess,
  onViewProfile,
  onManageProfiles,
}) => {
  const [config, setConfig] = useState<DeviceConfiguration>(initialConfig);
  const [activeTab, setActiveTab] = useState<'editor' | 'raw_json' | 'assignments' | 'history'>('editor');
  const [activeSection, setActiveSection] = useState<ConfigSectionType>('radios');
  const [isDiffOpen, setIsDiffOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Scope editing
  const [scopeType, setScopeType] = useState<'global' | 'property' | 'venue'>(
    config.venue ? 'venue' : config.entity ? 'property' : 'global'
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    config.entity || 'prop-sunrise-001'
  );
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    config.venue || '2211d28a-a985-434a-ad68-ca5ac4559852'
  );

  const handleUpdateBands = (updatedBands: RadioBandConfig[]) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        radios: { bands: updatedBands },
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleUpdateConfig = (updated: DeviceConfiguration) => {
    setConfig(updated);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    const prop = MOCK_PROPERTIES_LIST.find((p) => p.id === selectedPropertyId);
    const ven = MOCK_VENUES_LIST.find((v) => v.id === selectedVenueId);

    // Build list of referenced variable UUIDs
    const referencedVariables: string[] = [];
    config.sections.radios.bands.forEach((b) => {
      if (b.profileId && !referencedVariables.includes(b.profileId)) {
        referencedVariables.push(b.profileId);
      }
    });
    config.sections.interfaces.ssids.forEach((s) => {
      if (s.profileId && !referencedVariables.includes(s.profileId)) {
        referencedVariables.push(s.profileId);
      }
    });

    const saved: DeviceConfiguration = {
      ...config,
      modified: Math.floor(Date.now() / 1000),
      variables: referencedVariables,
      entity: scopeType === 'global' ? '' : selectedPropertyId,
      entityName: scopeType === 'global' ? 'Global Scope' : prop?.name,
      venue: scopeType === 'venue' ? selectedVenueId : '',
      venueName: scopeType === 'venue' ? ven?.name : '',
      status: isNewConfig ? 'active' : config.status,
    };

    setConfig(saved);
    setHasUnsavedChanges(false);
    if (onSaveSuccess) {
      onSaveSuccess(saved);
    }
  };

  const filteredVenues = MOCK_VENUES_LIST.filter(
    (v) => v.propertyId === selectedPropertyId
  );

  // Compile full uCentral configuration JSON representation
  const compiledJson = {
    uuid: config.id,
    name: config.name,
    description: config.description,
    devicetypes: config.devicetypes,
    devicerules: config.devicerules,
    configuration: [
      {
        name: 'Radios-Block',
        description: 'Auto-compiled radio configuration with profiles and local overrides',
        weight: 1,
        configuration: {
          radios: config.sections.radios.bands.map((b) => {
            const radioPayload: Record<string, unknown> = {};
            if (b.profileId) {
              radioPayload.__variableBlock = [b.profileId];
            }
            // Add local overrides
            b.fields
              .filter((f) => f.overridden)
              .forEach((f) => {
                radioPayload[f.key] = f.effectiveValue;
              });
            return radioPayload;
          }),
        },
      },
      {
        name: 'Interface-SSID-Block',
        description: 'Dynamic SSIDs referencing variable blocks',
        weight: 1,
        configuration: {
          interfaces: [
            {
              ssids: config.sections.interfaces.ssids.map((s) => {
                const ssidPayload: Record<string, unknown> = {};
                if (s.profileId) {
                  ssidPayload.__variableBlock = [s.profileId];
                }
                if (s.overridden) {
                  ssidPayload.name = s.ssid;
                  ssidPayload.vlan = s.vlan;
                }
                return ssidPayload;
              }),
            },
          ],
        },
      },
    ],
  };

  return (
    <Box pb={24}>
      {/* Top Breadcrumb & Actions Bar */}
      <Flex justify="space-between" align="center" mb={2}>
        <HStack gap={2} fontSize="12px" color={themeColors.text.muted}>
          <Text cursor="pointer" _hover={{ color: themeColors.brand.accent }} onClick={onBack}>
            Network
          </Text>
          <Text>/</Text>
          <Text cursor="pointer" _hover={{ color: themeColors.brand.accent }} onClick={onBack}>
            Configurations
          </Text>
          <Text>/</Text>
          <Text color={themeColors.text.primary} fontWeight="600">
            {isNewConfig ? 'New Configuration' : config.name}
          </Text>
        </HStack>

        <HStack gap={2.5}>
          <Button
            size="sm"
            bg={themeColors.brand.accent}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.accentHover }}
            onClick={handleSave}
            disabled={!hasUnsavedChanges && !isNewConfig}
          >
            {isNewConfig ? 'Create Configuration' : 'Save Changes'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            borderColor={themeColors.brand.accent}
            color={themeColors.brand.accent}
            bg="#ffffff"
            _hover={{ bg: '#eff6ff' }}
            onClick={() => setIsDiffOpen(true)}
          >
            Compare changes
          </Button>

          <Button
            size="sm"
            variant="outline"
            borderColor="#16a34a"
            color="#16a34a"
            bg="#ffffff"
            _hover={{ bg: '#f0fdf4' }}
            onClick={() => setIsDeployOpen(true)}
          >
            Deploy
          </Button>
        </HStack>
      </Flex>

      {/* Header Title & Metadata */}
      <Box mb={4}>
        <Flex align="center" gap={3} mb={1}>
          <Text fontSize="22px" fontWeight="700" color={themeColors.text.title}>
            {config.name}
          </Text>
          <HStack
            gap={1.5}
            px={2.5}
            py={0.5}
            borderRadius="12px"
            bg="#f0fdf4"
            border="1px solid"
            borderColor="#bbf7d0"
            color="#15803d"
            fontSize="12px"
            fontWeight="600"
          >
            <Icon name="check" size={12} color="#15803d" />
            <Text>{config.status === 'active' ? 'Active' : 'Draft'}</Text>
          </HStack>
          <Box fontSize="12px" color={themeColors.text.muted}>
            Version {config.version}
          </Box>
        </Flex>

        <Text fontSize="13px" color={themeColors.text.secondary}>
          {config.description}
        </Text>
      </Box>

      {/* Scope & Device Rules Settings */}
      <Box
        bg="#ffffff"
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="6px"
        p={4}
        mb={5}
      >
        <Flex gap={4} wrap="wrap" align="center">
          <Box flex="1" minW="180px">
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>
              Inheritance Scope
            </Text>
            <SelectDropdown
              value={scopeType}
              onChange={(val) => {
                setScopeType(val as 'global' | 'property' | 'venue');
                setHasUnsavedChanges(true);
              }}
              options={[
                { value: 'global', label: 'Global Scope' },
                { value: 'property', label: 'Property Scope' },
                { value: 'venue', label: 'Venue Scope' },
              ]}
            />
          </Box>

          {scopeType !== 'global' && (
            <Box flex="1" minW="200px">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>
                Property (Entity)
              </Text>
              <SelectDropdown
                value={selectedPropertyId}
                onChange={(val) => {
                  setSelectedPropertyId(val);
                  setHasUnsavedChanges(true);
                }}
                options={MOCK_PROPERTIES_LIST.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Box>
          )}

          {scopeType === 'venue' && (
            <Box flex="1" minW="200px">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>
                Venue
              </Text>
              <SelectDropdown
                value={selectedVenueId}
                onChange={(val) => {
                  setSelectedVenueId(val);
                  setHasUnsavedChanges(true);
                }}
                options={filteredVenues.map((v) => ({ value: v.id, label: v.name }))}
              />
            </Box>
          )}

          <Box w="140px">
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>
              Firmware Upgrade
            </Text>
            <SelectDropdown
              value={config.devicerules?.firmwareUpgrade || 'inherit'}
              onChange={(val) => {
                setConfig({
                  ...config,
                  devicerules: { ...config.devicerules, firmwareUpgrade: val as 'inherit' | 'yes' | 'no' },
                });
                setHasUnsavedChanges(true);
              }}
              options={[
                { value: 'inherit', label: 'inherit' },
                { value: 'yes', label: 'yes' },
                { value: 'no', label: 'no' },
              ]}
            />
          </Box>

          <Box w="120px">
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.muted} mb={1}>
              RRM Rule
            </Text>
            <SelectDropdown
              value={config.devicerules?.rrm || 'inherit'}
              onChange={(val) => {
                setConfig({
                  ...config,
                  devicerules: { ...config.devicerules, rrm: val as 'inherit' | 'yes' | 'no' },
                });
                setHasUnsavedChanges(true);
              }}
              options={[
                { value: 'inherit', label: 'inherit' },
                { value: 'yes', label: 'yes' },
                { value: 'no', label: 'no' },
              ]}
            />
          </Box>
        </Flex>
      </Box>

      {/* Inheritance Banner Flowchart */}
      <Box mb={5}>
        <InheritanceBanner currentScope={scopeType} />
      </Box>

      {/* Tabs: Editor | Raw JSON | Assignments | Deployment History */}
      <HStack gap={6} borderBottom="1px solid" borderColor={themeColors.panel.divider} mb={5}>
        <Text
          fontSize="13px"
          fontWeight="600"
          pb={2.5}
          borderBottom="2px solid"
          borderColor={activeTab === 'editor' ? themeColors.brand.accent : 'transparent'}
          color={activeTab === 'editor' ? themeColors.brand.accent : themeColors.text.secondary}
          cursor="pointer"
          onClick={() => setActiveTab('editor')}
        >
          Section Editor
        </Text>
        <Text
          fontSize="13px"
          fontWeight="600"
          pb={2.5}
          borderBottom="2px solid"
          borderColor={activeTab === 'raw_json' ? themeColors.brand.accent : 'transparent'}
          color={activeTab === 'raw_json' ? themeColors.brand.accent : themeColors.text.secondary}
          cursor="pointer"
          onClick={() => setActiveTab('raw_json')}
        >
          Compiled uCentral JSON (__variableBlock)
        </Text>
        <Text
          fontSize="13px"
          fontWeight="600"
          pb={2.5}
          borderBottom="2px solid"
          borderColor={activeTab === 'assignments' ? themeColors.brand.accent : 'transparent'}
          color={activeTab === 'assignments' ? themeColors.brand.accent : themeColors.text.secondary}
          cursor="pointer"
          onClick={() => setActiveTab('assignments')}
        >
          Current Assignments ({config.assignments.length})
        </Text>
        <Text
          fontSize="13px"
          fontWeight="600"
          pb={2.5}
          borderBottom="2px solid"
          borderColor={activeTab === 'history' ? themeColors.brand.accent : 'transparent'}
          color={activeTab === 'history' ? themeColors.brand.accent : themeColors.text.secondary}
          cursor="pointer"
          onClick={() => setActiveTab('history')}
        >
          Deployment Audit Log
        </Text>
      </HStack>

      {/* Tab: Editor */}
      {activeTab === 'editor' && (
        <Flex gap={5} align="flex-start">
          {/* Left: 6 uCentral Sections Sidebar */}
          <SectionSidebar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
          />

          {/* Center: Active Section Editor */}
          {activeSection === 'radios' && (
            <RadiosSectionEditor
              bands={config.sections.radios.bands}
              onUpdateBands={handleUpdateBands}
              onViewProfile={onViewProfile}
            />
          )}
          {activeSection === 'general' && (
            <GeneralSectionEditor config={config} onUpdate={handleUpdateConfig} />
          )}
          {activeSection === 'interfaces' && (
            <InterfacesSectionEditor config={config} onUpdate={handleUpdateConfig} />
          )}
          {activeSection === 'services' && (
            <ServicesSectionEditor config={config} onUpdate={handleUpdateConfig} />
          )}
          {activeSection === 'metrics' && (
            <MetricsSectionEditor config={config} onUpdate={handleUpdateConfig} />
          )}
          {activeSection === 'unit' && (
            <UnitSectionEditor config={config} onUpdate={handleUpdateConfig} />
          )}

          {/* Right: Summary, Profiles Used & Assignments */}
          <ConfigurationSummaryCard
            config={config}
            onManageProfiles={onManageProfiles}
          />
        </Flex>
      )}

      {/* Tab: Raw JSON Preview */}
      {activeTab === 'raw_json' && (
        <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
          <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={2}>
            Compiled OWPROV Configuration Data Structure
          </Text>
          <Text fontSize="12px" color={themeColors.text.muted} mb={4}>
            Notice how reusable profiles are embedded as <Text as="span" fontFamily="monospace" color="#0284c7">{'{"__variableBlock": ["<uuid>"]}'}</Text> along with local overrides.
          </Text>
          <Box
            as="pre"
            bg="#0f172a"
            color="#38bdf8"
            p={4}
            borderRadius="6px"
            fontSize="12px"
            fontFamily="monospace"
            overflowX="auto"
            lineHeight="1.5"
          >
            {JSON.stringify(compiledJson, null, 2)}
          </Box>
        </Box>
      )}

      {/* Tab: Assignments */}
      {activeTab === 'assignments' && (
        <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title} mb={3}>
            Assigned Scopes ({config.assignments.length})
          </Text>
          <VStack gap={2} align="stretch">
            {config.assignments.map((asgn) => (
              <Flex key={asgn.id} justify="space-between" align="center" p={3} bg="#f8fafc" borderRadius="4px" border="1px solid" borderColor={themeColors.panel.divider}>
                <HStack gap={3}>
                  <Icon name={asgn.type === 'property' ? 'building' : asgn.type === 'venue' ? 'landmark' : 'device'} size={18} color={themeColors.brand.accent} />
                  <Text fontWeight="600" fontSize="13px">{asgn.name}</Text>
                </HStack>
                <Box fontSize="11px" fontWeight="600" px={2} py={0.5} borderRadius="4px" bg="#e2e8f0" textTransform="uppercase">
                  {asgn.type}
                </Box>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}

      {/* Tab: History */}
      {activeTab === 'history' && (
        <Box bg="#ffffff" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" p={5}>
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title} mb={3}>
            Deployment Audit Log
          </Text>
          <VStack gap={2} align="stretch" fontSize="12px">
            <Flex justify="space-between" p={3} bg="#f0fdf4" borderRadius="4px" border="1px solid" borderColor="#bbf7d0">
              <HStack gap={2}>
                <Icon name="check" size={14} color="#15803d" />
                <Text fontWeight="600">Version {config.version} Deployed Successfully</Text>
              </HStack>
              <Text color={themeColors.text.muted}>18 minutes ago · 3 APs online</Text>
            </Flex>
          </VStack>
        </Box>
      )}

      {/* Sticky Bottom Action Bar */}
      <Box
        position="fixed"
        bottom={0}
        left={{ base: 0, md: '216px' }}
        right={0}
        bg="#ffffff"
        borderTop="1px solid"
        borderColor={themeColors.panel.border}
        py={3}
        px={6}
        boxShadow="0 -4px 6px -1px rgba(0,0,0,0.05)"
        zIndex={100}
      >
        <Flex justify="space-between" align="center">
          <HStack gap={3}>
            <Box color={themeColors.brand.accent}>
              <Icon name="info" size={20} color={themeColors.brand.accent} />
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color={themeColors.text.title}>
                Effective change preview
              </Text>
              <Text fontSize="11px" color={themeColors.text.secondary}>
                The configuration combines inherited profile values with local overrides. Saving updates the configuration template; deployment pushes via OWGW WebSocket.
              </Text>
            </Box>
          </HStack>

          <HStack gap={3}>
            <Button
              size="sm"
              variant="outline"
              borderColor={themeColors.brand.accent}
              color={themeColors.brand.accent}
              bg="#ffffff"
              _hover={{ bg: '#eff6ff' }}
              onClick={() => setIsDiffOpen(true)}
            >
              Compare changes
            </Button>
            <Button
              size="sm"
              bg={themeColors.brand.accent}
              color="#ffffff"
              _hover={{ bg: themeColors.brand.accentHover }}
              onClick={() => setIsDeployOpen(true)}
            >
              Preview affected devices
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Modals */}
      <DiffPreviewModal
        isOpen={isDiffOpen}
        onClose={() => setIsDiffOpen(false)}
        configName={config.name}
      />
      <DeployConfigModal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        config={config}
        onConfirmDeploy={() => {
          setConfig((prev) => ({ ...prev, version: prev.version + 1, updatedAt: 'Just now' }));
        }}
      />
    </Box>
  );
};
