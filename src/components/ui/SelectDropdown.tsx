import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectDropdownProps {
  value: string | number;
  onChange: (value: any) => void;
  options: (SelectOption | string | number)[];
  w?: string | number;
  minW?: string | number;
  h?: string | number;
  fontSize?: string;
  placeholder?: string;
  disabled?: boolean;
  bg?: string;
  borderColor?: string;
  borderRadius?: string;
  ariaLabel?: string;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  onChange,
  options,
  w = 'auto',
  minW,
  h = '38px',
  fontSize = '13px',
  placeholder = 'Select...',
  disabled = false,
  bg = '#ffffff',
  borderColor = themeColors.panel.border,
  borderRadius = '4px',
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to { value, label }
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null && 'value' in opt) {
      return opt as SelectOption;
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Handle keyboard events (Escape to close)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) setIsOpen(!isOpen);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = normalizedOptions.findIndex((opt) => String(opt.value) === String(value));
        const nextIndex = Math.min(normalizedOptions.length - 1, currentIndex + 1);
        onChange(normalizedOptions[nextIndex].value);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = normalizedOptions.findIndex((opt) => String(opt.value) === String(value));
        const prevIndex = Math.max(0, currentIndex - 1);
        onChange(normalizedOptions[prevIndex].value);
      }
    }
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      w={w}
      minW={minW}
      userSelect="none"
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      outline="none"
      _focus={{
        '& > div': {
          borderColor: themeColors.brand.accent,
          boxShadow: `0 0 0 1px ${themeColors.brand.accent}`,
        },
      }}
    >
      {/* Trigger Button */}
      <Flex
        align="center"
        justify="space-between"
        h={h}
        px={3}
        bg={bg}
        border="1px solid"
        borderColor={isOpen ? themeColors.brand.accent : borderColor}
        borderRadius={borderRadius}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.6 : 1}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        transition="border-color 0.15s ease, box-shadow 0.15s ease"
        boxShadow={isOpen ? `0 0 0 1px ${themeColors.brand.accent}` : 'none'}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
      >
        <Text
          fontSize={fontSize}
          color={selectedOption ? themeColors.text.primary : themeColors.text.muted}
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          mr={2}
        >
          {displayLabel}
        </Text>

        {/* Animated Chevron Indicator */}
        <Box
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          color={themeColors.text.secondary}
          transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
          transition="transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          flexShrink={0}
        >
          <Icon name="chevronDown" size={14} />
        </Box>
      </Flex>

      {/* Animated Dropdown Menu */}
      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left="0"
          minW="100%"
          maxH="240px"
          overflowY="auto"
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          boxShadow="0 8px 24px rgba(0, 0, 0, 0.12)"
          py={1}
          zIndex={1000}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <Flex
                key={String(opt.value)}
                align="center"
                justify="space-between"
                px={3}
                py="7px"
                fontSize={fontSize}
                cursor="pointer"
                bg={isSelected ? themeColors.brand.accentLight : 'transparent'}
                color={isSelected ? themeColors.brand.accent : themeColors.text.primary}
                fontWeight={isSelected ? '600' : '400'}
                _hover={{
                  bg: isSelected ? themeColors.brand.accentLight : '#f1f5f9',
                }}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <Text whiteSpace="nowrap">{opt.label}</Text>
                {isSelected && (
                  <Box color={themeColors.brand.accent} ml={2}>
                    <Icon name="check" size={13} />
                  </Box>
                )}
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default SelectDropdown;
