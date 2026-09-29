import React, { useState } from 'react';
import { Box, Flex, Text, VStack, Image } from '@chakra-ui/react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { Icon, type IconName } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import mduLogo from '@/assets/mdu-logo.png';

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
    <Flex
      as="aside"
      direction="column"
      w={isCollapsed ? '72px' : '216px'}
      h="100vh"
      maxH="100vh"
      flex={`0 0 ${isCollapsed ? '72px' : '216px'}`}
      bg={`linear-gradient(150deg, ${themeColors.sidebar.bgGradientStart}, ${themeColors.sidebar.bgGradientEnd})`}
      color={themeColors.sidebar.text}
      p="20px 12px"
      boxSizing="border-box"
      position="sticky"
      top={0}
      transition="width 0.2s ease, flex-basis 0.2s ease"
      userSelect="none"
      zIndex={100}
    >
      <Box
        flex="1"
        overflowY="auto"
        css={{
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {/* Brand Header */}
      {!isCollapsed ? (
        <Flex
          align="center"
          justify="center"
          pb={5}
          pt={1}
          minH="54px"
          w="100%"
          position="relative"
        >
          <Link
            to="/dashboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              width: '100%',
            }}
            title="Go to Dashboard"
          >
            <Image
              src={mduLogo}
              alt="MDU Logo"
              maxH="46px"
              maxW="180px"
              w="auto"
              h="auto"
              objectFit="contain"
              cursor="pointer"
              transition="transform 0.15s ease, opacity 0.15s ease"
              _hover={{ opacity: 0.92, transform: 'scale(1.03)' }}
            />
          </Link>
        </Flex>
      ) : (
        <Flex align="center" justify="center" pb={5} pt={1} minH="54px">
          <Flex
            as="button"
            align="center"
            justify="center"
            w="40px"
            h="40px"
            bg="transparent"
            border="0"
            color="#ffffff"
            opacity={0.9}
            _hover={{ opacity: 1, bg: 'rgba(255, 255, 255, 0.14)' }}
            borderRadius="6px"
            cursor="pointer"
            onClick={() => setIsCollapsed(false)}
            title="Open sidebar"
            aria-label="Open sidebar"
            transition="all 0.15s ease"
          >
            <Icon name="menu" size={24} />
          </Flex>
        </Flex>
      )}

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
      </Box>

      {/* Collapse Toggle at Bottom */}
      <Box
        pt={3}
        pb={1}
        display="flex"
        justifyContent={isCollapsed ? 'center' : 'flex-start'}
        px={isCollapsed ? 0 : 2}
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
    </Flex>
  );
};

export default Sidebar;
