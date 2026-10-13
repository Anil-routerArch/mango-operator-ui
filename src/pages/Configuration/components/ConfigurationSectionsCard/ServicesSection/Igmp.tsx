import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { ToggleSwitch } from '../ToggleSwitch';
import type { ServicesSectionData } from '../types';

interface IgmpProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const Igmp: React.FC<IgmpProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="8px" bg="#ffffff" overflow="hidden">
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>Igmp</Text>
      </Flex>
      <Box p={4}>
        <Flex align="center" justify="space-between">
          <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
            enable <Text as="span" color="#dc2626">*</Text>
          </Text>
          <ToggleSwitch
            checked={data.igmp.enable}
            onChange={(checked) =>
              onChange({
                ...data,
                igmp: { enable: checked },
              })
            }
            disabled={disabled}
          />
        </Flex>
      </Box>
    </Box>
  );
};

