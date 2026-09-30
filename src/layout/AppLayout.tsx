import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { themeColors } from '@/theme';

export const AppLayout: React.FC = () => {
  return (
    <Flex h="100vh" maxH="100vh" w="100%" overflow="hidden" bg={themeColors.canvas.bg}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <Box
        as="main"
        flex="1"
        h="100vh"
        maxH="100vh"
        p="20px 36px 36px"
        overflowX="hidden"
        overflowY="auto"
        bg={themeColors.panel.bg}
        boxSizing="border-box"
      >
        <Outlet />
      </Box>
    </Flex>
  );
};

export default AppLayout;
