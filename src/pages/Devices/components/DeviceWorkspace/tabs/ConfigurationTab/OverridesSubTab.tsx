import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { toaster } from '@/components/ui/toaster';
import type { UnifiedFleetDevice } from '@/types/device';

export interface OverridesSubTabProps {
  device: UnifiedFleetDevice;
}

export const OverridesSubTab: React.FC<OverridesSubTabProps> = ({ device: _device }) => {
  const [overrides, setOverrides] = useState([
    { key: 'gw_ip', value: '192.168.1.1', description: 'Default Gateway IP' },
    { key: 'vlan_id', value: '100', description: 'Management VLAN ID' },
  ]);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newKey.trim()) return;
    setOverrides([...overrides, { key: newKey.trim(), value: newValue.trim(), description: 'Custom override' }]);
    setNewKey('');
    setNewValue('');
    toaster.create({
      title: 'Override Added',
      description: `Added variable ${newKey}`,
      type: 'success',
    });
  };

  const handleDelete = (index: number) => {
    setOverrides(overrides.filter((_, i) => i !== index));
    toaster.create({
      title: 'Override Removed',
      type: 'info',
    });
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={5}>
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="15px" fontWeight="600" color={themeColors.text.title}>
              Configuration Variable Overrides
            </Text>
            <Text fontSize="12px" color={themeColors.text.muted}>
              Override template variables (${'{variable_name}'}) for this specific device.
            </Text>
          </Box>
        </Flex>

        {/* Add new override row */}
        <Flex gap={3} align="center" wrap="wrap">
          <Input
            size="sm"
            placeholder="Variable Key (e.g. static_ip)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            w="220px"
            borderColor={themeColors.input.border}
          />
          <Input
            size="sm"
            placeholder="Override Value (e.g. 10.0.0.50)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            w="260px"
            borderColor={themeColors.input.border}
          />
          <Button
            size="sm"
            bg={themeColors.brand.primary}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.primaryHover }}
            onClick={handleAdd}
            gap={1.5}
          >
            <Icon name="plus" size={14} />
            Add Override
          </Button>
        </Flex>

        {/* Overrides Box/Flex Table */}
        <Box border="1px solid" borderColor={themeColors.panel.divider} borderRadius="8px" overflow="hidden">
          <Flex
            bg="#f8fafc"
            borderBottom="1px solid"
            borderColor={themeColors.panel.divider}
            py={2.5}
            px={4}
            fontSize="11px"
            fontWeight="700"
            color={themeColors.text.muted}
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            <Box flex="1.5">VARIABLE KEY</Box>
            <Box flex="1.5">OVERRIDE VALUE</Box>
            <Box flex="2">DESCRIPTION</Box>
            <Box w="60px" textAlign="right">ACTION</Box>
          </Flex>

          {overrides.map((ov, idx) => (
            <Flex
              key={idx}
              align="center"
              py={3}
              px={4}
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
              fontSize="12px"
              _last={{ borderBottom: 'none' }}
              _hover={{ bg: '#fafbfc' }}
            >
              <Box flex="1.5" fontWeight="600" fontFamily="monospace" color={themeColors.brand.accent}>
                ${`{${ov.key}}`}
              </Box>
              <Box flex="1.5" fontFamily="monospace" color={themeColors.text.primary}>
                {ov.value}
              </Box>
              <Box flex="2" color={themeColors.text.secondary} fontSize="12px">
                {ov.description}
              </Box>
              <Box w="60px" textAlign="right">
                <Button
                  size="xs"
                  variant="ghost"
                  color="#dc2626"
                  _hover={{ bg: '#fee2e2' }}
                  onClick={() => handleDelete(idx)}
                >
                  <Icon name="trash" size={14} />
                </Button>
              </Box>
            </Flex>
          ))}
        </Box>
      </VStack>
    </Box>
  );
};

export default OverridesSubTab;

