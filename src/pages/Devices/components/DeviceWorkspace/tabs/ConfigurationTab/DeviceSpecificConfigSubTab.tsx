import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useUpdateDeviceTag } from '@/api/devices';
import { getModularConfigurationById } from '@/api/modularConfigurations';
import { toaster } from '@/components/ui/toaster';
import { ConfigurationSectionsCard } from '@/pages/Configuration/components/ConfigurationSectionsCard';
import type { ConfigurationSectionsState } from '@/pages/Configuration/components/ConfigurationSectionsCard/types';
import type { PlatformType } from '@/pages/Configuration/types/configuration';
import type { UnifiedFleetDevice } from '@/types/device';

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
  const initialRrm = useMemo<'inherit' | 'on' | 'off'>(() => {
    const val = (
      device.provTag?.deviceRules?.rrm ||
      (device as any).deviceRules?.rrm ||
      (device as any).rrm ||
      'inherit'
    ).toLowerCase();
    if (val === 'on' || val === 'yes') return 'on';
    if (val === 'off' || val === 'no') return 'off';
    return 'inherit';
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

  const [rrm, setRrm] = useState<'inherit' | 'on' | 'off'>(initialRrm);
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
        const val = configData.deviceRules.rrm.toLowerCase();
        setRrm(val === 'on' || val === 'yes' ? 'on' : val === 'off' || val === 'no' ? 'off' : 'inherit');
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

  // Initial config sections - empty by default so user can select each section on their own
  const initialJson = useMemo(() => {
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
  }, [device]);

  const [currentJson, setCurrentJson] = useState(initialJson);
  const updateMutation = useUpdateDeviceTag();

  // Keep currentJson in sync if device configuration updates
  useEffect(() => {
    if (
      device.configuration &&
      typeof device.configuration === 'object' &&
      Object.keys(device.configuration).length > 0
    ) {
      try {
        setCurrentJson(JSON.stringify(device.configuration, null, 2));
      } catch {
        // ignore
      }
    } else {
      setCurrentJson('{}');
    }
  }, [device.configuration]);

  const handleStateChange = (_state: ConfigurationSectionsState, compiled: string) => {
    setCurrentJson(compiled);
  };

  const handleDeleteConfig = async () => {
    if (!window.confirm('Are you sure you want to delete this device-specific configuration?')) {
      return;
    }
    try {
      const resolvedType =
        device.provTag?.deviceType ||
        (device.deviceType && !['ap', 'switch', 'olg'].includes(device.deviceType) ? device.deviceType : device.model) ||
        'asus_rt-ax53u';
      const resolvedGroup =
        device.provTag?.deviceGroup ||
        (['ap', 'switch', 'olg'].includes(device.deviceGroup) ? device.deviceGroup : 'ap');

      await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name: device.name || device.serialNumber,
          description: device.description || '',
          notes: (device.provTag?.notes || device.notes || []).map((n) => ({ note: n.note })),
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
          configuration: {},
        } as any,
      });
      setRrm('inherit');
      setFirmwareUpgrade('no');
      setFirmwareRCOnly(false);
      setCurrentJson('{}');
      toaster.create({
        title: 'Configuration Reset',
        description: 'Device-specific configuration and base rules have been reset.',
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Delete Failed',
        description: err instanceof Error ? err.message : 'Could not delete device configuration',
        type: 'error',
      });
    }
  };

  const handleSave = async () => {
    try {
      let configObj: Record<string, unknown> | undefined;
      if (currentJson && currentJson.trim()) {
        try {
          configObj = JSON.parse(currentJson);
        } catch {
          toaster.create({
            title: 'Invalid JSON',
            description: 'Could not parse configuration sections to valid JSON',
            type: 'error',
          });
          return;
        }
      }

      const resolvedType =
        device.provTag?.deviceType ||
        (device.deviceType && !['ap', 'switch', 'olg'].includes(device.deviceType) ? device.deviceType : device.model) ||
        'asus_rt-ax53u';
      const resolvedGroup =
        device.provTag?.deviceGroup ||
        (['ap', 'switch', 'olg'].includes(device.deviceGroup) ? device.deviceGroup : 'ap');

      await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name: device.name || device.serialNumber,
          description: device.description || '',
          notes: (device.provTag?.notes || device.notes || []).map((n) => ({ note: n.note })),
          deviceType: resolvedType,
          deviceGroup: resolvedGroup,
          devClass: device.provTag?.devClass || 'venue',
          deviceConfiguration: device.provTag?.deviceConfiguration ?? (device.configId || ''),
          deviceRules: {
            rrm,
            firmwareUpgrade,
            rcOnly: firmwareRCOnly ? 'yes' : 'no',
          },
          doNotAllowOverrides: Boolean(device.provTag?.doNotAllowOverrides),
          entity: device.provTag?.entity || device.entityId || '',
          venue: device.provTag?.venue || device.venueId || '',
          subscriber: device.provTag?.subscriber ?? (device.subscriberId || ''),
          state: device.provTag?.state ?? (device.state || ''),
          configuration: configObj as any,
        } as any,
      });

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
              title="Delete Configuration"
              aria-label="Delete Configuration"
            >
              <Icon name="trash" size={16} />
            </Button>
          </Flex>

          <Flex wrap="wrap" gap={8} align="flex-start">
            {/* RRM * */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                RRM <Text as="span" color="#ef4444">*</Text>
              </Text>
              <Box position="relative" width="120px">
                <select
                  value={rrm}
                  onChange={(e) => setRrm(e.target.value as 'inherit' | 'on' | 'off')}
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
                  <option value="on">on</option>
                  <option value="off">off</option>
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
            disabled={updateMutation.isPending}
            gap={1.5}
            px={5}
          >
            {updateMutation.isPending ? <Spinner size="xs" /> : <Icon name="check" size={14} />}
            Save Configuration
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default DeviceSpecificConfigSubTab;
