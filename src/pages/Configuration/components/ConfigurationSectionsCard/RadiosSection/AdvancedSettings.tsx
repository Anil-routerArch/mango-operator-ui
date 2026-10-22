import React from 'react';
import { Box, Input, SimpleGrid, Text } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import { He } from './He';
import { RATE_OPTIONS, REQUIRE_MODES } from './radiosConstants';
import type { SingleRadioConfigItem } from '../types';

interface AdvancedSettingsProps {
  radio: SingleRadioConfigItem;
  onChange: (updated: SingleRadioConfigItem) => void;
  disabled?: boolean;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  radio,
  onChange,
  disabled = false,
}) => {
  return (
    <Box pt={3} borderTop="1px solid" borderColor="#e2e8f0">
      <Text
        fontSize="13px"
        fontWeight="700"
        color={themeColors.text.title}
        mb={3}
        textDecoration="underline"
      >
        Advanced Settings
      </Text>

      <SimpleGrid columns={{ base: 1, sm: 2, md: 4, lg: 8 }} gap={3} alignItems="center">
        <ToggleSwitch
          checked={radio.allowDfs}
          onChange={(checked) => onChange({ ...radio, allowDfs: checked })}
          label="allow-dfs"
          disabled={disabled}
        />

        <Box>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            beacon-rate
          </Text>
          <SelectDropdown
            value={radio.beaconRate}
            onChange={(val) => onChange({ ...radio, beaconRate: String(val) })}
            options={RATE_OPTIONS}
            disabled={disabled}
            w="100%"
          />
        </Box>

        <Box>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            beacon-interval <Text as="span" color="#dc2626">*</Text>
          </Text>
          <Input
            size="sm"
            type="number"
            value={radio.beaconInterval}
            onChange={(e) =>
              onChange({
                ...radio,
                beaconInterval: Number(e.target.value) || 100,
              })
            }
            disabled={disabled}
            borderRadius="4px"
          />
        </Box>

        <Box>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            hostapd-iface-raw
          </Text>
          <Input
            size="sm"
            value={radio.hostapdIfaceRaw}
            onChange={(e) => onChange({ ...radio, hostapdIfaceRaw: e.target.value })}
            placeholder="URL param, eg.: test=value"
            disabled={disabled}
            borderRadius="4px"
          />
        </Box>

        <Box>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            multicast
          </Text>
          <SelectDropdown
            value={radio.multicast}
            onChange={(val) => onChange({ ...radio, multicast: String(val) })}
            options={RATE_OPTIONS}
            disabled={disabled}
            w="100%"
          />
        </Box>

        <He radio={radio} onChange={onChange} disabled={disabled} />

        <Box>
          <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
            require-mode
          </Text>
          <SelectDropdown
            value={radio.requireMode}
            onChange={(val) => onChange({ ...radio, requireMode: String(val) })}
            options={REQUIRE_MODES}
            disabled={disabled}
            w="100%"
          />
        </Box>
      </SimpleGrid>
    </Box>
  );
};

