import React from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { MultiSelectDropdown } from '../SubSectionPicker';
import { CreatableMultiSelect } from './CreatableMultiSelect';
import { ONLINE_CHECK_ACTIONS } from './servicesConstants';
import type { ServicesSectionData } from '../types';

interface OnlineCheckProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

export const OnlineCheck: React.FC<OnlineCheckProps> = ({ data, onChange, disabled = false }) => {
  const currentAction = Array.isArray(data.onlineCheck.action)
    ? data.onlineCheck.action
    : (data.onlineCheck.action ? [data.onlineCheck.action] : []);

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
          Online Check
        </Text>
      </Flex>
      <Box p={4}>
        <VStack gap={4} align="stretch">
          {/* action */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              action <Text as="span" color="#dc2626">*</Text>
            </Text>
            <MultiSelectDropdown
              value={currentAction}
              onChange={(val) =>
                onChange({
                  ...data,
                  onlineCheck: { ...data.onlineCheck, action: val },
                })
              }
              options={ONLINE_CHECK_ACTIONS}
              disabled={disabled}
              placeholder="Select..."
            />
          </Box>

          {/* ping-hosts */}
          <Box>
            <CreatableMultiSelect
              label="ping-hosts"
              isRequired
              values={data.onlineCheck.pingHosts}
              onChange={(newHosts) =>
                onChange({
                  ...data,
                  onlineCheck: { ...data.onlineCheck, pingHosts: newHosts },
                })
              }
              placeholder="Select..."
              disabled={disabled}
            />
          </Box>

          {/* download-hosts */}
          <Box>
            <CreatableMultiSelect
              label="download-hosts"
              isRequired
              values={data.onlineCheck.downloadHosts}
              onChange={(newHosts) =>
                onChange({
                  ...data,
                  onlineCheck: { ...data.onlineCheck, downloadHosts: newHosts },
                })
              }
              placeholder="Select..."
              disabled={disabled}
            />
          </Box>

          {/* check-interval */}
          <Box w="100px">
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              check-interval <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              min={0}
              max={65535}
              value={data.onlineCheck.checkInterval}
              onChange={(e) =>
                onChange({
                  ...data,
                  onlineCheck: { ...data.onlineCheck, checkInterval: Number(e.target.value) || 60 },
                })
              }
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>

          {/* check-threshold */}
          <Box w="100px">
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              check-threshold <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              min={0}
              max={65535}
              value={data.onlineCheck.checkThreshold}
              onChange={(e) =>
                onChange({
                  ...data,
                  onlineCheck: { ...data.onlineCheck, checkThreshold: Number(e.target.value) || 1 },
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
