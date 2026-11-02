import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import { useGetEventQueue } from '@/api/devices';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceEventQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: UnifiedFleetDevice;
}

export const DeviceEventQueueModal: React.FC<DeviceEventQueueModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [data, setData] = useState<unknown>(null);

  const queueMutation = useGetEventQueue();

  const fetchQueue = useCallback(async () => {
    try {
      const types = selectedType === 'all' ? ['dhcp-snooping', 'wifi-frames', 'state'] : [selectedType];
      const res = await queueMutation.mutateAsync({
        serialNumber: device.serialNumber,
        types,
      });
      setData(res);
    } catch (err: unknown) {
      toaster.create({
        title: 'Event Queue Error',
        description: err instanceof Error ? err.message : 'Could not query device event queue',
        type: 'error',
      });
    }
  }, [selectedType, queueMutation, device.serialNumber]);

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    } else {
      setData(null);
    }
  }, [isOpen, selectedType]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data ?? {}, null, 2));
    toaster.create({
      title: 'Copied',
      description: 'Event queue payload copied to clipboard',
      type: 'info',
    });
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
        maxW="720px"
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
            <Box color="#6366f1">
              <Icon name="list" size={20} />
            </Box>
            <Box>
              <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                Event Queue
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted}>
                {device.serialNumber} · In-flight controller queue buffers
              </Text>
            </Box>
          </HStack>

          <HStack gap={2}>
            <Button size="xs" variant="outline" onClick={handleCopy} disabled={!data}>
              <Icon name="copy" size={13} />
              Copy JSON
            </Button>
            <Button size="xs" colorPalette="blue" variant="outline" onClick={fetchQueue} disabled={queueMutation.isPending}>
              <Icon name="refresh" size={13} />
              Refresh
            </Button>
            <Button size="xs" variant="ghost" onClick={onClose} p={1}>
              <Icon name="x" size={16} />
            </Button>
          </HStack>
        </Flex>

        {/* Filter Pills */}
        <Flex px={6} py={3} gap={2} bg="#f8fafc" borderBottom="1px solid #e2e8f0">
          {(['all', 'dhcp-snooping', 'wifi-frames', 'state'] as const).map((t) => (
            <Button
              key={t}
              size="xs"
              variant={selectedType === t ? 'solid' : 'outline'}
              colorPalette={selectedType === t ? 'blue' : 'gray'}
              onClick={() => setSelectedType(t)}
            >
              {t === 'all' ? 'All Events' : t}
            </Button>
          ))}
        </Flex>

        {/* Body */}
        <Box p={6} maxH="60vh" overflowY="auto">
          {queueMutation.isPending ? (
            <Center py={16}>
              <VStack gap={3}>
                <Spinner size="lg" color="#6366f1" />
                <Text fontSize="13px" color={themeColors.text.muted}>
                  Querying event queue buffer from {device.serialNumber}...
                </Text>
              </VStack>
            </Center>
          ) : data ? (
            <Box
              p={4}
              borderRadius="8px"
              bg="#0f172a"
              color="#f8fafc"
              fontFamily="mono"
              fontSize="12px"
              overflowX="auto"
              whiteSpace="pre"
            >
              {JSON.stringify(data, null, 2)}
            </Box>
          ) : (
            <Center py={12}>
              <Text fontSize="13px" color={themeColors.text.muted}>
                No events currently queued for this device.
              </Text>
            </Center>
          )}
        </Box>

        {/* Footer */}
        <Flex
          justify="flex-end"
          px={6}
          py={3.5}
          bg="#f8fafc"
          borderTop="1px solid"
          borderColor={themeColors.panel.divider}
        >
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceEventQueueModal;

