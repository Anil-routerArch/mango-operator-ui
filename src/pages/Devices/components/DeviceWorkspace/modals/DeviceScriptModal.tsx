import React, { useState } from 'react';
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
import { useExecuteScript } from '@/api/devices';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: UnifiedFleetDevice;
}

export const DeviceScriptModal: React.FC<DeviceScriptModalProps> = ({
  isOpen,
  onClose,
  device,
}) => {
  const [scriptType, setScriptType] = useState<string>('shell');
  const [scriptBody, setScriptBody] = useState<string>('uname -a\nuptime\ncat /etc/openwrt_release');
  const [executionResult, setExecutionResult] = useState<unknown>(null);

  const scriptMutation = useExecuteScript();

  if (!isOpen) return null;

  const handleRunScript = async () => {
    if (!scriptBody.trim()) {
      toaster.create({
        title: 'Validation Error',
        description: 'Please enter script commands to execute.',
        type: 'error',
      });
      return;
    }

    try {
      const res = await scriptMutation.mutateAsync({
        serialNumber: device.serialNumber,
        type: scriptType,
        script: scriptBody,
      });

      setExecutionResult(res);
      toaster.create({
        title: 'Script Dispatched',
        description: `Executed script on ${device.serialNumber}.`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Script Execution Failed',
        description: err instanceof Error ? err.message : 'Could not run script on device',
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
        maxW="680px"
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
            <Box color="#8b5cf6">
              <Icon name="code" size={20} />
            </Box>
            <Box>
              <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                Run Script
              </Text>
              <Text fontSize="12px" color={themeColors.text.muted}>
                {device.serialNumber} · Direct device shell execution
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
            <HStack justify="space-between">
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary}>
                Script Language / Engine
              </Text>
              <select
                value={scriptType}
                onChange={(e) => setScriptType(e.target.value)}
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  background: '#ffffff',
                }}
              >
                <option value="shell">Shell (/bin/sh)</option>
                <option value="bash">Bash (/bin/bash)</option>
                <option value="uci">UCI Batch Commands</option>
              </select>
            </HStack>

            <Box>
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                Script Commands
              </Text>
              <textarea
                value={scriptBody}
                onChange={(e) => setScriptBody(e.target.value)}
                rows={7}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#0f172a',
                  color: '#f8fafc',
                  outline: 'none',
                }}
              />
            </Box>

            {/* Execution Result */}
            {Boolean(scriptMutation.isPending) ? (
              <Center py={6}>
                <HStack gap={2}>
                  <Spinner size="sm" color="#8b5cf6" />
                  <Text fontSize="12px" color={themeColors.text.muted}>
                    Executing script on device...
                  </Text>
                </HStack>
              </Center>
            ) : null}

            {executionResult !== null && !scriptMutation.isPending ? (
              <Box>
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
                  Execution Output
                </Text>
                <Box
                  p={3}
                  borderRadius="8px"
                  bg="#1e293b"
                  color="#38bdf8"
                  fontFamily="mono"
                  fontSize="12px"
                  maxH="180px"
                  overflowY="auto"
                  whiteSpace="pre-wrap"
                >
                  {typeof executionResult === 'string'
                    ? executionResult
                    : JSON.stringify(executionResult, null, 2)}
                </Box>
              </Box>
            ) : null}
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
          <Button size="sm" variant="outline" onClick={onClose} disabled={scriptMutation.isPending}>
            Close
          </Button>
          <Button
            size="sm"
            colorPalette="purple"
            variant="solid"
            onClick={handleRunScript}
            disabled={scriptMutation.isPending}
          >
            Execute Script
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceScriptModal;
