import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Header } from '@/layout/Header';
import { themeColors } from '@/theme';

export const PropertiesPage: React.FC = () => {
  return (
    <Box>
      <Header
        title="Properties"
        subtitle="Manage MDU sites, buildings, and venue properties."
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
            Properties content will appear here.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
};

export default PropertiesPage;
