import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { useUpdateDeviceTag } from '@/api/devices';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';

export interface MainConfigSubTabProps {
  device: UnifiedFleetDevice;
}

export const MainConfigSubTab: React.FC<MainConfigSubTabProps> = ({ device }) => {
  const [name, setName] = useState(device.name || '');
  const [description, setDescription] = useState(device.description || '');
  const [deviceType, setDeviceType] = useState(device.model || 'asus_rt-ax53u');
  const [deviceGroup, setDeviceGroup] = useState(device.deviceGroup || 'ap');
  const [rrm, setRrm] = useState<'Inherit' | 'Enabled' | 'Disabled'>('Inherit');
  const [firmwareUpgrade, setFirmwareUpgrade] = useState<'Inherit' | 'Scheduled' | 'Manual'>('Inherit');
  const [ignoreOverrides, setIgnoreOverrides] = useState(false);

  useEffect(() => {
    if (device) {
      setName(device.name || '');
      setDescription(device.description || '');
      setDeviceType(device.model || 'asus_rt-ax53u');
      setDeviceGroup(device.deviceGroup || 'ap');
    }
  }, [device]);

  const updateMutation = useUpdateDeviceTag();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        serialNumber: device.serialNumber,
        payload: {
          name,
          description,
          deviceType,
        },
      });
      toaster.create({
        title: 'Device Updated',
        description: `Configuration properties saved for ${device.serialNumber}`,
        type: 'success',
      });
    } catch (err: unknown) {
      toaster.create({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Could not update device tag',
        type: 'error',
      });
    }
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={5}>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
          {/* Serial Number */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Serial Number <span style={{ color: themeColors.text.required }}>*</span>
            </Text>
            <Input
              value={device.serialNumber}
              disabled
              bg="#f8fafc"
              borderColor={themeColors.input.border}
              fontSize="13px"
              fontFamily="monospace"
            />
          </Box>

          {/* Device Name */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Device Name <span style={{ color: themeColors.text.required }}>*</span>
            </Text>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AP-B-204"
              borderColor={themeColors.input.border}
              fontSize="13px"
            />
          </Box>

          {/* Description */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Description
            </Text>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Sunrise 2nd Floor Corridor"
              borderColor={themeColors.input.border}
              fontSize="13px"
            />
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
          {/* Device Group */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Device Group <span style={{ color: themeColors.text.required }}>*</span>
            </Text>
            <Input
              value={deviceGroup}
              onChange={(e) => setDeviceGroup(e.target.value)}
              borderColor={themeColors.input.border}
              fontSize="13px"
            />
          </Box>

          {/* Device Type / Hardware Model */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Device Type <span style={{ color: themeColors.text.required }}>*</span>
            </Text>
            <Input
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              borderColor={themeColors.input.border}
              fontSize="13px"
            />
          </Box>

          {/* Parent Property / Venue */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Parent Provisioning Hierarchy
            </Text>
            <Input
              value={`${device.entityName || 'Sunrise Apartments'} / ${device.venueName || 'Building B'}`}
              disabled
              bg="#f8fafc"
              borderColor={themeColors.input.border}
              fontSize="13px"
            />
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5}>
          {/* Radio Resource Management (RRM) */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Radio Resource Management (RRM)
            </Text>
            <HStack gap={2}>
              {(['Inherit', 'Enabled', 'Disabled'] as const).map((opt) => (
                <Button
                  key={opt}
                  size="sm"
                  variant={rrm === opt ? 'solid' : 'outline'}
                  bg={rrm === opt ? themeColors.brand.primary : 'transparent'}
                  color={rrm === opt ? '#ffffff' : themeColors.text.primary}
                  borderColor={themeColors.input.border}
                  _hover={rrm === opt ? { bg: themeColors.brand.primaryHover } : { bg: '#f8fafc' }}
                  onClick={() => setRrm(opt)}
                  fontSize="12px"
                  px={3}
                >
                  {opt}
                </Button>
              ))}
            </HStack>
          </Box>

          {/* Firmware Upgrade Policy */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Firmware Upgrade Policy
            </Text>
            <HStack gap={2}>
              {(['Inherit', 'Scheduled', 'Manual'] as const).map((opt) => (
                <Button
                  key={opt}
                  size="sm"
                  variant={firmwareUpgrade === opt ? 'solid' : 'outline'}
                  bg={firmwareUpgrade === opt ? themeColors.brand.primary : 'transparent'}
                  color={firmwareUpgrade === opt ? '#ffffff' : themeColors.text.primary}
                  borderColor={themeColors.input.border}
                  _hover={firmwareUpgrade === opt ? { bg: themeColors.brand.primaryHover } : { bg: '#f8fafc' }}
                  onClick={() => setFirmwareUpgrade(opt)}
                  fontSize="12px"
                  px={3}
                >
                  {opt}
                </Button>
              ))}
            </HStack>
          </Box>

          {/* Ignore Configuration Overrides Toggle */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary} mb={1}>
              Configuration Overrides
            </Text>
            <Flex
              align="center"
              justify="space-between"
              p="7px 12px"
              border="1px solid"
              borderColor={themeColors.input.border}
              borderRadius="6px"
              bg="#ffffff"
            >
              <Text fontSize="13px" color={themeColors.text.secondary}>
                Ignore overrides for this device
              </Text>
              <Button
                size="xs"
                variant={ignoreOverrides ? 'solid' : 'outline'}
                bg={ignoreOverrides ? '#dc2626' : '#f1f5f9'}
                color={ignoreOverrides ? '#ffffff' : themeColors.text.muted}
                onClick={() => setIgnoreOverrides(!ignoreOverrides)}
              >
                {ignoreOverrides ? 'Ignored' : 'Applied'}
              </Button>
            </Flex>
          </Box>
        </SimpleGrid>

        {/* Save Bar */}
        <Flex justify="flex-end" pt={4} borderTop="1px solid" borderColor={themeColors.panel.divider}>
          <Button
            size="sm"
            bg={themeColors.brand.primary}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.primaryHover }}
            onClick={handleSave}
            disabled={updateMutation.isPending}
            gap={1.5}
            px={5}
          >
            {updateMutation.isPending ? <Spinner size="xs" /> : null}
            Save Changes
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default MainConfigSubTab;

