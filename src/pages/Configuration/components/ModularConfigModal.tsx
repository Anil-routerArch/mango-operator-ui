import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import { useGetEntities, useGetVenues } from '@/api';
import type { DeviceConfiguration, PlatformType } from '../types/configuration';
import {
  ConfigurationSectionsCard,
} from './ConfigurationSectionsCard';
import {
  compileStateToModularConfigurationElements,
  type ModularConfigBlock,
} from './ConfigurationSectionsCard/utils';
import type { ConfigurationSectionsState } from './ConfigurationSectionsCard/types';
import {
  createModularConfiguration,
  updateModularConfiguration,
  getConfigurationAffectedDevices,
  type ModularConfigurationPayload,
} from '@/api/modularConfigurations';

export interface ModularConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DeviceConfiguration) => void;
  initialConfig?: DeviceConfiguration | null;
}

const COMMON_DEVICE_MODELS = [
  '*',
  'edgecore_eap101',
  'edgecore_eap102',
  'edgecore_ecs4100-12ph',
  'indio_um-305ac',
  'cig_wf188n',
  'wlan_ap_generic',
];

export const ModularConfigModal: React.FC<ModularConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const isEditMode = Boolean(initialConfig);

  const [isEditing, setIsEditing] = useState<boolean>(!isEditMode);
  const [name, setName] = useState<string>(initialConfig?.name || '');
  const [platform, setPlatform] = useState<PlatformType>(
    initialConfig?.platform || (initialConfig?.deviceGroup as PlatformType) || 'ap'
  );
  const [description, setDescription] = useState<string>(initialConfig?.description || '');
  const [note, setNote] = useState<string>(
    initialConfig?.notes?.[0]?.note || ''
  );
  const [deviceTypes, setDeviceTypes] = useState<string[]>(
    initialConfig?.devicetypes?.length ? initialConfig.devicetypes : ['*']
  );
  const [newDeviceTypeInput, setNewDeviceTypeInput] = useState<string>('');

  // Device rules matching OWPROV native schema
  const [rcOnly, setRcOnly] = useState<string>(
    initialConfig?.devicerules?.rcOnly || 'inherit'
  );
  const [rrm, setRrm] = useState<string>(
    initialConfig?.devicerules?.rrm || 'inherit'
  );
  const [firmwareUpgrade, setFirmwareUpgrade] = useState<string>(
    initialConfig?.devicerules?.firmwareUpgrade || 'inherit'
  );

  // Live Entities & Venues from OWPROV
  const { data: entities = [], isLoading: entitiesLoading } = useGetEntities();
  const { data: venues = [], isLoading: venuesLoading } = useGetVenues();

  const [selectedEntityOverride, setSelectedEntityOverride] = useState<string | null>(null);
  const [selectedVenueOverride, setSelectedVenueOverride] = useState<string | null>(null);

  // Derived effective entity & venue - auto-resolves parent entity if editing a venue-scoped config
  const resolvedInitialEntity = useMemo(() => {
    if (initialConfig?.entity) return initialConfig.entity;
    if (initialConfig?.venue && venues.length > 0) {
      const parentVenue = venues.find((v) => v.id === initialConfig.venue);
      if (parentVenue?.entity) return parentVenue.entity;
    }
    return '';
  }, [initialConfig, venues]);

  const selectedEntity = selectedEntityOverride !== null ? selectedEntityOverride : resolvedInitialEntity;
  const selectedVenue = selectedVenueOverride !== null ? selectedVenueOverride : (initialConfig?.venue || '');

  // Venues filtered by the selected entity
  const filteredVenues = selectedEntity
    ? venues.filter((v) => v.entity === selectedEntity)
    : [];

  const handleEntityChange = (entityId: string) => {
    setSelectedEntityOverride(entityId);
    setSelectedVenueOverride('');
  };

  const handleVenueChange = (venueId: string) => {
    setSelectedVenueOverride(venueId);
  };

  const entityOptions = [
    { value: '', label: 'None' },
    ...entities.map((e) => ({
      value: e.id,
      label: e.name ? (e.description ? `${e.name} (${e.description})` : e.name) : e.id,
    })),
  ];

  const venueOptions = [
    { value: '', label: selectedEntity ? 'Entity-wide (All Venues)' : 'Select Entity first...' },
    ...filteredVenues.map((v) => ({
      value: v.id,
      label: v.name ? (v.description ? `${v.name} (${v.description})` : v.name) : v.id,
    })),
  ];

  // Modular sections state synchronized from ConfigurationSectionsCard
  const [latestState, setLatestState] = useState<ConfigurationSectionsState | null>(null);
  const [configurationJson, setConfigurationJson] = useState<string>(() => {
    if (initialConfig?.rawConfigurationJson) return initialConfig.rawConfigurationJson;
    if (initialConfig?.configuration && initialConfig.configuration.length > 0) {
      return JSON.stringify(initialConfig.configuration);
    }
    return '';
  });

  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  // Affected Devices state (for Edit mode)
  const [affectedDevices, setAffectedDevices] = useState<string[]>([]);
  const [isLoadingAffected, setIsLoadingAffected] = useState<boolean>(() => Boolean(initialConfig?.id));
  const [showAffectedModal, setShowAffectedModal] = useState<boolean>(false);

  // Fetch affected devices when editing an existing configuration
  useEffect(() => {
    let isMounted = true;
    if (isEditMode && initialConfig?.id) {
      getConfigurationAffectedDevices(initialConfig.id)
        .then((devices) => {
          if (isMounted) {
            setAffectedDevices(devices || []);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch affected devices:', err);
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingAffected(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isEditMode, initialConfig?.id]);

  if (!isOpen) return null;

  // Real-time JSON validation
  const validateJson = (text: string): boolean => {
    if (!text.trim()) {
      setJsonError(null);
      return true;
    }
    try {
      JSON.parse(text);
      setJsonError(null);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      setJsonError(msg);
      return false;
    }
  };

  const handleAddDeviceType = () => {
    const trimmed = newDeviceTypeInput.trim();
    if (trimmed && !deviceTypes.includes(trimmed)) {
      setDeviceTypes([...deviceTypes, trimmed]);
      setNewDeviceTypeInput('');
    }
  };

  const handleRemoveDeviceType = (item: string) => {
    setDeviceTypes(deviceTypes.filter((dt) => dt !== item));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!validateJson(configurationJson)) return;

    setIsSubmitting(true);
    setApiError(null);
    setApiSuccess(null);

    const configName = name.trim();

    // Compile active sections into OWPROV modular configuration blocks
    let modularBlocks: ModularConfigBlock[] = [];
    if (latestState && latestState.activeSections.length > 0) {
      modularBlocks = compileStateToModularConfigurationElements(latestState);
    }

    // Fallback if no blocks were produced: wrap the compiled uCentral JSON into a primary block
    if (modularBlocks.length === 0) {
      modularBlocks = [
        {
          name: 'Main Configuration',
          description: description.trim() || 'Master device configuration',
          weight: 1,
          configuration: configurationJson,
        },
      ];
    }

    // Determine entity and venue according to OWPROV rules
    let payloadEntity = '';
    let payloadVenue = '';

    if (selectedVenue) {
      // Specific venue selected -> venue receives UUID, entity is empty
      payloadEntity = '';
      payloadVenue = selectedVenue;
    } else if (selectedEntity) {
      // Entity-wide selected -> entity receives UUID, venue is empty
      payloadEntity = selectedEntity;
      payloadVenue = '';
    }

    const payload: ModularConfigurationPayload = {
      name: configName,
      description: description.trim(),
      deviceGroup: platform,
      deviceTypes: deviceTypes.length > 0 ? deviceTypes : ['*'],
      deviceRules: {
        rcOnly,
        rrm,
        firmwareUpgrade,
      },
      notes: note.trim() ? [{ note: note.trim() }] : undefined,
      entity: payloadEntity,
      venue: payloadVenue,
      configuration: modularBlocks.map((b) => ({
        name: b.name,
        description: b.description,
        weight: b.weight,
        configuration: b.configuration,
      })),
    };

    try {
      let savedId = initialConfig?.id;
      if (isEditMode && initialConfig?.id) {
        await updateModularConfiguration(initialConfig.id, payload);
      } else {
        const res = await createModularConfiguration(payload);
        if (res?.id) {
          savedId = res.id;
        }
      }

      setApiSuccess(`Successfully saved modular configuration "${configName}" to OWPROV`);

      const selectedEntityObj = entities.find((e) => e.id === (payloadEntity || selectedEntity));
      const selectedVenueObj = venues.find((v) => v.id === (payloadVenue || selectedVenue));

      const saved: DeviceConfiguration = {
        id: savedId || `cfg-owprov-${Date.now().toString(36)}`,
        name: configName,
        description: description.trim(),
        configType: 'modular',
        platform,
        deviceGroup: platform,
        devicetypes: deviceTypes.length > 0 ? deviceTypes : ['*'],
        rawConfigurationJson: configurationJson,
        notes: note.trim()
          ? [{ note: note.trim(), created: Math.floor(Date.now() / 1000) }]
          : initialConfig?.notes || [],
        created: initialConfig?.created || Math.floor(Date.now() / 1000),
        modified: Math.floor(Date.now() / 1000),
        entity: payloadEntity || selectedEntity,
        entityName: selectedEntityObj?.name || initialConfig?.entityName || '',
        venue: payloadVenue || selectedVenue,
        venueName: selectedVenueObj?.name || initialConfig?.venueName || '',
        subscriber: initialConfig?.subscriber || '',
        subscriberonly: false,
        inuse: initialConfig?.inuse || [],
        variables: initialConfig?.variables || [],
        devicerules: {
          firmwareUpgrade: (firmwareUpgrade as 'inherit' | 'yes' | 'no') || 'inherit',
          rcOnly: (rcOnly as 'inherit' | 'yes' | 'no') || 'inherit',
          rrm: (rrm as 'inherit' | 'yes' | 'no') || 'inherit',
        },
        tags: ['owprov', 'modular-config', platform],
        version: (initialConfig?.version || 0) + 1,
        status: 'active',
        validation: 'passed',
        assignments: initialConfig?.assignments || [],
        configuration: modularBlocks.map((b) => ({
          name: b.name,
          description: b.description,
          weight: b.weight,
          configuration: b.configuration,
        })),
        sections: initialConfig?.sections || {
          general: {
            name: configName,
            description: description.trim(),
            timezone: 'UTC-5 (EST)',
            country: 'US',
          },
          radios: { bands: [] },
          interfaces: { ssids: [] },
          services: { ssh: true, lldp: true },
          metrics: { interval: 60, reporting: true },
          unit: { leds: true, poeOut: false },
        },
      };

      onSave(saved);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      interface ErrorResponse {
        response?: {
          data?: {
            Details?: string;
            ErrorDescription?: string;
            error?: string;
          };
        };
        message?: string;
      }
      const e = err as ErrorResponse;
      const errorMsg =
        e.response?.data?.Details ||
        e.response?.data?.ErrorDescription ||
        e.response?.data?.error ||
        e.message ||
        'Failed to save modular configuration to OWPROV';
      setApiError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = !isEditing || isSubmitting;
  const hasActiveSections = Boolean(
    (latestState && latestState.activeSections.length > 0) ||
    (configurationJson.trim().length > 0 && configurationJson.trim() !== '{}')
  );
  const isFormValid =
    name.trim().length > 0 &&
    deviceTypes.length > 0 &&
    !jsonError &&
    hasActiveSections;

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1300"
      p={4}
    >
      <Box
        w="min(880px, 96vw)"
        maxH="92vh"
        display="flex"
        flexDirection="column"
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        overflow="hidden"
        border="1px solid"
        borderColor={themeColors.panel.border}
      >
        {/* Header - Matching polished style with Floppy Save, Edit Pencil, and Close X */}
        <Flex
          px={6}
          py={4}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
          bg="#ffffff"
        >
          <HStack gap={3}>
            <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
              {isEditMode ? 'Edit Configuration' : 'Create Configuration'}
            </Text>
            <Box
              fontSize="11px"
              fontWeight="600"
              px={2}
              py={0.5}
              borderRadius="4px"
              bg="rgba(2, 132, 199, 0.08)"
              color="#0284c7"
              border="1px solid"
              borderColor="rgba(2, 132, 199, 0.25)"
            >
              Modular Configuration (OWPROV)
            </Box>
          </HStack>

          <HStack gap={2}>
            {/* Affected Devices Badge / Button (in Edit Mode) */}
            {isEditMode && (
              <Button
                size="sm"
                variant="outline"
                borderColor={affectedDevices.length > 0 ? '#f59e0b' : themeColors.panel.border}
                bg={affectedDevices.length > 0 ? '#fffbeb' : '#ffffff'}
                color={affectedDevices.length > 0 ? '#b45309' : themeColors.text.secondary}
                onClick={() => setShowAffectedModal(true)}
                title="View access points affected by this configuration"
                h="32px"
                px={2.5}
              >
                <Icon name="device" size={14} />
                <Text ml={1.5} fontSize="12px" fontWeight="600">
                  {isLoadingAffected
                    ? 'Checking...'
                    : `${affectedDevices.length} Device${affectedDevices.length === 1 ? '' : 's'} Affected`}
                </Text>
              </Button>
            )}

            {/* Save Button (Floppy disk icon) */}
            <Button
              size="sm"
              variant="outline"
              borderColor={themeColors.panel.border}
              color="#0284c7"
              disabled={isDisabled || !isFormValid}
              onClick={handleSubmit}
              title="Save modular configuration"
              h="32px"
              px={3}
            >
              <Icon name="save" size={15} />
              <Text ml={1.5} fontSize="12px" fontWeight="600">
                {isSubmitting ? 'Saving...' : 'Save'}
              </Text>
            </Button>

            {/* Edit Toggle Button (Pencil icon) */}
            {isEditMode && (
              <Button
                size="sm"
                variant={isEditing ? 'solid' : 'outline'}
                bg={isEditing ? '#0284c7' : undefined}
                color={isEditing ? '#ffffff' : themeColors.text.title}
                borderColor={themeColors.panel.border}
                onClick={() => setIsEditing(!isEditing)}
                title={isEditing ? 'Switch to View mode' : 'Switch to Edit mode'}
                h="32px"
                px={3}
              >
                <Icon name="edit" size={14} />
                <Text ml={1.5} fontSize="12px" fontWeight="600">
                  {isEditing ? 'Editing' : 'Edit'}
                </Text>
              </Button>
            )}

            {/* Close Button */}
            <Box
              as="button"
              cursor="pointer"
              p={1.5}
              borderRadius="4px"
              color={themeColors.text.secondary}
              _hover={{ bg: '#f1f5f9', color: themeColors.text.title }}
              onClick={onClose}
              title="Close modal"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon name="x" size={18} />
            </Box>
          </HStack>
        </Flex>

        {/* Modal Body - Scrollable content */}
        <Box
          p={6}
          overflowY="auto"
          flex="1"
          css={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '3px',
            },
          }}
        >
          <VStack gap={5} align="stretch">
            {/* Alert / Feedback message */}
            {apiError && (
              <Box
                p={3}
                borderRadius="6px"
                bg="#fee2e2"
                border="1px solid #fca5a5"
                color="#b91c1c"
                fontSize="12px"
                display="flex"
                alignItems="flex-start"
                gap={2}
              >
                <Box mt={0.5}>
                  <Icon name="alertTriangle" size={15} color="#b91c1c" />
                </Box>
                <Box flex="1">
                  <Text fontWeight="600">Failed to save configuration:</Text>
                  <Text>{apiError}</Text>
                </Box>
              </Box>
            )}

            {apiSuccess && (
              <Box
                p={3}
                borderRadius="6px"
                bg="#dcfce7"
                border="1px solid #86efac"
                color="#15803d"
                fontSize="12px"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Icon name="check" size={15} color="#15803d" />
                <Text fontWeight="600">{apiSuccess}</Text>
              </Box>
            )}

            {/* Upper General Information Form - Matches OWPROV native fields (Image 2) */}
            <Box
              bg="#f8fafc"
              p={4}
              borderRadius="8px"
              border="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={3}>
                General Configuration
              </Text>

              {/* Row 1: Name *, Device Group *, Entity, Venue */}
              <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={4}>
                {/* 1. Name * */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    Name <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Input
                    size="sm"
                    bg="#ffffff"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Master AP Config"
                    disabled={isDisabled}
                  />
                </Box>

                {/* 2. Device Group * */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    Device Group <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <SelectDropdown
                    value={platform}
                    onChange={(val) => setPlatform(val as PlatformType)}
                    options={[
                      { value: 'ap', label: 'AP' },
                      { value: 'switch', label: 'Switch' },
                    ]}
                    disabled={isDisabled}
                  />
                </Box>

                {/* 3. Entity */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    Entity
                  </Text>
                  <SelectDropdown
                    value={selectedEntity}
                    onChange={(val) => handleEntityChange(String(val))}
                    options={entityOptions}
                    placeholder={entitiesLoading ? 'Loading entities...' : 'Select Entity...'}
                    disabled={isDisabled || entitiesLoading}
                  />
                </Box>

                {/* 4. Venue */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    Venue
                  </Text>
                  <SelectDropdown
                    value={selectedVenue}
                    onChange={(val) => handleVenueChange(String(val))}
                    options={venueOptions}
                    placeholder={
                      !selectedEntity
                        ? 'Select Entity first...'
                        : venuesLoading
                        ? 'Loading venues...'
                        : 'Select Venue...'
                    }
                    disabled={isDisabled || !selectedEntity || venuesLoading}
                  />
                </Box>
              </SimpleGrid>

              {/* Row 2: Device Types *, Release Candidates Only, RRM, Firmware Upgrade */}
              <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mb={4}>
                {/* 1. Device Types * */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    Device Types <Text as="span" color="#dc2626">*</Text>
                  </Text>
                  <Flex
                    p={1.5}
                    border="1px solid"
                    borderColor="#cbd5e1"
                    borderRadius="6px"
                    bg="#ffffff"
                    wrap="wrap"
                    gap={1}
                    minH="32px"
                    align="center"
                  >
                    {deviceTypes.map((dt) => (
                      <HStack
                        key={dt}
                        fontSize="10px"
                        fontWeight="600"
                        px={1.5}
                        py={0.2}
                        borderRadius="3px"
                        bg="#f1f5f9"
                        color={themeColors.text.title}
                        border="1px solid"
                        borderColor="#cbd5e1"
                        fontFamily="monospace"
                      >
                        <Text>{dt}</Text>
                        {!isDisabled && (
                          <Box
                            as="button"
                            cursor="pointer"
                            display="flex"
                            alignItems="center"
                            color="#dc2626"
                            onClick={() => handleRemoveDeviceType(dt)}
                          >
                            <Icon name="x" size={10} />
                          </Box>
                        )}
                      </HStack>
                    ))}
                    {!isDisabled && (
                      <HStack gap={1} flex="1" minW="100px">
                        <Input
                          size="xs"
                          variant="flushed"
                          border="none"
                          outline="none"
                          placeholder="Type & Add..."
                          value={newDeviceTypeInput}
                          onChange={(e) => setNewDeviceTypeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddDeviceType();
                            }
                          }}
                          fontSize="11px"
                          h="20px"
                        />
                        <Button size="xs" variant="ghost" h="20px" px={1} onClick={handleAddDeviceType}>
                          Add
                        </Button>
                      </HStack>
                    )}
                  </Flex>
                </Box>

                {/* 2. Release Candidates Only */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    Release Candidates Only
                  </Text>
                  <SelectDropdown
                    value={rcOnly}
                    onChange={(val) => setRcOnly(val)}
                    options={[
                      { value: 'inherit', label: 'Inherit' },
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ]}
                    disabled={isDisabled}
                  />
                </Box>

                {/* 3. RRM */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    RRM
                  </Text>
                  <SelectDropdown
                    value={rrm}
                    onChange={(val) => setRrm(val)}
                    options={[
                      { value: 'inherit', label: 'Inherit' },
                      { value: 'on', label: 'On' },
                      { value: 'off', label: 'Off' },
                    ]}
                    disabled={isDisabled}
                  />
                </Box>

                {/* 4. Firmware Upgrade */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    Firmware Upgrade
                  </Text>
                  <SelectDropdown
                    value={firmwareUpgrade}
                    onChange={(val) => setFirmwareUpgrade(val)}
                    options={[
                      { value: 'inherit', label: 'Inherit' },
                      { value: 'yes', label: 'Yes' },
                      { value: 'no', label: 'No' },
                    ]}
                    disabled={isDisabled}
                  />
                </Box>
              </SimpleGrid>

              {/* Quick device model recommendation chips */}
              {!isDisabled && (
                <HStack gap={1} wrap="wrap" mb={4}>
                  <Text fontSize="11px" color={themeColors.text.muted}>
                    Quick add models:
                  </Text>
                  {COMMON_DEVICE_MODELS.filter((m) => !deviceTypes.includes(m)).slice(0, 5).map((m) => (
                    <Button
                      key={m}
                      size="xs"
                      variant="outline"
                      fontSize="10px"
                      h="20px"
                      px={1.5}
                      borderColor={themeColors.panel.border}
                      color={themeColors.text.secondary}
                      onClick={() => setDeviceTypes([...deviceTypes, m])}
                    >
                      +{m}
                    </Button>
                  ))}
                </HStack>
              )}

              {/* Row 3: Description, Note */}
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                {/* 1. Description */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    Description
                  </Text>
                  <Input
                    size="sm"
                    bg="#ffffff"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    disabled={isDisabled}
                  />
                </Box>

                {/* 2. Note */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title} mb={1}>
                    Note
                  </Text>
                  <Input
                    size="sm"
                    bg="#ffffff"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note"
                    disabled={isDisabled}
                  />
                </Box>
              </SimpleGrid>
            </Box>

            {/* Configuration Sections Card (OWPROV Modular Mode with isDefaultConfig=false) */}
            <Box pt={1}>
              <ConfigurationSectionsCard
                key={initialConfig?.id || 'new-modular'}
                platform={platform}
                initialJson={configurationJson}
                isDefaultConfig={false}
                onStateChange={(state, compiledJson) => {
                  setLatestState(state);
                  setConfigurationJson(compiledJson);
                  validateJson(compiledJson);
                }}
                disabled={isDisabled}
              />
            </Box>
          </VStack>
        </Box>

        {/* Modal Footer */}
        <Flex
          px={6}
          py={3}
          bg="#f8fafc"
          borderTop="1px solid"
          borderColor={themeColors.panel.divider}
          justify="space-between"
          align="center"
        >
          <HStack gap={1.5} fontSize="11px" color={themeColors.text.muted}>
            <Icon name="check" size={13} color="#16a34a" />
            <Text>Ready to submit to OWPROV REST API /api/v1/configuration</Text>
          </HStack>
          <HStack gap={2}>
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              bg="#0284c7"
              color="#ffffff"
              _hover={{ bg: '#0369a1' }}
              disabled={isDisabled || !isFormValid}
              onClick={handleSubmit}
            >
              {isSubmitting
                ? 'Saving to OWPROV...'
                : isEditMode
                ? 'Update Configuration'
                : 'Save Configuration'}
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Affected Devices Sub-Modal */}
      {showAffectedModal && (
        <Box
          position="fixed"
          inset="0"
          bg="rgba(5, 12, 23, 0.6)"
          display="grid"
          placeItems="center"
          zIndex="1400"
          p={4}
        >
          <Box
            w="min(560px, 94vw)"
            maxH="80vh"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            overflow="hidden"
            border="1px solid"
            borderColor={themeColors.panel.border}
            display="flex"
            flexDirection="column"
          >
            <Flex
              px={5}
              py={3.5}
              align="center"
              justify="space-between"
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <HStack gap={2}>
                <Icon name="device" size={18} color="#f59e0b" />
                <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                  Affected Devices
                </Text>
                <Box
                  fontSize="11px"
                  fontWeight="600"
                  px={2}
                  py={0.2}
                  borderRadius="4px"
                  bg="#fef3c7"
                  color="#b45309"
                >
                  {affectedDevices.length} Device{affectedDevices.length === 1 ? '' : 's'}
                </Box>
              </HStack>
              <Box
                as="button"
                cursor="pointer"
                p={1}
                color={themeColors.text.muted}
                _hover={{ color: themeColors.text.title }}
                onClick={() => setShowAffectedModal(false)}
              >
                <Icon name="x" size={16} />
              </Box>
            </Flex>

            <Box p={5} overflowY="auto" flex="1">
              <Text fontSize="12px" color={themeColors.text.secondary} mb={3}>
                Configuration: <Text as="span" fontWeight="700" color={themeColors.text.title}>{name || initialConfig?.name}</Text>
              </Text>

              {affectedDevices.length === 0 ? (
                <Box
                  p={6}
                  textAlign="center"
                  borderRadius="6px"
                  bg="#f8fafc"
                  border="1px solid"
                  borderColor={themeColors.panel.divider}
                >
                  <Icon name="info" size={24} color="#94a3b8" />
                  <Text mt={2} fontSize="13px" fontWeight="600" color={themeColors.text.title}>
                    No devices currently affected
                  </Text>
                  <Text fontSize="12px" color={themeColors.text.muted} mt={1}>
                    This configuration is not currently assigned to or inherited by any active devices in the inventory.
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" gap={2}>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
                    The following {affectedDevices.length} device(s) inherit this configuration and will be affected upon saving:
                  </Text>
                  <Box
                    maxH="280px"
                    overflowY="auto"
                    border="1px solid"
                    borderColor={themeColors.panel.divider}
                    borderRadius="6px"
                    p={2}
                    bg="#fafafa"
                  >
                    {affectedDevices.map((serial) => (
                      <Flex
                        key={serial}
                        align="center"
                        justify="space-between"
                        p={2}
                        borderRadius="4px"
                        bg="#ffffff"
                        mb={1.5}
                        border="1px solid #f1f5f9"
                        _hover={{ borderColor: '#cbd5e1' }}
                      >
                        <HStack gap={2}>
                          <Icon name="device" size={14} color="#0284c7" />
                          <Text fontSize="12px" fontFamily="monospace" fontWeight="600" color={themeColors.text.title}>
                            {serial}
                          </Text>
                        </HStack>
                        <Box
                          as="button"
                          fontSize="11px"
                          color={themeColors.text.muted}
                          _hover={{ color: themeColors.brand.accent }}
                          cursor="pointer"
                          onClick={() => navigator.clipboard.writeText(serial)}
                          title="Copy serial number"
                        >
                          <Icon name="copy" size={13} />
                        </Box>
                      </Flex>
                    ))}
                  </Box>
                </VStack>
              )}
            </Box>

            <Flex
              px={5}
              py={3}
              justify="flex-end"
              borderTop="1px solid"
              borderColor={themeColors.panel.divider}
              bg="#f8fafc"
            >
              <Button
                size="sm"
                variant="outline"
                borderColor={themeColors.panel.border}
                onClick={() => setShowAffectedModal(false)}
              >
                Close
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};
