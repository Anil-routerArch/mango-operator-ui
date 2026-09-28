import React, { useState } from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon, type IconName } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

interface NavItem {
  icon: IconName;
  label: string;
  path: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'OPERATIONS',
    items: [
      { icon: 'home', label: 'Dashboard', path: '/dashboard' },
      { icon: 'building', label: 'Properties', path: '/properties' },
      { icon: 'device', label: 'Devices', path: '/devices' },
    ],
  },
  {
    title: 'NETWORK',
    items: [{ icon: 'settings', label: 'Configuration', path: '/configuration' }],
  },
  {
    title: 'ADMINISTRATION',
    items: [{ icon: 'users', label: 'Users & Access', path: '/users' }],
  },
];

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  return (
    <Box
      as="aside"
      w={isCollapsed ? '72px' : '216px'}
      minH="100vh"
      flex={`0 0 ${isCollapsed ? '72px' : '216px'}`}
      bg={`linear-gradient(150deg, ${themeColors.sidebar.bgGradientStart}, ${themeColors.sidebar.bgGradientEnd})`}
      color={themeColors.sidebar.text}
      p="20px 12px"
      boxSizing="border-box"
      position="relative"
      transition="width 0.2s ease, flex-basis 0.2s ease"
      userSelect="none"
    >
      {/* Brand Header */}
      <Flex align="center" gap={3} px={2} pb={6}>
        <Box
          w="28px"
          h="34px"
          bg={`linear-gradient(145deg, ${themeColors.brand.mangoGradientStart}, ${themeColors.brand.mangoGradientEnd})`}
          borderRadius="70% 40% 65% 55%"
          display="inline-block"
          transform="rotate(15deg)"
          position="relative"
          flexShrink={0}
        >
          <Box
            w="17px"
            h="7px"
            position="absolute"
            bg={themeColors.brand.mangoLeaf}
            borderRadius="100% 0"
            top="-5px"
            right="-7px"
            transform="rotate(-25deg)"
          />
        </Box>
        {!isCollapsed && (
          <Text fontSize="18px" fontWeight="700" color="#ffffff" whiteSpace="nowrap">
            Mango Cloud
          </Text>
        )}
      </Flex>

      {/* Nav Groups */}
      <VStack gap={5} align="stretch">
        {NAV_GROUPS.map((group) => (
          <Box key={group.title}>
            {!isCollapsed && (
              <Text
                fontSize="11px"
                fontWeight="600"
                color={themeColors.sidebar.categoryText}
                letterSpacing="0.05em"
                px={2}
                mb={2}
              >
                {group.title}
              </Text>
            )}
            <VStack gap={1} align="stretch">
              {group.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/dashboard' && (location.pathname === '/' || location.pathname === ''));

                return (
                  <NavLink key={item.label} to={item.path} style={{ textDecoration: 'none' }}>
                    <Flex
                      align="center"
                      gap={3}
                      px={3}
                      py="10px"
                      borderRadius="6px"
                      cursor="pointer"
                      bg={isActive ? themeColors.sidebar.activeBg : 'transparent'}
                      color="#ffffff"
                      _hover={{
                        bg: isActive ? themeColors.sidebar.activeBg : themeColors.sidebar.hoverBg,
                      }}
                      transition="background 0.15s ease"
                      title={isCollapsed ? item.label : undefined}
                      justify={isCollapsed ? 'center' : 'flex-start'}
                    >
                      <Icon name={item.icon} size={18} />
                      {!isCollapsed && (
                        <Text fontSize="13px" fontWeight={isActive ? '600' : '400'}>
                          {item.label}
                        </Text>
                      )}
                    </Flex>
                  </NavLink>
                );
              })}
            </VStack>
          </Box>
        ))}
      </VStack>

      {/* Collapse Toggle at Bottom */}
      <Box
        position="absolute"
        bottom="25px"
        left={isCollapsed ? '50%' : '20px'}
        transform={isCollapsed ? 'translateX(-50%)' : 'none'}
      >
        <Flex
          as="button"
          align="center"
          justify="center"
          w="32px"
          h="32px"
          bg="transparent"
          border="0"
          color="#ffffff"
          opacity={0.8}
          _hover={{ opacity: 1, bg: 'rgba(255, 255, 255, 0.1)' }}
          borderRadius="4px"
          cursor="pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name={isCollapsed ? 'chevronRight' : 'chevronLeft'} size={20} />
        </Flex>
      </Box>
    </Box>
  );
};

export default Sidebar;
