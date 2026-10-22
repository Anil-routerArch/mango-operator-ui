import React from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

interface ViewWarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  warnings: string[];
}

export const ViewWarningsModal: React.FC<ViewWarningsModalProps> = ({
  isOpen,
  onClose,
  warnings,
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
        w="min(560px, 92vw)"
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        overflow="hidden"
        border="1px solid"
        borderColor={themeColors.panel.border}
      >
        {/* Header */}
        <Flex
          px={5}
          py={3.5}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
        >
          <HStack gap={2}>
            <Box
              w="24px"
              h="24px"
              borderRadius="4px"
              bg={warnings.length > 0 ? '#fef3c7' : '#dcfce7'}
              color={warnings.length > 0 ? '#b45309' : '#166534'}
              display="grid"
              placeItems="center"
            >
              <Icon name={warnings.length > 0 ? 'alertTriangle' : 'check'} size={15} />
            </Box>
            <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
              Configuration Warnings ({warnings.length})
            </Text>
          </HStack>

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

        {/* Body */}
        <Box p={5}>
          {warnings.length === 0 ? (
            <Flex
              p={4}
              bg="#f0fdf4"
              border="1px solid"
              borderColor="#bbf7d0"
              borderRadius="6px"
              gap={2.5}
              align="center"
            >
              <Icon name="check" size={20} color="#16a34a" />
              <Box>
                <Text fontSize="13px" fontWeight="700" color="#15803d">
                  No Configuration Warnings
                </Text>
                <Text fontSize="12px" color="#166534">
                  All active configuration sections pass semantic checks without issues.
                </Text>
              </Box>
            </Flex>
          ) : (
            <VStack gap={2.5} align="stretch">
              {warnings.map((w, idx) => (
                <Flex
                  key={idx}
                  p={3}
                  bg="#fffbeb"
                  border="1px solid"
                  borderColor="#fde68a"
                  borderRadius="6px"
                  gap={2}
                  align="flex-start"
                >
                  <Box color="#d97706" mt={0.5}>
                    <Icon name="alertTriangle" size={15} />
                  </Box>
                  <Text fontSize="12px" color="#92400e" lineHeight="1.4">
                    {w}
                  </Text>
                </Flex>
              ))}
            </VStack>
          )}
        </Box>

        {/* Footer */}
        <Flex
          px={5}
          py={3}
          bg="#f8fafc"
          borderTop="1px solid"
          borderColor={themeColors.panel.divider}
          justify="flex-end"
        >
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

