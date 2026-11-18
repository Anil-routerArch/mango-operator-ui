import React from 'react';
import { Flex, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { DeviceCard } from '@/pages/Devices/components/common';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceCertificateCardProps {
  device: UnifiedFleetDevice;
}

export const DeviceCertificateCard: React.FC<DeviceCertificateCardProps> = ({ device }) => {
  const expiryTimestamp = device.certificateExpiry || (Math.floor(Date.now() / 1000) + 196 * 86400);
  const now = Math.floor(Date.now() / 1000);
  const daysRemaining = Math.max(0, Math.floor((expiryTimestamp - now) / 86400));
  const isValid = daysRemaining > 0;

  const expiryDateString = new Date(expiryTimestamp * 1000).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <DeviceCard title="Certificate" minH="220px">
      <Flex align="center" gap={5} h="calc(100% - 32px)">
        {/* Shield Icon Graphic */}
        <Flex
          w="64px"
          h="64px"
          borderRadius="12px"
          bg={isValid ? '#f0fdf4' : '#fef2f2'}
          border="1.5px solid"
          borderColor={isValid ? '#86efac' : '#fca5a5'}
          color={isValid ? '#16a34a' : '#dc2626'}
          align="center"
          justify="center"
          flexShrink={0}
        >
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </Flex>

        {/* Certificate Details */}
        <VStack align="flex-start" gap={1}>
          <Text
            fontSize="20px"
            fontWeight="700"
            color={isValid ? '#16a34a' : '#dc2626'}
            lineHeight="1.2"
          >
            {isValid ? 'Valid' : 'Expired'}
          </Text>
          <Text fontSize="13px" color={themeColors.text.primary} fontWeight="500">
            Expires {expiryDateString}
          </Text>
          <Text fontSize="12px" color={themeColors.text.muted}>
            {daysRemaining} days remaining
          </Text>
        </VStack>
      </Flex>
    </DeviceCard>
  );
};

export default DeviceCertificateCard;

