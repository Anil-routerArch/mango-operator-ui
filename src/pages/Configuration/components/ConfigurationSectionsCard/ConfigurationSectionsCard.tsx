import React, { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { PlatformType } from '../../types/configuration';
import type {
  SubsectionKey,
  ConfigurationSectionsState,
} from './types';
import { AddSubsectionModal } from './AddSubsectionModal';
import { ExpertModeModal } from './ExpertModeModal';
import { ImportConfigModal } from './ImportConfigModal';
import { ViewJsonConfigModal } from './ViewJsonConfigModal';
import { ViewWarningsModal } from './ViewWarningsModal';
import { GlobalsSection } from './GlobalsSection/index';
import { RadiosSection } from './RadiosSection/index';
import { InterfacesSection } from './InterfacesSection/index';
import { ServicesSection } from './ServicesSection/index';
import { MetricsSection } from './MetricsSection/index';
import { UnitSection } from './UnitSection/index';
import { ThirdPartySection } from './ThirdPartySection/index';

import { getInitialSectionsState, compileStateToUCentralJson, parseUCentralJsonToSectionsState } from './utils';

interface ConfigurationSectionsCardProps {
  platform?: PlatformType;
  initialJson?: string;
  initialState?: Partial<ConfigurationSectionsState>;
  onStateChange?: (state: ConfigurationSectionsState, compiledJson: string) => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const ConfigurationSectionsCard: React.FC<ConfigurationSectionsCardProps> = ({
  initialJson,
  initialState,
  onStateChange,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const [sectionsState, setSectionsState] = useState<ConfigurationSectionsState>(() => {
    if (initialJson && initialJson.trim()) {
      return parseUCentralJsonToSectionsState(initialJson);
    }
    return {
      ...getInitialSectionsState(),
      ...initialState,
    };
  });

  const [activeTab, setActiveTab] = useState<SubsectionKey | null>(
    () => sectionsState.activeSections[0] ?? null
  );

  // Sync state if initialJson changes externally without cascading effect render
  const [prevInitialJson, setPrevInitialJson] = useState(initialJson);
  if (initialJson !== prevInitialJson) {
    setPrevInitialJson(initialJson);
    if (initialJson && initialJson.trim()) {
      const next = parseUCentralJsonToSectionsState(initialJson);
      setSectionsState(next);
      setActiveTab((prev) => (prev && next.activeSections.includes(prev) ? prev : (next.activeSections[0] ?? null)));
    }
  }

  const currentTab =
    activeTab && sectionsState.activeSections.includes(activeTab)
      ? activeTab
      : (sectionsState.activeSections[0] ?? null);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExpertOpen, setIsExpertOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isViewJsonOpen, setIsViewJsonOpen] = useState(false);
  const [isWarningsOpen, setIsWarningsOpen] = useState(false);

  // Computed JSON
  const compiledJson = useMemo(() => compileStateToUCentralJson(sectionsState), [sectionsState]);

  // Detected warnings
  const warnings = useMemo(() => {
    const list: string[] = [];
    if (sectionsState.activeSections.includes('interfaces')) {
      const allSsids = sectionsState.interfaces.interfaces.flatMap((i) => i.ssids);
      if (allSsids.length === 0) {
        list.push('Interfaces section is active but no SSIDs are configured.');
      }
    }
    if (
      sectionsState.activeSections.includes('radios') &&
      sectionsState.radios.bands.length === 0
    ) {
      list.push('Radios section is active but no radio bands are configured.');
    }
    return list;
  }, [sectionsState]);

  const updateState = (next: ConfigurationSectionsState) => {
    setSectionsState(next);
    const json = compileStateToUCentralJson(next);
    onStateChange?.(next, json);
  };

  const handleAddSection = (key: SubsectionKey) => {
    if (!sectionsState.activeSections.includes(key)) {
      const next: ConfigurationSectionsState = {
        ...sectionsState,
        activeSections: [...sectionsState.activeSections, key],
      };
      updateState(next);
      setActiveTab(key);
    }
  };

  const handleDeleteSection = (key: SubsectionKey) => {
    const filtered = sectionsState.activeSections.filter((k) => k !== key);
    const next: ConfigurationSectionsState = {
      ...sectionsState,
      activeSections: filtered,
    };
    updateState(next);
    if (activeTab === key) {
      setActiveTab(filtered[0] ?? null);
    }
  };

  const handleApplyImportedJson = (importedJsonStr: string) => {
    try {
      const next = parseUCentralJsonToSectionsState(importedJsonStr);
      updateState(next);
      if (next.activeSections.length > 0) {
        setActiveTab(next.activeSections[0]);
      }
    } catch {
      // invalid json handled by modal
    }
  };

  return (
    <Box
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="8px"
      bg="#ffffff"
      overflow="hidden"
      boxShadow="0 1px 3px rgba(0,0,0,0.05)"
    >
      {/* Top Header Bar matching OWPROV screenshot */}
      <Flex
        px={4}
        py={2.5}
        align="center"
        justify="space-between"
        bg="linear-gradient(180deg, #f0f7ff 0%, #e6f1fe 100%)"
        borderBottom="1px solid"
        borderColor="#cbd5e1"
      >
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
          Configuration Sections
        </Text>

        {/* Circular Action Icons matching screenshot */}
        <HStack gap={1.5}>
          {/* Warnings indicator button */}
          <Box
            as="button"
            w="28px"
            h="28px"
            borderRadius="50%"
            bg={warnings.length > 0 ? '#fef08a' : '#bbf7d0'}
            color={warnings.length > 0 ? '#854d0e' : '#15803d'}
            display="grid"
            placeItems="center"
            cursor="pointer"
            onClick={() => setIsWarningsOpen(true)}
            title={warnings.length > 0 ? `${warnings.length} Warnings` : 'All checks passed'}
          >
            <Icon name={warnings.length > 0 ? 'alertTriangle' : 'check'} size={14} />
          </Box>

          {/* Validation Status (Green check) */}
          <Box
            w="28px"
            h="28px"
            borderRadius="50%"
            bg="#bbf7d0"
            color="#15803d"
            display="grid"
            placeItems="center"
            title="Valid configuration"
          >
            <Icon name="check" size={14} />
          </Box>

          {/* Expert Mode Button (Purple Beaker) */}
          <Box
            as="button"
            w="28px"
            h="28px"
            borderRadius="50%"
            bg="#8b5cf6"
            color="#ffffff"
            display="grid"
            placeItems="center"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            _hover={{ opacity: 0.9 }}
            onClick={() => !disabled && setIsExpertOpen(true)}
            title="Expert Mode (Raw JSON)"
          >
            <Icon name="flask" size={14} />
          </Box>

          {/* Import Configuration Button (Blue Upload) */}
          <Box
            as="button"
            w="28px"
            h="28px"
            borderRadius="50%"
            bg="#2563eb"
            color="#ffffff"
            display="grid"
            placeItems="center"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            _hover={{ opacity: 0.9 }}
            onClick={() => !disabled && setIsImportOpen(true)}
            title="Import configuration from file"
          >
            <Icon name="upload" size={14} />
          </Box>

          {/* Add Subsection Button (Blue Plus) */}
          <Box
            as="button"
            w="28px"
            h="28px"
            borderRadius="50%"
            bg="#2563eb"
            color="#ffffff"
            display="grid"
            placeItems="center"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            _hover={{ opacity: 0.9 }}
            onClick={() => !disabled && setIsAddOpen(true)}
            title="Add Subsection"
          >
            <Icon name="plus" size={14} />
          </Box>

          {/* View JSON / Fullscreen Button (ArrowsOut) */}
          <Box
            as="button"
            w="28px"
            h="28px"
            borderRadius="4px"
            bg="#ffffff"
            border="1px solid"
            borderColor="#cbd5e1"
            color={themeColors.text.title}
            display="grid"
            placeItems="center"
            cursor="pointer"
            _hover={{ bg: '#f8fafc' }}
            onClick={() => setIsViewJsonOpen(true)}
            title="View Configuration JSON"
          >
            <Icon name="maximize" size={14} />
          </Box>
        </HStack>
      </Flex>

      {/* Horizontal Subsection Tabs */}
      {sectionsState.activeSections.length > 0 && (
        <Box px={4} pt={2} bg="#f8fafc" borderBottom="1px solid" borderColor={themeColors.panel.divider}>
          <HStack gap={1} overflowX="auto">
            {sectionsState.activeSections.map((secKey) => {
              const isActive = currentTab === secKey;
              const labelMap: Record<SubsectionKey, string> = {
                globals: 'Globals',
                unit: 'Unit',
                metrics: 'Metrics',
                services: 'Services',
                radios: 'Radios',
                interfaces: 'Interfaces',
                'third-party': 'Third Party',
              };

              return (
                <Box
                  key={secKey}
                  as="button"
                  px={3.5}
                  py={2}
                  fontSize="12px"
                  fontWeight="700"
                  cursor="pointer"
                  borderTop="2px solid"
                  borderColor={isActive ? themeColors.brand.accent : 'transparent'}
                  color={isActive ? themeColors.brand.accent : themeColors.text.secondary}
                  bg={isActive ? '#ffffff' : 'transparent'}
                  borderRadius="4px 4px 0 0"
                  borderLeft={isActive ? '1px solid' : 'none'}
                  borderRight={isActive ? '1px solid' : 'none'}
                  borderLeftColor={themeColors.panel.divider}
                  borderRightColor={themeColors.panel.divider}
                  onClick={() => setActiveTab(secKey)}
                >
                  {labelMap[secKey]}
                </Box>
              );
            })}
          </HStack>
        </Box>
      )}

      {/* Active Subsection Body */}
      <Box p={4} bg="#f8fafc">
        {sectionsState.activeSections.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={10}
            px={4}
            bg="#ffffff"
            borderRadius="6px"
            border="1px dashed"
            borderColor="#cbd5e1"
            textAlign="center"
          >
            <Box
              w="44px"
              h="44px"
              borderRadius="50%"
              bg="#eff6ff"
              color="#2563eb"
              display="grid"
              placeItems="center"
              mb={3}
            >
              <Icon name="sliders" size={22} />
            </Box>
            <Text fontSize="15px" fontWeight="700" color={themeColors.text.title} mb={1}>
              No Configuration Subsections Added
            </Text>
            <Text fontSize="13px" color={themeColors.text.secondary} maxW="460px" mb={4}>
              Select the subsections you want to include in this configuration (Globals, Radios, Interfaces, Services, Unit, Metrics, or Third Party), or import a file.
            </Text>
            <HStack gap={3}>
              <Box
                as="button"
                display="inline-flex"
                alignItems="center"
                gap={2}
                px={4}
                py={2}
                borderRadius="6px"
                bg="#2563eb"
                color="#ffffff"
                fontSize="13px"
                fontWeight="600"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                _hover={{ bg: '#1d4ed8' }}
                onClick={() => !disabled && setIsAddOpen(true)}
              >
                <Icon name="plus" size={14} />
                Add Subsection
              </Box>
              <Box
                as="button"
                display="inline-flex"
                alignItems="center"
                gap={2}
                px={3.5}
                py={2}
                borderRadius="6px"
                border="1px solid"
                borderColor="#cbd5e1"
                bg="#ffffff"
                color={themeColors.text.title}
                fontSize="13px"
                fontWeight="600"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                _hover={{ bg: '#f8fafc' }}
                onClick={() => !disabled && setIsImportOpen(true)}
              >
                <Icon name="upload" size={14} />
                Import from File
              </Box>
            </HStack>
          </Flex>
        ) : (
          <>
            {currentTab === 'globals' && (
              <GlobalsSection
                data={sectionsState.globals}
                onChange={(globals) => updateState({ ...sectionsState, globals })}
                onDeleteSection={() => handleDeleteSection('globals')}
                disabled={disabled}
                isDefaultConfig={isDefaultConfig}
              />
            )}

            {currentTab === 'radios' && (
              <RadiosSection
                data={sectionsState.radios}
                onChange={(radios) => updateState({ ...sectionsState, radios })}
                onDeleteSection={() => handleDeleteSection('radios')}
                disabled={disabled}
                isDefaultConfig={isDefaultConfig}
              />
            )}

            {currentTab === 'interfaces' && (
              <InterfacesSection
                data={sectionsState.interfaces}
                onChange={(interfaces) => updateState({ ...sectionsState, interfaces })}
                onDeleteSection={() => handleDeleteSection('interfaces')}
                disabled={disabled}
                isDefaultConfig={isDefaultConfig}
              />
            )}

            {currentTab === 'services' && (
              <ServicesSection
                data={sectionsState.services}
                onChange={(services) => updateState({ ...sectionsState, services })}
                onDeleteSection={() => handleDeleteSection('services')}
                disabled={disabled}
                isDefaultConfig={isDefaultConfig}
              />
            )}

            {currentTab === 'metrics' && (
              <MetricsSection
                data={sectionsState.metrics}
                onChange={(metrics) => updateState({ ...sectionsState, metrics })}
                onDeleteSection={() => handleDeleteSection('metrics')}
                disabled={disabled}
                isDefaultConfig={isDefaultConfig}
              />
            )}

            {currentTab === 'unit' && (
              <UnitSection
                data={sectionsState.unit}
                onChange={(unit) => updateState({ ...sectionsState, unit })}
                onDeleteSection={() => handleDeleteSection('unit')}
                disabled={disabled}
                isDefaultConfig={isDefaultConfig}
              />
            )}

            {currentTab === 'third-party' && (
              <ThirdPartySection
                data={sectionsState.thirdParty}
                onChange={(thirdParty) => updateState({ ...sectionsState, thirdParty })}
                onDeleteSection={() => handleDeleteSection('third-party')}
                disabled={disabled}
                isDefaultConfig={isDefaultConfig}
              />
            )}
          </>
        )}
      </Box>

      {/* Modals */}
      <AddSubsectionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        activeSections={sectionsState.activeSections}
        onAddSection={handleAddSection}
      />

      <ExpertModeModal
        isOpen={isExpertOpen}
        onClose={() => setIsExpertOpen(false)}
        currentJson={compiledJson}
        onSaveJson={handleApplyImportedJson}
      />

      <ImportConfigModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportJson={handleApplyImportedJson}
      />

      <ViewJsonConfigModal
        isOpen={isViewJsonOpen}
        onClose={() => setIsViewJsonOpen(false)}
        compiledJson={compiledJson}
      />

      <ViewWarningsModal
        isOpen={isWarningsOpen}
        onClose={() => setIsWarningsOpen(false)}
        warnings={warnings}
      />
    </Box>
  );
};
