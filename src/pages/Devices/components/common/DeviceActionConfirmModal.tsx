import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
  Spinner,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

export interface DeviceActionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  icon?: 'refresh' | 'trash' | 'alertTriangle' | 'device' | 'power';
}

export const DeviceActionConfirmModal: React.FC<DeviceActionConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  icon = 'alertTriangle',
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch {
      // Handled by caller / toaster
    } finally {
      setLoading(false);
    }
  };

  const getActionColors = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          bg: '#fee2e2',
          iconColor: '#b91c1c',
          btnBg: '#dc2626',
          btnHover: '#b91c1c',
        };
      case 'warning':
        return {
          bg: '#fef3c7',
          iconColor: '#b45309',
          btnBg: '#d97706',
          btnHover: '#b45309',
        };
      default:
        return {
          bg: themeColors.brand.accentLight,
          iconColor: themeColors.brand.accent,
          btnBg: themeColors.brand.accent,
          btnHover: themeColors.brand.accentHover,
        };
    }
  };

  const colors = getActionColors();

  return (
    <Box
      position="fixed"
      inset="0"
      bg="rgba(5, 12, 23, 0.54)"
      display="grid"
      placeItems="center"
      zIndex="1200"
      p={4}
    >
      <Box
        w="min(460px, 95vw)"
        bg="#ffffff"
        borderRadius="8px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        overflow="hidden"
        border="1px solid"
        borderColor={themeColors.panel.border}
      >
        <Box p={6}>
          <HStack gap={4} align="flex-start">
            <Flex
              w="44px"
              h="44px"
              borderRadius="10px"
              bg={colors.bg}
              color={colors.iconColor}
              align="center"
              justify="center"
              flexShrink={0}
            >
              <Icon name={icon} size={22} />
            </Flex>
            <VStack align="stretch" gap={1.5}>
              <Text fontSize="16px" fontWeight="700" color={themeColors.text.title}>
                {title}
              </Text>
              <Text fontSize="13px" color={themeColors.text.secondary} lineHeight="1.5">
                {description}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Flex
          px={6}
          py={3}
          bg="#f8fafc"
          borderTop="1px solid"
          borderColor={themeColors.panel.divider}
          justify="flex-end"
          gap={3}
        >
          <Button size="sm" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            bg={colors.btnBg}
            color="#ffffff"
            _hover={{ bg: colors.btnHover }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : confirmLabel}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceActionConfirmModal;

