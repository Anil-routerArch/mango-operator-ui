import React from 'react';
import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

interface DiffPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  configName: string;
}

export const DiffPreviewModal: React.FC<DiffPreviewModalProps> = ({
  isOpen,
  onClose,
  configName,
}) => {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0,0,0,0.4)"
      zIndex={2000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="#ffffff"
        borderRadius="8px"
        w="100%"
        maxW="650px"
        boxShadow="0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
        overflow="hidden"
      >
        {/* Modal Header */}
        <Flex justify="space-between" align="center" p={4} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
          <HStack gap={2}>
            <Icon name="sliders" size={18} color={themeColors.brand.accent} />
            <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
              Compare Changes — {configName}
            </Text>
          </HStack>
          <Button variant="plain" size="xs" p={1} onClick={onClose} aria-label="Close">
            <Icon name="x" size={16} />
          </Button>
        </Flex>

        {/* Modal Body */}
        <Box p={5} maxH="450px" overflowY="auto">
          <Text fontSize="12px" color={themeColors.text.secondary} mb={4}>
            Dry-run configuration calculation based on <Text as="span" fontWeight="600">APConfig hierarchy</Text> and local profile overrides:
          </Text>

          {/* Diff Table */}
          <Box border="1px solid" borderColor={themeColors.panel.divider} borderRadius="6px" overflow="hidden">
            <Flex bg="#f8fafc" px={3} py={2} fontSize="11px" fontWeight="700" color={themeColors.text.secondary} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
              <Box flex="1.5">Setting Path</Box>
              <Box flex="1">Previous (Inherited)</Box>
              <Box flex="1">Proposed (Effective)</Box>
              <Box w="100px" textAlign="right">Source</Box>
            </Flex>

            <Flex align="center" px={3} py={2.5} fontSize="12px" bg="#fffbeb" borderBottom="1px solid" borderColor={themeColors.panel.divider}>
              <Box flex="1.5" fontWeight="600" color={themeColors.text.primary}>
                radios.0.tx-power
              </Box>
              <Box flex="1" color="#ef4444" textDecoration="line-through">
                18 dBm
              </Box>
              <Box flex="1" fontWeight="700" color="#16a34a">
                20 dBm
              </Box>
              <Box w="100px" textAlign="right">
                <Box as="span" fontSize="10px" fontWeight="600" px={1.5} py={0.5} borderRadius="4px" bg="#fef3c7" color="#b45309">
                  Local Override
                </Box>
              </Box>
            </Flex>

            <Flex align="center" px={3} py={2.5} fontSize="12px">
              <Box flex="1.5" color={themeColors.text.secondary}>
                radios.0.channel
              </Box>
              <Box flex="1" color={themeColors.text.secondary}>
                Auto
              </Box>
              <Box flex="1" color={themeColors.text.secondary}>
                Auto (Unchanged)
              </Box>
              <Box w="100px" textAlign="right" fontSize="11px" color={themeColors.text.muted}>
                Standard 5 GHz
              </Box>
            </Flex>
          </Box>
        </Box>

        {/* Modal Footer */}
        <Flex justify="flex-end" gap={3} p={4} bg="#f8fafc" borderTop="1px solid" borderColor={themeColors.panel.divider}>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close preview
          </Button>
          <Button
            size="sm"
            bg={themeColors.brand.primary}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.primaryHover }}
            onClick={onClose}
          >
            Acknowledge & Proceed
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};
