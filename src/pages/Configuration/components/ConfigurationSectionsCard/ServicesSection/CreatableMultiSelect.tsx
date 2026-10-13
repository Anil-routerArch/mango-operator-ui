import React, { useState } from 'react';
import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

interface CreatableMultiSelectProps {
  label?: string;
  isRequired?: boolean;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CreatableMultiSelect: React.FC<CreatableMultiSelectProps> = ({
  label,
  isRequired = false,
  values,
  onChange,
  placeholder = 'Type and press Enter...',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleAdd = (valToAdd: string) => {
    const trimmed = valToAdd.trim();
    if (!trimmed) return;
    if (!values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const handleRemove = (valToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(values.filter((v) => v !== valToRemove));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  return (
    <Box w="100%">
      {label && (
        <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
          {label} {isRequired && <Text as="span" color="#dc2626">*</Text>}
        </Text>
      )}

      <Flex
        minH="36px"
        p="4px 8px"
        border="1px solid"
        borderColor={isFocused ? themeColors.brand.accent : '#cbd5e1'}
        borderRadius="8px"
        bg={disabled ? '#f1f5f9' : '#ffffff'}
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={1.5}
        transition="border-color 0.15s ease"
        cursor="text"
      >
        <Flex wrap="wrap" gap={1.5} align="center" flex="1">
          {values.map((v) => (
            <HStack
              key={v}
              gap={1}
              px={2}
              py={0.5}
              borderRadius="10px"
              bg="#e2e8f0"
              color="#1e293b"
              fontSize="11px"
              fontWeight="600"
            >
              <Text>{v}</Text>
              {!disabled && (
                <Box
                  as="button"
                  display="grid"
                  placeItems="center"
                  w="14px"
                  h="14px"
                  borderRadius="50%"
                  cursor="pointer"
                  _hover={{ bg: '#cbd5e1' }}
                  onClick={(e: React.MouseEvent) => handleRemove(v, e)}
                  title={`Remove ${v}`}
                >
                  <Icon name="x" size={10} />
                </Box>
              )}
            </HStack>
          ))}

          {!disabled && (
            <input
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                minWidth: '120px',
                flex: 1,
                fontSize: '12px',
                color: '#1e293b',
              }}
              placeholder={values.length === 0 ? placeholder : ''}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                if (inputValue.trim()) {
                  handleAdd(inputValue);
                }
              }}
            />
          )}
        </Flex>

        <HStack gap={1} color="#64748b" pl={1}>
          {values.length > 0 && !disabled && (
            <Box
              as="button"
              display="grid"
              placeItems="center"
              w="18px"
              h="18px"
              borderRadius="50%"
              cursor="pointer"
              _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
              onClick={handleClearAll}
              title="Clear all"
            >
              <Icon name="x" size={12} />
            </Box>
          )}
          <Box color="#64748b">
            <Icon name="chevronDown" size={14} />
          </Box>
        </HStack>
      </Flex>
    </Box>
  );
};
