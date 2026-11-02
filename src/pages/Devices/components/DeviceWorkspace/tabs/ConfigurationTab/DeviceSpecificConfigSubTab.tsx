import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';

export interface DeviceSpecificConfigSubTabProps {
  device: UnifiedFleetDevice;
}

export const DeviceSpecificConfigSubTab: React.FC<DeviceSpecificConfigSubTabProps> = ({ device }) => {
  const [configJson, setConfigJson] = useState(() => {
    return JSON.stringify(
      {
        metrics: {
          statistics: {
            interval: 60,
            types: ['ssids', 'lldp', 'clients'],
          },
          telemetry: {
            interval: 30,
            types: ['radios'],
          },
        },
        radios: [
          {
            band: '5G',
            channel: 'auto',
            'channel-mode': 'HE',
            'channel-width': 80,
          },
        ],
      },
      null,
      2
    );
  });

  const [isValidJson, setIsValidJson] = useState(true);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setConfigJson(text);
    try {
      JSON.parse(text);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleSave = () => {
    if (!isValidJson) {
      toaster.create({
        title: 'Invalid JSON',
        description: 'Please fix syntax errors before saving device-specific configuration',
        type: 'error',
      });
      return;
    }
    toaster.create({
      title: 'Configuration Saved',
      description: `Device-specific configuration updated for ${device.serialNumber}`,
      type: 'success',
    });
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={4}>
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="15px" fontWeight="600" color={themeColors.text.title}>
              Device-Specific Configuration Block
            </Text>
            <Text fontSize="12px" color={themeColors.text.muted}>
              Custom JSON blocks applied specifically to this device, overriding parent venue defaults.
            </Text>
          </Box>
          <HStack gap={2}>
            {!isValidJson && (
              <Box
                fontSize="11px"
                fontWeight="700"
                color="#dc2626"
                bg="#fee2e2"
                px={2.5}
                py={0.5}
                borderRadius="4px"
              >
                Invalid JSON Syntax
              </Box>
            )}
            <Button
              size="sm"
              bg={themeColors.brand.primary}
              color="#ffffff"
              _hover={{ bg: themeColors.brand.primaryHover }}
              onClick={handleSave}
              disabled={!isValidJson}
            >
              Apply Specific Config
            </Button>
          </HStack>
        </Flex>

        <Box
          border="1px solid"
          borderColor={isValidJson ? themeColors.panel.border : '#fca5a5'}
          borderRadius="8px"
          overflow="hidden"
          bg="#0d1117"
        >
          <Textarea
            value={configJson}
            onChange={handleJsonChange}
            fontFamily="monospace"
            fontSize="12px"
            lineHeight="1.6"
            color="#c9d1d9"
            bg="transparent"
            border="none"
            minH="350px"
            p={4}
            _focus={{ outline: 'none' }}
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default DeviceSpecificConfigSubTab;

