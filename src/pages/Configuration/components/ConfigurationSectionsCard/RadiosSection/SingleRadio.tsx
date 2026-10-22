import React, { useMemo } from 'react';
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
import type { VariableBlockApiResponse } from '@/api/modularConfigurations';

interface SingleRadioProps {
  radio: SingleRadioConfigItem;
  onChange: (updated: SingleRadioConfigItem) => void;
  onDelete?: () => void;
  canDelete: boolean;
  disabled?: boolean;
  isDefaultConfig?: boolean;
  availableResources?: VariableBlockApiResponse[];
}

export const SingleRadio: React.FC<SingleRadioProps> = ({
  radio,
  onChange,
  onDelete,
  canDelete,
  disabled = false,
  isDefaultConfig = false,
  availableResources = [],
}) => {
  const radioResources = useMemo(() => {
    if (!availableResources || availableResources.length === 0) return [];
    return availableResources.filter((r) =>
      r.variables?.some((v) => v.prefix === 'radio')
    );
  }, [availableResources]);

  const radioOptions = useMemo(() => {
    const opts = [
      { value: '', label: 'No Resource Selected' },
      ...radioResources.map((r) => ({
        value: r.id,
        label: r.name ? `${r.name}` : r.id,
      })),
    ];
    if (radio.resource && !opts.some((o) => o.value === radio.resource)) {
      opts.push({
        value: radio.resource,
        label: `${radio.resource} (Attached Profile)`,
      });
    }
    return opts;
  }, [radioResources, radio.resource]);

  const handleResourceChange = (val: string) => {
    if (!val) {
      onChange({ ...radio, resource: '' });
      return;
    }
    const selectedProfile = availableResources?.find((r) => r.id === val);
    let updatedRadio: SingleRadioConfigItem = { ...radio, resource: val };
    if (selectedProfile?.variables?.[0]?.value) {
      try {
        const rawVal = selectedProfile.variables[0].value;
        const parsed = typeof rawVal === 'string' ? JSON.parse(rawVal) : rawVal;
        if (parsed && typeof parsed === 'object') {
          if (parsed.bandwidth !== undefined) updatedRadio.bandwidth = Number(parsed.bandwidth);
          if (parsed.channel !== undefined) updatedRadio.channel = String(parsed.channel);
          if (parsed['channel-mode'] || parsed.channelMode) {
            updatedRadio.channelMode = String(parsed['channel-mode'] || parsed.channelMode);
          }
          if (parsed['channel-width'] !== undefined || parsed.channelWidth !== undefined) {
            updatedRadio.channelWidth = Number(parsed['channel-width'] ?? parsed.channelWidth);
          }
          if (parsed.country) updatedRadio.country = String(parsed.country);
          if (parsed['tx-power'] !== undefined || parsed.txPower !== undefined) {
            updatedRadio.txPower = Number(parsed['tx-power'] ?? parsed.txPower);
          }
        }
      } catch (e) {
        console.warn('Could not parse radio profile JSON value:', e);
      }
    }
    onChange(updatedRadio);
  };

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
              value={radio.resource || ''}
              onChange={(val) => handleResourceChange(String(val))}
              options={radioOptions}
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

