import React, { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { getChannelOptionsForBand } from './radiosConstants';
import type { SingleRadioConfigItem } from '../types';

interface ChannelPickerProps {
  band: SingleRadioConfigItem['band'];
  channelWidth: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const ChannelPicker: React.FC<ChannelPickerProps> = ({
  band,
  channelWidth,
  value,
  onChange,
  disabled = false,
}) => {
  const options = useMemo(() => {
    return getChannelOptionsForBand(band, channelWidth);
  }, [band, channelWidth]);

  return (
    <Box>
      <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
        channel
      </Text>
      <SelectDropdown
        value={value}
        onChange={(val) => onChange(String(val))}
        options={options}
        disabled={disabled}
        w="100%"
      />
    </Box>
  );
};

