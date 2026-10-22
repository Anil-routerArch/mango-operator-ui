import React, { useState, useMemo } from 'react';
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
import { SingleNatRule } from './SingleNatRule';
import { CreateNatRuleModal } from './CreateNatRuleModal';
import { getDefaultSnatRule, getDefaultDnatRule } from './natConstants';
import type { NatSectionData, SnatRule, DnatRule } from '../types';

export interface NatSectionProps {
  data: NatSectionData;
  onChange: (data: NatSectionData) => void;
  onDeleteSection: () => void;
  interfaceNameOptions?: { label: string; value: string }[];
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

interface CombinedRuleEntry {
  mode: 'snat' | 'dnat';
  index: number;
  rule: SnatRule | DnatRule;
}

export const NatSection: React.FC<NatSectionProps> = ({
  data,
  onChange,
  onDeleteSection,
  interfaceNameOptions = [],
  disabled = false,
  isDefaultConfig = false,
}) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const snatRules = data.snat?.rules || [];
  const dnatRules = data.dnat?.rules || [];

  const combinedRules: CombinedRuleEntry[] = useMemo(() => {
    const list: CombinedRuleEntry[] = [];
    snatRules.forEach((rule, index) => {
      list.push({ mode: 'snat', index, rule });
    });
    dnatRules.forEach((rule, index) => {
      list.push({ mode: 'dnat', index, rule });
    });
    return list;
  }, [snatRules, dnatRules]);

  const activeEntry: CombinedRuleEntry | undefined =
    combinedRules[selectedTabIndex] || combinedRules[0];

  const nextRuleId = (rules: (SnatRule | DnatRule)[]) => {
    const max = rules.reduce((acc, r) => Math.max(acc, Number(r['rule-id']) || 0), 0);
    return max + 1;
  };

  const handleAddRule = (mode: 'snat' | 'dnat') => {
    if (mode === 'snat') {
      const id = nextRuleId(snatRules);
      const newRule = getDefaultSnatRule(id);
      const updatedSnat = [...snatRules, newRule];
      onChange({
        ...data,
        snat: { rules: updatedSnat },
      });
      setSelectedTabIndex(snatRules.length);
    } else {
      const id = nextRuleId(dnatRules);
      const newRule = getDefaultDnatRule(id);
      const updatedDnat = [...dnatRules, newRule];
      onChange({
        ...data,
        dnat: { rules: updatedDnat },
      });
      setSelectedTabIndex(snatRules.length + dnatRules.length);
    }
  };

  const handleDeleteRule = (mode: 'snat' | 'dnat', index: number) => {
    if (mode === 'snat') {
      const updated = snatRules.filter((_, i) => i !== index);
      onChange({
        ...data,
        snat: { rules: updated },
      });
    } else {
      const updated = dnatRules.filter((_, i) => i !== index);
      onChange({
        ...data,
        dnat: { rules: updated },
      });
    }
    setSelectedTabIndex(0);
  };

  const handleUpdateRule = (mode: 'snat' | 'dnat', index: number, updated: SnatRule | DnatRule) => {
    if (mode === 'snat') {
      const updatedSnat = [...snatRules];
      updatedSnat[index] = updated as SnatRule;
      onChange({
        ...data,
        snat: { rules: updatedSnat },
      });
    } else {
      const updatedDnat = [...dnatRules];
      updatedDnat[index] = updated as DnatRule;
      onChange({
        ...data,
        dnat: { rules: updatedDnat },
      });
    }
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

      {/* Main NAT Card */}
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        overflow="hidden"
      >
        {/* Rule Tabs Bar */}
        {combinedRules.length > 0 && (
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
              {combinedRules.map((entry, idx) => {
                const isActive = activeEntry === entry || selectedTabIndex === idx;
                return (
                  <Box
                    key={`${entry.mode}-${entry.rule['rule-id']}-${entry.index}`}
                    as="button"
                    px={3}
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
                    Rule {entry.rule['rule-id']} ({entry.mode.toUpperCase()})
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
              onClick={() => setIsCreateModalOpen(true)}
              disabled={disabled}
            >
              <Icon name="plus" size={12} />
              <Text ml={1} fontSize="11px" fontWeight="600">Add Rule</Text>
            </Button>
          </Flex>
        )}

        {/* Card Body */}
        <Box p={4}>
          {combinedRules.length === 0 ? (
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
                No NAT Rules Configured
              </Text>
              <Text fontSize="12px" color={themeColors.text.secondary} maxW="400px" mb={4}>
                Add SNAT (Source NAT) or DNAT (Destination NAT) rules to handle traffic translation for this OpenLAN Gateway.
              </Text>
              <Button
                size="sm"
                bg="#2563eb"
                color="#ffffff"
                _hover={{ bg: '#1d4ed8' }}
                onClick={() => setIsCreateModalOpen(true)}
                disabled={disabled}
              >
                <Icon name="plus" size={14} />
                <Text ml={1.5} fontSize="12px" fontWeight="600">Add Rule</Text>
              </Button>
            </Flex>
          ) : activeEntry ? (
            <SingleNatRule
              key={`${activeEntry.mode}-${activeEntry.rule['rule-id']}-${activeEntry.index}`}
              mode={activeEntry.mode}
              rule={activeEntry.rule}
              onChange={(updated) => handleUpdateRule(activeEntry.mode, activeEntry.index, updated)}
              onDelete={() => handleDeleteRule(activeEntry.mode, activeEntry.index)}
              interfaceNameOptions={interfaceNameOptions}
              disabled={disabled}
            />
          ) : null}
        </Box>
      </Box>

      {/* Create Rule Modal */}
      <CreateNatRuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddRule={handleAddRule}
      />
    </VStack>
  );
};

