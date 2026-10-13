import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import type { ServicesSectionData } from '../types';

interface RttyProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Rtty: React.FC<RttyProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Rtty</Text>
      </Flex>
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Flex gap={2}>
            <Box flex="2">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                host <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={data.rtty.host}
                onChange={(e) => onChange({ ...data, rtty: { ...data.rtty, host: e.target.value } })}
                placeholder="rtty.openwifi.net"
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
            <Box flex="1">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                port <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                value={data.rtty.port}
                onChange={(e) => onChange({ ...data, rtty: { ...data.rtty, port: Number(e.target.value) || 5912 } })}
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          </Flex>
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              token <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={data.rtty.token}
              onChange={(e) => onChange({ ...data, rtty: { ...data.rtty, token: e.target.value } })}
              placeholder="Authentication token"
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

