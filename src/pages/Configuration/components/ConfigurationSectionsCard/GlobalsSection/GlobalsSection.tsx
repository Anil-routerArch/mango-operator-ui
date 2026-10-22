import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { GeneralInfoCard } from '../GeneralInfoCard';
import type { GlobalsSectionData } from '../types';

export interface GlobalsSectionProps {
  data: GlobalsSectionData;
  onChange: (updated: GlobalsSectionData) => void;
  onDeleteSection: () => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const GlobalsSection: React.FC<GlobalsSectionProps> = ({
  data,
  onChange,
  onDeleteSection,
  disabled = false,
  isDefaultConfig = false,
}) => {
  return (
    <Flex gap={4} wrap={{ base: 'wrap', lg: 'nowrap' }} align="stretch">
      {/* Left Card: General Information */}
      <GeneralInfoCard
        meta={data.meta}
        onChange={(meta) => onChange({ ...data, meta })}
        onDeleteSection={onDeleteSection}
        disabled={disabled}
        isDefaultConfig={isDefaultConfig}
      />

      {/* Right Card: Globals parameters matching OWPROV */}
      <Box
        flex="1"
        minW={{ base: '100%', md: '360px' }}
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        overflow="hidden"
      >
        <Flex
          px={4}
          py={3}
          align="center"
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
          bg="#f8fafc"
        >
          <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
            Globals
          </Text>
        </Flex>

        <Box p={4}>
          <VStack gap={3} align="stretch">
            <Flex gap={3} wrap="wrap">
              <Box flex="1" minW="160px">
                <HStack gap={1} mb={1}>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                    ipv4-network
                  </Text>
                  <Icon name="info" size={12} color={themeColors.text.muted} />
                  <Text as="span" color="#dc2626">*</Text>
                </HStack>
                <Input
                  size="sm"
                  value={data.ipv4Network}
                  onChange={(e) => onChange({ ...data, ipv4Network: e.target.value })}
                  placeholder="e.g. 192.168.1.0/24"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>

              <Box flex="1" minW="160px">
                <HStack gap={1} mb={1}>
                  <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                    ipv6-network
                  </Text>
                  <Icon name="info" size={12} color={themeColors.text.muted} />
                  <Text as="span" color="#dc2626">*</Text>
                </HStack>
                <Input
                  size="sm"
                  value={data.ipv6Network}
                  onChange={(e) => onChange({ ...data, ipv6Network: e.target.value })}
                  placeholder="e.g. fd00::/64"
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>
            </Flex>
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
};

