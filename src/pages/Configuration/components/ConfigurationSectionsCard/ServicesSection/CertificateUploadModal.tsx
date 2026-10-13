import React, { useRef, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

interface CertificateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  fileName?: string;
  onSave: (value: string, fileName?: string) => void;
  disabled?: boolean;
}

export const CertificateUploadModal: React.FC<CertificateUploadModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  fileName = '',
  onSave,
  disabled = false,
}) => {
  const [tempValue, setTempValue] = useState<string>(() => value);
  const [tempFilename, setTempFilename] = useState<string>(() => fileName || '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempFilename(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setTempValue(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    onSave(tempValue.trim(), tempFilename.trim() || `${title}.pem`);
    onClose();
  };

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1500"
      p={4}
    >
      <Box
        w="min(680px, 95vw)"
        maxH="90vh"
        display="flex"
        flexDirection="column"
        bg="#ffffff"
        borderRadius="12px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        border="1px solid"
        borderColor={themeColors.panel.border}
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          px={5}
          py={3.5}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor="#e2e8f0"
          bg="#ffffff"
        >
          <Text fontSize="15px" fontWeight="700" color="#1e293b">
            configuration.ieee8021x.{title}
          </Text>

          <HStack gap={2}>
            {!disabled && (
              <Box
                as="button"
                w="32px"
                h="32px"
                borderRadius="8px"
                bg={tempValue.trim() ? '#2563eb' : '#94a3b8'}
                color="#ffffff"
                display="grid"
                placeItems="center"
                cursor={tempValue.trim() ? 'pointer' : 'not-allowed'}
                _hover={tempValue.trim() ? { bg: '#1d4ed8' } : undefined}
                onClick={tempValue.trim() ? handleSave : undefined}
                title="Save file"
              >
                <Icon name="save" size={16} />
              </Box>
            )}

            <Box
              as="button"
              w="32px"
              h="32px"
              borderRadius="50%"
              border="1px solid"
              borderColor="#cbd5e1"
              color="#64748b"
              display="grid"
              placeItems="center"
              cursor="pointer"
              _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
              onClick={onClose}
              title="Close"
            >
              <Icon name="x" size={15} />
            </Box>
          </HStack>
        </Flex>

        {/* Modal Scrollable Body */}
        <Box p={6} overflowY="auto" flex="1">
          <VStack gap={4} align="stretch">
            <Text fontSize="13px" color="#64748b">
              Upload a .pem file or paste the certificate/key text content below.
            </Text>

            {/* File Picker */}
            {!disabled && (
              <Box>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pem,.crt,.key,.cer,text/plain,*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Flex align="center" gap={3}>
                  <Box
                    as="button"
                    px={4}
                    py={1.5}
                    borderRadius="6px"
                    bg="#2563eb"
                    color="#ffffff"
                    fontSize="13px"
                    fontWeight="600"
                    cursor="pointer"
                    _hover={{ bg: '#1d4ed8' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Box>
                  <Text fontSize="13px" color={tempFilename ? '#1e293b' : '#94a3b8'} fontWeight="500">
                    {tempFilename || 'No file chosen'}
                  </Text>
                </Flex>
              </Box>
            )}

            {/* Text Preview / Edit Area */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                File Content
              </Text>
              <Textarea
                value={tempValue}
                onChange={(e) => {
                  setTempValue(e.target.value);
                  if (!tempFilename && e.target.value.trim()) {
                    setTempFilename(`${title}.pem`);
                  }
                }}
                disabled={disabled}
                placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                rows={9}
                fontFamily="monospace"
                fontSize="12px"
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};
