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

interface ImportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportJson: (jsonStr: string) => void;
}

export const ImportConfigModal: React.FC<ImportConfigModalProps> = ({
  isOpen,
  onClose,
  onImportJson,
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file from disk');
    };
    reader.readAsText(file);
  };

  const handleApply = () => {
    if (!jsonText.trim()) {
      setError('Please choose a file or paste configuration JSON');
      return;
    }
    try {
      JSON.parse(jsonText);
      onImportJson(jsonText);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON file contents');
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
        w="min(680px, 94vw)"
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
              bg="#2563eb"
              color="#ffffff"
              display="grid"
              placeItems="center"
            >
              <Icon name="upload" size={14} />
            </Box>
            <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
              Import Configuration from File
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
        <Box flex="1" overflowY="auto" p={5}>
          <VStack gap={3.5} align="stretch">
            {/* Warning Banner */}
            <Flex
              p={3}
              bg="#fffbeb"
              border="1px solid"
              borderColor="#fde68a"
              borderRadius="6px"
              gap={2.5}
              align="center"
            >
              <Icon name="alertTriangle" size={18} color="#d97706" />
              <Box>
                <Text fontSize="12px" fontWeight="700" color="#92400e">
                  Warning: Importing Overwrites Active Sections
                </Text>
                <Text fontSize="11px" color="#b45309">
                  Importing a configuration will replace your current section parameters with the values defined in the file.
                </Text>
              </Box>
            </Flex>

            {/* File input box */}
            <Box
              border="2px dashed"
              borderColor={themeColors.panel.border}
              borderRadius="8px"
              p={4}
              textAlign="center"
              bg="#f8fafc"
            >
              <input
                type="file"
                accept=".json"
                id="config-file-input"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <label htmlFor="config-file-input" style={{ cursor: 'pointer' }}>
                <VStack gap={1}>
                  <Box color={themeColors.brand.accent}>
                    <Icon name="upload" size={24} />
                  </Box>
                  <Text fontSize="13px" fontWeight="600" color={themeColors.text.title}>
                    {fileName ? `Selected: ${fileName}` : 'Click to browse a .json file'}
                  </Text>
                  <Text fontSize="11px" color={themeColors.text.muted}>
                    Accepts standard uCentral JSON configuration files
                  </Text>
                </VStack>
              </label>
            </Box>

            <Box>
              <Text fontSize="12px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Or paste JSON content directly:
              </Text>
              <Textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setError(null);
                }}
                placeholder="Paste uCentral JSON here..."
                fontFamily="monospace"
                fontSize="12px"
                lineHeight="1.5"
                minH="200px"
                borderRadius="6px"
                borderColor={error ? '#ef4444' : themeColors.panel.border}
                whiteSpace="pre"
              />
            </Box>

            {error && (
              <HStack gap={1.5} color="#dc2626" fontSize="12px" fontWeight="600">
                <Icon name="alertTriangle" size={14} color="#dc2626" />
                <Text>{error}</Text>
              </HStack>
            )}
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
          gap={2}
        >
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            bg={themeColors.brand.accent}
            color="#ffffff"
            _hover={{ opacity: 0.9 }}
            onClick={handleApply}
          >
            Import & Apply
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

