import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import { WIFI_STEERING_MODES } from './servicesConstants';
import type { ServicesSectionData } from '../types';

interface WifiSteeringProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const WifiSteering: React.FC<WifiSteeringProps> = ({ data, onChange, disabled = false }) => {
  return (
    <Box
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="8px"
      bg="#ffffff"
      position="relative"
      overflow="visible"
    >
      <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
        <Text
          fontSize="14px"
          fontWeight="700"
          color={themeColors.text.title}
          textDecoration="underline"
          textUnderlineOffset="3px"
        >
          Wifi Steering
        </Text>
      </Flex>
      <Box p={4}>
        <VStack gap={4} align="stretch">
          {/* mode */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              mode <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              size="sm"
              value={data.wifiSteering.mode}
              onChange={(val) =>
                onChange({
                  ...data,
                  wifiSteering: {
                    ...data.wifiSteering,
                    mode: val as ServicesSectionData['wifiSteering']['mode'],
                  },
                })
              }
              options={WIFI_STEERING_MODES}
              disabled={disabled}
              w="100%"
            />
          </Box>

          {/* assoc-steering */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              assoc-steering <Text as="span" color="#dc2626">*</Text>
            </Text>
            <ToggleSwitch
              checked={data.wifiSteering.assocSteering}
              onChange={(checked) =>
                onChange({
                  ...data,
                  wifiSteering: {
                    ...data.wifiSteering,
                    assocSteering: checked,
                  },
                })
              }
              disabled={disabled}
            />
          </Box>

          {/* auto-channel */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              auto-channel <Text as="span" color="#dc2626">*</Text>
            </Text>
            <ToggleSwitch
              checked={data.wifiSteering.autoChannel}
              onChange={(checked) =>
                onChange({
                  ...data,
                  wifiSteering: {
                    ...data.wifiSteering,
                    autoChannel: checked,
                  },
                })
              }
              disabled={disabled}
            />
          </Box>

          {/* required-probe-snr */}
          <Box w="100px">
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              required-probe-snr <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={data.wifiSteering.requiredProbeSnr}
              onChange={(e) =>
                onChange({
                  ...data,
                  wifiSteering: {
                    ...data.wifiSteering,
                    requiredProbeSnr: Number(e.target.value) || 0,
                  },
                })
              }
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>

          {/* required-roam-snr */}
          <Box w="100px">
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              required-roam-snr <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={data.wifiSteering.requiredRoamSnr}
              onChange={(e) =>
                onChange({
                  ...data,
                  wifiSteering: {
                    ...data.wifiSteering,
                    requiredRoamSnr: Number(e.target.value) || 0,
                  },
                })
              }
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>

          {/* load-kick-threshold */}
          <Box w="100px">
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              load-kick-threshold <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={data.wifiSteering.loadKickThreshold}
              onChange={(e) =>
                onChange({
                  ...data,
                  wifiSteering: {
                    ...data.wifiSteering,
                    loadKickThreshold: Number(e.target.value) || 0,
                  },
                })
              }
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};
