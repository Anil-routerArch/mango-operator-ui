import React from 'react';
import { Box, Button, Flex, HStack, Text } from '@chakra-ui/react';
import { useAuthStore } from '@/stores/authStore';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Users & Access',
  subtitle = 'Manage users, system roles, and scoped permissions.',
  onRefresh,
  primaryAction,
}) => {
  const { user, logout } = useAuthStore();

  const userInitials = (user?.name || user?.email || 'U')
    .split(' ')
    .map((part: string) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Flex as="header" justify="space-between" align="flex-start" mb={4}>
      {/* Title & Description */}
      <Box>
        <Text
          as="h1"
          fontSize="26px"
          fontWeight="700"
          color={themeColors.text.title}
          mb="2px"
          letterSpacing="-0.02em"
        >
          {title}
        </Text>
        <Text fontSize="13px" color={themeColors.text.secondary}>
          {subtitle}
        </Text>
      </Box>

      {/* Right User & Actions */}
      <HStack gap={3} align="center">
        {/* User Profile Pill */}
        {user && (
          <HStack
            gap={2}
            px={3}
            py="6px"
            bg={themeColors.panel.bg}
            border="1px solid"
            borderColor={themeColors.panel.border}
            borderRadius="20px"
          >
            <Flex
              w="24px"
              h="24px"
              borderRadius="50%"
              bg={themeColors.avatar.blue}
              color="#ffffff"
              align="center"
              justify="center"
              fontSize="10px"
              fontWeight="700"
            >
              {userInitials}
            </Flex>
            <Text fontSize="12px" fontWeight="600" color={themeColors.text.primary}>
              {user.name || user.email}
            </Text>
            <Box
              fontSize="10px"
              fontWeight="600"
              bg={themeColors.brand.primaryLight}
              color={themeColors.brand.primary}
              px={2}
              py="1px"
              borderRadius="10px"
              textTransform="capitalize"
            >
              {user.userRole}
            </Box>
          </HStack>
        )}

        {/* Refresh Icon Button */}
        {onRefresh && (
          <Button
            onClick={onRefresh}
            w="40px"
            h="38px"
            minW="40px"
            bg="#ffffff"
            border="1px solid"
            borderColor={themeColors.input.iconBtnBorder}
            borderRadius="4px"
            p={0}
            color={themeColors.text.secondary}
            _hover={{ bg: themeColors.canvas.bg }}
            aria-label="Refresh data"
          >
            <Icon name="refresh" size={18} />
          </Button>
        )}

        {/* Primary Action Button (e.g. + Create user) */}
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            bg={themeColors.brand.primary}
            _hover={{ bg: themeColors.brand.primaryHover }}
            _active={{ bg: themeColors.brand.primaryActive }}
            color="#ffffff"
            borderRadius="4px"
            h="38px"
            px={4}
            fontSize="13px"
            fontWeight="600"
          >
            <HStack gap={2}>
              <Icon name="plus" size={16} />
              <span>{primaryAction.label}</span>
            </HStack>
          </Button>
        )}

        {/* Logout Button */}
        <Button
          onClick={() => logout()}
          w="40px"
          h="38px"
          minW="40px"
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.input.iconBtnBorder}
          borderRadius="4px"
          p={0}
          color={themeColors.status.error.text}
          _hover={{ bg: themeColors.status.error.bg }}
          title="Sign out"
          aria-label="Sign out"
        >
          <Icon name="logout" size={18} />
        </Button>
      </HStack>
    </Flex>
  );
};

export default Header;
