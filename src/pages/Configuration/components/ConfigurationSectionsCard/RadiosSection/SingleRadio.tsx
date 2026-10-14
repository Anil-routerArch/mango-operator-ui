import React from 'react';
import {
  Box,
  Flex,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import { COUNTRY_LIST } from '../countryList';
import { ChannelPicker } from './ChannelPicker';
import { AdvancedSettings } from './AdvancedSettings';
import {
  BANDWIDTHS,
  CHANNEL_MODES,
  CHANNEL_WIDTHS,
  MIMOS,
  RADIO_BANDS,
} from './radiosConstants';
import type { SingleRadioConfigItem } from '../types';

interface SingleRadioProps {
  radio: SingleRadioConfigItem;
  onChange: (updated: SingleRadioConfigItem) => void;
  onDelete?: () => void;
  canDelete: boolean;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const SingleRadio: React.FC<SingleRadioProps> = ({
  radio,
  onChange,
  onDelete,
  canDelete,
  disabled = false,
  isDefaultConfig = false,
}) => {
  return (
    <Box p={4}>
      {/* Header: General [No Resource Selected] and red delete button */}
      <Flex align="center" justify="space-between" mb={4} pb={2} borderBottom="1px solid" borderColor="#e2e8f0">
        <Flex align="center" gap={3}>
          <Text
            fontSize="14px"
            fontWeight="700"
            color={themeColors.text.title}
            borderBottom="2px solid"
            borderColor={themeColors.text.title}
          >
            General
          </Text>

          <Box title={isDefaultConfig ? 'Resource profiles cannot be bound to default configurations' : undefined}>
            <SelectDropdown
              value="No Resource Selected"
              onChange={() => {}}
              options={['No Resource Selected']}
              disabled={disabled || isDefaultConfig}
              size="sm"
              h="28px"
              fontSize="12px"
              minW="180px"
            />
          </Box>
        </Flex>

        {canDelete && !disabled && onDelete && (
          <Box
            as="button"
            w="26px"
            h="26px"
            borderRadius="4px"
            bg="#fee2e2"
            color="#dc2626"
            display="grid"
            placeItems="center"
            cursor="pointer"
            _hover={{ bg: '#fca5a5' }}
            onClick={onDelete}
            title="Delete this radio band"
          >
            <Icon name="trash" size={13} />
          </Box>
        )}
      </Flex>

      {/* General Fields Grid */}
      <VStack gap={4} align="stretch">
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4, lg: 8 }} gap={3}>
          {/* Band: Locked to active band pill */}
          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              band <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              value={radio.band}
              onChange={(val) =>
                onChange({
                  ...radio,
                  band: val as SingleRadioConfigItem['band'],
                })
              }
              options={RADIO_BANDS}
              disabled={true}
              w="100%"
            />
          </Box>

          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              bandwidth <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              value={radio.bandwidth}
              onChange={(val) =>
                onChange({ ...radio, bandwidth: Number(val) || 5 })
              }
              options={BANDWIDTHS}
              disabled={disabled}
              w="100%"
            />
          </Box>

          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              country <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              value={radio.country === 'United States' ? 'US' : (radio.country || 'US')}
              onChange={(val) =>
                onChange({ ...radio, country: String(val) })
              }
              options={COUNTRY_LIST}
              disabled={disabled}
              w="100%"
            />
          </Box>

          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              channel-mode <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              value={radio.channelMode}
              onChange={(val) =>
                onChange({ ...radio, channelMode: String(val) })
              }
              options={CHANNEL_MODES}
              disabled={disabled}
              w="100%"
            />
          </Box>

          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              channel-width <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              value={radio.channelWidth}
              onChange={(val) =>
                onChange({ ...radio, channelWidth: Number(val) || 20 })
              }
              options={CHANNEL_WIDTHS}
              disabled={disabled}
              w="100%"
            />
          </Box>

          {/* Dynamic Channel Dropdown based on active band & channel-width */}
          <ChannelPicker
            band={radio.band}
            channelWidth={radio.channelWidth}
            value={radio.channel}
            onChange={(val) => onChange({ ...radio, channel: val })}
            disabled={disabled}
          />

          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              mimo
            </Text>
            <SelectDropdown
              value={radio.mimo}
              onChange={(val) =>
                onChange({ ...radio, mimo: String(val) })
              }
              options={MIMOS}
              disabled={disabled}
              w="100%"
            />
          </Box>

          <Box>
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              tx-power <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={radio.txPower}
              onChange={(e) =>
                onChange({ ...radio, txPower: Number(e.target.value) || 0 })
              }
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
        </SimpleGrid>

        {/* Row 2: legacy-rates, maximum-clients, multiple-bssid */}
        <Flex gap={8} align="center" wrap="wrap">
          <ToggleSwitch
            checked={radio.legacyRates}
            onChange={(checked) =>
              onChange({
                ...radio,
                legacyRates: checked,
              })
            }
            label="legacy-rates"
            disabled={disabled}
          />

          <Box w="140px">
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              maximum-clients
            </Text>
            <Input
              size="sm"
              type="number"
              value={radio.maximumClients}
              onChange={(e) =>
                onChange({
                  ...radio,
                  maximumClients: Number(e.target.value) || 64,
                })
              }
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>

          <ToggleSwitch
            checked={radio.multipleBssid}
            onChange={(checked) =>
              onChange({
                ...radio,
                multipleBssid: checked,
              })
            }
            label="multiple-bssid"
            disabled={disabled}
          />
        </Flex>

        {/* Advanced Settings */}
        <AdvancedSettings radio={radio} onChange={onChange} disabled={disabled} />
      </VStack>
    </Box>
  );
};

