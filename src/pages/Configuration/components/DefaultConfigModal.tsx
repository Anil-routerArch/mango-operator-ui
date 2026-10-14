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
import type { DeviceConfiguration, PlatformType } from '../types/configuration';
import {
  ConfigurationSectionsCard,
} from './ConfigurationSectionsCard';
import {
  createDefaultConfiguration,
  updateDefaultConfiguration,
  type DefaultConfigurationPayload,
} from '@/api/defaultConfigurations';

export interface DefaultConfigModalProps {
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

export const DefaultConfigModal: React.FC<DefaultConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialConfig,
}) => {
  const isEditMode = Boolean(initialConfig);

  const [isEditing, setIsEditing] = useState<boolean>(!isEditMode);
  const [name, setName] = useState<string>(initialConfig?.name || '');
  const [platform, setPlatform] = useState<PlatformType>(initialConfig?.platform || 'ap');
  const [description, setDescription] = useState<string>(initialConfig?.description || '');
  const [deviceTypes, setDeviceTypes] = useState<string[]>(
    initialConfig?.devicetypes?.length ? initialConfig.devicetypes : ['*']
  );
  const [newDeviceTypeInput, setNewDeviceTypeInput] = useState<string>('');

  // JSON state synchronized from ConfigurationSectionsCard (or initial config)
  const [configurationJson, setConfigurationJson] = useState<string>(
    initialConfig?.rawConfigurationJson || ''
  );

  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

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

  const handlePlatformChange = (newPlat: PlatformType) => {
    setPlatform(newPlat);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!validateJson(configurationJson)) return;

    setIsSubmitting(true);
    setApiError(null);
    setApiSuccess(null);

    const configName = (isEditMode && initialConfig ? initialConfig.name : name).trim();

    const payload: DefaultConfigurationPayload = {
      name: configName,
      description: description.trim(),
      modelIds: deviceTypes.length > 0 ? deviceTypes : ['*'],
      platform,
      configuration: configurationJson,
    };

    try {
      if (isEditMode) {
        await updateDefaultConfiguration(payload);
      } else {
        await createDefaultConfiguration(payload);
      }

      setApiSuccess(`Successfully saved default configuration "${configName}" to OWGW`);

      const saved: DeviceConfiguration = {
        id: initialConfig?.id || `cfg-owgw-${Date.now().toString(36)}`,
        name: name.trim(),
        description: description.trim(),
        configType: 'default',
        platform,
        devicetypes: deviceTypes.length > 0 ? deviceTypes : ['*'],
        rawConfigurationJson: configurationJson,
        notes: initialConfig?.notes || [],
        created: initialConfig?.created || Math.floor(Date.now() / 1000),
        modified: Math.floor(Date.now() / 1000),
        entity: '',
        venue: '',
        subscriber: '',
        subscriberonly: false,
        inuse: initialConfig?.inuse || [],
        variables: [],
        devicerules: initialConfig?.devicerules || {
          firmwareUpgrade: 'inherit',
          rcOnly: 'inherit',
          rrm: 'inherit',
        },
        tags: ['owgw', 'default-config', platform],
        version: (initialConfig?.version || 0) + 1,
        status: 'active',
        validation: 'passed',
        assignments: initialConfig?.assignments || [],
        configuration: [
          {
            name: 'uCentral-Payload',
            description: 'Gateway default payload',
            weight: 0,
            configuration: configurationJson,
          },
        ],
        sections: initialConfig?.sections || {
          general: {
            name: name.trim(),
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
        'Failed to save default configuration to OWGW';
      setApiError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDisabled = !isEditing || isSubmitting;
  const isFormValid =
    name.trim().length > 0 &&
    deviceTypes.length > 0 &&
    !jsonError &&
    configurationJson.trim().length > 0 &&
    configurationJson.trim() !== '{}';

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
        w="min(860px, 96vw)"
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
        {/* Header - Replicates OWGW modal header with Floppy Save, Edit Pencil, and Close X buttons */}
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
              bg="#f1f5f9"
              color={themeColors.brand.accent}
              border="1px solid"
              borderColor="rgba(10, 107, 107, 0.2)"
            >
              Default Configuration (OWGW)
            </Box>
          </HStack>

          <HStack gap={2}>
            {/* Save Button (Floppy disk icon) */}
            <Button
              size="sm"
              variant="outline"
              borderColor={themeColors.panel.border}
              color={themeColors.brand.accent}
              disabled={isDisabled || !isFormValid}
              onClick={handleSubmit}
              title="Save configuration"
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
                bg={isEditing ? themeColors.brand.accent : undefined}
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

        {/* Scrollable Form Body */}
        <Box flex="1" overflowY="auto" px={6} py={4}>
          <VStack gap={4} align="stretch">
            {/* API Status Alerts */}
            {apiError && (
              <Box
                p={3}
                borderRadius="6px"
                bg="#fef2f2"
                border="1px solid #fecaca"
                color="#dc2626"
                fontSize="13px"
              >
                <Flex align="center" gap={2}>
                  <Icon name="alertTriangle" size={16} />
                  <Text fontWeight="600">Error saving default configuration to OWGW</Text>
                </Flex>
                <Text mt={1} fontSize="12px" color="#991b1b">
                  {apiError}
                </Text>
              </Box>
            )}

            {apiSuccess && (
              <Box
                p={3}
                borderRadius="6px"
                bg="#f0fdf4"
                border="1px solid #bbf7d0"
                color="#16a34a"
                fontSize="13px"
              >
                <Flex align="center" gap={2}>
                  <Icon name="check" size={16} />
                  <Text fontWeight="600">{apiSuccess}</Text>
                </Flex>
              </Box>
            )}

            {/* Row 1: Name * and Platform * */}
            <Flex gap={3}>
              <Box flex="1">
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  Name <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Default-AP-Config"
                  fontSize="13px"
                  size="sm"
                  borderRadius="4px"
                  borderColor={themeColors.panel.border}
                  disabled={isDisabled || isEditMode}
                  bg={isDisabled || isEditMode ? '#f8fafc' : '#ffffff'}
                  cursor={isEditMode ? 'not-allowed' : undefined}
                  title={isEditMode ? 'Default configuration name cannot be changed in OWGW' : undefined}
                />
                {isEditMode && (
                  <Text fontSize="10px" color={themeColors.text.muted} mt={1}>
                    Name cannot be changed for existing default configurations in OWGW
                  </Text>
                )}
              </Box>

              <Box w="180px">
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  Platform <Text as="span" color="#dc2626">*</Text>
                </Text>
                <SelectDropdown
                  value={platform}
                  onChange={(val) => handlePlatformChange(val as PlatformType)}
                  options={[
                    { label: 'AP', value: 'ap' },
                    { label: 'Switch', value: 'switch' },
                    { label: 'OLG', value: 'olg' },
                  ]}
                  disabled={isDisabled}
                  size="sm"
                />
              </Box>
            </Flex>

            {/* Row 2: Description */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Description
              </Text>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description of this gateway configuration template"
                fontSize="13px"
                size="sm"
                borderRadius="4px"
                borderColor={themeColors.panel.border}
                disabled={isDisabled}
                bg={isDisabled ? '#f8fafc' : '#ffffff'}
              />
            </Box>

            {/* Row 3: Device Types * */}
            <Box>
              <Flex justify="space-between" align="center" mb={1}>
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary}>
                  Device Types <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Text fontSize="11px" color={themeColors.text.muted}>
                  Use &quot;*&quot; for all models or add specific device types
                </Text>
              </Flex>

              {/* Tag chips */}
              <Flex
                wrap="wrap"
                gap={1.5}
                mb={2}
                p={2}
                minH="38px"
                border="1px solid"
                borderColor={themeColors.panel.border}
                borderRadius="4px"
                bg={isDisabled ? '#f8fafc' : '#ffffff'}
              >
                {deviceTypes.map((dt) => (
                  <HStack
                    key={dt}
                    fontSize="11px"
                    fontWeight="600"
                    px={2}
                    py={0.5}
                    borderRadius="4px"
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
                        <Icon name="x" size={12} />
                      </Box>
                    )}
                  </HStack>
                ))}
                {!isDisabled && (
                  <HStack gap={1} flex="1" minW="150px">
                    <Input
                      size="xs"
                      variant="flushed"
                      border="none"
                      outline="none"
                      placeholder="Type model and press Enter or click Add..."
                      value={newDeviceTypeInput}
                      onChange={(e) => setNewDeviceTypeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDeviceType();
                        }
                      }}
                      fontSize="12px"
                    />
                    <Button size="xs" variant="ghost" onClick={handleAddDeviceType}>
                      Add
                    </Button>
                  </HStack>
                )}
              </Flex>

              {/* Quick model recommendations */}
              {!isDisabled && (
                <HStack gap={1} wrap="wrap">
                  <Text fontSize="11px" color={themeColors.text.muted}>
                    Quick add:
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
            </Box>

            {/* Configuration Sections (Unified OWPROV Architecture with Expert Mode) */}
            <Box pt={1}>
              <ConfigurationSectionsCard
                key={initialConfig?.id || 'new'}
                platform={platform}
                initialJson={initialConfig?.rawConfigurationJson}
                isDefaultConfig={true}
                onStateChange={(_state, compiledJson) => {
                  setConfigurationJson(compiledJson);
                  validateJson(compiledJson);
                }}
                disabled={isDisabled}
              />
            </Box>
          </VStack>
        </Box>

        {/* Footer */}
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
            <Text>Ready to submit to OWGW REST API /api/v1/default_configuration</Text>
          </HStack>
          <HStack gap={2}>
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              bg={themeColors.brand.accent}
              color="#ffffff"
              _hover={{ opacity: 0.9 }}
              disabled={isDisabled || !isFormValid}
              onClick={handleSubmit}
            >
              {isSubmitting
                ? 'Saving to OWGW...'
                : isEditMode
                ? 'Update Configuration'
                : 'Save Configuration'}
            </Button>
          </HStack>
        </Flex>
      </Box>
    </Box>
  );
};
