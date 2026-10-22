import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { ToggleSwitch } from '../ToggleSwitch';
import type { ServicesSectionData } from '../types';

interface MdnsProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Mdns: React.FC<MdnsProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Mdns</Text>
      </Flex>
      <Box p={4}>
        <Flex align="center" justify="space-between">
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
            enable <Text as="span" color="#dc2626">*</Text>
          </Text>
          <ToggleSwitch
            checked={data.mdns.enable}
            onChange={(checked) =>
              onChange({
                ...data,
                mdns: { enable: checked },
              })
            }
            disabled={disabled}
          />
        </Flex>
      </Box>
    </Box>
  );
};

