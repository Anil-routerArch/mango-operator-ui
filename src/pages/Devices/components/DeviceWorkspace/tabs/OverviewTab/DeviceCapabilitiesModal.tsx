import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { useDeviceCapabilities } from '@/api/devices';

export interface DeviceCapabilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  serialNumber: string;
}

const formatDate = (timestamp?: number): string => {
  if (!timestamp) return 'Never';
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const DeviceCapabilitiesModal: React.FC<DeviceCapabilitiesModalProps> = ({
  isOpen,
  onClose,
  serialNumber,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');

  // Fetch capabilities from MDU backend with RBAC check
  const { data: capResponse, refetch, isFetching } = useDeviceCapabilities(serialNumber, isOpen);

  if (!isOpen) return null;

  const rawCaps = capResponse?.capabilities || capResponse;
  const jsonString = JSON.stringify(rawCaps || {}, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const compatible = (rawCaps as Record<string, unknown>)?.compatible as string | undefined;
  const platform = (rawCaps as Record<string, unknown>)?.platform as string | undefined;
  const model = (rawCaps as Record<string, unknown>)?.model as string | undefined;

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
        w="min(860px, 95vw)"
        maxH="85vh"
        bg="#ffffff"
        borderRadius="12px"
        boxShadow="0 20px 50px rgba(0,0,0,0.3)"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        border="1px solid"
        borderColor={themeColors.panel.border}
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          px={5}
          py={3.5}
          borderBottom="1px solid"
          borderColor={themeColors.panel.divider}
          bg="#f8fafc"
        >
          <HStack gap={2}>
            <Box color="#9333ea">
              <Icon name="sliders" size={18} />
            </Box>
            <Box>
              <HStack gap={2}>
                <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                  Device Capabilities
                </Text>
                <Badge colorPalette="purple" size="xs">
                  {serialNumber}
                </Badge>
              </HStack>
              {capResponse?.lastUpdate ? (
                <Text fontSize="11px" color={themeColors.text.secondary}>
                  Last Modified: {formatDate(capResponse.lastUpdate)}
                </Text>
              ) : null}
            </Box>
          </HStack>

          <HStack gap={2}>
            <Button
              size="xs"
              variant="outline"
              colorPalette={copied ? 'green' : 'blue'}
              onClick={handleCopy}
            >
              <Icon name="copy" size={12} />
              {copied ? 'Copied!' : 'Copy JSON'}
            </Button>

            <IconButton
              size="xs"
              variant="ghost"
              title="Refresh capabilities"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <Box animation={isFetching ? 'spin 1s linear infinite' : undefined}>
                <Icon name="refresh" size={14} />
              </Box>
            </IconButton>

            <IconButton
              size="xs"
              variant="ghost"
              aria-label="Close"
              onClick={onClose}
              color={themeColors.text.secondary}
            >
              <Icon name="x" size={16} />
            </IconButton>
          </HStack>
        </Flex>

        {/* Quick summary badges if available */}
        {(compatible || platform || model) && (
          <Flex px={5} py={2} bg="#f1f5f9" borderBottom="1px solid #e2e8f0" gap={3} wrap="wrap">
            {model && (
              <Text fontSize="12px" color="#334155">
                <strong>Model:</strong> {model}
              </Text>
            )}
            {compatible && (
              <Text fontSize="12px" color="#334155">
                <strong>Compatible:</strong> {compatible}
              </Text>
            )}
            {platform && (
              <Text fontSize="12px" color="#334155">
                <strong>Platform:</strong> {platform}
              </Text>
            )}
          </Flex>
        )}

        {/* Tab switch */}
        <Flex px={5} pt={2} gap={4} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
          <Button
            size="xs"
            variant="ghost"
            borderBottom="2px solid"
            borderColor={activeTab === 'preview' ? '#9333ea' : 'transparent'}
            borderRadius={0}
            color={activeTab === 'preview' ? '#9333ea' : themeColors.text.secondary}
            fontWeight={activeTab === 'preview' ? '700' : '500'}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </Button>
          <Button
            size="xs"
            variant="ghost"
            borderBottom="2px solid"
            borderColor={activeTab === 'raw' ? '#9333ea' : 'transparent'}
            borderRadius={0}
            color={activeTab === 'raw' ? '#9333ea' : themeColors.text.secondary}
            fontWeight={activeTab === 'raw' ? '700' : '500'}
            onClick={() => setActiveTab('raw')}
          >
            Raw JSON
          </Button>
        </Flex>

        {/* Content Body */}
        <Box p={4} flex="1" overflowY="auto">
          {isFetching && !capResponse && (
            <Center py={12}>
              <Spinner size="lg" color="#9333ea" />
            </Center>
          )}

          {(!isFetching || capResponse) && (
            <>
              {!capResponse || Object.keys(rawCaps || {}).length === 0 ? (
                <Center py={10} flexDirection="column" gap={2}>
                  <Box color="#94a3b8">
                    <Icon name="info" size={28} />
                  </Box>
                  <Text fontSize="13px" color={themeColors.text.secondary}>
                    No capabilities reported by device yet.
                  </Text>
                  <Text fontSize="11px" color="#94a3b8">
                    When the device connects and authenticates with the gateway, its hardware parameters will appear here.
                  </Text>
                </Center>
              ) : (
                <Box
                  bg="#0f172a"
                  color="#f8fafc"
                  p={4}
                  borderRadius="8px"
                  fontFamily="monospace"
                  fontSize="12px"
                  lineHeight="1.6"
                  overflowX="auto"
                  maxH="55vh"
                >
                  <pre style={{ margin: 0 }}>{jsonString}</pre>
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Footer */}
        <Flex
          justify="flex-end"
          px={5}
          py={3}
          borderTop="1px solid"
          borderColor={themeColors.panel.divider}
          bg="#f8fafc"
        >
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeviceCapabilitiesModal;

