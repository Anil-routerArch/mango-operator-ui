import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

export interface SubSectionOption {
  value: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
}

export interface SubSectionPickerProps {
  label?: string;
  options: SubSectionOption[];
  activeSubsections?: string[];
  value?: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  isRequired?: boolean;
}

export const SubSectionPicker: React.FC<SubSectionPickerProps> = ({
  label = 'Subsections',
  options,
  activeSubsections,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select...',
  isRequired = false,
}) => {
  const selectedValues = value ?? activeSubsections ?? [];
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRemove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedValues.filter((s) => s !== val));
  };

  const handleToggle = (val: string) => {
    if (disabled) return;
    const opt = options.find((o) => o.value === val);
    if (opt?.disabled) return;
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((s) => s !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box position="relative" ref={containerRef} w="100%">
      {label && (
        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          {label} {isRequired && <Text as="span" color="#dc2626">*</Text>}
        </Text>
      )}

      {/* Control Box */}
      <Flex
        minH="36px"
        p="4px 8px"
        border="1px solid"
        borderColor={isOpen ? themeColors.brand.accent : '#cbd5e1'}
        borderRadius="8px"
        bg={disabled ? '#f1f5f9' : '#ffffff'}
        align="center"
        justify="space-between"
        cursor={disabled ? 'not-allowed' : 'pointer'}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        wrap="wrap"
        gap={1.5}
        transition="border-color 0.15s ease"
      >
        <Flex wrap="wrap" gap={1.5} align="center" flex="1">
          {selectedValues.length === 0 ? (
            <Text fontSize="12px" color="#94a3b8">
              {placeholder}
            </Text>
          ) : (
            selectedValues.map((subVal) => {
              const opt = options.find((o) => o.value === subVal);
              const displayLabel = opt ? opt.label : subVal;

              return (
                <HStack
                  key={subVal}
                  gap={1}
                  px={2}
                  py={0.5}
                  borderRadius="10px"
                  bg="#e2e8f0"
                  color="#1e293b"
                  fontSize="11px"
                  fontWeight="600"
                >
                  <Text>{displayLabel}</Text>
                  {!disabled && (
                    <Box
                      as="button"
                      display="grid"
                      placeItems="center"
                      w="14px"
                      h="14px"
                      borderRadius="50%"
                      _hover={{ bg: '#cbd5e1' }}
                      onClick={(e: React.MouseEvent) => handleRemove(subVal, e)}
                    >
                      <Icon name="x" size={10} />
                    </Box>
                  )}
                </HStack>
              );
            })
          )}
        </Flex>

        <HStack gap={1} color="#64748b" pl={2}>
          {selectedValues.length > 0 && !disabled && (
            <Box
              as="button"
              display="grid"
              placeItems="center"
              w="18px"
              h="18px"
              borderRadius="50%"
              _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onChange([]);
              }}
              title="Clear all"
            >
              <Icon name="x" size={12} />
            </Box>
          )}
          <Box transform={isOpen ? 'rotate(180deg)' : 'none'} transition="transform 0.15s ease">
            <Icon name="chevronDown" size={14} />
          </Box>
        </HStack>
      </Flex>

      {/* Dropdown Menu */}
      {isOpen && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          maxH="240px"
          overflowY="auto"
          overscrollBehavior="contain"
          bg="#ffffff"
          border="1px solid"
          borderColor="#cbd5e1"
          borderRadius="8px"
          boxShadow="0 6px 18px rgba(0,0,0,0.15)"
          zIndex={999}
          p={1}
          onWheel={(e) => e.stopPropagation()}
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f8fafc',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#94a3b8',
            },
          }}
        >
          {options.length > 5 && (
            <Box p={1} pb={1.5} borderBottom="1px solid" borderColor="#e2e8f0" mb={1}>
              <Input
                size="xs"
                placeholder="Search subsections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                borderRadius="4px"
              />
            </Box>
          )}

          <VStack gap={0.5} align="stretch">
            {filteredOptions.length === 0 ? (
              <Text p={2} fontSize="11px" color="#94a3b8" textAlign="center">
                No matching subsections
              </Text>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                const isOptDisabled = opt.disabled || false;
                return (
                  <Flex
                    key={opt.value}
                    px={3}
                    py={1.5}
                    align="center"
                    justify="space-between"
                    borderRadius="6px"
                    cursor={isOptDisabled ? 'not-allowed' : 'pointer'}
                    bg={isOptDisabled ? '#f8fafc' : isSelected ? '#eff6ff' : 'transparent'}
                    color={isOptDisabled ? '#94a3b8' : isSelected ? themeColors.brand.accent : themeColors.text.primary}
                    opacity={isOptDisabled ? 0.65 : 1}
                    _hover={isOptDisabled ? undefined : { bg: isSelected ? '#dbeafe' : '#f8fafc' }}
                    fontSize="12px"
                    fontWeight={isSelected ? '600' : '400'}
                    onClick={() => !isOptDisabled && handleToggle(opt.value)}
                    title={opt.disabledReason}
                  >
                    <HStack gap={2}>
                      <Text>{opt.label}</Text>
                      {isOptDisabled && (
                        <Text as="span" fontSize="10px" color="#ef4444" fontWeight="500">
                          (Not supported in Default Config)
                        </Text>
                      )}
                    </HStack>
                    {isSelected && <Icon name="check" size={14} color={isOptDisabled ? '#94a3b8' : themeColors.brand.accent} />}
                  </Flex>
                );
              })
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export const MultiSelectDropdown: React.FC<SubSectionPickerProps> = ({ label = '', ...props }) => (
  <SubSectionPicker label={label} {...props} />
);
export type MultiSelectDropdownProps = SubSectionPickerProps;

