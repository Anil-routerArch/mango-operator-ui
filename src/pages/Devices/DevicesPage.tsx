import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Header } from '@/layout/Header';
import { themeColors } from '@/theme';

export const DevicesPage: React.FC = () => {
  return (
    <Box>
      <Header
        title="Devices"
        subtitle="Manage access points, switches, and gateway devices."
      />
      <Box
        bg={themeColors.panel.bg}
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        p={8}
        minH="450px"
      >
        <Flex align="center" justify="center" minH="300px">
          <Text fontSize="14px" color={themeColors.text.muted}>
            Devices content will appear here.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
};

export default DevicesPage;
