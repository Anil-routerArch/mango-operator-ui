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

export interface CertificateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  value: string;
  fileName?: string;
  onSave: (value: string, fileName?: string) => void;
  disabled?: boolean;
  isPrivateKey?: boolean;
  context?: string;
}

export const isPemPrivateKey = (text: string): boolean => {
  const t = text.trim();
  return (
    (t.includes('-----BEGIN PRIVATE KEY-----') && t.includes('-----END PRIVATE KEY-----')) ||
    (t.includes('-----BEGIN RSA PRIVATE KEY-----') && t.includes('-----END RSA PRIVATE KEY-----')) ||
    (t.includes('-----BEGIN EC PRIVATE KEY-----') && t.includes('-----END EC PRIVATE KEY-----')) ||
    (t.includes('-----BEGIN ENCRYPTED PRIVATE KEY-----') && t.includes('-----END ENCRYPTED PRIVATE KEY-----'))
  );
};

export const isPemCertificate = (text: string): boolean => {
  const t = text.trim();
  return t.includes('-----BEGIN CERTIFICATE-----') && t.includes('-----END CERTIFICATE-----');
};

export const getPemValidationError = (content: string, isKey: boolean): string | null => {
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (isKey) {
    if (trimmed.includes('-----BEGIN CERTIFICATE-----')) {
      return 'Invalid file format: Detected a public certificate (-----BEGIN CERTIFICATE-----). Please upload or paste a valid private key.';
    }
    if (!isPemPrivateKey(trimmed)) {
      return 'Invalid key format: Private key must begin with -----BEGIN ... PRIVATE KEY----- and end with -----END ... PRIVATE KEY-----.';
    }
  } else {
    if (
      trimmed.includes('-----BEGIN PRIVATE KEY-----') ||
      trimmed.includes('-----BEGIN RSA PRIVATE KEY-----') ||
      trimmed.includes('-----BEGIN EC PRIVATE KEY-----') ||
      trimmed.includes('-----BEGIN ENCRYPTED PRIVATE KEY-----')
    ) {
      return 'Security Warning: Detected private key material (-----BEGIN PRIVATE KEY-----). Private keys cannot be uploaded into a public certificate field.';
    }
    if (!isPemCertificate(trimmed)) {
      return 'Invalid certificate format: Certificate must begin with -----BEGIN CERTIFICATE----- and end with -----END CERTIFICATE-----.';
    }
  }

  return null;
};

