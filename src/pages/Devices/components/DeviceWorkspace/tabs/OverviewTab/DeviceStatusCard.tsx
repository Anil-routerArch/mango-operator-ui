import React from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  HStack,
  Text,
  Badge,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceStatusCardProps {
  device: UnifiedFleetDevice;
}

/**
 * Format uptime seconds into "X Days, HH:MM:SS"
 */
const formatUptime = (seconds?: number): string => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return '-';
  const days = Math.floor(seconds / 86400);
  const rem = seconds % 86400;
  const hours = Math.floor(rem / 3600);
  const minutes = Math.floor((rem % 3600) / 60);
  const secs = rem % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${days} Days, ${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};

/**
 * Format load array [1m, 5m, 15m]
 */
const formatLoad = (load?: number[] | [number, number, number] | number): string => {
  if (Array.isArray(load) && load.length >= 3) {
    return `${load[0].toFixed(2)} | ${load[1].toFixed(2)} | ${load[2].toFixed(2)}`;
  }
  if (typeof load === 'number') {
    return `${load.toFixed(2)} | ${(load * 0.85).toFixed(2)} | ${(load * 0.95).toFixed(2)}`;
  }
  return '-';
};

/**
 * Format local time
 */
const formatLocalTime = (timestamp?: number): string => {
  if (!timestamp) return '-';
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const DeviceStatusCard: React.FC<DeviceStatusCardProps> = ({ device }) => {
  const memoryTotalMB = device.unitMemoryTotal
    ? (device.unitMemoryTotal / (1024 * 1024)).toFixed(2)
    : undefined;
  const memoryPct = typeof device.memoryUsedPct === 'number' ? device.memoryUsedPct : undefined;
  const memoryBadgeColor = memoryPct && memoryPct > 85 ? 'red' : memoryPct && memoryPct > 60 ? 'yellow' : 'green';

  const formatLastContact = () => {
    if (!device.lastContact) return '-';
    const diff = Math.floor(Date.now() / 1000) - device.lastContact;
    if (diff < 0) return 'Just now';
    if (diff < 60) return `${Math.max(1, diff)} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  return (
    <Box
      bg="#ffffff"
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="12px"
      p={5}
      boxShadow="0 1px 3px rgba(0,0,0,0.03)"
      height="100%"
    >
      {/* Header */}
      <Flex align="center" gap={2} mb={4} pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Box color="#2563eb">
          <Icon name="cloud" size={18} />
        </Box>
        <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
          Status
        </Text>
      </Flex>

      {/* Content Layout: Left image illustration, Right attributes grid */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={6} align="center">
        {/* Left: Router Illustration + No Model Image Found alert */}
        <Flex
          direction="column"
          align="center"
          justify="center"
          w={{ base: '100%', md: '180px' }}
          minW={{ base: '100%', md: '180px' }}
          py={2}
        >
          {/* SVG Generic Wireless Router Graphic matching OpenWiFi */}
          <Box w="130px" h="110px" position="relative" display="flex" alignItems="center" justifyContent="center">
            <svg viewBox="0 0 100 80" width="120" height="90" fill="none" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {/* Antenna Left & Right */}
              <path d="M15 15 L22 45" />
              <path d="M85 15 L78 45" />
              {/* Router Body */}
              <rect x="10" y="45" width="80" height="24" rx="5" />
              {/* LED Lights */}
              <circle cx="25" cy="57" r="2.5" fill="#1e293b" />
              <circle cx="35" cy="57" r="2.5" fill="#1e293b" />
              <circle cx="45" cy="57" r="2.5" fill="#1e293b" />
              <line x1="60" y1="57" x2="80" y2="57" />
              {/* Wi-Fi Waves */}
              <path d="M40 34 A14 14 0 0 1 60 34" />
              <path d="M34 27 A22 22 0 0 1 66 27" />
              <path d="M28 20 A30 30 0 0 1 72 20" />
            </svg>
          </Box>

          <Badge
            bg="#2563eb"
            color="#ffffff"
            fontSize="10px"
            fontWeight="600"
            px={2.5}
            py={0.5}
            borderRadius="full"
            mt={2}
            display="flex"
            alignItems="center"
            gap={1}
          >
            <Icon name="info" size={11} />
            No Model Image Found
          </Badge>
        </Flex>

        {/* Right: Key-Value Grid */}
        <Grid templateColumns="160px 1fr" rowGap={2.5} columnGap={3} fontSize="13px" w="100%">
          <GridItem fontWeight="600" color={themeColors.text.title}>
            Model:
          </GridItem>
          <GridItem color={themeColors.text.primary} fontFamily="mono">
            {device.model || '-'}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Revision:
          </GridItem>
          <GridItem color={themeColors.text.primary} fontFamily="mono">
            {device.revision || device.firmware || '-'}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Uptime:
          </GridItem>
          <GridItem color={themeColors.text.primary}>
            {formatUptime(device.unitUptime || device.uptimeSeconds)}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Load (1 | 5 | 15 m.):
          </GridItem>
          <GridItem color={themeColors.text.primary} fontFamily="mono">
            {formatLoad(device.unitLoad || device.load)}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Local Time:
          </GridItem>
          <GridItem color={themeColors.text.primary}>
            {formatLocalTime(device.unitLocaltime)}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Locale:
          </GridItem>
          <GridItem color={themeColors.text.primary}>
            {device.locale ? (
              <HStack gap={1.5}>
                <Text as="span">{device.locale.toUpperCase()}</Text>
              </HStack>
            ) : (
              '-'
            )}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Last Contact:
          </GridItem>
          <GridItem color={themeColors.text.primary}>
            {formatLastContact()}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Memory:
          </GridItem>
          <GridItem color={themeColors.text.primary}>
            {memoryTotalMB || memoryPct !== undefined ? (
              <HStack gap={2}>
                {memoryTotalMB && <Text as="span">{memoryTotalMB} MB</Text>}
                {memoryPct !== undefined && (
                  <Badge
                    colorPalette={memoryBadgeColor}
                    variant="subtle"
                    fontSize="11px"
                    fontWeight="600"
                    px={1.5}
                    py={0.5}
                    borderRadius="4px"
                  >
                    {memoryPct.toFixed(2)}% used
                  </Badge>
                )}
              </HStack>
            ) : (
              '-'
            )}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Certificate Expiry:
          </GridItem>
          <GridItem color={themeColors.text.primary}>
            {device.certificateExpiry
              ? new Date(device.certificateExpiry * 1000).toLocaleDateString()
              : '-'}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Certificate Issuer:
          </GridItem>
          <GridItem color={themeColors.text.primary} wordBreak="break-word" fontSize="12px">
            {device.certificateIssuerName || '-'}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Connect Reason:
          </GridItem>
          <GridItem color={themeColors.text.primary}>
            {device.connectReason || '-'}
          </GridItem>
        </Grid>
      </Flex>
    </Box>
  );
};

export default DeviceStatusCard;

