import React, { useState } from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { DHCP_RELAY_SELECT_PORTS_OPTIONS } from './servicesConstants';
import { DhcpRelayVlansModal } from './DhcpRelayVlansModal';
import type { ServicesSectionData } from '../types';

interface DhcpRelayProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const DhcpRelay: React.FC<DhcpRelayProps> = ({
  data,
  onChange,
  disabled = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePortsChange = (selected: string[]) => {
    // If user clicked 'All' ('*') and it wasn't already selected, make it ['*']
    if (selected.includes('*') && !data.dhcpRelay.selectPorts.includes('*')) {
      onChange({
        ...data,
        dhcpRelay: {
          ...data.dhcpRelay,
          selectPorts: ['*'],
        },
      });
      return;
    }

    // If user selected specific ports while '*' was present, remove '*'
    const withoutAll = selected.filter((p) => p !== '*');
    onChange({
      ...data,
      dhcpRelay: {
        ...data.dhcpRelay,
        selectPorts: withoutAll,
      },
    });
  };

  return (
    <>
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        position="relative"
        zIndex={12}
      >
        <Flex
          px={4}
          py={3}
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
          bg="#f8fafc"
          borderTopRadius="7px"
        >
          <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
            DHCP Relay
          </Text>
        </Flex>
        <Box p={4}>
          <VStack gap={3} align="stretch">
            <Box>
              <MultiSelectDropdown
                label="select-ports"
                isRequired
                options={DHCP_RELAY_SELECT_PORTS_OPTIONS}
                value={data.dhcpRelay.selectPorts}
                onChange={handlePortsChange}
                disabled={disabled}
                placeholder="Select ports..."
              />
            </Box>

            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                vlans <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Box
                as="button"
                w="100%"
                py={1.5}
                px={3}
                borderRadius="6px"
                bg="#2563eb"
                color="#ffffff"
                fontSize="12px"
                fontWeight="600"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                _hover={{ bg: '#1d4ed8' }}
                onClick={() => !disabled && setIsModalOpen(true)}
              >
                Manage vlans ({data.dhcpRelay.vlans.length} entries)
              </Box>
            </Box>
          </VStack>
        </Box>
      </Box>

      <DhcpRelayVlansModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vlans={data.dhcpRelay.vlans}
        onSave={(updatedVlans) =>
          onChange({
            ...data,
            dhcpRelay: {
              ...data.dhcpRelay,
              vlans: updatedVlans,
            },
          })
        }
        disabled={disabled}
      />
    </>
  );
};
