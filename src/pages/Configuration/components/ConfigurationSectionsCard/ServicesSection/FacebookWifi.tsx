import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import type { ServicesSectionData } from '../types';

interface FacebookWifiProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const FacebookWifi: React.FC<FacebookWifiProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Facebook WiFi</Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              vendor-id <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={data.facebookWifi.vendorId}
              onChange={(e) =>
                onChange({
                  ...data,
                  facebookWifi: { ...data.facebookWifi, vendorId: e.target.value },
                })
              }
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              gateway-id <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={data.facebookWifi.gatewayId}
              onChange={(e) =>
                onChange({
                  ...data,
                  facebookWifi: { ...data.facebookWifi, gatewayId: e.target.value },
                })
              }
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              secret <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="password"
              value={data.facebookWifi.secret}
              onChange={(e) =>
                onChange({
                  ...data,
                  facebookWifi: { ...data.facebookWifi, secret: e.target.value },
                })
              }
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

