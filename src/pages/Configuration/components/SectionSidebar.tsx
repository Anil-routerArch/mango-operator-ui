import React from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { ConfigSectionType } from '../types/configuration';

interface SectionItem {
  id: ConfigSectionType;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'general', label: 'General' },
  { id: 'radios', label: 'Radios' },
  { id: 'interfaces', label: 'Interfaces' },
  { id: 'services', label: 'Services' },
  { id: 'metrics', label: 'Metrics' },
  { id: 'unit', label: 'Unit' },
];

interface SectionSidebarProps {
  activeSection: ConfigSectionType;
  onSelectSection: (section: ConfigSectionType) => void;
}

export const SectionSidebar: React.FC<SectionSidebarProps> = ({
  activeSection,
  onSelectSection,
}) => {
  return (
    <Box
      w="180px"
      minW="180px"
      bg="#ffffff"
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="6px"
      p={3}
    >
      <Text fontSize="12px" fontWeight="700" color={themeColors.text.muted} textTransform="uppercase" mb={3} px={2}>
        Sections
      </Text>
      <VStack gap={1} align="stretch">
        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <Flex
              key={sec.id}
              align="center"
              justify="space-between"
              px={3}
              py={2}
              borderRadius="4px"
              cursor="pointer"
              bg={isActive ? '#eff6ff' : 'transparent'}
              border="1px solid"
              borderColor={isActive ? '#bfdbfe' : 'transparent'}
              color={isActive ? themeColors.brand.accent : themeColors.text.primary}
              fontWeight={isActive ? '600' : '500'}
              fontSize="13px"
              transition="all 0.15s ease"
              _hover={{
                bg: isActive ? '#eff6ff' : '#f8fafc',
              }}
              onClick={() => onSelectSection(sec.id)}
            >
              <Text>{sec.label}</Text>
              <Box color={themeColors.brand.primary}>
                <Icon name="check" size={14} />
              </Box>
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
};

