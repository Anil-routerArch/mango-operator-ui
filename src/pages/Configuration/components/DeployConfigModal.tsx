import React, { useState } from 'react';
import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { DeviceConfiguration } from '../types/configuration';

interface DeployConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DeviceConfiguration;
  onConfirmDeploy: () => void;
}

export const DeployConfigModal: React.FC<DeployConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfirmDeploy,
}) => {
  const [deploying, setDeploying] = useState(false);

  if (!isOpen) return null;

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      onConfirmDeploy();
      onClose();
    }, 1200);
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0,0,0,0.4)"
      zIndex={2000}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="#ffffff"
        borderRadius="8px"
        w="100%"
        maxW="540px"
        boxShadow="0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
        overflow="hidden"
      >
        {/* Header */}
        <Flex justify="space-between" align="center" p={4} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
          <HStack gap={2}>
            <Icon name="device" size={18} color="#15803d" />
            <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
              Deploy Configuration
            </Text>
          </HStack>
          <Button variant="plain" size="xs" p={1} onClick={onClose}>
            <Icon name="x" size={16} />
          </Button>
        </Flex>

        {/* Content */}
        <Box p={5}>
          <Text fontSize="13px" color={themeColors.text.primary} mb={3}>
            You are about to deploy <Text as="span" fontWeight="700">{config.name}</Text> (Version {config.version}) to all assigned scopes:
          </Text>

          <VStack gap={2} align="stretch" mb={4} p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor={themeColors.panel.divider} fontSize="12px">
            {config.assignments.map((asgn) => (
              <Flex key={asgn.id} justify="space-between">
                <Text fontWeight="600">{asgn.name}</Text>
                <Text color={themeColors.text.muted} textTransform="capitalize">{asgn.type}</Text>
              </Flex>
            ))}
          </VStack>

          <HStack gap={3} p={3} bg="#f0fdf4" border="1px solid" borderColor="#bbf7d0" borderRadius="6px" color="#15803d" fontSize="12px">
            <Icon name="check" size={16} color="#15803d" />
            <Text>18 online Access Points will receive the updated configuration via WebSocket push.</Text>
          </HStack>
        </Box>

        {/* Footer */}
        <Flex justify="flex-end" gap={3} p={4} bg="#f8fafc" borderTop="1px solid" borderColor={themeColors.panel.divider}>
          <Button variant="outline" size="sm" onClick={onClose} disabled={deploying}>
            Cancel
          </Button>
          <Button
            size="sm"
            bg={themeColors.brand.primary}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.primaryHover }}
            onClick={handleDeploy}
            loading={deploying}
          >
            {deploying ? 'Deploying...' : 'Deploy to 18 Devices'}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

