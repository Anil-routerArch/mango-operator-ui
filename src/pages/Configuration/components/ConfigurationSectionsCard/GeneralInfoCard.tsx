import React from 'react';
import {
  Box,
  Flex,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { SubSectionPicker, type SubSectionOption } from './SubSectionPicker';
import type { SectionMeta } from './types';

interface GeneralInfoCardProps {
  meta: SectionMeta;
  onChange: (updated: SectionMeta) => void;
  onDeleteSection: () => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
  subsectionsOptions?: SubSectionOption[];
  activeSubsections?: string[];
  onSubsectionsChange?: (subs: string[]) => void;
}

export const GeneralInfoCard: React.FC<GeneralInfoCardProps> = ({
  meta,
  onChange,
  onDeleteSection,
  disabled = false,
  isDefaultConfig = false,
  subsectionsOptions,
  activeSubsections,
  onSubsectionsChange,
}) => {
  return (
    <Box
      flex="1"
      minW={{ base: '100%', md: '320px' }}
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="8px"
      bg="#ffffff"
      position="relative"
      zIndex={15}
    >
      {/* Header matching screenshot with red trash icon */}
      <Flex
        px={4}
        py={3}
        align="center"
        justify="space-between"
        borderBottom="1px solid"
        borderColor={themeColors.panel.divider}
        bg="#f8fafc"
        borderTopRadius="7px"
      >
        <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
          General Information
        </Text>

        {!disabled && !isDefaultConfig && (
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
            _hover={{ bg: '#fca5a5', color: '#b91c1c' }}
            onClick={onDeleteSection}
            title="Delete this subsection"
          >
            <Icon name="trash" size={13} />
          </Box>
        )}
      </Flex>

      {/* Inputs matching screenshot: Name *, Description, Weight * */}
      <Box p={4}>
        <VStack gap={3} align="stretch">
          <Flex gap={3} wrap="wrap">
            <Box flex="1" minW="140px">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Name <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={meta.name}
                onChange={(e) => onChange({ ...meta, name: e.target.value })}
                placeholder="Section Name"
                disabled={disabled || isDefaultConfig}
                bg={disabled || isDefaultConfig ? '#f8fafc' : '#ffffff'}
                cursor={isDefaultConfig ? 'not-allowed' : undefined}
                title={isDefaultConfig ? 'Fixed section name in uCentral schema' : undefined}
                borderRadius="4px"
              />
            </Box>

            <Box flex="1" minW="140px">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Description
              </Text>
              <Input
                size="sm"
                value={meta.description}
                onChange={(e) => onChange({ ...meta, description: e.target.value })}
                placeholder={isDefaultConfig ? 'N/A for default configs' : 'Optional description'}
                disabled={disabled || isDefaultConfig}
                bg={disabled || isDefaultConfig ? '#f8fafc' : '#ffffff'}
                cursor={isDefaultConfig ? 'not-allowed' : undefined}
                title={isDefaultConfig ? 'Section descriptions are not supported in uCentral JSON default configurations' : undefined}
                borderRadius="4px"
              />
            </Box>
          </Flex>

          {subsectionsOptions && onSubsectionsChange && (
            <SubSectionPicker
              label="Subsections"
              options={subsectionsOptions}
              activeSubsections={activeSubsections || []}
              onChange={onSubsectionsChange}
              disabled={disabled}
            />
          )}

          <Box maxW="140px">
            <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
              Weight <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              value={meta.weight}
              onChange={(e) => onChange({ ...meta, weight: Number(e.target.value) || 1 })}
              disabled={disabled || isDefaultConfig}
              bg={disabled || isDefaultConfig ? '#f8fafc' : '#ffffff'}
              cursor={isDefaultConfig ? 'not-allowed' : undefined}
              title={isDefaultConfig ? 'Weight is only used for OWPROV modular profile priority, not applicable to default configurations' : undefined}
              borderRadius="4px"
            />
            {isDefaultConfig && (
              <Text fontSize="10px" color={themeColors.text.muted} mt={0.5}>
                N/A for default configs
              </Text>
            )}
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};