export const CertificateUploadModal: React.FC<CertificateUploadModalProps> = ({
  isOpen,
  onClose,
  title,
  value,
  fileName = '',
  onSave,
  disabled = false,
  isPrivateKey,
  context,
}) => {
  const isKey = isPrivateKey ?? title.toLowerCase().includes('private-key');
  const hasExistingValue = Boolean(value && value.trim());

  // If a private key is already stored, do not default to replacement/plaintext view
  const [isReplacingKey, setIsReplacingKey] = useState<boolean>(() => !isKey || !hasExistingValue);
  const [tempValue, setTempValue] = useState<string>(() => (isKey && hasExistingValue ? '' : value));
  const [tempFilename, setTempFilename] = useState<string>(() => fileName || '');
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIsReplacingKey(!isKey || !hasExistingValue);
    setTempValue(isKey && hasExistingValue ? '' : value);
    setTempFilename(fileName || '');
    setShowKeyText(false);
  }, [isOpen, value, fileName, isKey, hasExistingValue]);

  if (!isOpen) return null;

  const displayTitle = context
    ? `${context}.${title}`
    : title.startsWith('configuration.')
    ? title
    : `configuration.${title}`;

  const validationError =
    (isReplacingKey || !isKey) && tempValue.trim()
      ? getPemValidationError(tempValue, isKey)
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
          if (isKey) {
            setIsReplacingKey(true);
          }
        }
      };
      reader.readAsText(file);
    }
    // Clear input value so selecting the same file triggers onChange again
    e.target.value = '';
  };

  const handleSave = () => {
    if (isKey && !isReplacingKey && hasExistingValue) {
      // Kept existing private key unchanged; update filename if modified
      onSave(value.trim(), tempFilename.trim() || `${title}.pem`);
    } else {
      onSave(tempValue.trim(), tempFilename.trim() || `${title}.pem`);
    }
    onClose();
  };

  const handleCancelReplace = () => {
    setIsReplacingKey(false);
    setTempValue('');
    setTempFilename(fileName || '');
    setShowKeyText(false);
  };

  const canSave =
    !disabled &&
    !validationError &&
    ((isKey && !isReplacingKey && hasExistingValue) || tempValue.trim().length > 0);

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
            {isKey && (
              <Box color="#2563eb">
                <Icon name="lock" size={16} />
              </Box>
            )}
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
              {isKey
                ? 'Upload or paste a PEM private key (.key / .pem). Stored keys are confidential and masked.'
                : 'Upload a .pem / .crt file or paste the certificate text content below.'}
            </Text>

            {/* Existing Private Key Protected Status View */}
            {isKey && hasExistingValue && !isReplacingKey ? (
              <Box
                p={4}
                borderRadius="10px"
                bg="#f8fafc"
                border="1px solid"
                borderColor="#e2e8f0"
              >
                <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
                  <HStack gap={3}>
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="8px"
                      bg="#e2e8f0"
                      color="#334155"
                      display="grid"
                      placeItems="center"
                    >
                      <Icon name="lock" size={20} />
                    </Box>
                    <Box>
                      <HStack gap={2}>
                        <Text fontSize="13px" fontWeight="600" color="#1e293b">
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
                      <Text fontSize="12px" color="#64748b" mt={0.5}>
                        Using file: <strong>{tempFilename || `${title}.pem`}</strong> • Cryptographic material hidden for security
                      </Text>
                    </Box>
                  </HStack>

                  {!disabled && (
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
                        setIsReplacingKey(true);
                        setTempValue('');
                      }}
                    >
                      Replace Key
                    </Box>
                  )}
                </Flex>
              </Box>
            ) : (
              <>
                {/* Notice when replacing an existing private key */}
                {isKey && hasExistingValue && (
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
                        Replacing existing private key. The stored key will be updated upon saving.
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
                      accept={isKey ? '.key,.pem,text/plain' : '.pem,.crt,.cer,text/plain'}
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
                        {tempFilename || 'No file chosen'}
                      </Text>
                    </Flex>
                  </Box>
                )}

                {/* Text Area Input */}
                <Box>
                  <Flex justify="space-between" align="center" mb={1.5}>
                    <Text fontSize="12px" fontWeight="600" color="#475569">
                      {isKey ? 'Private Key Content' : 'Certificate Content'}
                    </Text>

                    {isKey && tempValue.trim().length > 0 && (
                      <Box
                        as="button"
                        display="flex"
                        alignItems="center"
                        gap={1}
                        fontSize="12px"
                        fontWeight="500"
                        color="#2563eb"
                        cursor="pointer"
                        onClick={() => setShowKeyText((prev) => !prev)}
                        _hover={{ textDecoration: 'underline' }}
                      >
                        <Icon name={showKeyText ? 'eyeOff' : 'eye'} size={14} />
                        {showKeyText ? 'Mask Plaintext' : 'Reveal Plaintext'}
                      </Box>
                    )}
                  </Flex>

                  <Textarea
                    value={tempValue}
                    onChange={(e) => {
                      setTempValue(e.target.value);
                      if (!tempFilename && e.target.value.trim()) {
                        setTempFilename(`${title}.pem`);
                      }
                    }}
                    disabled={disabled}
                    placeholder={
                      isKey
                        ? '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
                        : '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'
                    }
                    rows={9}
                    fontFamily="monospace"
                    fontSize="12px"
                    borderRadius="8px"
                    borderColor={validationError ? '#ef4444' : '#cbd5e1'}
                    style={
                      {
                        WebkitTextSecurity: isKey && !showKeyText ? 'disc' : 'none',
                      } as React.CSSProperties
                    }
                  />
                </Box>

                {/* Validation Error Banner */}
                {validationError && (
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
                      {validationError}
                    </Text>
                  </Flex>
                )}

                {/* Security Guidance for Private Keys */}
                {isKey && (
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
                      <strong>Security Notice:</strong> Private keys authenticate this system and should remain confidential. Never paste private keys into public certificate fields. Stored keys are masked on future views.
                    </Text>
                  </Flex>
                )}
              </>
            )}
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};
