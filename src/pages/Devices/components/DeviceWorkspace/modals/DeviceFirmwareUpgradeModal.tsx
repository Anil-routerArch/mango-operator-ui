import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  RadioGroup,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import { useUpgradeFirmware } from '@/api/devices';
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
  const [selectedChannel, setSelectedChannel] = useState<'stable' | 'dev' | 'custom'>('stable');
  const [customUri, setCustomUri] = useState('');
  const [keepRedirector, setKeepRedirector] = useState(true);

  const upgradeMutation = useUpgradeFirmware();

  if (!isOpen) return null;

  const getResolvedUri = () => {
    const comp = (device.compatible || device.model || 'asus_rt-ax53u').toLowerCase().replace(/_/g, '-');
    if (selectedChannel === 'stable') {
      return `https://tip.openwifi.cloud/firmware/${comp}/tip-v4.2.4-stable.bin`;
    }
    if (selectedChannel === 'dev') {
      return `https://tip.openwifi.cloud/firmware/${comp}/tip-v4.3.0-devel-snapshot.bin`;
    }
    return customUri.trim();
  };

  const handleUpgrade = async () => {
    const uri = getResolvedUri();
    if (!uri) {
      toaster.create({
        title: 'Validation Error',
        description: 'Please specify a valid firmware image URI.',
        type: 'error',
      });
      return;
    }

    try {
      await upgradeMutation.mutateAsync({
        serialNumber: device.serialNumber,
        uri,
        keepRedirector,
      });

      toaster.create({
        title: 'Upgrade Initiated',
        description: `Firmware upgrade dispatched for ${device.serialNumber}. The device will download and reboot.`,
        type: 'success',
      });
      onClose();
    } catch (err: unknown) {
      toaster.create({
        title: 'Upgrade Failed',
        description: err instanceof Error ? err.message : 'Failed to schedule firmware upgrade',
        type: 'error',
      });
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
        maxW="620px"
        boxShadow="0 20px 40px rgba(0,0,0,0.2)"
        border="1px solid"
        borderColor={themeColors.panel.border}
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          px={6}
          py={4}
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
        >
          <HStack gap={2.5}>
            <Box color="#3b82f6">
              <Icon name="arrowUp" size={20} />
            </Box>
            <Box>
              <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                Firmware Upgrade
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted}>
                {device.serialNumber} · {device.manufacturer || device.model}
              </Text>
            </Box>
          </HStack>
          <Button size="xs" variant="ghost" onClick={onClose} p={1}>
            <Icon name="x" size={16} />
          </Button>
        </Flex>

        {/* Body */}
        <Box p={6}>
          <VStack align="stretch" gap={5}>
            {/* Current Firmware Banner */}
            <Box
              p={3}
              borderRadius="8px"
              bg="#f8fafc"
              border="1px solid #e2e8f0"
              fontSize="13px"
            >
              <HStack justify="space-between">
                <Text color={themeColors.text.muted}>Current Installed Firmware:</Text>
                <Text fontWeight="600" fontFamily="mono" color={themeColors.text.title}>
                  {device.firmware || 'TIP-v4.2.4-1a0ba9bf'}
                </Text>
              </HStack>
            </Box>

            {/* Release Channel Selector */}
            <Box>
              <Text fontSize="13px" fontWeight="600" color={themeColors.text.title} mb={2}>
                Select Target Release Channel
              </Text>
              <RadioGroup.Root
                value={selectedChannel}
                onValueChange={(details) => setSelectedChannel(details.value as 'stable' | 'dev' | 'custom')}
              >
                <VStack align="stretch" gap={2.5}>
                  <RadioGroup.Item value="stable">
                    <RadioGroup.ItemControl />
                    <RadioGroup.ItemText fontSize="13px">
                      <Text as="span" fontWeight="600">Latest Production Release</Text> (TIP-v4.2.4-stable, recommended)
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>

                  <RadioGroup.Item value="dev">
                    <RadioGroup.ItemControl />
                    <RadioGroup.ItemText fontSize="13px">
                      <Text as="span" fontWeight="600">Development Snapshot</Text> (TIP-v4.3.0-devel testing)
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>

                  <RadioGroup.Item value="custom">
                    <RadioGroup.ItemControl />
                    <RadioGroup.ItemText fontSize="13px">
                      <Text as="span" fontWeight="600">Custom Image URI</Text> (Specify direct HTTP/HTTPS firmware link)
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                </VStack>
              </RadioGroup.Root>
            </Box>

            {/* Custom URI Input if custom channel is selected */}
            {selectedChannel === 'custom' && (
              <Box>
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                  Direct Firmware Image URL <span style={{ color: '#ef4444' }}>*</span>
                </Text>
                <Input
                  value={customUri}
                  onChange={(e) => setCustomUri(e.target.value)}
                  placeholder="https://example.com/firmware/openwifi-image.bin"
                  fontSize="13px"
                  fontFamily="mono"
                  borderColor={themeColors.input.border}
                />
              </Box>
            )}

            {/* Keep Redirector Option */}
            <Box p={3} borderRadius="8px" bg="#f0fdf4" border="1px solid #bbf7d0">
              <HStack justify="space-between" align="center">
                <Box>
                  <Text fontSize="13px" fontWeight="600" color="#166534">
                    Keep Redirector Configuration
                  </Text>
                  <Text fontSize="11px" color="#15803d">
                    Preserves current Gateway controller connection parameters across firmware flashes.
                  </Text>
                </Box>
                <input
                  type="checkbox"
                  checked={keepRedirector}
                  onChange={(e) => setKeepRedirector(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </HStack>
            </Box>
          </VStack>
        </Box>

        {/* Footer */}
        <Flex
          justify="flex-end"
          gap={3}
          px={6}
          py={4}
          bg="#f8fafc"
          borderTop="1px solid"
          borderColor={themeColors.panel.divider}
        >
          <Button size="sm" variant="outline" onClick={onClose} disabled={upgradeMutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            colorPalette="blue"
            variant="solid"
            onClick={handleUpgrade}
            disabled={upgradeMutation.isPending}
          >
            {upgradeMutation.isPending ? (
              <HStack gap={2}>
                <Spinner size="xs" />
                <Text>Initiating...</Text>
              </HStack>
            ) : (
              'Start Firmware Upgrade'
            )}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceFirmwareUpgradeModal;
