import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

interface ViewJsonConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  compiledJson: string;
}

export const ViewJsonConfigModal: React.FC<ViewJsonConfigModalProps> = ({
  isOpen,
  onClose,
  compiledJson,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(compiledJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              bg="#0f172a"
              color="#ffffff"
              display="grid"
              placeItems="center"
            >
              <Icon name="code" size={14} />
            </Box>
            <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
              Configuration JSON
            </Text>
          </HStack>

          <HStack gap={2}>
            <Button size="xs" variant="outline" onClick={handleCopy}>
              <Icon name={copied ? 'check' : 'copy'} size={13} />
              <Text ml={1.5}>{copied ? 'Copied!' : 'Copy JSON'}</Text>
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

        {/* JSON Preview Content */}
        <Box flex="1" overflowY="auto" p={5} bg="#0f172a">
          <Box
            as="pre"
            fontFamily="monospace"
            fontSize="12px"
            lineHeight="1.5"
            color="#e2e8f0"
            whiteSpace="pre"
          >
            {compiledJson}
          </Box>
        </Box>

        {/* Footer */}
        <Flex
          px={6}
          py={2.5}
          bg="#f8fafc"
          borderTop="1px solid"
          borderColor={themeColors.panel.divider}
          justify="space-between"
          align="center"
        >
          <Text fontSize="11px" color={themeColors.text.muted}>
            Aggregated uCentral document compiled from active subsections
          </Text>
          <Button size="xs" variant="outline" onClick={onClose}>
            Close
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

