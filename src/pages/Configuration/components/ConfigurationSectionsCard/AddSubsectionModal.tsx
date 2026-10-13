import React from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { SubsectionKey } from './types';

interface AddSubsectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSections: SubsectionKey[];
  onAddSection: (section: SubsectionKey) => void;
}

const AVAILABLE_SUBSECTIONS: { key: SubsectionKey; label: string }[] = [
  { key: 'globals', label: 'Globals' },
  { key: 'unit', label: 'Unit' },
  { key: 'metrics', label: 'Metrics' },
  { key: 'services', label: 'Services' },
  { key: 'radios', label: 'Radios' },
  { key: 'interfaces', label: 'Interfaces' },
  { key: 'third-party', label: 'Third Party' },
];

export const AddSubsectionModal: React.FC<AddSubsectionModalProps> = ({
  isOpen,
  onClose,
  activeSections,
  onAddSection,
}) => {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1400"
      p={4}
    >
      <Box
        w="min(400px, 92vw)"
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        overflow="hidden"
        border="1px solid"
        borderColor={themeColors.panel.border}
      >
        {/* Modal Header */}
        <Flex
          px={5}
          py={3.5}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
        >
          <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
            Add Subsection
          </Text>
          <Box
            as="button"
            cursor="pointer"
            p={1}
            borderRadius="4px"
            color={themeColors.text.secondary}
            _hover={{ bg: '#f1f5f9', color: themeColors.text.title }}
            onClick={onClose}
          >
            <Icon name="x" size={16} />
          </Box>
        </Flex>

        {/* Modal Body - Pill buttons matching OWPROV */}
        <Box p={6}>
          <VStack gap={2.5} align="center">
            {AVAILABLE_SUBSECTIONS.map((sub) => {
              const isAdded = activeSections.includes(sub.key);
              return (
                <Button
                  key={sub.key}
                  w="140px"
                  h="36px"
                  borderRadius="18px"
                  fontSize="13px"
                  fontWeight="600"
                  bg={isAdded ? '#e2e8f0' : '#2563eb'}
                  color={isAdded ? '#94a3b8' : '#ffffff'}
                  _hover={isAdded ? undefined : { bg: '#1d4ed8' }}
                  disabled={isAdded}
                  onClick={() => {
                    onAddSection(sub.key);
                    onClose();
                  }}
                  cursor={isAdded ? 'not-allowed' : 'pointer'}
                >
                  {sub.label}
                </Button>
              );
            })}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

