import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import { getApiErrorMessage } from '@/api/errors';
import { useUpgradeFirmware, useGetAvailableFirmware } from '@/api/devices';
import { assertDeviceCommandSucceeded, getDeviceCommandSuccessTitle } from '@/api/deviceCommandStatus';
import { ToggleSwitch } from '@/pages/Configuration/components/ConfigurationSectionsCard/ToggleSwitch';
import { formatBytes } from '@/pages/Devices/components/DeviceFleetTable/deviceTableHelpers';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceFirmwareUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: UnifiedFleetDevice;
}

export const DeviceFirmwareUpgradeModal: React.FC<DeviceFirmwareUpgradeModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [showDevFirmware, setShowDevFirmware] = useState(false);
  const [keepRedirector, setKeepRedirector] = useState(false);
  const [upgradingUri, setUpgradingUri] = useState<string | null>(null);

  // Authoritatively resolve hardware SKU without fabricating fallback models
  const deviceSku = useMemo(() => {
    const placeholders = ['-', 'unknown', 'n/a', 'ap', 'switch', 'olg', 'gateway'];
    const compatible = (device.compatible || '').trim();
    if (compatible && !placeholders.includes(compatible.toLowerCase())) return compatible;
    const dt = (device.deviceType || '').trim();
    if (dt && !placeholders.includes(dt.toLowerCase())) {
      return dt;
    }
    const m = (device.model || '').trim();
    if (m && !placeholders.includes(m.toLowerCase())) {
      return m;
    }
    return '';
  }, [device.compatible, device.deviceType, device.model]);

  // Retrieve available firmwares from FMS for authoritative SKU
  const {
    data: fmsFirmwares = [],
    isFetching: isFetchingFirmware,
    isError: isFirmwareError,
    error: firmwareError,
    refetch: refetchFirmware,
  } = useGetAvailableFirmware(deviceSku);

  const upgradeMutation = useUpgradeFirmware();

  const filteredFirmwares = useMemo(() => {
    const imageDateValue = (value?: number | string): number => {
      if (typeof value === 'number') return value > 1e11 ? value : value * 1000;
      if (!value) return 0;
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric > 1e11 ? numeric : numeric * 1000;
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    return (fmsFirmwares || [])
      .filter((fw) => {
        if (showDevFirmware) return true;
        const rev = (fw.revision || '').toLowerCase();
        return !rev.includes('devel') && !rev.includes('snapshot');
      })
      .sort((a, b) => imageDateValue(b.imageDate) - imageDateValue(a.imageDate));
  }, [fmsFirmwares, showDevFirmware]);

  if (!isOpen) return null;

  const formatFirmwareDate = (timestamp?: number | string) => {
    if (timestamp === undefined || timestamp === null || timestamp === '') return '—';
    const numeric = typeof timestamp === 'number' ? timestamp : Number(timestamp);
    const ms = Number.isFinite(numeric)
      ? numeric > 1e11
        ? numeric
        : numeric * 1000
      : Date.parse(String(timestamp));
    if (Number.isNaN(ms)) return '—';
    return new Date(ms).toLocaleDateString();
  };

  const handleUpgrade = async (uriToUpgrade: string) => {
    const uri = uriToUpgrade?.trim();
    if (!uri) {
      toaster.create({
        title: 'Validation Error',
        description: 'Please specify a valid firmware image URI.',
        type: 'error',
      });
      return;
    }

    try {
      setUpgradingUri(uri);
      const result = await upgradeMutation.mutateAsync({
        serialNumber: device.serialNumber,
        uri,
        keepRedirector,
      });
      assertDeviceCommandSucceeded(result);

      toaster.create({
        title: getDeviceCommandSuccessTitle('Firmware Upgrade', result),
        description: `Firmware upgrade command accepted for ${device.serialNumber}.`,
        type: 'success',
      });
      onClose();
    } catch (err: unknown) {
      toaster.create({
        title: 'Upgrade Failed',
        description: getApiErrorMessage(err, 'Failed to schedule firmware upgrade'),
        type: 'error',
      });
    } finally {
      setUpgradingUri(null);
    }
  };

  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(15, 23, 42, 0.65)"
      backdropFilter="blur(3px)"
      zIndex={1400}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="#ffffff"
        borderRadius="12px"
        w="100%"
        maxW="860px"
        boxShadow="0 20px 40px rgba(0,0,0,0.2)"
        border="1px solid"
        borderColor={themeColors.panel.border}
        overflow="hidden"
      >
        {/* Header matching OWGW: Title on left, Dev Releases toggle + Close on right */}
        <Flex
          align="center"
          justify="space-between"
          px={6}
          py={3.5}
          borderBottom="1px solid"
          borderColor="#e2e8f0"
        >
          <Text fontSize="16px" fontWeight="700" color="#0f172a">
            Firmware Upgrade #{device.serialNumber}
          </Text>
          <HStack gap={3}>
            <HStack gap={2}>
              <Text fontSize="13px" fontWeight="500" color="#334155">
                Dev Releases
              </Text>
              <ToggleSwitch
                checked={showDevFirmware}
                onChange={setShowDevFirmware}
              />
            </HStack>
            <Button size="xs" variant="ghost" onClick={onClose} p={1} borderRadius="6px">
              <Icon name="x" size={16} />
            </Button>
          </HStack>
        </Flex>

        {/* Body matching OWGW */}
        <Box p={6}>
          {!deviceSku ? (
            <VStack py={12} gap={3} textAlign="center">
              <Icon name="alertTriangle" size={26} color="#d97706" />
              <Text fontSize="14px" fontWeight="700" color="#92400e">
                Hardware SKU Unavailable
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted} maxW="520px">
                The device record does not contain an authoritative compatible hardware model, so firmware compatibility cannot be determined.
              </Text>
            </VStack>
          ) : isFetchingFirmware ? (
            <Flex justify="center" align="center" py={16}>
              <Spinner size="lg" color="#2563eb" />
            </Flex>
          ) : isFirmwareError ? (
            <VStack py={12} gap={3} textAlign="center">
              <Icon name="alertTriangle" size={26} color="#dc2626" />
              <Text fontSize="14px" fontWeight="700" color="#991b1b">
                Failed to Load Firmware Catalog
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted} maxW="520px">
                {getApiErrorMessage(firmwareError, 'FMS could not return compatible firmware images.')}
              </Text>
              <Button size="sm" variant="outline" onClick={() => void refetchFirmware()}>
                Retry
              </Button>
            </VStack>
          ) : (
            <VStack align="stretch" gap={4}>
              <Text fontSize="14px" fontWeight="600" color="#0f172a">
                Current Firmware: {device.firmware || 'Unknown'}
              </Text>

              <VStack align="start" gap={1.5}>
                <Text fontSize="13px" fontWeight="500" color="#334155">
                  Keep Redirector?
                </Text>
                <ToggleSwitch
                  checked={keepRedirector}
                  onChange={setKeepRedirector}
                />
              </VStack>

              {/* Table matching OWGW */}
              <Box maxH="380px" overflowY="auto" mt={1}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '160px' }}>
                        IMAGE DATE
                      </th>
                      <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', width: '120px' }}>
                        SIZE
                      </th>
                      <th style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                        REVISION
                      </th>
                      <th style={{ padding: '8px 4px', width: '110px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFirmwares.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px 4px', textAlign: 'center', color: '#94a3b8' }}>
                          No firmware available
                        </td>
                      </tr>
                    ) : (
                      filteredFirmwares.map((fw, idx) => {
                        const isCurrentUpgrading = upgradingUri === fw.uri;
                        return (
                          <tr key={fw.id || fw.uri || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 4px', color: '#334155' }}>
                              {formatFirmwareDate(fw.imageDate)}
                            </td>
                            <td style={{ padding: '10px 4px', color: '#334155' }}>
                              {formatBytes(fw.size)}
                            </td>
                            <td style={{ padding: '10px 4px', fontFamily: 'monospace', color: '#0f172a', fontWeight: '500' }}>
                              {fw.revision}
                            </td>
                            <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                              <Button
                                size="xs"
                                colorPalette="blue"
                                variant="solid"
                                bg="#2563eb"
                                color="#ffffff"
                                _hover={{ bg: '#1d4ed8' }}
                                onClick={() => fw.uri && handleUpgrade(fw.uri)}
                                disabled={upgradeMutation.isPending}
                              >
                                {isCurrentUpgrading ? 'Upgrading...' : 'Upgrade'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </Box>
            </VStack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DeviceFirmwareUpgradeModal;
