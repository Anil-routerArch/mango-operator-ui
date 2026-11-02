import React, { useState } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useFactoryResetDevice } from '@/api/devices';
import { toaster } from '@/components/ui/toaster';

export interface DeviceFactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  serialNumber: string;
}

export const DeviceFactoryResetModal: React.FC<DeviceFactoryResetModalProps> = ({
  isOpen,
  onClose,
  serialNumber,
}) => {
  const [keepRedirector, setKeepRedirector] = useState(true);
  const resetMutation = useFactoryResetDevice();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      await resetMutation.mutateAsync({
        serialNumber,
        keepRedirector,
      });

      toaster.create({
        title: 'Factory Reset Dispatched',
        description: `Factory reset command sent to device ${serialNumber}`,
        type: 'success',
      });
      onClose();
    } catch (err: unknown) {
      toaster.create({
        title: 'Factory Reset Failed',
        description: err instanceof Error ? err.message : 'Failed to issue factory reset',
        type: 'error',
      });
    }
  };

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1200"
      p={4}
    >
      <Box
        w="min(540px, 95vw)"
        bg="#ffffff"
        borderRadius="12px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        border="1px solid"
        borderColor={themeColors.panel.border}
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          px={5}
          py={3.5}
          borderBottom="1px solid"
          borderColor={themeColors.panel.border}
          bg="#fff1f2"
        >
          <HStack gap={3}>
            <Box
              w="32px"
              h="32px"
              borderRadius="8px"
              bg="#fecdd3"
              color="#e11d48"
              display="grid"
              placeItems="center"
            >
              <Icon name="alertTriangle" size={18} color="#e11d48" />
            </Box>
            <Box>
              <Text fontSize="15px" fontWeight="700" color="#9f1239">
                Factory Reset Device
              </Text>
              <Text fontSize="12px" color="#be123c">
                Serial: {serialNumber}
              </Text>
            </Box>
          </HStack>

          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Close modal"
            onClick={onClose}
            color="#be123c"
          >
            <Icon name="x" size={16} />
          </IconButton>
        </Flex>

        {/* Content */}
        <Box p={6}>
          {/* Warning Banner */}
          <Box
            p={4}
            mb={5}
            borderRadius="8px"
            bg="#fef2f2"
            border="1px solid #fecaca"
          >
            <HStack align="flex-start" gap={3}>
              <Icon name="alertTriangle" size={18} color="#dc2626" />
              <Box>
                <Text fontSize="13px" fontWeight="700" color="#991b1b">
                  Warning: Irreversible Operation
                </Text>
                <Text fontSize="12px" color="#b91c1c" mt={1} lineHeight="1.5">
                  Restoring factory defaults will erase all custom configurations, local credentials, and state on this hardware. Active wireless clients will be disconnected immediately.
                </Text>
              </Box>
            </HStack>
          </Box>

          {/* Keep Redirector Option */}
          <Box
            p={4}
            mb={6}
            borderRadius="8px"
            border="1px solid"
            borderColor={keepRedirector ? '#bfdbfe' : '#e2e8f0'}
            bg={keepRedirector ? '#eff6ff' : '#f8fafc'}
            cursor="pointer"
            onClick={() => setKeepRedirector(!keepRedirector)}
            transition="all 0.15s ease"
          >
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontSize="13px" fontWeight="600" color="#0f172a">
                  Keep Redirector Configuration
                </Text>
                <Text fontSize="12px" color="#64748b" mt={0.5}>
                  Preserve controller redirection addresses so the access point reconnects to Mango Cloud automatically after reset.
                </Text>
              </Box>
              <input
                type="checkbox"
                checked={keepRedirector}
                onChange={() => {}}
                style={{ width: '18px', height: '18px', cursor: 'pointer', marginLeft: '12px' }}
              />
            </Flex>
          </Box>

          {/* Action Button */}
          <Center mb={2}>
            <Button
              size="md"
              w="100%"
              bg="#e11d48"
              color="#ffffff"
              _hover={{ bg: '#be123c' }}
              onClick={handleSubmit}
              disabled={resetMutation.isPending}
              fontWeight="700"
            >
              {resetMutation.isPending ? (
                <>
                  <Spinner size="xs" mr={2} />
                  Sending Factory Reset Command...
                </>
              ) : (
                `Confirm Factory Reset for ${serialNumber}`
              )}
            </Button>
          </Center>
        </Box>

        {/* Footer */}
        <Flex
          align="center"
          justify="flex-end"
          px={5}
          py={3}
          borderTop="1px solid"
          borderColor={themeColors.panel.border}
          bg="#f8fafc"
        >
          <Button size="sm" variant="outline" onClick={onClose} disabled={resetMutation.isPending}>
            Cancel
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};
