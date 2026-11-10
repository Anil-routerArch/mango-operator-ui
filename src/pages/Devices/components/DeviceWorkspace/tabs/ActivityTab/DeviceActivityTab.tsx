import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { DeviceCard, DeviceJsonViewerModal } from '@/pages/Devices/components/common';
import { useDeviceCommands, useDeviceLogs } from '@/api/devices';
import { getApiErrorMessage } from '@/api/errors';
import type { UnifiedFleetDevice, DeviceCommandHistory, DeviceLog } from '@/types/device';

export interface DeviceActivityTabProps {
  device: UnifiedFleetDevice;
}

export const DeviceActivityTab: React.FC<DeviceActivityTabProps> = ({ device }) => {
  const [subView, setSubView] = useState<'commands' | 'reboots'>('commands');
  const [selectedCommand, setSelectedCommand] = useState<DeviceCommandHistory | null>(null);
  const [selectedLog, setSelectedLog] = useState<DeviceLog | null>(null);

  const {
    data: commandsData,
    isLoading: isCommandsLoading,
    isError: isCommandsError,
    error: commandsError,
    refetch: refetchCommands,
  } = useDeviceCommands(device.serialNumber, 25);

  const {
    data: rebootLogsData,
    isLoading: isRebootsLoading,
    isError: isRebootsError,
    error: rebootsError,
    refetch: refetchReboots,
  } = useDeviceLogs(
    device.serialNumber,
    2, // logType: 2 = Reboot logs in OpenWiFi
    25
  );

  // Authoritative commands list from MDU backend - no fabricated synthetic operations
  const commandsList: DeviceCommandHistory[] = React.useMemo(() => {
    return Array.isArray(commandsData) ? commandsData : [];
  }, [commandsData]);

  // Authoritative reboot logs from MDU backend - no fabricated reboot events
  const rebootsList: DeviceLog[] = React.useMemo(() => {
    return Array.isArray(rebootLogsData) ? rebootLogsData : [];
  }, [rebootLogsData]);

  const formatTimestamp = (ts?: number) => {
    if (!ts) return '-';
    const secondsAgo = Math.floor(Date.now() / 1000) - ts;
    if (secondsAgo < 60) return `${Math.max(1, secondsAgo)}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} min ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { bg: '#dcfce7', text: '#16a34a' };
      case 'failed':
      case 'error':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'pending':
        return { bg: '#fef3c7', text: '#d97706' };
      default:
        return { bg: '#f1f5f9', text: '#475569' };
    }
  };

  return (
    <DeviceCard p={0}>
      {/* Sub-view toggle bar */}
      <Flex
        px={6}
        pt={3}
        borderBottom="1px solid"
        borderColor={themeColors.panel.divider}
        justify="space-between"
        align="center"
      >
        <HStack gap={6}>
          <Box
            as="button"
            pb={3}
            fontSize="13px"
            fontWeight={subView === 'commands' ? '600' : '500'}
            color={subView === 'commands' ? themeColors.brand.accent : themeColors.text.secondary}
            borderBottom="2px solid"
            borderColor={subView === 'commands' ? themeColors.brand.accent : 'transparent'}
            onClick={() => setSubView('commands')}
          >
            Commands History ({isCommandsLoading ? '...' : commandsList.length})
          </Box>
          <Box
            as="button"
            pb={3}
            fontSize="13px"
            fontWeight={subView === 'reboots' ? '600' : '500'}
            color={subView === 'reboots' ? themeColors.brand.accent : themeColors.text.secondary}
            borderBottom="2px solid"
            borderColor={subView === 'reboots' ? themeColors.brand.accent : 'transparent'}
            onClick={() => setSubView('reboots')}
          >
            Reboot History ({isRebootsLoading ? '...' : rebootsList.length})
          </Box>
        </HStack>

        <Button
          size="xs"
          variant="outline"
          onClick={() => (subView === 'commands' ? refetchCommands() : refetchReboots())}
          gap={1}
          mb={2}
        >
          {isCommandsLoading || isRebootsLoading ? <Spinner size="xs" /> : <Icon name="refresh" size={13} />}
          Refresh
        </Button>
      </Flex>

      {/* Commands Table View */}
      {subView === 'commands' ? (
        <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" overflow="hidden" bg="#ffffff" m={4}>
          {isCommandsLoading ? (
            <Flex justify="center" align="center" minH="240px" direction="column" gap={3}>
              <Spinner size="lg" color={themeColors.brand.accent} />
              <Text fontSize="13px" color={themeColors.text.muted}>
                Loading command history...
              </Text>
            </Flex>
          ) : isCommandsError ? (
            <Flex justify="center" align="center" minH="240px" direction="column" gap={3} p={6}>
              <Box color="#dc2626">
                <Icon name="alertTriangle" size={32} />
              </Box>
              <Text fontSize="14px" fontWeight="600" color="#dc2626">
                Failed to load command history
              </Text>
              <Text fontSize="13px" color={themeColors.text.secondary} textAlign="center" maxW="460px">
                {getApiErrorMessage(commandsError, 'An error occurred while fetching device commands.')}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchCommands()}
                gap={1.5}
                mt={1}
                borderColor={themeColors.input.iconBtnBorder}
                _hover={{ bg: '#f1f5f9' }}
              >
                <Icon name="refresh" size={14} />
                Retry
              </Button>
            </Flex>
          ) : commandsList.length === 0 ? (
            <Flex justify="center" align="center" minH="200px" color={themeColors.text.muted}>
              <Text fontSize="13px">No commands recorded for this device.</Text>
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Box minW="750px">
                <Flex
                  bg="#f8fafc"
                  borderBottom="1px solid"
                  borderColor={themeColors.panel.border}
                  py={2.5}
                  px={4}
                  fontSize="11px"
                  fontWeight="700"
                  color={themeColors.text.secondary}
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  <Box flex="1">SUBMITTED</Box>
                  <Box flex="1.2">COMMAND</Box>
                  <Box flex="1">STATUS</Box>
                  <Box flex="1">EXECUTED</Box>
                  <Box flex="1">COMPLETED</Box>
                  <Box flex="0.8">ERR CODE</Box>
                  <Box w="60px" textAlign="right">DETAILS</Box>
                </Flex>

                {commandsList.map((cmd) => {
                  const colors = getStatusColor(cmd.status);
                  return (
                    <Flex
                      key={cmd.UUID || cmd.id}
                      align="center"
                      py={3}
                      px={4}
                      borderBottom="1px solid"
                      borderColor={themeColors.panel.divider}
                      fontSize="12px"
                      _last={{ borderBottom: 'none' }}
                      _hover={{ bg: '#fafbfc' }}
                    >
                      <Box flex="1" color={themeColors.text.muted} fontSize="12px" whiteSpace="nowrap">
                        {formatTimestamp(cmd.submitted)}
                      </Box>
                      <Box flex="1.2" fontWeight="600" color={themeColors.text.title} fontFamily="monospace">
                        {cmd.command || '-'}
                      </Box>
                      <Box flex="1">
                        <Box
                          fontSize="11px"
                          fontWeight="700"
                          color={colors.text}
                          bg={colors.bg}
                          px={2.5}
                          py={0.5}
                          borderRadius="4px"
                          display="inline-block"
                        >
                          {cmd.status || '-'}
                        </Box>
                      </Box>
                      <Box flex="1" color={themeColors.text.secondary} fontSize="12px">
                        {formatTimestamp(cmd.executionTime || cmd.executed || cmd.submitted)}
                      </Box>
                      <Box flex="1" color={themeColors.text.secondary} fontSize="12px">
                        {formatTimestamp(cmd.completed)}
                      </Box>
                      <Box flex="0.8" color={themeColors.text.muted} fontFamily="monospace">
                        {cmd.errorCode !== undefined ? cmd.errorCode : '-'}
                      </Box>
                      <Box w="60px" textAlign="right">
                        <Button
                          size="xs"
                          variant="ghost"
                          color={themeColors.brand.accent}
                          _hover={{ bg: themeColors.brand.accentLight }}
                          onClick={() => setSelectedCommand(cmd)}
                        >
                          <Icon name="search" size={14} />
                        </Button>
                      </Box>
                    </Flex>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        /* Reboots Table View */
        <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" overflow="hidden" bg="#ffffff" m={4}>
          {isRebootsLoading ? (
            <Flex justify="center" align="center" minH="240px" direction="column" gap={3}>
              <Spinner size="lg" color={themeColors.brand.accent} />
              <Text fontSize="13px" color={themeColors.text.muted}>
                Loading reboot history...
              </Text>
            </Flex>
          ) : isRebootsError ? (
            <Flex justify="center" align="center" minH="240px" direction="column" gap={3} p={6}>
              <Box color="#dc2626">
                <Icon name="alertTriangle" size={32} />
              </Box>
              <Text fontSize="14px" fontWeight="600" color="#dc2626">
                Failed to load reboot history
              </Text>
              <Text fontSize="13px" color={themeColors.text.secondary} textAlign="center" maxW="460px">
                {getApiErrorMessage(rebootsError, 'An error occurred while fetching device reboot logs.')}
              </Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchReboots()}
                gap={1.5}
                mt={1}
                borderColor={themeColors.input.iconBtnBorder}
                _hover={{ bg: '#f1f5f9' }}
              >
                <Icon name="refresh" size={14} />
                Retry
              </Button>
            </Flex>
          ) : rebootsList.length === 0 ? (
            <Flex justify="center" align="center" minH="200px" color={themeColors.text.muted}>
              <Text fontSize="13px">No reboot events recorded for this device.</Text>
            </Flex>
          ) : (
            <Box overflowX="auto">
              <Box minW="600px">
                <Flex
                  bg="#f8fafc"
                  borderBottom="1px solid"
                  borderColor={themeColors.panel.border}
                  py={2.5}
                  px={4}
                  fontSize="11px"
                  fontWeight="700"
                  color={themeColors.text.secondary}
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  <Box flex="1">TIME</Box>
                  <Box flex="2.5">BOOT REASON / LOG</Box>
                  <Box flex="0.8">SEVERITY</Box>
                  <Box w="60px" textAlign="right">DETAILS</Box>
                </Flex>

                {rebootsList.map((rb, idx) => (
                  <Flex
                    key={rb.UUID || rb.id || idx}
                    align="center"
                    py={3}
                    px={4}
                    borderBottom="1px solid"
                    borderColor={themeColors.panel.divider}
                    fontSize="12px"
                    _last={{ borderBottom: 'none' }}
                    _hover={{ bg: '#fafbfc' }}
                  >
                    <Box flex="1" color={themeColors.text.muted} fontSize="12px">
                      {formatTimestamp(rb.recorded)}
                    </Box>
                    <Box flex="2.5" fontWeight="600" color={themeColors.text.title}>
                      <HStack gap={2}>
                        <Box w="6px" h="6px" borderRadius="full" bg="#0284c7" />
                        <Text fontFamily="monospace">{rb.log || '-'}</Text>
                      </HStack>
                    </Box>
                    <Box flex="0.8" color={themeColors.text.secondary}>
                      {rb.severity !== undefined ? rb.severity : '-'}
                    </Box>
                    <Box w="60px" textAlign="right">
                      <Button
                        size="xs"
                        variant="ghost"
                        color={themeColors.brand.accent}
                        _hover={{ bg: themeColors.brand.accentLight }}
                        onClick={() => setSelectedLog(rb)}
                      >
                        <Icon name="search" size={14} />
                      </Button>
                    </Box>
                  </Flex>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Details Modals */}
      {selectedCommand && (
        <DeviceJsonViewerModal
          isOpen={!!selectedCommand}
          onClose={() => setSelectedCommand(null)}
          title={`Command Details: ${selectedCommand.command}`}
          subtitle={`Command ID: ${selectedCommand.UUID || selectedCommand.id} · Status: ${selectedCommand.status}`}
          data={selectedCommand.results || selectedCommand}
        />
      )}

      {selectedLog && (
        <DeviceJsonViewerModal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Reboot Log Details"
          subtitle={`Recorded: ${new Date(selectedLog.recorded * 1000).toLocaleString()}`}
          data={selectedLog.data || selectedLog}
        />
      )}
    </DeviceCard>
  );
};

export default DeviceActivityTab;
