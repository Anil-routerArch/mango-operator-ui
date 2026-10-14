import React from 'react';
import {
  Box,
  Flex,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import { GeneralInfoCard } from '../GeneralInfoCard';
import { BeaconAdvertisement } from './BeaconAdvertisement';
import { TIMEZONE_OPTIONS } from './unitConstants';
import type { UnitSectionData } from '../types';

export interface UnitSectionProps {
  data: UnitSectionData;
  onChange: (data: UnitSectionData) => void;
  onDeleteSection: () => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const UnitSection: React.FC<UnitSectionProps> = ({
  data,
  onChange,
  onDeleteSection,
  disabled = false,
  isDefaultConfig = false,
}) => {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} alignItems="start">
      {/* General Information Card */}
      <GeneralInfoCard
        meta={data.meta}
        onChange={(meta) => onChange({ ...data, meta })}
        onDeleteSection={onDeleteSection}
        disabled={disabled}
        isDefaultConfig={isDefaultConfig}
      />

      {/* Unit Settings Card matching OWPROV */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        overflow="hidden"
      >
        <Flex
          px={4}
          py={3}
          align="center"
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
          bg="#f8fafc"
        >
          <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
            Unit
          </Text>
        </Flex>

        <Box p={4}>
          <VStack gap={4} align="stretch">
            {/* name & location */}
            <Flex gap={3} wrap="wrap">
              <Box flex="1" minW="160px">
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  name {!isDefaultConfig && <Text as="span" color="#dc2626">*</Text>}
                </Text>
                <Input
                  size="sm"
                  value={data.name}
                  onChange={(e) => onChange({ ...data, name: e.target.value })}
                  placeholder={isDefaultConfig ? 'Optional generic name (e.g. OpenWiFi AP)' : 'Unit name'}
                  disabled={disabled}
                  borderRadius="4px"
                  borderColor={!isDefaultConfig && !data.name ? '#dc2626' : undefined}
                />
                {!isDefaultConfig && !data.name && (
                  <Text fontSize="10px" color="#dc2626" mt={0.5}>
                    Required
                  </Text>
                )}
              </Box>

              <Box flex="1" minW="160px">
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  location {!isDefaultConfig && <Text as="span" color="#dc2626">*</Text>}
                </Text>
                <Input
                  size="sm"
                  value={data.location}
                  onChange={(e) => onChange({ ...data, location: e.target.value })}
                  placeholder={isDefaultConfig ? 'Optional location' : 'Location description'}
                  disabled={disabled}
                  borderRadius="4px"
                  borderColor={!isDefaultConfig && !data.location ? '#dc2626' : undefined}
                />
                {!isDefaultConfig && !data.location && (
                  <Text fontSize="10px" color="#dc2626" mt={0.5}>
                    Required
                  </Text>
                )}
              </Box>
            </Flex>

            {/* hostname & timezone */}
            <Flex gap={3} wrap="wrap">
              <Box flex="1" minW="160px">
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  hostname
                </Text>
                <Input
                  size="sm"
                  value={data.hostname || ''}
                  onChange={(e) => onChange({ ...data, hostname: e.target.value })}
                  placeholder={isDefaultConfig ? 'Leave empty to use device serial number' : 'e.g. ap-floor-1'}
                  disabled={disabled}
                  borderRadius="4px"
                />
              </Box>

              <Box flex="1" minW="160px">
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                  timezone
                </Text>
                <SelectDropdown
                  value={data.timezone || 'None'}
                  onChange={(val) => onChange({ ...data, timezone: String(val) })}
                  options={TIMEZONE_OPTIONS}
                  disabled={disabled}
                  w="100%"
                />
              </Box>
            </Flex>

            {/* leds-active & random-password toggles */}
            <Flex gap={6} wrap="wrap">
              <Flex align="center" gap={2}>
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
                  leds-active <Text as="span" color="#dc2626">*</Text>
                </Text>
                <ToggleSwitch
                  checked={data.ledsActive}
                  onChange={(val) => onChange({ ...data, ledsActive: val })}
                  disabled={disabled}
                />
              </Flex>

              <Flex align="center" gap={2}>
                <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
                  random-password <Text as="span" color="#dc2626">*</Text>
                </Text>
                <ToggleSwitch
                  checked={data.randomPassword}
                  onChange={(val) => onChange({ ...data, randomPassword: val })}
                  disabled={disabled}
                />
              </Flex>
            </Flex>

            {/* Beacon Advertisement */}
            <BeaconAdvertisement data={data} onChange={onChange} disabled={disabled} isDefaultConfig={isDefaultConfig} />
          </VStack>
        </Box>
      </Box>
    </SimpleGrid>
  );
};

