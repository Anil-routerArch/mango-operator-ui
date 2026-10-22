import React from 'react';
import { Box, Flex, Input, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import type { ServicesSectionData } from '../types';

interface HttpProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Http: React.FC<HttpProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Http</Text>
      </Flex>
      <Box p={4}>
        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          http-port <Text as="span" color="#dc2626">*</Text>
        </Text>
        <Input
          size="sm"
          type="number"
          value={data.http.httpPort}
          onChange={(e) =>
            onChange({
              ...data,
              http: { httpPort: Number(e.target.value) || 80 },
            })
          }
          disabled={disabled}
          borderRadius="4px"
        />
      </Box>
    </Box>
  );
};

