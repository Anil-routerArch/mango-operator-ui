import React from 'react';
import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';

interface Step {
  id: 'global' | 'property' | 'venue' | 'device' | 'override';
  label: string;
  icon: 'settings' | 'building' | 'landmark' | 'device' | 'sliders';
}

const STEPS: Step[] = [
  { id: 'global', label: 'Default (Global)', icon: 'settings' },
  { id: 'property', label: 'Property (Entity)', icon: 'building' },
  { id: 'venue', label: 'Venue', icon: 'landmark' },
  { id: 'device', label: 'Device', icon: 'device' },
  { id: 'override', label: 'Local Override', icon: 'sliders' },
];

interface InheritanceBannerProps {
  currentScope?: 'global' | 'property' | 'venue' | string;
}

export const InheritanceBanner: React.FC<InheritanceBannerProps> = ({ currentScope = 'global' }) => {
  return (
    <Box
      bg="#ffffff"
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="6px"
      p={4}
      mb={4}
    >
      <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={3}>
        Configuration inheritance hierarchy (APConfig.cpp resolution)
      </Text>

      {/* Horizontal Flowchart */}
      <Flex align="center" justify="flex-start" gap={3} wrap="wrap" mb={2}>
        {STEPS.map((step, idx) => {
          const isCurrent = step.id === currentScope;

          return (
            <React.Fragment key={step.label}>
              <HStack
                gap={2}
                px={3}
                py={1.5}
                borderRadius="4px"
                bg={isCurrent ? '#eff6ff' : idx === 4 ? '#fffbeb' : '#f8fafc'}
                border="1px solid"
                borderColor={isCurrent ? themeColors.brand.accent : idx === 4 ? '#fde68a' : themeColors.panel.divider}
              >
                <Icon
                  name={step.icon}
                  size={15}
                  color={isCurrent ? themeColors.brand.accent : idx === 4 ? '#b45309' : themeColors.text.secondary}
                />
                <Text
                  fontSize="12px"
                  fontWeight={isCurrent ? '700' : idx === 4 ? '600' : '500'}
                  color={isCurrent ? themeColors.brand.accent : idx === 4 ? '#92400e' : themeColors.text.primary}
                >
                  {step.label} {isCurrent && '★ Active'}
                </Text>
              </HStack>

              {idx < STEPS.length - 1 && (
                <Box color={themeColors.text.muted}>
                  <Icon name="arrowRight" size={14} />
                </Box>
              )}
            </React.Fragment>
          );
        })}
      </Flex>

      <Text fontSize="11px" color={themeColors.text.secondary}>
        Settings flow left to right. Lower levels in hierarchy and local overrides take precedence over inherited profiles.
      </Text>
    </Box>
  );
};
