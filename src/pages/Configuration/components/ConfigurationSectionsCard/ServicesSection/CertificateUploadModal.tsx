import React, { useEffect, useRef, useState } from 'react';
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
import {
  validatePemCertificate,
} from '../../../utils/pemValidation';

export interface CertificateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  fileName?: string;
  onSave: (value: string, fileName?: string) => void;
  disabled?: boolean;
  context?: string;
}

export const CertificateUploadModal: React.FC<CertificateUploadModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  fileName = '',
  onSave,
  disabled = false,
  context,
}) => {
  const [tempValue, setTempValue] = useState<string>(() => value);
  const [tempFilename, setTempFilename] = useState<string>(() => fileName || '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTempValue(value || '');
    setTempFilename(fileName || '');
  }, [isOpen, value, fileName]);

  if (!isOpen) return null;

  const displayTitle = context
    ? `${context}.${title}`
    : title.startsWith('configuration.')
    ? title
    : `configuration.${title}`;

  const validationResult = tempValue.trim()
    ? validatePemCertificate(tempValue)
    : null;

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
    e.target.value = '';
  };

  const handleSave = () => {
    if (validationResult?.valid) {
      onSave(tempValue.trim(), tempFilename.trim() || `${title}.pem`);
      onClose();
    }
  };

  const handleRemove = () => {
    onSave('', '');
    onClose();
  };

  const canSave =
    !disabled &&
    Boolean(validationResult?.valid);

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
          <HStack gap={2}>
            <Box color="#2563eb">
              <Icon name="file" size={16} />
            </Box>
            <Text fontSize="15px" fontWeight="700" color="#1e293b">
              {displayTitle}
            </Text>
          </HStack>

          <HStack gap={2}>
            {!disabled && (
              <Box
                as="button"
                w="32px"
                h="32px"
                borderRadius="8px"
                bg={canSave ? '#2563eb' : '#94a3b8'}
                color="#ffffff"
                display="grid"
                placeItems="center"
                cursor={canSave ? 'pointer' : 'not-allowed'}
                _hover={canSave ? { bg: '#1d4ed8' } : undefined}
                onClick={canSave ? handleSave : undefined}
                title="Save certificate"
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
              Upload a .pem / .crt file or paste the certificate content below.
            </Text>

            {/* File Picker & Actions */}
            <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
              {!disabled && (
                <Box>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pem,.crt,.cer,text/plain"
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
                    <Text
                      fontSize="13px"
                      color={tempFilename ? '#1e293b' : '#94a3b8'}
                      fontWeight="500"
                    >
                      {tempFilename || 'No file chosen (.pem / .crt)'}
                    </Text>
                  </Flex>
                </Box>
              )}

              {Boolean(value && value.trim()) && !disabled && (
                <Box
                  as="button"
                  px={3}
                  py={1.5}
                  borderRadius="6px"
                  bg="#fee2e2"
                  color="#dc2626"
                  fontSize="12px"
                  fontWeight="600"
                  cursor="pointer"
                  _hover={{ bg: '#fca5a5' }}
                  onClick={handleRemove}
                >
                  Remove Certificate
                </Box>
              )}
            </Flex>

            {/* Certificate Content Input */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                Certificate Content (PEM)
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
                borderColor={
                  validationResult && !validationResult.valid
                    ? '#ef4444'
                    : validationResult?.valid
                    ? '#22c55e'
                    : '#cbd5e1'
                }
              />
            </Box>

            {/* Validation Feedback */}
            {validationResult && !validationResult.valid && (
              <Flex
                p={3}
                borderRadius="8px"
                bg="#fef2f2"
                border="1px solid"
                borderColor="#fecaca"
                align="flex-start"
                gap={2.5}
              >
                <Box color="#dc2626" mt={0.5} flexShrink={0}>
                  <Icon name="alertTriangle" size={15} />
                </Box>
                <Text fontSize="12px" color="#991b1b" lineHeight="1.5">
                  {validationResult.error}
                </Text>
              </Flex>
            )}

            {validationResult?.valid && (
              <Flex
                p={3}
                borderRadius="8px"
                bg="#f0fdf4"
                border="1px solid"
                borderColor="#bbf7d0"
                align="flex-start"
                gap={2.5}
              >
                <Box color="#16a34a" mt={0.5} flexShrink={0}>
                  <Icon name="shield" size={15} />
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="600" color="#166534">
                    Valid {validationResult.format}
                  </Text>
                  <Text fontSize="11px" color="#15803d" mt={0.5}>
                    Fingerprint: <Text as="span" fontFamily="monospace">{validationResult.fingerprint}</Text>
                  </Text>
                </Box>
              </Flex>
            )}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};
