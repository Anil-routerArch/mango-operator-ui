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
import { useStartTelemetry } from '@/api/devices';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceTelemetryModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: UnifiedFleetDevice;
}

export const DeviceTelemetryModal: React.FC<DeviceTelemetryModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [intervalSec, setIntervalSec] = useState<number>(3);
  const [durationMin, setDurationMin] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['wifi-frames', 'dhcp-snooping', 'state']);
  const [outputTarget, setOutputTarget] = useState<'websocket' | 'kafka'>('websocket');
  const [result, setResult] = useState<unknown>(null);

  const telemetryMutation = useStartTelemetry();

  if (!isOpen) return null;

  const toggleType = (t: string) => {
    if (selectedTypes.includes(t)) {
      setSelectedTypes(selectedTypes.filter((x) => x !== t));
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  const handleStart = async () => {
    if (selectedTypes.length === 0) {
      toaster.create({
        title: 'Validation Error',
        description: 'Please select at least one telemetry data stream type.',
        type: 'error',
      });
      return;
    }

    try {
      const res = await telemetryMutation.mutateAsync({
        serialNumber: device.serialNumber,
        interval: intervalSec,
        lifetime: durationMin * 60,
        types: selectedTypes,
      });

      setResult(res);
      toaster.create({
        title: 'Telemetry Stream Started',
        description: `Dispatched telemetry stream collection for ${device.serialNumber}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Telemetry Failed',
        description: err instanceof Error ? err.message : 'Could not start telemetry collection',
        type: 'error',
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(result ?? {}, null, 2));
    toaster.create({
      title: 'Copied',
      description: 'Telemetry result copied to clipboard',
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
        maxW="640px"
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
            <Box color="#10b981">
              <Icon name="activity" size={20} />
            </Box>
            <Box>
              <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                Telemetry Stream
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted}>
                {device.serialNumber} · Real-time metrics streaming
              </Text>
            </Box>
          </HStack>
          <Button size="xs" variant="ghost" onClick={onClose} p={1}>
            <Icon name="x" size={16} />
          </Button>
        </Flex>

        {/* Body */}
        <Box p={6}>
          {telemetryMutation.isPending ? (
            <Center py={16}>
              <VStack gap={3}>
                <Spinner size="lg" color="#10b981" />
                <Text fontSize="13px" fontWeight="600" color={themeColors.text.title}>
                  Starting telemetry socket session on {device.serialNumber}...
                </Text>
              </VStack>
            </Center>
          ) : result ? (
            <VStack align="stretch" gap={4}>
              <Box p={4} borderRadius="8px" bg="#f0fdf4" border="1px solid #bbf7d0">
                <Text fontSize="13px" fontWeight="700" color="#166534">
                  Telemetry Session Active
                </Text>
                <Text fontSize="12px" color="#15803d" mt={0.5}>
                  Streaming every {intervalSec}s for {durationMin} minutes. Streams: {selectedTypes.join(', ')}.
                </Text>
              </Box>

              <Box
                p={4}
                borderRadius="8px"
                bg="#0f172a"
                color="#f8fafc"
                fontFamily="mono"
                fontSize="12px"
                maxH="240px"
                overflowY="auto"
                whiteSpace="pre"
              >
                {JSON.stringify(result, null, 2)}
              </Box>

              <HStack justify="space-between">
                <Button size="sm" variant="outline" onClick={() => setResult(null)}>
                  Change Settings
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  <Icon name="copy" size={14} />
                  Copy Payload
                </Button>
              </HStack>
            </VStack>
          ) : (
            <VStack align="stretch" gap={5}>
              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Reporting Interval
                  </Text>
                  <select
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: '#ffffff',
                    }}
                  >
                    <option value={1}>1 second</option>
                    <option value={3}>3 seconds (Standard)</option>
                    <option value={5}>5 seconds</option>
                    <option value={10}>10 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                  </select>
                </Box>

                <Box>
                  <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                    Session Duration
                  </Text>
                  <select
                    value={durationMin}
                    onChange={(e) => setDurationMin(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      background: '#ffffff',
                    }}
                  >
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes (Standard)</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </Box>
              </SimpleGrid>

              {/* Output Pipeline */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                  Target Output Channel
                </Text>
                <select
                  value={outputTarget}
                  onChange={(e) => setOutputTarget(e.target.value as 'websocket' | 'kafka')}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                  }}
                >
                  <option value="websocket">Live WebSocket Session (UI streaming)</option>
                  <option value="kafka">Kafka Telemetry Pipeline (Server side)</option>
                </select>
              </Box>

              {/* Stream Types */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={2}>
                  Streamed Telemetry Payloads
                </Text>
                <VStack align="stretch" gap={2}>
                  {[
                    { id: 'wifi-frames', label: 'Wi-Fi Frames & Probe Requests', desc: 'Raw 802.11 management & probe frame monitoring' },
                    { id: 'dhcp-snooping', label: 'DHCP Snooping & Leases', desc: 'Client IP assignment tracking and broadcast interception' },
                    { id: 'state', label: 'Full Radio & Hardware State', desc: 'Real-time CPU, RAM, association lists, interface statistics' },
                  ].map((item) => {
                    const isChecked = selectedTypes.includes(item.id);
                    return (
                      <Box
                        key={item.id}
                        p={3}
                        borderRadius="8px"
                        border="1px solid"
                        borderColor={isChecked ? '#93c5fd' : '#e2e8f0'}
                        bg={isChecked ? '#eff6ff' : '#ffffff'}
                        cursor="pointer"
                        onClick={() => toggleType(item.id)}
                        transition="all 0.15s ease"
                      >
                        <HStack justify="space-between" align="center">
                          <Box>
                            <Text fontSize="13px" fontWeight="600" color={themeColors.text.title}>
                              {item.label}
                            </Text>
                            <Text fontSize="11px" color={themeColors.text.muted}>
                              {item.desc}
                            </Text>
                          </Box>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
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
          <Button size="sm" variant="outline" onClick={onClose} disabled={telemetryMutation.isPending}>
            Close
          </Button>
          {!result && (
            <Button
              size="sm"
              colorPalette="teal"
              variant="solid"
              onClick={handleStart}
              disabled={telemetryMutation.isPending}
            >
              Start Telemetry
            </Button>
          )}
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceTelemetryModal;

