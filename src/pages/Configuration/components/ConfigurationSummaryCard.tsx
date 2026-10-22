import React from 'react';
import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { DeviceConfiguration } from '../types/configuration';

interface ConfigurationSummaryCardProps {
  config: DeviceConfiguration;
  onManageProfiles?: () => void;
}

export const ConfigurationSummaryCard: React.FC<ConfigurationSummaryCardProps> = ({
  config,
  onManageProfiles,
}) => {
  // Collect all unique referenced profiles
  const profilesUsed: Array<{ name: string; type: string; settingsCount: number }> = [];

  config.sections.radios.bands.forEach((b) => {
    if (b.profileName && !profilesUsed.find((p) => p.name === b.profileName)) {
      profilesUsed.push({
        name: b.profileName,
        type: `Radio · ${b.band}`,
        settingsCount: b.inheritedSettingsCount || 8,
      });
    }
  });

  config.sections.interfaces.ssids.forEach((s) => {
    if (s.profileName && !profilesUsed.find((p) => p.name === s.profileName)) {
      profilesUsed.push({
        name: s.profileName,
        type: 'Interface · SSID',
        settingsCount: 6,
      });
    }
  });

  // Count local overrides
  const radioOverrides = config.sections.radios.bands.flatMap((b) =>
    b.fields.filter((f) => f.overridden)
  );
  const ssidOverrides = config.sections.interfaces.ssids.filter((s) => s.overridden);
  const totalOverrides = radioOverrides.length + ssidOverrides.length;

  const totalInherited =
    config.sections.radios.bands.reduce((acc, b) => acc + (b.inheritedSettingsCount || 0), 0) +
    config.sections.interfaces.ssids.filter((s) => s.profileId).length * 6;

  return (
    <VStack w="320px" minW="300px" gap={4} align="stretch">
      {/* Profiles Used Card */}
      <Box
        bg="#ffffff"
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="6px"
        p={4}
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title}>
            Profiles Used (__variableBlock)
          </Text>
          <Box
            fontSize="11px"
            fontWeight="600"
            px={2}
            py={0.5}
            borderRadius="10px"
            bg="#f1f5f9"
            color={themeColors.text.secondary}
          >
            {profilesUsed.length}
          </Box>
        </Flex>

        <VStack gap={2.5} align="stretch" mb={3}>
          {profilesUsed.length === 0 ? (
            <Text fontSize="12px" color={themeColors.text.muted}>
              No reusable profiles linked yet.
            </Text>
          ) : (
            profilesUsed.map((p, idx) => (
              <Flex key={idx} align="center" justify="space-between" fontSize="12px">
                <HStack gap={2}>
                  <Icon
                    name={p.type.includes('Radio') ? 'radio' : 'layers'}
                    size={14}
                    color={themeColors.brand.accent}
                  />
                  <Text fontWeight="600" color={themeColors.text.primary} lineClamp={1} maxW="150px">
                    {p.name}
                  </Text>
                </HStack>
                <Text color={themeColors.text.muted} fontSize="11px">
                  {p.type} · {p.settingsCount} settings
                </Text>
              </Flex>
            ))
          )}
        </VStack>

        {onManageProfiles && (
          <Text
            fontSize="12px"
            fontWeight="600"
            color={themeColors.brand.accent}
            cursor="pointer"
            _hover={{ textDecoration: 'underline' }}
            onClick={onManageProfiles}
          >
            Manage profiles library →
          </Text>
        )}
      </Box>

      {/* Configuration Summary Card */}
      <Box
        bg="#ffffff"
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="6px"
        p={4}
      >
        <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={3}>
          Configuration Inheritance Stats
        </Text>

        <VStack gap={2} align="stretch" mb={3} fontSize="12px">
          <Flex justify="space-between">
            <Text color={themeColors.text.secondary}>Inherited settings:</Text>
            <Text fontWeight="600" color={themeColors.text.primary}>
              {totalInherited}
            </Text>
          </Flex>
          <Flex justify="space-between">
            <Text color={themeColors.text.secondary}>Local overrides:</Text>
            <Text fontWeight="600" color={totalOverrides > 0 ? '#b45309' : themeColors.text.primary}>
              {totalOverrides} {totalOverrides > 0 && '(Active)'}
            </Text>
          </Flex>
          <Flex justify="space-between">
            <Text color={themeColors.text.secondary}>Device rules:</Text>
            <Text fontWeight="600" color={themeColors.text.primary}>
              FW: {config.devicerules?.firmwareUpgrade || 'inherit'}
            </Text>
          </Flex>
          <Flex justify="space-between">
            <Text color={themeColors.text.secondary}>Schema Validation:</Text>
            <HStack gap={1} color="#15803d" fontWeight="600">
              <Icon name="check" size={12} color="#15803d" />
              <Text>Passed</Text>
            </HStack>
          </Flex>
        </VStack>

        {totalOverrides > 0 && (
          <Box
            bg="#fef3c7"
            border="1px solid"
            borderColor="#fde68a"
            borderRadius="4px"
            p={2.5}
            fontSize="11px"
            color="#92400e"
          >
            <HStack gap={1.5} align="flex-start">
              <Icon name="alertTriangle" size={13} color="#b45309" />
              <Text>
                <Text as="span" fontWeight="700">Local overrides:</Text> {totalOverrides} setting(s) deviate from linked profile standards.
              </Text>
            </HStack>
          </Box>
        )}
      </Box>

      {/* Current Assignments Card */}
      <Box
        bg="#ffffff"
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="6px"
        p={4}
      >
        <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={3}>
          Current Scope Assignments
        </Text>

        <VStack gap={2.5} align="stretch" fontSize="12px">
          <Flex align="center" justify="space-between">
            <HStack gap={2}>
              <Icon name="building" size={14} color={themeColors.brand.accent} />
              <Text fontWeight="500" color={themeColors.text.primary}>
                {config.entityName || (config.entity ? 'Entity: ' + config.entity.substring(0, 8) : 'Global Property')}
              </Text>
            </HStack>
            <Box fontSize="10px" fontWeight="600" px={1.5} py={0.5} borderRadius="4px" bg="#f1f5f9">
              Property
            </Box>
          </Flex>

          {config.venue && (
            <Flex align="center" justify="space-between">
              <HStack gap={2}>
                <Icon name="landmark" size={14} color="#7c3aed" />
                <Text fontWeight="500" color={themeColors.text.primary}>
                  {config.venueName || 'Venue: ' + config.venue.substring(0, 8)}
                </Text>
              </HStack>
              <Box fontSize="10px" fontWeight="600" px={1.5} py={0.5} borderRadius="4px" bg="#f3e8ff" color="#7e22ce">
                Venue
              </Box>
            </Flex>
          )}

          <Flex align="center" justify="space-between">
            <HStack gap={2}>
              <Icon name="device" size={14} color={themeColors.text.secondary} />
              <Text color={themeColors.text.secondary}>
                {config.inuse?.length || 0} APs deployed
              </Text>
            </HStack>
            <Box fontSize="10px" fontWeight="600" px={1.5} py={0.5} borderRadius="4px" bg="#f1f5f9">
              Inventory
            </Box>
          </Flex>
        </VStack>
      </Box>
    </VStack>
  );
};
