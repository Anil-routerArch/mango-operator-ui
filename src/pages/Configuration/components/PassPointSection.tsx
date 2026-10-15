import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import { CreatableMultiSelect } from './ConfigurationSectionsCard/ServicesSection/CreatableMultiSelect';
import type { PassPointConfig, PassPointIcon } from '../types/passpoint';

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <HStack
    gap={2}
    cursor={disabled ? 'not-allowed' : 'pointer'}
    userSelect="none"
    onClick={() => !disabled && onChange(!checked)}
  >
    <Box
      w="34px"
      h="18px"
      borderRadius="9px"
      bg={checked ? themeColors.brand.accent : '#cbd5e1'}
      position="relative"
      transition="all 0.2s ease"
      opacity={disabled ? 0.6 : 1}
    >
      <Box
        w="14px"
        h="14px"
        borderRadius="50%"
        bg="#ffffff"
        position="absolute"
        top="2px"
        left={checked ? '18px' : '2px'}
        transition="all 0.2s ease"
        boxShadow="0 1px 2px rgba(0,0,0,0.2)"
      />
    </Box>
  </HStack>
);

export interface PassPointSectionProps {
  config: PassPointConfig;
  onChange: (cfg: PassPointConfig) => void;
  isDisabled?: boolean;
}

export const PassPointSection: React.FC<PassPointSectionProps> = ({
  config,
  onChange,
  isDisabled = false,
}) => {
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [newIconWidth, setNewIconWidth] = useState(64);
  const [newIconHeight, setNewIconHeight] = useState(64);
  const [newIconLang, setNewIconLang] = useState('eng');
  const [newIconType, setNewIconType] = useState('image/png');
  const [newIconBase64, setNewIconBase64] = useState('');

  const updateField = <K extends keyof PassPointConfig>(key: K, val: PassPointConfig[K]) => {
    onChange({
      ...config,
      [key]: val,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewIconType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Index = result.indexOf('base64,');
      if (base64Index !== -1) {
        setNewIconBase64(result.substring(base64Index + 7));
      } else {
        setNewIconBase64(result);
      }

      // Detect dimensions
      const img = new window.Image();
      img.onload = () => {
        if (img.width) setNewIconWidth(img.width);
        if (img.height) setNewIconHeight(img.height);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleAddIcon = () => {
    if (!newIconBase64) return;
    const item: PassPointIcon = {
      width: Number(newIconWidth) || 64,
      height: Number(newIconHeight) || 64,
      type: newIconType || 'image/png',
      language: (newIconLang || 'eng').toLowerCase().slice(0, 3),
      icon: newIconBase64,
    };
    onChange({
      ...config,
      icons: [...config.icons, item],
    });
    setNewIconBase64('');
  };

  const handleRemoveIcon = (index: number) => {
    onChange({
      ...config,
      icons: config.icons.filter((_, i) => i !== index),
    });
  };

  return (
    <Box>
      <Flex align="center" gap={3} mb={config.enabled ? 4 : 0}>
        <Text
          fontSize="14px"
          fontWeight="700"
          color={themeColors.text.title}
          borderBottom="1px solid #0f172a"
          pb={0.5}
        >
          Pass Point
        </Text>
        <ToggleSwitch
          checked={config.enabled}
          onChange={(val) => updateField('enabled', val)}
          disabled={isDisabled}
        />
      </Flex>

      {config.enabled && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} pt={2}>
          {/* Row 1 */}
          <Box>
            <CreatableMultiSelect
              label="venue-name"
              values={config.venueName}
              onChange={(vals) => updateField('venueName', vals)}
              placeholder="eng:Example passpoint_venue"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <CreatableMultiSelect
              label="venue-url"
              values={config.venueUrl}
              onChange={(vals) => updateField('venueUrl', vals)}
              placeholder="http://www.example.com/info-fra"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              venue-group <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              min={0}
              max={32}
              value={config.venueGroup}
              onChange={(e) => updateField('venueGroup', Number(e.target.value))}
              bg="#ffffff"
              borderColor="#cbd5e1"
              borderRadius="6px"
              disabled={isDisabled}
            />
          </Box>

          {/* Row 2 */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              venue-type <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              min={0}
              max={32}
              value={config.venueType}
              onChange={(e) => updateField('venueType', Number(e.target.value))}
              bg="#ffffff"
              borderColor="#cbd5e1"
              borderRadius="6px"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              access-network-type <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              min={0}
              max={15}
              value={config.accessNetworkType}
              onChange={(e) => updateField('accessNetworkType', Number(e.target.value))}
              bg="#ffffff"
              borderColor="#cbd5e1"
              borderRadius="6px"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              auth-type.type <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              value={config.authType.type}
              onChange={(v) =>
                onChange({
                  ...config,
                  authType: { ...config.authType, type: v },
                })
              }
              options={[
                { value: 'terms-and-conditions', label: 'Terms and Conditions' },
                { value: 'online-enrollment', label: 'Online Enrollment' },
                { value: 'http-redirection', label: 'HTTP Redirection' },
                { value: 'dns-redirection', label: 'DNS Redirection' },
              ]}
              disabled={isDisabled}
            />
          </Box>

          {/* Row 3 */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              auth-type.url
            </Text>
            <Input
              size="sm"
              value={config.authType.url || ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  authType: { ...config.authType, url: e.target.value },
                })
              }
              placeholder="https://..."
              bg="#ffffff"
              borderColor="#cbd5e1"
              borderRadius="6px"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <CreatableMultiSelect
              label="domain-name"
              values={config.domainName}
              onChange={(vals) => updateField('domainName', vals)}
              placeholder="test.com"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <CreatableMultiSelect
              label="nai-realm"
              values={config.naiRealm}
              onChange={(vals) => updateField('naiRealm', vals)}
              placeholder="test.com"
              disabled={isDisabled}
            />
          </Box>

          {/* Row 4 */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              osen
            </Text>
            <Box pt={1}>
              <ToggleSwitch
                checked={config.osen}
                onChange={(val) => updateField('osen', val)}
                disabled={isDisabled}
              />
            </Box>
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              anqp-domain <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              min={0}
              max={65535}
              value={config.anqpDomain}
              onChange={(e) => updateField('anqpDomain', Number(e.target.value))}
              bg="#ffffff"
              borderColor="#cbd5e1"
              borderRadius="6px"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <CreatableMultiSelect
              label="anqp-3gpp-cell-net"
              values={config.anqp3gppCellNet}
              onChange={(vals) => updateField('anqp3gppCellNet', vals)}
              placeholder="310,410"
              disabled={isDisabled}
            />
          </Box>

          {/* Row 5 */}
          <Box>
            <CreatableMultiSelect
              label="friendly-name"
              values={config.friendlyName}
              onChange={(vals) => updateField('friendlyName', vals)}
              placeholder="eng:TestLabs"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              internet
            </Text>
            <Box pt={1}>
              <ToggleSwitch
                checked={config.internet}
                onChange={(val) => updateField('internet', val)}
                disabled={isDisabled}
              />
            </Box>
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              asra
            </Text>
            <Box pt={1}>
              <ToggleSwitch
                checked={config.asra}
                onChange={(val) => updateField('asra', val)}
                disabled={isDisabled}
              />
            </Box>
          </Box>

          {/* Row 6 */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              esr
            </Text>
            <Box pt={1}>
              <ToggleSwitch
                checked={config.esr}
                onChange={(val) => updateField('esr', val)}
                disabled={isDisabled}
              />
            </Box>
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              uesa
            </Text>
            <Box pt={1}>
              <ToggleSwitch
                checked={config.uesa}
                onChange={(val) => updateField('uesa', val)}
                disabled={isDisabled}
              />
            </Box>
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              hessid
            </Text>
            <Input
              size="sm"
              value={config.hessid}
              onChange={(e) => updateField('hessid', e.target.value)}
              placeholder="00:11:22:33:44:55"
              bg="#ffffff"
              borderColor="#cbd5e1"
              borderRadius="6px"
              disabled={isDisabled}
            />
          </Box>

          {/* Row 7 */}
          <Box>
            <CreatableMultiSelect
              label="roaming-consortium"
              values={config.roamingConsortium}
              onChange={(vals) => updateField('roamingConsortium', vals)}
              placeholder="BAA2D00100"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              disable-dgaf
            </Text>
            <Box pt={1}>
              <ToggleSwitch
                checked={config.disableDgaf}
                onChange={(val) => updateField('disableDgaf', val)}
                disabled={isDisabled}
              />
            </Box>
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              ipaddr-type-available
            </Text>
            <Input
              size="sm"
              type="number"
              min={0}
              max={255}
              value={config.ipaddrTypeAvailable !== undefined ? config.ipaddrTypeAvailable : ''}
              onChange={(e) =>
                updateField(
                  'ipaddrTypeAvailable',
                  e.target.value === '' ? undefined : Number(e.target.value)
                )
              }
              placeholder="0 - 255"
              bg="#ffffff"
              borderColor="#cbd5e1"
              borderRadius="6px"
              disabled={isDisabled}
            />
          </Box>

          {/* Row 8 */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              wan-metrics.type <Text as="span" color="#dc2626">*</Text>
            </Text>
            <SelectDropdown
              value={config.wanMetrics.type}
              onChange={(v) =>
                onChange({
                  ...config,
                  wanMetrics: { ...config.wanMetrics, type: v as 'up' | 'down' | 'testing' },
                })
              }
              options={[
                { value: 'up', label: 'up' },
                { value: 'down', label: 'down' },
                { value: 'testing', label: 'testing' },
              ]}
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              wan-metrics.downlink <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Flex align="center">
              <Input
                size="sm"
                type="number"
                min={0}
                value={config.wanMetrics.downlink}
                onChange={(e) =>
                  onChange({
                    ...config,
                    wanMetrics: { ...config.wanMetrics, downlink: Number(e.target.value) },
                  })
                }
                bg="#ffffff"
                borderColor="#cbd5e1"
                borderRightRadius={0}
                disabled={isDisabled}
              />
              <Box
                px={3}
                py="6px"
                fontSize="11px"
                fontWeight="600"
                color={themeColors.text.muted}
                bg="#f1f5f9"
                border="1px solid"
                borderColor="#cbd5e1"
                borderLeft="none"
                borderRightRadius="6px"
              >
                kbps
              </Box>
            </Flex>
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              wan-metrics.uplink <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Flex align="center">
              <Input
                size="sm"
                type="number"
                min={0}
                value={config.wanMetrics.uplink}
                onChange={(e) =>
                  onChange({
                    ...config,
                    wanMetrics: { ...config.wanMetrics, uplink: Number(e.target.value) },
                  })
                }
                bg="#ffffff"
                borderColor="#cbd5e1"
                borderRightRadius={0}
                disabled={isDisabled}
              />
              <Box
                px={3}
                py="6px"
                fontSize="11px"
                fontWeight="600"
                color={themeColors.text.muted}
                bg="#f1f5f9"
                border="1px solid"
                borderColor="#cbd5e1"
                borderLeft="none"
                borderRightRadius="6px"
              >
                kbps
              </Box>
            </Flex>
          </Box>

          {/* Row 9 */}
          <Box>
            <CreatableMultiSelect
              label="connection-capability"
              values={config.connectionCapability}
              onChange={(vals) => updateField('connectionCapability', vals)}
              placeholder="17:5060:0"
              disabled={isDisabled}
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              icons
            </Text>
            <Button
              size="sm"
              bg="#2563eb"
              color="#ffffff"
              _hover={{ bg: '#1d4ed8' }}
              borderRadius="6px"
              fontSize="12px"
              fontWeight="600"
              onClick={() => setIsIconModalOpen(true)}
              disabled={isDisabled}
            >
              Manage icons ({config.icons?.length || 0} entries)
            </Button>
          </Box>
        </SimpleGrid>
      )}

      {/* Icons Management Modal */}
      {isIconModalOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(15, 23, 42, 0.45)"
          backdropFilter="blur(2px)"
          zIndex={10000}
          display="grid"
          placeItems="center"
          p={4}
          onClick={() => setIsIconModalOpen(false)}
        >
          <Box
            bg="#ffffff"
            border="1px solid"
            borderColor={themeColors.panel.border}
            borderRadius="8px"
            boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
            w="100%"
            maxW="560px"
            p={5}
            onClick={(e) => e.stopPropagation()}
          >
            <Flex justify="space-between" align="center" mb={4} pb={2} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
              <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
                Pass Point Icons ({config.icons?.length || 0})
              </Text>
              <Button
                size="xs"
                variant="plain"
                color={themeColors.text.muted}
                onClick={() => setIsIconModalOpen(false)}
              >
                ✕
              </Button>
            </Flex>

            {/* List of current icons */}
            <Box maxH="220px" overflowY="auto" mb={4}>
              {config.icons.length === 0 ? (
                <Text fontSize="12px" color={themeColors.text.muted} py={3} textAlign="center">
                  No icons added yet.
                </Text>
              ) : (
                <VStack gap={2} align="stretch">
                  {config.icons.map((ic, idx) => (
                    <Flex
                      key={idx}
                      align="center"
                      justify="space-between"
                      p={2.5}
                      bg="#f8fafc"
                      borderRadius="6px"
                      border="1px solid"
                      borderColor={themeColors.panel.divider}
                    >
                      <HStack gap={3}>
                        <Box
                          w="40px"
                          h="40px"
                          bg="#ffffff"
                          border="1px solid #cbd5e1"
                          borderRadius="4px"
                          display="grid"
                          placeItems="center"
                          overflow="hidden"
                        >
                          <img
                            src={ic.icon.startsWith('data:') ? ic.icon : `data:${ic.type};base64,${ic.icon}`}
                            alt="icon"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                          />
                        </Box>
                        <Box fontSize="11px">
                          <Text fontWeight="600" color={themeColors.text.title}>
                            {ic.width} × {ic.height} px ({ic.language})
                          </Text>
                          <Text color={themeColors.text.muted}>{ic.type}</Text>
                        </Box>
                      </HStack>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="#dc2626"
                        onClick={() => handleRemoveIcon(idx)}
                      >
                        <Icon name="trash" size={13} color="#dc2626" />
                      </Button>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>

            {/* Add new icon form */}
            <Box bg="#f8fafc" p={3.5} borderRadius="6px" border="1px solid #e2e8f0">
              <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2.5}>
                Add Icon
              </Text>
              <SimpleGrid columns={3} gap={2.5} mb={2.5}>
                <Box>
                  <Text fontSize="10px" fontWeight="600" color={themeColors.text.muted} mb={1}>
                    Width (px)
                  </Text>
                  <Input
                    size="xs"
                    type="number"
                    value={newIconWidth}
                    onChange={(e) => setNewIconWidth(Number(e.target.value))}
                    bg="#ffffff"
                  />
                </Box>
                <Box>
                  <Text fontSize="10px" fontWeight="600" color={themeColors.text.muted} mb={1}>
                    Height (px)
                  </Text>
                  <Input
                    size="xs"
                    type="number"
                    value={newIconHeight}
                    onChange={(e) => setNewIconHeight(Number(e.target.value))}
                    bg="#ffffff"
                  />
                </Box>
                <Box>
                  <Text fontSize="10px" fontWeight="600" color={themeColors.text.muted} mb={1}>
                    Language (3-char)
                  </Text>
                  <Input
                    size="xs"
                    maxLength={3}
                    value={newIconLang}
                    onChange={(e) => setNewIconLang(e.target.value)}
                    bg="#ffffff"
                    placeholder="eng"
                  />
                </Box>
              </SimpleGrid>

              <Box mb={3}>
                <Text fontSize="10px" fontWeight="600" color={themeColors.text.muted} mb={1}>
                  Icon File (PNG / GIF / JPEG)
                </Text>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ fontSize: '11px' }}
                />
              </Box>

              <Flex justify="flex-end">
                <Button
                  size="xs"
                  bg={themeColors.brand.accent}
                  color="#ffffff"
                  onClick={handleAddIcon}
                  disabled={!newIconBase64}
                >
                  Add Icon to List
                </Button>
              </Flex>
            </Box>

            <Flex justify="flex-end" mt={4}>
              <Button size="xs" variant="outline" onClick={() => setIsIconModalOpen(false)}>
                Done
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

