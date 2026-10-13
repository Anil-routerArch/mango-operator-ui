import React from 'react';
import { Box, Input, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { ToggleSwitch } from '../ToggleSwitch';
import type { SingleRadioConfigItem } from '../types';

interface HeProps {
  radio: SingleRadioConfigItem;
  onChange: (updated: SingleRadioConfigItem) => void;
  disabled?: boolean;
}

export const He: React.FC<HeProps> = ({ radio, onChange, disabled = false }) => {
  return (
    <>
      <ToggleSwitch
        checked={radio.ema}
        onChange={(checked) => onChange({ ...radio, ema: checked })}
        label="ema"
        disabled={disabled}
      />

      <Box>
        <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
          bss-color
        </Text>
        <Input
          size="sm"
          type="number"
          value={radio.bssColor ?? ''}
          onChange={(e) =>
            onChange({
              ...radio,
              bssColor: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="1..63"
          disabled={disabled}
          borderRadius="4px"
        />
      </Box>
    </>
  );
};

