import React, { useState } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import { useTraceDevice } from '@/api/devices';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: UnifiedFleetDevice;
}

export const DeviceTraceModal: React.FC<DeviceTraceModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [traceType, setTraceType] = useState<'duration' | 'packets'>('duration');
  const [network, setNetwork] = useState<'up' | 'down'>('up');
  const [duration, setDuration] = useState<number>(20);
  const [packets, setPackets] = useState<number>(100);
  const [traceResult, setTraceResult] = useState<Record<string, unknown> | null>(null);

  const traceMutation = useTraceDevice();

  if (!isOpen) return null;

  const handleStartTrace = async () => {
    try {
      const res = await traceMutation.mutateAsync({
        serialNumber: device.serialNumber,
        type: traceType,
        network,
        duration: traceType === 'duration' ? duration : undefined,
        packets: traceType === 'packets' ? packets : undefined,
      });

      setTraceResult(res as Record<string, unknown>);
      toaster.create({
        title: 'Packet Trace Complete',
        description: `Captured network packet trace for ${device.serialNumber}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Trace Failed',
        description: err instanceof Error ? err.message : 'Could not execute packet capture',
        type: 'error',
      });
    }
  };

  const handleDownload = () => {
    const jsonStr = JSON.stringify(traceResult ?? {}, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pcap-trace-${device.serialNumber}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
        maxW="560px"
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
            <Box color="#0284c7">
              <Icon name="network" size={20} />
            </Box>
            <Box>
              <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                Network Packet Trace
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted}>
                {device.serialNumber} · Live PCAP packet capture
              </Text>
            </Box>
          </HStack>
          <Button size="xs" variant="ghost" onClick={onClose} p={1}>
            <Icon name="x" size={16} />
          </Button>
        </Flex>

        {/* Body */}
        <Box p={6}>
          {traceMutation.isPending ? (
            <Center py={16}>
              <VStack gap={3}>
                <Spinner size="lg" color="#0284c7" />
                <Text fontSize="13px" fontWeight="600" color={themeColors.text.title}>
                  Running packet capture on {device.serialNumber}...
                </Text>
                <Text fontSize="12px" color={themeColors.text.muted}>
                  Streaming packets ({traceType === 'duration' ? `${duration}s duration` : `${packets} packets`})
                </Text>
              </VStack>
            </Center>
          ) : traceResult ? (
            <VStack align="stretch" gap={4} py={2}>
              <Box p={4} borderRadius="8px" bg="#f0fdf4" border="1px solid #bbf7d0">
                <HStack gap={2.5} align="start">
                  <Box color="#16a34a" mt={0.5}>
                    <Icon name="check" size={18} />
                  </Box>
                  <Box>
                    <Text fontSize="14px" fontWeight="700" color="#166534">
                      Packet Capture Completed
                    </Text>
                    <Text fontSize="12px" color="#15803d" mt={0.5}>
                      Network trace data is ready for inspection and export.
                    </Text>
                  </Box>
                </HStack>
              </Box>

              <Box
                p={4}
                borderRadius="8px"
                bg="#0f172a"
                color="#f8fafc"
                fontFamily="mono"
                fontSize="12px"
                maxH="220px"
                overflowY="auto"
                whiteSpace="pre"
              >
                {JSON.stringify(traceResult, null, 2)}
              </Box>

              <HStack justify="space-between" pt={2}>
                <Button size="sm" variant="outline" onClick={() => setTraceResult(null)}>
                  Configure Another Trace
                </Button>
                <Button size="sm" colorPalette="blue" variant="solid" onClick={handleDownload}>
                  <Icon name="download" size={14} />
                  Download Trace (.json)
                </Button>
              </HStack>
            </VStack>
          ) : (
            <VStack align="stretch" gap={4}>
              <Box p={3} borderRadius="8px" bg="#f8fafc" border="1px solid #e2e8f0" fontSize="12px" color={themeColors.text.muted}>
                Execute live packet capture directly on the device network interfaces. Results can be analyzed or exported for Wireshark analysis.
              </Box>

              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Capture Metric
                  </Text>
                  <select
                    value={traceType}
                    onChange={(e) => setTraceType(e.target.value as 'duration' | 'packets')}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: '#ffffff',
                    }}
                  >
                    <option value="duration">Duration (Seconds)</option>
                    <option value="packets">Packet Count</option>
                  </select>
                </Box>

                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Network Direction
                  </Text>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as 'up' | 'down')}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: '#ffffff',
                    }}
                  >
                    <option value="up">Upstream / WAN</option>
                    <option value="down">Downstream / LAN</option>
                  </select>
                </Box>
              </SimpleGrid>

              {traceType === 'duration' ? (
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Duration Limit
                  </Text>
                  <HStack gap={2}>
                    {[20, 40, 60, 120].map((s) => (
                      <Button
                        key={s}
                        size="xs"
                        variant={duration === s ? 'solid' : 'outline'}
                        colorPalette={duration === s ? 'blue' : 'gray'}
                        onClick={() => setDuration(s)}
                      >
                        {s} Seconds
                      </Button>
                    ))}
                  </HStack>
                </Box>
              ) : (
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Packet Count Limit
                  </Text>
                  <HStack gap={2}>
                    {[100, 250, 500, 1000].map((p) => (
                      <Button
                        key={p}
                        size="xs"
                        variant={packets === p ? 'solid' : 'outline'}
                        colorPalette={packets === p ? 'blue' : 'gray'}
                        onClick={() => setPackets(p)}
                      >
                        {p} Packets
                      </Button>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          )}
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
          <Button size="sm" variant="outline" onClick={onClose} disabled={traceMutation.isPending}>
            Close
          </Button>
          {!traceResult && (
            <Button
              size="sm"
              colorPalette="blue"
              variant="solid"
              onClick={handleStartTrace}
              disabled={traceMutation.isPending}
            >
              Start Packet Capture
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceTraceModal;
