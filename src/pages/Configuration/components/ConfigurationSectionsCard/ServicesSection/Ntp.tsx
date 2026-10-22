import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { ToggleSwitch } from '../ToggleSwitch';
import type { ServicesSectionData } from '../types';

interface NtpProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Ntp: React.FC<NtpProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>NTP</Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              servers <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={data.ntp.servers.join(', ')}
              onChange={(e) =>
                onChange({
                  ...data,
                  ntp: {
                    ...data.ntp,
                    servers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              placeholder="0.pool.ntp.org, 1.pool.ntp.org"
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
          <Flex align="center" justify="space-between">
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
              local-server <Text as="span" color="#dc2626">*</Text>
            </Text>
            <ToggleSwitch
              checked={data.ntp.localServer}
              onChange={(checked) =>
                onChange({
                  ...data,
                  ntp: { ...data.ntp, localServer: checked },
                })
              }
              disabled={disabled}
            />
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

