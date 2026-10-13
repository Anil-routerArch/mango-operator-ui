import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

interface ExpertModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentJson: string;
  onSaveJson: (jsonStr: string) => void;
}

export const ExpertModeModal: React.FC<ExpertModeModalProps> = ({
  isOpen,
  onClose,
  currentJson,
  onSaveJson,
}) => {
  const [jsonText, setJsonText] = useState<string>(currentJson);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  const handleSave = () => {
    try {
      JSON.parse(jsonText);
      onSaveJson(jsonText);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
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
        w="min(760px, 95vw)"
        maxH="90vh"
        display="flex"
        flexDirection="column"
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
          <HStack gap={2}>
            <Box
              w="26px"
              h="26px"
              borderRadius="6px"
              bg="#8b5cf6"
              color="#ffffff"
              display="grid"
              placeItems="center"
            >
              <Icon name="flask" size={15} />
            </Box>
            <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
              Expert Mode
            </Text>
          </HStack>

          <HStack gap={2}>
            <Button size="xs" variant="outline" onClick={handleFormat}>
              Format JSON
            </Button>
            <Button
              size="xs"
              bg="#8b5cf6"
              color="#ffffff"
              _hover={{ opacity: 0.9 }}
              onClick={handleSave}
            >
              Apply JSON
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

        {/* Body */}
        <Box flex="1" overflowY="auto" p={5}>
          <VStack gap={3} align="stretch">
            {/* Warning alert banner */}
            <Flex
              p={3}
              bg="#fef2f2"
              border="1px solid"
              borderColor="#fecaca"
              borderRadius="6px"
              gap={2.5}
              align="center"
            >
              <Icon name="alertTriangle" size={18} color="#dc2626" />
              <Box>
                <Text fontSize="12px" fontWeight="700" color="#991b1b">
                  Warning: Expert Mode Directly Modifies JSON
                </Text>
                <Text fontSize="11px" color="#b91c1c">
                  Direct edits made here will overwrite corresponding visual sections. Ensure all section keys and syntax match uCentral specifications.
                </Text>
              </Box>
            </Flex>

            <Textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setError(null);
              }}
              fontFamily="monospace"
              fontSize="12px"
              lineHeight="1.5"
              minH="360px"
              borderRadius="6px"
              borderColor={error ? '#ef4444' : themeColors.panel.border}
              whiteSpace="pre"
            />

            {error && (
              <HStack gap={1.5} color="#dc2626" fontSize="12px" fontWeight="600">
                <Icon name="alertTriangle" size={14} color="#dc2626" />
                <Text>{error}</Text>
              </HStack>
            )}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

