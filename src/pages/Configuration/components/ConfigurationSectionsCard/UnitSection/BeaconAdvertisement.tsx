import React from 'react';
import {
  Box,
  Flex,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { ToggleSwitch } from '../ToggleSwitch';
import type { UnitSectionData } from '../types';

interface BeaconAdvertisementProps {
  data: UnitSectionData;
  onChange: (updated: UnitSectionData) => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const BeaconAdvertisement: React.FC<BeaconAdvertisementProps> = ({
  data,
  onChange,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const isBeaconEnabled = Boolean(data.beaconAdvertisement?.enabled);

  return (
    <Box pt={2} borderTop="1px solid" borderColor={themeColors.panel.divider}>
      <Flex align="center" gap={2} mb={3}>
        <Text fontSize="12px" fontWeight="700" color={themeColors.text.title}>
          Beacon Advertisement
        </Text>
        <ToggleSwitch
          checked={isBeaconEnabled}
          onChange={(checked) => {
            onChange({
              ...data,
              beaconAdvertisement: {
                enabled: checked,
                deviceName: data.beaconAdvertisement?.deviceName || data.name,
                deviceSerial: data.beaconAdvertisement?.deviceSerial || '',
                networkId: data.beaconAdvertisement?.networkId || 1024,
              },
            });
          }}
          disabled={disabled}
        />
      </Flex>

      {isBeaconEnabled && (
        <VStack gap={3} align="stretch" pl={3} borderLeft="2px solid" borderColor={themeColors.brand.accent}>
          <Flex gap={3} wrap="wrap">
            <Box flex="1" minW="140px">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                device-name {!isDefaultConfig && <Text as="span" color="#dc2626">*</Text>}
              </Text>
              <Input
                size="sm"
                value={data.beaconAdvertisement?.deviceName || ''}
                onChange={(e) =>
                  onChange({
                    ...data,
                    beaconAdvertisement: {
                      ...data.beaconAdvertisement!,
                      deviceName: e.target.value,
                    },
                  })
                }
                placeholder="Beacon Device Name"
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>

            <Box flex="1" minW="140px">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                device-serial {!isDefaultConfig && <Text as="span" color="#dc2626">*</Text>}
              </Text>
              <Input
                size="sm"
                value={data.beaconAdvertisement?.deviceSerial || ''}
                onChange={(e) =>
                  onChange({
                    ...data,
                    beaconAdvertisement: {
                      ...data.beaconAdvertisement!,
                      deviceSerial: e.target.value,
                    },
                  })
                }
                placeholder="Beacon Serial"
                disabled={disabled}
                borderRadius="4px"
              />
            </Box>
          </Flex>

          <Box maxW="160px">
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              network-id <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={data.beaconAdvertisement?.networkId ?? 1024}
              onChange={(e) =>
                onChange({
                  ...data,
                  beaconAdvertisement: {
                    ...data.beaconAdvertisement!,
                    networkId: Number(e.target.value) || 1024,
                  },
                })
              }
              disabled={disabled}
              borderRadius="4px"
            />
          </Box>
        </VStack>
      )}
    </Box>
  );
};

