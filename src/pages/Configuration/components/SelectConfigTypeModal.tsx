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

export interface SelectConfigTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'default' | 'modular') => void;
}

export const SelectConfigTypeModal: React.FC<SelectConfigTypeModalProps> = ({
  isOpen,
  onClose,
  onSelectType,
}) => {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1200"
      p={4}
    >
      <Box
        w="min(680px, 95vw)"
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        overflow="hidden"
        border="1px solid"
        borderColor={themeColors.panel.border}
      >
        {/* Header */}
        <Flex
          px={6}
          py={4}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
        >
          <Box>
            <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
              Create Configuration
            </Text>
            <Text fontSize="12px" color={themeColors.text.secondary} mt={0.5}>
              Select how you want to build this network device configuration
            </Text>
          </Box>
          <Button
            size="sm"
            variant="ghost"
            p={1}
            color={themeColors.text.muted}
            _hover={{ bg: '#f1f5f9', color: themeColors.text.title }}
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="x" size={18} />
          </Button>
        </Flex>

        {/* Body with 2 Mode Selection Cards */}
        <Box p={6}>
          <VStack gap={4} align="stretch">
            {/* Option 1: Default Configuration (OWGW) */}
            <Box
              p={5}
              border="2px solid"
              borderColor={themeColors.panel.border}
              borderRadius="8px"
              cursor="pointer"
              transition="all 0.15s ease"
              _hover={{
                borderColor: themeColors.brand.accent,
                bg: '#f8fafc',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(10, 107, 107, 0.08)',
              }}
              onClick={() => onSelectType('default')}
            >
              <Flex justify="space-between" align="flex-start" mb={2}>
                <HStack gap={3}>
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="8px"
                    bg="rgba(10, 107, 107, 0.1)"
                    color={themeColors.brand.accent}
                    align="center"
                    justify="center"
                  >
                    <Icon name="device" size={22} />
                  </Flex>
                  <Box>
                    <HStack gap={2}>
                      <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                        Default Configuration
                      </Text>
                      <Box
                        fontSize="10px"
                        fontWeight="700"
                        px={2}
                        py={0.5}
                        borderRadius="4px"
                        bg="#f1f5f9"
                        color={themeColors.brand.accent}
                        border="1px solid"
                        borderColor="rgba(10, 107, 107, 0.2)"
                      >
                        OWGW Gateway
                      </Box>
                    </HStack>
                    <Text fontSize="12px" color={themeColors.text.secondary} mt={0.5}>
                      Simple gateway template with platform, device types, and raw uCentral JSON payload.
                    </Text>
                  </Box>
                </HStack>
                <Icon name="chevronRight" size={18} color={themeColors.text.muted} />
              </Flex>

              <Box pl="52px" pt={1}>
                <VStack align="stretch" gap={1} fontSize="11px" color={themeColors.text.muted}>
                  <Text>• Define Platform: AP, Switch, or OLG</Text>
                  <Text>• Assign device models / wildcard (*) for zero-touch provisioning</Text>
                  <Text>• Paste & format raw uCentral JSON with live syntax validation</Text>
                </VStack>
              </Box>
            </Box>

            {/* Option 2: Modular Configuration (OWPROV) */}
            <Box
              p={5}
              border="2px solid"
              borderColor={themeColors.panel.border}
              borderRadius="8px"
              cursor="pointer"
              transition="all 0.15s ease"
              _hover={{
                borderColor: themeColors.brand.accent,
                bg: '#f8fafc',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(10, 107, 107, 0.08)',
              }}
              onClick={() => onSelectType('modular')}
            >
              <Flex justify="space-between" align="flex-start" mb={2}>
                <HStack gap={3}>
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="8px"
                    bg="rgba(14, 165, 233, 0.1)"
                    color="#0284c7"
                    align="center"
                    justify="center"
                  >
                    <Icon name="sliders" size={22} />
                  </Flex>
                  <Box>
                    <HStack gap={2}>
                      <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                        Modular Configuration
                      </Text>
                      <Box
                        fontSize="10px"
                        fontWeight="700"
                        px={2}
                        py={0.5}
                        borderRadius="4px"
                        bg="#f1f5f9"
                        color="#0284c7"
                        border="1px solid"
                        borderColor="rgba(2, 132, 199, 0.2)"
                      >
                        OWPROV Provisioning
                      </Box>
                    </HStack>
                    <Text fontSize="12px" color={themeColors.text.secondary} mt={0.5}>
                      Interactive visual builder with reusable variable blocks, radio bands, SSIDs, and overrides.
                    </Text>
                  </Box>
                </HStack>
                <Icon name="chevronRight" size={18} color={themeColors.text.muted} />
              </Flex>

              <Box pl="52px" pt={1}>
                <VStack align="stretch" gap={1} fontSize="11px" color={themeColors.text.muted}>
                  <Text>• Visual section builder (Radios, SSIDs, VLANs, Metrics, Services)</Text>
                  <Text>• Reusable Profile references via __variableBlock bindings</Text>
                  <Text>• Granular field overrides, inheritance tracking, and live diff</Text>
                </VStack>
              </Box>
            </Box>
          </VStack>
        </Box>

        {/* Footer */}
        <Flex
          px={6}
          py={3}
          bg="#f8fafc"
          borderTop="1px solid"
          borderColor={themeColors.panel.divider}
          justify="flex-end"
        >
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

