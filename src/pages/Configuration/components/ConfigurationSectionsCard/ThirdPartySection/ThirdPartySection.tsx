import React, { useState } from 'react';
import {
  Box,
  Flex,
  Input,
  SimpleGrid,
  Text,
  Textarea,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { ThirdPartySectionData } from '../types';

export interface ThirdPartySectionProps {
  data: ThirdPartySectionData;
  onChange: (updated: ThirdPartySectionData) => void;
  onDeleteSection: () => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const ThirdPartySection: React.FC<ThirdPartySectionProps> = ({
  data,
  onChange,
  onDeleteSection,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const rawConfig =
    data.configuration !== undefined
      ? data.configuration
      : data.customProperties && Object.keys(data.customProperties).length > 0
        ? JSON.stringify(data.customProperties, null, 2)
        : '{}';

  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    let parsed: Record<string, unknown> = {};
    let err: string | null = null;

    if (!newText.trim()) {
      err = 'Configuration cannot be empty. Please enter a valid JSON object.';
    } else {
      try {
        parsed = JSON.parse(newText);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          err = 'JSON must be an object in the form: { "value_name": "value" }';
        }
      } catch (parseErr: unknown) {
        err = parseErr instanceof Error ? parseErr.message : 'Invalid JSON string';
      }
    }

    setJsonError(err);
    onChange({
      ...data,
      configuration: newText,
      customProperties: err ? data.customProperties : parsed,
    });
  };

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} w="100%" alignItems="start">
      {/* Left Card: General Information */}
      <Box
        border="1px solid"
        borderColor="#cbd5e1"
        borderRadius="8px"
        bg="#ffffff"
        overflow="hidden"
      >
        <Flex
          px={4}
          py={3}
          align="center"
          justify="space-between"
          borderBottom="1px solid"
          borderColor="#e2e8f0"
          bg="#f8fafc"
        >
          <Box>
            <Text
              fontSize="14px"
              fontWeight="700"
              color={themeColors.text.title}
              borderBottom="1px solid #0f172a"
              display="inline-block"
              pb={0.5}
            >
              General Information
            </Text>
          </Box>

          {!disabled && !isDefaultConfig && (
            <Box
              as="button"
              w="28px"
              h="28px"
              borderRadius="6px"
              bg="#dc2626"
              color="#ffffff"
              display="grid"
              placeItems="center"
              cursor="pointer"
              _hover={{ bg: '#b91c1c' }}
              onClick={onDeleteSection}
              title="Delete this section"
            >
              <Icon name="trash" size={14} />
            </Box>
          )}
        </Flex>

        <Box p={4}>
          <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4}>
            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Name <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={data.meta.name}
                onChange={(e) =>
                  onChange({
                    ...data,
                    meta: { ...data.meta, name: e.target.value },
                  })
                }
                disabled={disabled || isDefaultConfig}
                bg={disabled || isDefaultConfig ? '#f8fafc' : '#ffffff'}
                cursor={isDefaultConfig ? 'not-allowed' : undefined}
                title={isDefaultConfig ? 'Fixed section name in uCentral schema' : undefined}
                borderRadius="4px"
                borderColor="#cbd5e1"
              />
            </Box>

            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Description
              </Text>
              <Input
                size="sm"
                value={data.meta.description}
                onChange={(e) =>
                  onChange({
                    ...data,
                    meta: { ...data.meta, description: e.target.value },
                  })
                }
                placeholder={isDefaultConfig ? 'N/A for default configs' : 'Optional description'}
                disabled={disabled || isDefaultConfig}
                bg={disabled || isDefaultConfig ? '#f8fafc' : '#ffffff'}
                cursor={isDefaultConfig ? 'not-allowed' : undefined}
                title={isDefaultConfig ? 'Section descriptions are not supported in uCentral JSON default configurations' : undefined}
                borderRadius="4px"
                borderColor="#cbd5e1"
              />
            </Box>

            <Box>
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Weight <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                type="number"
                min={0}
                value={data.meta.weight ?? 0}
                onChange={(e) =>
                  onChange({
                    ...data,
                    meta: {
                      ...data.meta,
                      weight: e.target.value === '' ? 0 : Number(e.target.value),
                    },
                  })
                }
                disabled={disabled || isDefaultConfig}
                bg={disabled || isDefaultConfig ? '#f8fafc' : '#ffffff'}
                cursor={isDefaultConfig ? 'not-allowed' : undefined}
                title={isDefaultConfig ? 'Weight is an OWPROV profile concept and is not applicable to uCentral JSON default configurations' : undefined}
                borderRadius="4px"
                borderColor="#cbd5e1"
              />
            </Box>
          </SimpleGrid>
        </Box>
      </Box>

      {/* Right Card: Third Party */}
      <Box
        border="1px solid"
        borderColor="#cbd5e1"
        borderRadius="8px"
        bg="#ffffff"
        overflow="hidden"
      >
        <Flex
          px={4}
          py={3}
          align="center"
          borderBottom="1px solid"
          borderColor="#e2e8f0"
          bg="#f8fafc"
        >
          <Text
            fontSize="14px"
            fontWeight="700"
            color={themeColors.text.title}
            borderBottom="1px solid #0f172a"
            display="inline-block"
            pb={0.5}
          >
            Third Party
          </Text>
        </Flex>

        <Box p={4}>
          <Text fontSize="12px" color={themeColors.text.secondary} mb={2}>
            Please use a valid JSON string in the following form: {'{ "value_name": "value" }'}.{' '}
            <Text as="span" color="#dc2626">*</Text>
          </Text>

          <Textarea
            value={rawConfig}
            onChange={handleConfigChange}
            placeholder="{}"
            disabled={disabled}
            minH="340px"
            fontFamily="mono"
            fontSize="13px"
            borderRadius="6px"
            borderColor={jsonError ? '#ef4444' : '#cbd5e1'}
            _focus={{
              borderColor: jsonError ? '#ef4444' : '#2563eb',
              boxShadow: jsonError ? '0 0 0 1px #ef4444' : '0 0 0 1px #2563eb',
            }}
          />

          {jsonError && (
            <Text fontSize="11px" color="#dc2626" mt={1}>
              {jsonError}
            </Text>
          )}
        </Box>
      </Box>
    </SimpleGrid>
  );
};
