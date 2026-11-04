import React, { useState } from 'react';
import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { DeviceCard } from '@/pages/Devices/components/common';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceIdentityCardProps {
  device: UnifiedFleetDevice;
}

export const DeviceIdentityCard: React.FC<DeviceIdentityCardProps> = ({ device }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Format MAC with colons if plain hex
  const formatMac = (mac?: string) => {
    if (!mac) return '-';
    if (mac.includes(':')) return mac.toUpperCase();
    return (mac.match(/.{1,2}/g)?.join(':') || mac).toUpperCase();
  };

  const handleCopy = (val: string, fieldName: string) => {
    navigator.clipboard.writeText(val);
    setCopiedField(fieldName);
    toaster.create({
      title: 'Copied',
      description: `${fieldName} copied to clipboard`,
      type: 'info',
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fields = [
    {
      label: 'Serial Number',
      value: device.serialNumber,
      copyable: true,
      key: 'serial',
    },
    {
      label: 'MAC Address',
      value: formatMac(device.macAddress || device.serialNumber),
      copyable: true,
      key: 'mac',
    },
    {
      label: 'Model',
      value: device.model || device.deviceType || '-',
      copyable: false,
      key: 'model',
    },
    {
      label: 'Revision',
      value: device.revision || '-',
      copyable: false,
      key: 'revision',
    },
    {
      label: 'Property',
      value: device.entityName || '-',
      copyable: false,
      key: 'property',
    },
    {
      label: 'Venue',
      value: device.venueName || '-',
      copyable: false,
      key: 'venue',
    },
  ];

  return (
    <DeviceCard title="Identity & Location" minH="210px">
      <VStack align="stretch" gap={2}>
        {fields.map((f) => (
          <Flex
            key={f.key}
            justify="space-between"
            align="center"
            fontSize="13px"
            py={0.5}
            borderBottom="1px solid"
            borderColor="rgba(0,0,0,0.03)"
          >
            <Text color={themeColors.text.muted}>{f.label}</Text>
            <HStack gap={1.5}>
              <Text fontWeight="600" color={themeColors.text.primary} fontFamily={f.copyable ? 'monospace' : 'inherit'}>
                {f.value}
              </Text>
              {f.copyable && (
                <Box
                  as="button"
                  color={copiedField === f.key ? '#16a34a' : themeColors.text.muted}
                  _hover={{ color: themeColors.brand.accent }}
                  onClick={() => handleCopy(f.value, f.label)}
                  aria-label={`Copy ${f.label}`}
                  p={0.5}
                >
                  <Icon name={copiedField === f.key ? 'check' : 'copy'} size={14} />
                </Box>
              )}
            </HStack>
          </Flex>
        ))}
      </VStack>
    </DeviceCard>
  );
};

export default DeviceIdentityCard;

