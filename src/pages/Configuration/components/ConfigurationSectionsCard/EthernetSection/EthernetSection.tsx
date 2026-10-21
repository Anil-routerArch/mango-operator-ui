import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { GeneralInfoCard } from '../GeneralInfoCard';
import { SingleEthernetEntry } from './SingleEthernetEntry';
import { getDefaultEthernetEntry } from './ethernetConstants';
import type { EthernetSectionData, EthernetPortEntry } from '../types';

export interface EthernetSectionProps {
  data: EthernetSectionData;
  onChange: (data: EthernetSectionData) => void;
  onDeleteSection: () => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const EthernetSection: React.FC<EthernetSectionProps> = ({
  data,
  onChange,
  onDeleteSection,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);

  const entries: EthernetPortEntry[] = Array.isArray(data.configuration)
    ? data.configuration
    : [];

  const activeEntry: EthernetPortEntry | undefined =
    entries[selectedTabIndex] || entries[0];

  const handleAddRule = () => {
    const nextPortNum = entries.length;
    const defaultEntry = getDefaultEthernetEntry();
    if (nextPortNum <= 40) {
      defaultEntry['select-ports'] = [`Ethernet${nextPortNum}`];
    }
    const updated = [...entries, defaultEntry];
    onChange({
      ...data,
      configuration: updated,
    });
    setSelectedTabIndex(entries.length);
  };

  const handleDeleteRule = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    onChange({
      ...data,
      configuration: updated,
    });
    setSelectedTabIndex(0);
  };

  const handleUpdateRule = (index: number, updated: EthernetPortEntry) => {
    const updatedList = [...entries];
    updatedList[index] = updated;
    onChange({
      ...data,
      configuration: updatedList,
    });
  };

  return (
    <VStack gap={4} align="stretch" w="100%">
      {/* General Information Card */}
      <GeneralInfoCard
        meta={data.meta}
        onChange={(meta) => onChange({ ...data, meta })}
        onDeleteSection={onDeleteSection}
        disabled={disabled}
        isDefaultConfig={isDefaultConfig}
      />

      {/* Main Ethernet Card */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        overflow="hidden"
      >
        {/* Rule Tabs Bar */}
        {entries.length > 0 && (
          <Flex
            px={3}
            pt={2}
            bg="#f8fafc"
            borderBottom="1px solid"
            borderColor={themeColors.panel.divider}
            align="center"
            justify="space-between"
            gap={2}
            overflowX="auto"
          >
            <HStack gap={1}>
              {entries.map((_, idx) => {
                const isActive = idx === selectedTabIndex;
                return (
                  <Box
                    key={`ethernet-tab-${idx}`}
                    as="button"
                    px={3.5}
                    py={1.5}
                    fontSize="12px"
                    fontWeight="700"
                    cursor="pointer"
                    borderTop="2px solid"
                    borderColor={isActive ? themeColors.brand.accent : 'transparent'}
                    color={isActive ? themeColors.brand.accent : themeColors.text.secondary}
                    bg={isActive ? '#ffffff' : 'transparent'}
                    borderRadius="4px 4px 0 0"
                    borderLeft={isActive ? '1px solid' : 'none'}
                    borderRight={isActive ? '1px solid' : 'none'}
                    borderLeftColor={themeColors.panel.divider}
                    borderRightColor={themeColors.panel.divider}
                    onClick={() => setSelectedTabIndex(idx)}
                  >
                    Rule {idx + 1}
                  </Box>
                );
              })}
            </HStack>

            <Button
              size="xs"
              variant="outline"
              borderColor="#cbd5e1"
              bg="#ffffff"
              color={themeColors.text.title}
              _hover={{ bg: '#f1f5f9' }}
              onClick={handleAddRule}
              disabled={disabled}
            >
              <Icon name="plus" size={12} />
              <Text ml={1} fontSize="11px" fontWeight="600">Add Rule</Text>
            </Button>
          </Flex>
        )}

        {/* Card Body */}
        <Box p={4}>
          {entries.length === 0 ? (
            <Flex
              direction="column"
              align="center"
              justify="center"
              py={10}
              px={4}
              textAlign="center"
            >
              <Box
                w="44px"
                h="44px"
                borderRadius="50%"
                bg="#eff6ff"
                color="#2563eb"
                display="grid"
                placeItems="center"
                mb={3}
              >
                <Icon name="sliders" size={20} />
              </Box>
              <Text fontSize="14px" fontWeight="700" color={themeColors.text.title} mb={1}>
                No Ethernet Port Rules Configured
              </Text>
              <Text fontSize="12px" color={themeColors.text.secondary} maxW="400px" mb={4}>
                Configure switch port settings including speeds, duplex, PoE, BPDU Guard, storm control, and LLDP for physical Ethernet interfaces.
              </Text>
              <Button
                size="sm"
                bg="#2563eb"
                color="#ffffff"
                _hover={{ bg: '#1d4ed8' }}
                onClick={handleAddRule}
                disabled={disabled}
              >
                <Icon name="plus" size={14} />
                <Text ml={1.5} fontSize="12px" fontWeight="600">Add Rule</Text>
              </Button>
            </Flex>
          ) : activeEntry ? (
            <SingleEthernetEntry
              key={`ethernet-entry-${selectedTabIndex}`}
              index={selectedTabIndex}
              entry={activeEntry}
              onChange={(updated) => handleUpdateRule(selectedTabIndex, updated)}
              onDelete={() => handleDeleteRule(selectedTabIndex)}
              disabled={disabled}
            />
          ) : null}
        </Box>
      </Box>
    </VStack>
  );
};

