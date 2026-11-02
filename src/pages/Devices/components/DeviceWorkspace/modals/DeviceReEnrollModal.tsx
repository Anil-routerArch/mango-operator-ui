import React from 'react';
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
import { useReEnrollDevice } from '@/api/devices';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceReEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: UnifiedFleetDevice;
}

export const DeviceReEnrollModal: React.FC<DeviceReEnrollModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const reEnrollMutation = useReEnrollDevice();

  if (!isOpen) return null;

  const handleReEnroll = async () => {
    try {
      await reEnrollMutation.mutateAsync(device.serialNumber);
      toaster.create({
        title: 'Re-Enroll Initiated',
        description: `Dispatched certificate re-enrollment for ${device.serialNumber}.`,
        type: 'success',
      });
      onClose();
    } catch (err: unknown) {
      toaster.create({
        title: 'Re-Enroll Failed',
        description: err instanceof Error ? err.message : 'Could not re-enroll device',
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
        maxW="500px"
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
            <Box color="#eab308">
              <Icon name="key" size={20} />
            </Box>
            <Box>
              <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                Re-Enroll Device
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted}>
                {device.serialNumber}
              </Text>
            </Box>
          </HStack>
          <Button size="xs" variant="ghost" onClick={onClose} p={1}>
            <Icon name="x" size={16} />
          </Button>
        </Flex>

        {/* Body */}
        <Box p={6}>
          <VStack align="stretch" gap={4}>
            <Box p={4} borderRadius="8px" bg="#fefce8" border="1px solid #fef08a">
              <HStack gap={2.5} align="start">
                <Box color="#ca8a04" mt={0.5}>
                  <Icon name="alertTriangle" size={18} />
                </Box>
                <Box>
                  <Text fontSize="13px" fontWeight="700" color="#854d0e">
                    Security Notice
                  </Text>
                  <Text fontSize="12px" color="#a16207" mt={1}>
                    Re-enrolling will invalidate current mutual TLS cryptographic certificates for device{' '}
                    <Text as="span" fontFamily="mono" fontWeight="600">{device.serialNumber}</Text>{' '}
                    and issue a fresh certificate signing request.
                  </Text>
                </Box>
              </HStack>
            </Box>

            <Text fontSize="13px" color={themeColors.text.primary}>
              Use this action if the device is encountering certificate expiration or TLS handshake validation errors with the gateway.
            </Text>
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
          <Button size="sm" variant="outline" onClick={onClose} disabled={reEnrollMutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            colorPalette="yellow"
            variant="solid"
            onClick={handleReEnroll}
            disabled={reEnrollMutation.isPending}
          >
            {reEnrollMutation.isPending ? (
              <HStack gap={2}>
                <Spinner size="xs" />
                <Text>Re-Enrolling...</Text>
              </HStack>
            ) : (
              'Confirm Re-Enroll'
            )}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceReEnrollModal;

