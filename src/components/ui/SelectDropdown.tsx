import React, { useMemo } from 'react';
import { Select, createListCollection, Portal } from '@chakra-ui/react';
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
  size?: 'sm' | 'md' | 'lg';
}

/**
 * SelectDropdown implemented using official Chakra UI v3 Select component:
 * import { Select, createListCollection, Portal } from '@chakra-ui/react'
 * with animated chevron indicator on open/close.
 */
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
  size = 'sm',
}) => {
  const collection = useMemo(() => {
    return createListCollection({
      items: options.map((opt) => {
        if (typeof opt === 'object' && opt !== null && 'value' in opt) {
          return { label: opt.label, value: String(opt.value) };
        }
        return { label: String(opt), value: String(opt) };
      }),
    });
  }, [options]);

  return (
    <Select.Root
      collection={collection}
      value={[String(value)]}
      onValueChange={(e) => {
        if (e.value && e.value.length > 0) {
          onChange(e.value[0]);
        }
      }}
      size={size}
      width={w}
      minW={minW}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <Select.Control>
        <Select.Trigger
          bg={bg}
          borderColor={borderColor}
          borderRadius={borderRadius}
          h={h}
          minH={h}
          px={3}
          cursor={disabled ? 'not-allowed' : 'pointer'}
          _focus={{
            borderColor: themeColors.brand.accent,
            boxShadow: `0 0 0 1px ${themeColors.brand.accent}`,
          }}
        >
          <Select.ValueText placeholder={placeholder} fontSize={fontSize} />
          <Select.Context>
            {(select) => (
              <Select.Indicator
                transform={select.open ? 'rotate(180deg)' : 'rotate(0deg)'}
                transition="transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              />
            )}
          </Select.Context>
        </Select.Trigger>
      </Select.Control>
      <Portal>
        <Select.Positioner zIndex={2000}>
          <Select.Content
            bg="#ffffff"
            borderColor={themeColors.panel.border}
            borderRadius="6px"
            boxShadow="0 8px 24px rgba(0, 0, 0, 0.12)"
            py={1}
            minW="120px"
          >
            {collection.items.map((item) => (
              <Select.Item
                item={item}
                key={item.value}
                cursor="pointer"
                fontSize={fontSize}
                px={3}
                py="6px"
                _hover={{ bg: themeColors.brand.accentLight }}
                _highlighted={{ bg: themeColors.brand.accentLight }}
              >
                {item.label}
                <Select.ItemIndicator color={themeColors.brand.accent} />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
};

export default SelectDropdown;

