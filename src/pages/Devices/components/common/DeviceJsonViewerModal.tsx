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

export interface DeviceJsonViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  data: unknown;
}

export const DeviceJsonViewerModal: React.FC<DeviceJsonViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  data,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
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
      zIndex="1200"
      p={4}
    >
      <Box
        w="min(800px, 95vw)"
        maxH="85vh"
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        display="flex"
        flexDirection="column"
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
              {title}
            </Text>
            {subtitle && (
              <Text fontSize="12px" color={themeColors.text.secondary} mt={0.5}>
                {subtitle}
              </Text>
            )}
          </Box>
          <HStack gap={2}>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              gap={1.5}
              color={copied ? '#167930' : themeColors.text.secondary}
            >
              <Icon name={copied ? 'check' : 'copy'} size={15} />
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
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
          </HStack>
        </Flex>

        {/* JSON Viewer Body */}
        <Box
          p={4}
          flex="1"
          overflowY="auto"
          bg="#0d1117"
          color="#c9d1d9"
          fontFamily="monospace"
          fontSize="12px"
          lineHeight="1.6"
        >
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {jsonString || '// No content available'}
          </pre>
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
            Close
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceJsonViewerModal;

