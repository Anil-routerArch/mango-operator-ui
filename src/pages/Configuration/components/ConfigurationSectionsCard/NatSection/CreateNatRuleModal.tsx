import React, { useState } from 'react';
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
import { SelectDropdown } from '@/components/ui/SelectDropdown';

interface CreateNatRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRule: (mode: 'snat' | 'dnat') => void;
}

export const CreateNatRuleModal: React.FC<CreateNatRuleModalProps> = ({
  isOpen,
  onClose,
  onAddRule,
}) => {
  const [selectedType, setSelectedType] = useState<'snat' | 'dnat'>('snat');

  if (!isOpen) return null;

  const handleSave = () => {
    onAddRule(selectedType);
    onClose();
  };

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
            Add Rule
          </Text>
          <HStack gap={2}>
            <Button
              size="xs"
              bg="#2563eb"
              color="#ffffff"
              _hover={{ bg: '#1d4ed8' }}
              onClick={handleSave}
            >
              Save
            </Button>
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
          </HStack>
        </Flex>

        {/* Modal Body */}
        <Box p={5}>
          <VStack gap={4} align="stretch">
            <Box>
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Type <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                value={selectedType}
                onChange={(val) => setSelectedType(val as 'snat' | 'dnat')}
                options={[
                  { value: 'snat', label: 'SNAT' },
                  { value: 'dnat', label: 'DNAT' },
                ]}
                w="100%"
              />
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};
