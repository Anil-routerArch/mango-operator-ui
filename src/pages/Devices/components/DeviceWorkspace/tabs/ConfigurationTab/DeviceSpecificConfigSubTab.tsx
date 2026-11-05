import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useUpdateDeviceTag } from '@/api/devices';
import {
  getModularConfigurationById,
  createModularConfiguration,
  type ModularConfigElementPayload,
  type ModularConfigurationPayload,
} from '@/api/modularConfigurations';
import { toaster } from '@/components/ui/toaster';
import { ConfigurationSectionsCard } from '@/pages/Configuration/components/ConfigurationSectionsCard';
import type { ConfigurationSectionsState } from '@/pages/Configuration/components/ConfigurationSectionsCard/types';
import { compileStateToModularConfigurationElements } from '@/pages/Configuration/components/ConfigurationSectionsCard/utils';
import type { PlatformType } from '@/pages/Configuration/types/configuration';
import type { UnifiedFleetDevice } from '@/types/device';
import { RrmEditorField } from './RrmEditorField';
import { normalizeRrmForSubmission } from './rrmHelper';

export interface DeviceSpecificConfigSubTabProps {
  device: UnifiedFleetDevice;
}

export const DeviceSpecificConfigSubTab: React.FC<DeviceSpecificConfigSubTabProps> = ({ device }) => {
  // Determine platform type (olg, switch, ap)
  const platform: PlatformType = useMemo(() => {
    const t = (device.deviceGroup || device.deviceType || '').toLowerCase();
    const m = (device.model || '').toLowerCase();
    const c = (device.compatible || '').toLowerCase();
    if (t === 'olg' || t === 'gateway' || m.includes('olg') || c.includes('olg')) return 'olg';
    if (t === 'switch' || m.includes('switch') || m.includes('ecs') || c.includes('switch')) return 'switch';
    return 'ap';
  }, [device]);

  // Initial values for Base Information fields matching OWPROV
  const initialRrm = useMemo<string>(() => {
    const raw =
      device.provTag?.deviceRules?.rrm ||
      (device as any).deviceRules?.rrm ||
      (device as any).rrm ||
      'inherit';
    return typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : String(raw);
  }, [device]);

  const initialFirmwareUpgrade = useMemo<'inherit' | 'yes' | 'no'>(() => {
    const val = (
      device.provTag?.deviceRules?.firmwareUpgrade ||
      (device as any).deviceRules?.firmwareUpgrade ||
      (device as any).firmwareUpgrade ||
      'no'
    ).toLowerCase();
    if (val === 'yes' || val === 'on') return 'yes';
    if (val === 'inherit') return 'inherit';
    return 'no';
  }, [device]);

  const initialFirmwareRCOnly = useMemo<boolean>(() => {
    const val =
      device.provTag?.deviceRules?.rcOnly ||
      (device as any).deviceRules?.rcOnly ||
      (device as any).firmwareRCOnly ||
      (device as any).rcOnly;
    return val === true || val === 'yes' || val === 'true';
  }, [device]);

  const [rrm, setRrm] = useState<string>(initialRrm);
  const [firmwareUpgrade, setFirmwareUpgrade] = useState<'inherit' | 'yes' | 'no'>(initialFirmwareUpgrade);
  const [firmwareRCOnly, setFirmwareRCOnly] = useState<boolean>(initialFirmwareRCOnly);

  // Sync state if device prop changes
  useEffect(() => {
    setRrm(initialRrm);
    setFirmwareUpgrade(initialFirmwareUpgrade);
    setFirmwareRCOnly(initialFirmwareRCOnly);
  }, [initialRrm, initialFirmwareUpgrade, initialFirmwareRCOnly]);

  // Query modular configuration if device.configId is present
  const { data: configData } = useQuery({
    queryKey: ['modular-configuration-device', device.configId],
    queryFn: () => getModularConfigurationById(device.configId!),
    enabled: Boolean(device.configId),
  });

  useEffect(() => {
    if (configData?.deviceRules) {
      if (configData.deviceRules.rrm) {
        const raw = configData.deviceRules.rrm;
        setRrm(typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : String(raw));
      }
      if (configData.deviceRules.firmwareUpgrade) {
        const val = configData.deviceRules.firmwareUpgrade.toLowerCase();
        setFirmwareUpgrade(val === 'yes' || val === 'on' ? 'yes' : val === 'inherit' ? 'inherit' : 'no');
      }
      if (configData.deviceRules.rcOnly) {
        const val = configData.deviceRules.rcOnly;
        setFirmwareRCOnly(val === 'yes' || val === 'true');
      }
    }
  }, [configData]);

  const [latestSectionsState, setLatestSectionsState] = useState<ConfigurationSectionsState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Initial config sections derived from configData or device.configuration
  const initialJson = useMemo(() => {
    if (
      configData?.configuration &&
      Array.isArray(configData.configuration) &&
      configData.configuration.length > 0
    ) {
      try {
        return JSON.stringify(configData.configuration, null, 2);
      } catch {
        // fallback
      }
    }
    if (
      device.configuration &&
      typeof device.configuration === 'object' &&
      Object.keys(device.configuration).length > 0
    ) {
      try {
        return JSON.stringify(device.configuration, null, 2);
      } catch {
        // fallback
      }
    }
    return '{}';
  }, [configData, device]);

  const [currentJson, setCurrentJson] = useState(initialJson);
  const updateMutation = useUpdateDeviceTag();

  // Keep currentJson in sync if configData or device.configuration updates
  useEffect(() => {
    if (
      configData?.configuration &&
      Array.isArray(configData.configuration) &&
      configData.configuration.length > 0
    ) {
      try {
        setCurrentJson(JSON.stringify(configData.configuration, null, 2));
      } catch {
        // ignore
      }
    } else if (
      device.configuration &&
      typeof device.configuration === 'object' &&
      Object.keys(device.configuration).length > 0
    ) {
      try {
        setCurrentJson(JSON.stringify(device.configuration, null, 2));
      } catch {
        // ignore
      }
    } else if (!device.configId) {
      setCurrentJson('{}');
    }
  }, [configData, device.configuration, device.configId]);

  const handleStateChange = (state: ConfigurationSectionsState, compiled: string) => {
    setLatestSectionsState(state);
    setCurrentJson(compiled);
  };

  const handleDeleteConfig = async () => {
    if (!window.confirm('Are you sure you want to reset this device-specific configuration? This will detach the configuration without deleting the shared template.')) {
      return;
    }
    try {
      setIsSaving(true);
      const configId = device.configId || device.provTag?.deviceConfiguration;

      const resolvedType =
        device.provTag?.deviceType ||
        (device.deviceType && !['ap', 'switch', 'olg'].includes(device.deviceType) ? device.deviceType : device.model) ||
        'asus_rt-ax53u';
      const resolvedGroup =
        device.provTag?.deviceGroup ||
        (['ap', 'switch', 'olg'].includes(device.deviceGroup) ? device.deviceGroup : 'ap');

      // Interim Copy-On-Write requirement:
      // Reset Configuration detaches the selected device without deleting the underlying modular configuration,
      // preserving the profile for any other devices referencing it.
      await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name: device.name || device.serialNumber,
          description: device.description || '',
          deviceType: resolvedType,
          deviceGroup: resolvedGroup,
          devClass: device.provTag?.devClass || 'venue',
          deviceConfiguration: '',
          deviceRules: {
            rrm: 'inherit',
            firmwareUpgrade: 'no',
            rcOnly: 'no',
          },
          doNotAllowOverrides: Boolean(device.provTag?.doNotAllowOverrides),
          entity: device.provTag?.entity || device.entityId || '',
          venue: device.provTag?.venue || device.venueId || '',
          subscriber: device.provTag?.subscriber ?? (device.subscriberId || ''),
          state: device.provTag?.state ?? (device.state || ''),
        } as any,
      });

      setRrm('inherit');
      setFirmwareUpgrade('no');
      setFirmwareRCOnly(false);
      setCurrentJson('{}');
      setLatestSectionsState(null);
      if (configId) {
        queryClient.invalidateQueries({ queryKey: ['modular-configuration-device', configId] });
      }
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', device.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', device.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });

      toaster.create({
        title: 'Configuration Reset',
        description: 'Device-specific configuration detached successfully.',
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Reset Failed',
        description: err instanceof Error ? err.message : 'Could not reset device configuration',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const originalConfigId = device.configId || device.provTag?.deviceConfiguration;

      const resolvedType =
        device.provTag?.deviceType ||
        (device.deviceType && !['ap', 'switch', 'olg'].includes(device.deviceType) ? device.deviceType : device.model) ||
        'asus_rt-ax53u';
      const resolvedGroup =
        device.provTag?.deviceGroup ||
        (['ap', 'switch', 'olg'].includes(device.deviceGroup) ? device.deviceGroup : 'ap');

      // 1. Determine modular blocks to save:
      // If user modified sections, compile latestSectionsState.
      // Otherwise preserve existing blocks from configData.
      const normalizedRrm = normalizeRrmForSubmission(rrm);
      let blocksToSave: ModularConfigElementPayload[] = [];
      if (latestSectionsState) {
        blocksToSave = compileStateToModularConfigurationElements(latestSectionsState);
      } else if (configData?.configuration && Array.isArray(configData.configuration)) {
        blocksToSave = configData.configuration;
      }

      // Interim Copy-On-Write (COW) approach (Issue #1):
      // Do not update an existing modular configuration in place, which could unintentionally
      // modify shared configurations referenced by other devices.
      // Instead, create a new device-specific configuration preserving metadata, variables, and rules,
      // and associate it with the selected device only after successful creation.
      const newConfigPayload: ModularConfigurationPayload = {
        name: `device:${device.serialNumber}`,
        description: configData?.description || 'Device-specific configuration',
        deviceGroup: resolvedGroup,
        deviceTypes: [resolvedType],
        deviceRules: {
          rrm: normalizedRrm,
          firmwareUpgrade,
          rcOnly: firmwareRCOnly ? 'yes' : 'no',
        },
        variables: configData?.variables || [],
        entity: configData?.entity || (device.provTag?.entity || device.entityId || ''),
        venue: configData?.venue || (device.provTag?.venue || device.venueId || ''),
        subscriber: configData?.subscriber || (device.provTag?.subscriber || device.subscriberId || ''),
        subscriberOnly: configData?.subscriberOnly ?? false,
        configuration: blocksToSave,
      };

      const createRes = await createModularConfiguration(newConfigPayload);
      if (!createRes?.id) {
        throw new Error('Failed to create device-specific configuration: No ID returned');
      }
      const newConfigId = createRes.id;

      // Associate the new configuration with the selected device only after successful creation.
      // The previously referenced configuration is left completely untouched.
      await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name: device.name || device.serialNumber,
          description: device.description || '',
          deviceType: resolvedType,
          deviceGroup: resolvedGroup,
          devClass: device.provTag?.devClass || 'venue',
          deviceConfiguration: newConfigId,
          deviceRules: {
            rrm: normalizedRrm,
            firmwareUpgrade,
            rcOnly: firmwareRCOnly ? 'yes' : 'no',
          },
          doNotAllowOverrides: Boolean(device.provTag?.doNotAllowOverrides),
          entity: device.provTag?.entity || device.entityId || '',
          venue: device.provTag?.venue || device.venueId || '',
          subscriber: device.provTag?.subscriber ?? (device.subscriberId || ''),
          state: device.provTag?.state ?? (device.state || ''),
        } as any,
      });

      if (originalConfigId) {
        queryClient.invalidateQueries({ queryKey: ['modular-configuration-device', originalConfigId] });
      }
      queryClient.invalidateQueries({ queryKey: ['modular-configuration-device', newConfigId] });
      queryClient.invalidateQueries({ queryKey: ['single-device-overview', device.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['device-computed-config', device.serialNumber] });
      queryClient.invalidateQueries({ queryKey: ['paginated-fleet-devices'] });

      toaster.create({
        title: 'Device Configuration Saved',
        description: `Device-specific configuration updated for ${device.serialNumber}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Could not save device configuration',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box p={4}>
      <VStack align="stretch" gap={4}>
        {/* Base Information Card Header matching OWPROV */}
        <Box>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
              Base Information
            </Text>
            <Button
              size="xs"
              minW="30px"
              w="30px"
              h="30px"
              p={0}
              borderRadius="6px"
              bg="#dc2626"
              color="#ffffff"
              display="grid"
              placeItems="center"
              cursor={updateMutation.isPending ? 'not-allowed' : 'pointer'}
              opacity={updateMutation.isPending ? 0.6 : 1}
              _hover={{ bg: '#b91c1c' }}
              _active={{ bg: '#991b1b' }}
              onClick={handleDeleteConfig}
              title="Reset Configuration"
              aria-label="Reset Configuration"
            >
              <Icon name="trash" size={16} />
            </Button>
          </Flex>

          <Flex wrap="wrap" gap={8} align="flex-start">
            {/* RRM * */}
            <Box minW="150px">
              <RrmEditorField
                value={rrm}
                onChange={setRrm}
                required
                disabled={isSaving}
              />
            </Box>

            {/* Firmware Upgrade * */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                Firmware Upgrade <Text as="span" color="#ef4444">*</Text>
              </Text>
              <Box position="relative" width="120px">
                <select
                  value={firmwareUpgrade}
                  onChange={(e) => setFirmwareUpgrade(e.target.value as 'inherit' | 'yes' | 'no')}
                  style={{
                    width: '100%',
                    height: '34px',
                    padding: '4px 28px 4px 10px',
                    fontSize: '13px',
                    color: themeColors.text.title,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    appearance: 'none',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="inherit">inherit</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <Box
                  position="absolute"
                  right="8px"
                  top="50%"
                  transform="translateY(-50%)"
                  pointerEvents="none"
                  color="#64748b"
                >
                  <Icon name="chevronDown" size={14} />
                </Box>
              </Box>
            </Box>

            {/* Release Candidates Only */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                Release Candidates Only
              </Text>
              <Box
                w="38px"
                h="20px"
                borderRadius="10px"
                bg={firmwareRCOnly ? themeColors.brand.accent : '#cbd5e1'}
                position="relative"
                cursor="pointer"
                transition="all 0.2s ease"
                onClick={() => setFirmwareRCOnly(!firmwareRCOnly)}
                title={firmwareRCOnly ? 'Enabled' : 'Disabled'}
              >
                <Box
                  w="16px"
                  h="16px"
                  borderRadius="50%"
                  bg="#ffffff"
                  position="absolute"
                  top="2px"
                  left={firmwareRCOnly ? '20px' : '2px'}
                  transition="all 0.2s ease"
                  boxShadow="0 1px 2px rgba(0,0,0,0.2)"
                />
              </Box>
            </Box>
          </Flex>
        </Box>

        {/* Modular Sections Card matching OWPROV */}
        <ConfigurationSectionsCard
          initialJson={currentJson}
          onStateChange={handleStateChange}
          platform={platform}
        />

        {/* Save Bar */}
        <Flex justify="flex-end" pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
          <Button
            size="sm"
            bg={themeColors.brand.primary}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.primaryHover }}
            onClick={handleSave}
            disabled={isSaving || updateMutation.isPending}
            gap={1.5}
            px={5}
          >
            {isSaving || updateMutation.isPending ? <Spinner size="xs" /> : <Icon name="check" size={14} />}
            Save Configuration
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default DeviceSpecificConfigSubTab;
