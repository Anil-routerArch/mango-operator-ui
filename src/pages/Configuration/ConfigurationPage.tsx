import React, { useState } from 'react';
import { Box, Button, Flex } from '@chakra-ui/react';
import { Header } from '@/layout/Header';
import { themeColors } from '@/theme';
import { useConfigurationUiStore } from '@/stores/configurationUiStore';
import { ConfigurationsPage } from './ConfigurationsPage';
import { ConfigurationProfilesPage } from './ConfigurationProfilesPage';

export const ConfigurationPage: React.FC = () => {
  const {
    mainTab,
    setMainTab,
    selectedConfigId,
    selectedProfileId,
    isCreatingConfig,
    setIsCreatingConfig,
    setSelectedConfigId,
    setSelectedProfileId,
  } = useConfigurationUiStore();

  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [isCreateConfigOpen, setIsCreateConfigOpen] = useState(false);

  const handleTabChange = (tab: 'configurations' | 'profiles') => {
    setSelectedConfigId(null);
    setSelectedProfileId(null);
    setIsCreatingConfig(false);
    setMainTab(tab);
  };

  const handlePrimaryAction = () => {
    if (mainTab === 'configurations') {
      setIsCreateConfigOpen(true);
    } else {
      setIsCreateProfileOpen(true);
    }
  };

  const isEditing = Boolean(selectedConfigId || selectedProfileId || isCreatingConfig);

  return (
    <Box w="100%" pb={8}>
      {/* Header & Subtabs - displayed when not in full-page editor mode */}
      {!isEditing && (
        <>
          <Header
            title="Configurations"
            subtitle={
              mainTab === 'configurations'
                ? 'Master device configurations with variable block bindings and hierarchy overrides.'
                : 'Reusable variable blocks (radios, SSIDs, VLANs) in OWPROV scoped globally, per property, or per venue.'
            }
            primaryAction={{
              label: mainTab === 'configurations' ? 'Create Configuration' : 'Create Profile',
              onClick: handlePrimaryAction,
            }}
          />

          {/* Main Top Navigation Subtabs: Configurations & Configuration Profiles (Mirrors Users & Access) */}
          <Flex borderBottom="1px solid" borderColor={themeColors.panel.divider} gap={6} mb={4} mt={1}>
            <Button
              variant="plain"
              onClick={() => handleTabChange('configurations')}
              px={1}
              pb={2}
              pt={1}
              fontSize="14px"
              fontWeight={mainTab === 'configurations' ? '600' : '500'}
              color={mainTab === 'configurations' ? themeColors.text.title : themeColors.text.secondary}
              position="relative"
              cursor="pointer"
              _after={
                mainTab === 'configurations'
                  ? {
                      content: '""',
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      bg: themeColors.brand.accent,
                    }
                  : undefined
              }
            >
              Configurations
            </Button>

            <Button
              variant="plain"
              onClick={() => handleTabChange('profiles')}
              px={1}
              pb={2}
              pt={1}
              fontSize="14px"
              fontWeight={mainTab === 'profiles' ? '600' : '500'}
              color={mainTab === 'profiles' ? themeColors.text.title : themeColors.text.secondary}
              position="relative"
              cursor="pointer"
              _after={
                mainTab === 'profiles'
                  ? {
                      content: '""',
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      bg: themeColors.brand.accent,
                    }
                  : undefined
              }
            >
              Configuration Profiles
            </Button>
          </Flex>
        </>
      )}

      {/* Tab Content */}
      {mainTab === 'configurations' ? (
        <ConfigurationsPage
          embedded
          isCreateOpen={isCreateConfigOpen}
          onCloseCreate={() => setIsCreateConfigOpen(false)}
          onNavigateToProfile={() => handleTabChange('profiles')}
        />
      ) : (
        <ConfigurationProfilesPage
          embedded
          isCreateOpen={isCreateProfileOpen}
          onCloseCreate={() => setIsCreateProfileOpen(false)}
          onNavigateToConfig={() => handleTabChange('configurations')}
        />
      )}
    </Box>
  );
};

export default ConfigurationPage;
