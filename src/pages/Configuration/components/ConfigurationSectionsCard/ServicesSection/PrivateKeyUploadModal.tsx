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
  detectPrivateKeyFormat,
  computePemSyncFingerprint,
  validatePemPrivateKey,
} from '../../../utils/pemValidation';

export interface PrivateKeyUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  fileName?: string;
  onSave: (value: string, fileName?: string) => void;
  disabled?: boolean;
  context?: string;
}

export const PrivateKeyUploadModal: React.FC<PrivateKeyUploadModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  fileName = '',
  onSave,
  disabled = false,
  context,
}) => {
  const hasExistingValue = Boolean(value && value.trim());

  // Stored keys remain strictly write-only: draft is never pre-filled with the secret
  const [isReplacing, setIsReplacing] = useState<boolean>(() => !hasExistingValue);
  const [draftValue, setDraftValue] = useState<string>('');
  const [draftFilename, setDraftFilename] = useState<string>(() => fileName || '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIsReplacing(!hasExistingValue);
    setDraftValue('');
    setDraftFilename(fileName || '');
  }, [isOpen, value, fileName, hasExistingValue]);

  if (!isOpen) return null;

  const displayTitle = context
    ? `${context}.${title}`
    : title.startsWith('configuration.')
    ? title
    : `configuration.${title}`;

  const validationResult = draftValue.trim()
    ? validatePemPrivateKey(draftValue)
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDraftFilename(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setDraftValue(text);
          setIsReplacing(true);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleSave = () => {
    if (!isReplacing && hasExistingValue) {
      // Retained existing key unchanged, optionally update filename
      onSave(value.trim(), draftFilename.trim() || `${title}.pem`);
    } else if (validationResult?.valid) {
      onSave(draftValue.trim(), draftFilename.trim() || `${title}.pem`);
    }
    onClose();
  };

  const handleRemove = () => {
    onSave('', '');
    onClose();
  };

  const handleCancelReplace = () => {
    setIsReplacing(false);
    setDraftValue('');
    setDraftFilename(fileName || '');
  };

  const canSave =
    !disabled &&
    ((!isReplacing && hasExistingValue) || Boolean(validationResult?.valid));

  const existingFormat = hasExistingValue ? detectPrivateKeyFormat(value) || 'Private Key' : null;
  const existingFingerprint = hasExistingValue ? computePemSyncFingerprint(value) : null;

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
              <Icon name="lock" size={16} />
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
                title="Save private key"
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
            {/* Security Explanation */}
            <Text fontSize="13px" color="#64748b">
              Upload or paste a PEM private key (.key / .pem). Stored keys are confidential and never redisplayed in plaintext.
            </Text>

            {/* Existing Private Key View (Write-Only Protected Secret) */}
            {hasExistingValue && !isReplacing ? (
              <Box
                p={4}
                borderRadius="10px"
                bg="#f8fafc"
                border="1px solid"
                borderColor="#e2e8f0"
              >
                <Flex align="flex-start" justify="space-between" flexWrap="wrap" gap={3}>
                  <HStack gap={3} align="flex-start">
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="8px"
                      bg="#e2e8f0"
                      color="#2563eb"
                      display="grid"
                      placeItems="center"
                      flexShrink={0}
                    >
                      <Icon name="lock" size={20} />
                    </Box>
                    <Box>
                      <HStack gap={2}>
                        <Text fontSize="13px" fontWeight="700" color="#1e293b">
                          Private Key Configured
                        </Text>
                        <Box
                          px={2}
                          py={0.5}
                          borderRadius="4px"
                          bg="#dcfce7"
                          color="#15803d"
                          fontSize="11px"
                          fontWeight="600"
                        >
                          Protected
                        </Box>
                      </HStack>
                      <Text fontSize="12px" color="#475569" mt={1}>
                        File: <strong>{draftFilename || `${title}.pem`}</strong>
                      </Text>
                      <Text fontSize="11px" color="#64748b" mt={0.5}>
                        Format: <strong>{existingFormat}</strong> • Fingerprint: <Text as="span" fontFamily="monospace">{existingFingerprint}</Text>
                      </Text>
                      <Text fontSize="11px" color="#64748b" mt={1}>
                        Cryptographic material is securely preserved in configuration and hidden from DOM display to prevent unauthorized exposure.
                      </Text>
                    </Box>
                  </HStack>

                  {!disabled && (
                    <HStack gap={2}>
                      <Box
                        as="button"
                        px={3.5}
                        py={1.5}
                        borderRadius="6px"
                        bg="#2563eb"
                        color="#ffffff"
                        fontSize="12px"
                        fontWeight="600"
                        cursor="pointer"
                        _hover={{ bg: '#1d4ed8' }}
                        onClick={() => {
                          setIsReplacing(true);
                          setDraftValue('');
                        }}
                      >
                        Replace Key
                      </Box>
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
                        Remove
                      </Box>
                    </HStack>
                  )}
                </Flex>
              </Box>
            ) : (
              <>
                {/* Replacing banner */}
                {hasExistingValue && (
                  <Flex
                    p={3}
                    borderRadius="8px"
                    bg="#fef3c7"
                    border="1px solid"
                    borderColor="#fde68a"
                    align="center"
                    justify="space-between"
                  >
                    <HStack gap={2}>
                      <Box color="#b45309">
                        <Icon name="alertTriangle" size={16} />
                      </Box>
                      <Text fontSize="12px" color="#92400e" fontWeight="500">
                        Replacing existing private key. Stored key will be overwritten on save.
                      </Text>
                    </HStack>
                    <Box
                      as="button"
                      fontSize="12px"
                      fontWeight="600"
                      color="#b45309"
                      textDecoration="underline"
                      cursor="pointer"
                      onClick={handleCancelReplace}
                    >
                      Cancel
                    </Box>
                  </Flex>
                )}

                {/* File Picker */}
                {!disabled && (
                  <Box>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".key,.pem,text/plain"
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
                        Choose Key File
                      </Box>
                      <Text
                        fontSize="13px"
                        color={draftFilename ? '#1e293b' : '#94a3b8'}
                        fontWeight="500"
                      >
                        {draftFilename || 'No file chosen (.key / .pem)'}
                      </Text>
                    </Flex>
                  </Box>
                )}

                {/* Secret Key Input Area */}
                <Box>
                  <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                    Private Key Content (PEM)
                  </Text>
                  <Textarea
                    value={draftValue}
                    onChange={(e) => {
                      setDraftValue(e.target.value);
                      if (!draftFilename && e.target.value.trim()) {
                        setDraftFilename(`${title}.pem`);
                      }
                    }}
                    disabled={disabled}
                    placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                    rows={8}
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

                {/* Real-time Validation Feedback */}
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

                {/* Security Guidance */}
                <Flex
                  p={3}
                  borderRadius="8px"
                  bg="#f0f9ff"
                  border="1px solid"
                  borderColor="#bae6fd"
                  align="flex-start"
                  gap={2.5}
                >
                  <Box color="#0284c7" mt={0.5} flexShrink={0}>
                    <Icon name="shield" size={15} />
                  </Box>
                  <Text fontSize="11px" color="#0369a1" lineHeight="1.4">
                    <strong>Confidential Secret:</strong> Private keys authenticate this system and should remain confidential. Never paste private keys into public certificate fields. Once saved, this key is masked on future views and kept write-only.
                  </Text>
                </Flex>
              </>
            )}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

