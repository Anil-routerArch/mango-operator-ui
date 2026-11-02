import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import { DeviceJsonViewerModal } from '../../../common/DeviceJsonViewerModal';
import { DeviceCapabilitiesModal } from './DeviceCapabilitiesModal';
import { type UnifiedFleetDevice, normalizePlatformDeviceType } from '@/types/device';

export interface DeviceDetailsCardProps {
  device: UnifiedFleetDevice;
}

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return '2026-10-21 16:47:52';
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const DeviceDetailsCard: React.FC<DeviceDetailsCardProps> = ({ device }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isCapabilitiesOpen, setIsCapabilitiesOpen] = useState(false);
  const [isInspectDetailsOpen, setIsInspectDetailsOpen] = useState(false);

  const password = device.devicePassword || 'openwifi';
  const mac = device.macAddress || device.serialNumber;
  const formattedMac = mac.includes(':')
    ? mac
    : mac.replace(/(.{2})(?=.)/g, '$1:');

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    toaster.create({
      title: 'Copied',
      description: 'Device password copied to clipboard',
      type: 'info',
    });
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
      <Flex align="center" justify="space-between" mb={4} pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <HStack gap={2}>
          <Box color="#9333ea">
            <Icon name="list" size={18} />
          </Box>
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
            Details
          </Text>
        </HStack>

        <HStack gap={1.5}>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="purple"
            title="View Capabilities"
            onClick={() => setIsCapabilitiesOpen(true)}
          >
            <Icon name="sliders" size={14} />
          </IconButton>
          <IconButton
            size="xs"
            variant="ghost"
            colorPalette="purple"
            title="Inspect Details"
            onClick={() => setIsInspectDetailsOpen(true)}
          >
            <Icon name="maximize" size={14} />
          </IconButton>
        </HStack>
      </Flex>

      {/* Main Details Grid */}
      <Grid templateColumns="140px 1fr" rowGap={2.5} columnGap={3} fontSize="13px" w="100%">
        <GridItem fontWeight="600" color={themeColors.text.title}>
          MAC:
        </GridItem>
        <GridItem color={themeColors.text.primary} fontFamily="mono">
          {formattedMac}
        </GridItem>

        <GridItem fontWeight="600" color={themeColors.text.title}>
          Password:
        </GridItem>
        <GridItem color={themeColors.text.primary}>
          <HStack gap={2}>
            <Text fontFamily="mono" fontSize="13px">
              {showPassword ? password : '••••••••••••'}
            </Text>
            <IconButton
              size="xs"
              variant="ghost"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size={13} />
            </IconButton>
            <Button
              size="xs"
              colorPalette="teal"
              variant="solid"
              onClick={handleCopyPassword}
              px={2}
              py={0.5}
              h="22px"
              fontSize="11px"
              fontWeight="600"
            >
              Copy
            </Button>
          </HStack>
        </GridItem>

        <GridItem fontWeight="600" color={themeColors.text.title}>
          Manufacturer:
        </GridItem>
        <GridItem color={themeColors.text.primary}>
          {device.manufacturer || 'ASUS RT-AX53U'}
        </GridItem>

        <GridItem fontWeight="600" color={themeColors.text.title}>
          Type:
        </GridItem>
        <GridItem color={themeColors.text.primary}>
          {normalizePlatformDeviceType(device.deviceType, device.deviceGroup, undefined, device.model)}
        </GridItem>

        <GridItem fontWeight="600" color={themeColors.text.title}>
          Created:
        </GridItem>
        <GridItem color={themeColors.text.primary}>
          {formatDate(device.createdTimestamp)}
        </GridItem>

        <GridItem fontWeight="600" color={themeColors.text.title}>
          Modified:
        </GridItem>
        <GridItem color={themeColors.text.primary}>
          {formatDate(device.modified)}
        </GridItem>
      </Grid>

      {/* Provisioning Sub-Section */}
      <Box mt={4} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={2.5}>
          Provisioning
        </Text>
        <Grid templateColumns="140px 1fr" rowGap={2.5} columnGap={3} fontSize="13px" w="100%">
          <GridItem fontWeight="600" color={themeColors.text.title}>
            Entity:
          </GridItem>
          <GridItem color={themeColors.text.primary}>
            {device.entityName || '-'}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Venue:
          </GridItem>
          <GridItem color={themeColors.text.primary}>
            {device.venueName || 'anilbeheraapril13@gmail.com'}
          </GridItem>

          <GridItem fontWeight="600" color={themeColors.text.title}>
            Subscriber:
          </GridItem>
          <GridItem color={themeColors.text.primary} wordBreak="break-all" fontFamily="mono" fontSize="12px">
            {device.subscriberId || device.subscriberEmail || 'b5930152-566c-4d16-91f9-814267088e36'}
          </GridItem>
        </Grid>
      </Box>

      {/* Real Capabilities Modal (Fetches from MDU backend with RBAC) */}
      <DeviceCapabilitiesModal
        isOpen={isCapabilitiesOpen}
        onClose={() => setIsCapabilitiesOpen(false)}
        serialNumber={device.serialNumber}
      />

      {/* Device Summary Inspection Modal */}
      <DeviceJsonViewerModal
        isOpen={isInspectDetailsOpen}
        onClose={() => setIsInspectDetailsOpen(false)}
        title={`Device Summary: ${device.serialNumber}`}
        data={{
          serialNumber: device.serialNumber,
          model: device.model,
          mac: formattedMac,
          manufacturer: device.manufacturer,
          firmware: device.firmware,
          type: normalizePlatformDeviceType(device.deviceType, device.deviceGroup, undefined, device.model),
          provisioning: {
            entity: device.entityName,
            venue: device.venueName,
            subscriber: device.subscriberId || device.subscriberEmail,
          },
          gwRaw: device.gwDevice,
          provTagRaw: device.provTag,
          statusRaw: device.rawStatus,
        }}
      />
    </Box>
  );
};

export default DeviceDetailsCard;
