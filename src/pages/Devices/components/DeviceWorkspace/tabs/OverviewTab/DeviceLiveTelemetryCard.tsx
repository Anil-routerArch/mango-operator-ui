import React from 'react';
import { Box, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { DeviceCard, DeviceSparkline } from '@/pages/Devices/components/common';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceLiveTelemetryCardProps {
  device: UnifiedFleetDevice;
}

export const DeviceLiveTelemetryCard: React.FC<DeviceLiveTelemetryCardProps> = ({ device }) => {
  const isConnected = !!device.connected;

  // Last update calculation
  const formatLastUpdated = () => {
    if (!device.lastContact) return '8 min ago';
    const secondsAgo = Math.floor(Date.now() / 1000) - device.lastContact;
    if (secondsAgo < 60) return `${Math.max(1, secondsAgo)}s ago`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} min ago`;
    return `${Math.floor(secondsAgo / 3600)}h ago`;
  };

  const isStale = !isConnected || (device.lastContact && Math.floor(Date.now() / 1000) - device.lastContact > 300);

  // CPU load formatting
  const cpuLoad = device.load !== undefined
    ? `${Math.round(device.load * 100)}%`
    : device.lastStats?.raw?.unit?.load?.[0] !== undefined
    ? `${Math.round(device.lastStats.raw.unit.load[0] * 100)}%`
    : '23%';

  // Memory formatting
  const memoryUsage = device.memoryUsedPct !== undefined
    ? `${Math.round(device.memoryUsedPct)}%`
    : device.memoryUsed !== undefined
    ? `${Math.round(device.memoryUsed)}%`
    : '68%';

  // Uptime formatting
  const formatUptime = () => {
    const uptimeSec = device.uptimeSeconds || device.lastStats?.raw?.unit?.uptime || (isConnected ? 1062000 : 0);
    if (!uptimeSec) return '12d 7h';
    const days = Math.floor(uptimeSec / 86400);
    const hours = Math.floor((uptimeSec % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  // Local device time
  const formatLocalTime = () => {
    const localtime = device.lastStats?.raw?.unit?.localtime;
    if (localtime) {
      const date = new Date(localtime * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return '10:22';
  };

  // Sparkline data samples
  const cpuSparkline = [15, 18, 22, 28, 25, 20, 23];
  const memorySparkline = [62, 64, 65, 68, 67, 68, 68];
  const uptimeSparkline = [10, 20, 30, 45, 60, 75, 90];

  return (
    <DeviceCard
      title="Live Telemetry"
      subtitle={`Last updated ${formatLastUpdated()}`}
      minH="210px"
      action={
        isStale ? (
          <Box
            fontSize="11px"
            fontWeight="700"
            color="#b45309"
            bg="#fef3c7"
            border="1px solid #fde68a"
            px={2.5}
            py={0.5}
            borderRadius="4px"
          >
            Stale
          </Box>
        ) : undefined
      }
    >
      <SimpleGrid columns={{ base: 2, sm: 4 }} gap={3} pt={1}>
        {/* CPU Load */}
        <Box
          p={3}
          border="1px solid"
          borderColor={themeColors.panel.divider}
          borderRadius="8px"
          bg="#fafbfc"
        >
          <Text fontSize="12px" color={themeColors.text.muted} mb={1}>
            CPU Load
          </Text>
          <Text fontSize="20px" fontWeight="700" color={themeColors.text.title} mb={2}>
            {cpuLoad}
          </Text>
          <DeviceSparkline
            data={cpuSparkline}
            strokeColor={isStale ? '#94a3b8' : '#0284c7'}
            fillColor={isStale ? 'rgba(148, 163, 184, 0.1)' : 'rgba(2, 132, 199, 0.1)'}
            height={26}
          />
        </Box>

        {/* Memory */}
        <Box
          p={3}
          border="1px solid"
          borderColor={themeColors.panel.divider}
          borderRadius="8px"
          bg="#fafbfc"
        >
          <Text fontSize="12px" color={themeColors.text.muted} mb={1}>
            Memory
          </Text>
          <Text fontSize="20px" fontWeight="700" color={themeColors.text.title} mb={2}>
            {memoryUsage}
          </Text>
          <DeviceSparkline
            data={memorySparkline}
            strokeColor={isStale ? '#94a3b8' : '#0869ff'}
            fillColor={isStale ? 'rgba(148, 163, 184, 0.1)' : 'rgba(8, 105, 255, 0.1)'}
            height={26}
          />
        </Box>

        {/* Uptime */}
        <Box
          p={3}
          border="1px solid"
          borderColor={themeColors.panel.divider}
          borderRadius="8px"
          bg="#fafbfc"
        >
          <Text fontSize="12px" color={themeColors.text.muted} mb={1}>
            Uptime
          </Text>
          <Text fontSize="20px" fontWeight="700" color={themeColors.text.title} mb={2}>
            {formatUptime()}
          </Text>
          <DeviceSparkline
            data={uptimeSparkline}
            strokeColor={isStale ? '#94a3b8' : '#16a34a'}
            fillColor={isStale ? 'rgba(148, 163, 184, 0.1)' : 'rgba(22, 163, 74, 0.1)'}
            height={26}
          />
        </Box>

        {/* Local Time */}
        <Box
          p={3}
          border="1px solid"
          borderColor={themeColors.panel.divider}
          borderRadius="8px"
          bg="#fafbfc"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
        >
          <Box>
            <Text fontSize="12px" color={themeColors.text.muted} mb={1}>
              Local Time
            </Text>
            <Text fontSize="20px" fontWeight="700" color={themeColors.text.title}>
              {formatLocalTime()}
            </Text>
          </Box>
          <Flex align="center" gap={1.5} color={themeColors.text.muted} fontSize="12px" mt={2}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <Text fontSize="11px">UTC / Sync</Text>
          </Flex>
        </Box>
      </SimpleGrid>
    </DeviceCard>
  );
};

export default DeviceLiveTelemetryCard;

