import React, { useState } from 'react';
import { Box, Flex, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { INTERFACE_ROLES } from './interfacesConstants';

interface CreateInterfaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (values: { name: string; role: 'upstream' | 'downstream' }) => void;
  disabled?: boolean;
}

const CreateInterfaceDialog: React.FC<Omit<CreateInterfaceModalProps, 'isOpen'>> = ({
  onClose,
  onCreate,
  disabled = false,
}) => {
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<'upstream' | 'downstream'>('upstream');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Name is required');
      return;
    }
    onCreate({ name: trimmed, role });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid = Boolean(name.trim());

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
        w="min(460px, 95vw)"
        bg="#ffffff"
        borderRadius="12px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        border="1px solid"
        borderColor={themeColors.panel.border}
        overflow="hidden"
      >
        {/* Modal Header */}
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
            Add Interface
          </Text>

          <HStack gap={2}>
            {!disabled && (
              <Box
                as="button"
                w="32px"
                h="32px"
                borderRadius="8px"
                bg={isValid ? '#2563eb' : '#94a3b8'}
                color="#ffffff"
                display="grid"
                placeItems="center"
                cursor={isValid ? 'pointer' : 'not-allowed'}
                _hover={isValid ? { bg: '#1d4ed8' } : undefined}
                onClick={isValid ? handleSubmit : undefined}
                title="Save interface"
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

        {/* Modal Body */}
        <Box p={5}>
          <VStack gap={4} align="stretch">
            {/* name field */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                name <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Interface name"
                disabled={disabled}
                borderRadius="8px"
                borderColor={errorMessage ? '#dc2626' : '#cbd5e1'}
                autoFocus
              />
              {errorMessage && (
                <Text fontSize="11px" color="#dc2626" mt={1}>
                  {errorMessage}
                </Text>
              )}
            </Box>

            {/* role field */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                role <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                size="sm"
                value={role}
                onChange={(val) => setRole(val as 'upstream' | 'downstream')}
                options={INTERFACE_ROLES}
                disabled={disabled}
                w="100%"
              />
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export const CreateInterfaceModal: React.FC<CreateInterfaceModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <CreateInterfaceDialog {...props} />;
};

