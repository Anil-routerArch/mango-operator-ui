import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  SimpleGrid,
  Table,
  Text,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import { CreatableMultiSelect } from './ConfigurationSectionsCard/ServicesSection/CreatableMultiSelect';
import type {
  CaptiveAuthMode,
  CaptiveCredential,
  CaptivePortalConfig,
} from '../types/captive';

const AUTH_MODE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'click-to-continue', label: 'Click' },
  { value: 'radius', label: 'Radius' },
  { value: 'credentials', label: 'Credentials' },
  { value: 'uam', label: 'UAM' },
];

const MAC_FORMAT_OPTIONS = [
  { value: 'aabbccddeeff', label: 'aabbccddeeff' },
  { value: 'aa-bb-cc-dd-ee-ff', label: 'aa-bb-cc-dd-ee-ff' },
  { value: 'aa:bb:cc:dd:ee:ff', label: 'aa:bb:cc:dd:ee:ff' },
  { value: 'AABBCCDDEEFF', label: 'AABBCCDDEEFF' },
  { value: 'AA:BB:CC:DD:EE:FF', label: 'AA:BB:CC:DD:EE:FF' },
  { value: 'AA-BB-CC-DD-EE-FF', label: 'AA-BB-CC-DD-EE-FF' },
];

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

const PasswordInput: React.FC<{
  label: string;
  isRequired?: boolean;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
}> = ({ label, isRequired, value, onChange, disabled, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <Box>
      <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
        {label} {isRequired && <Text as="span" color="#dc2626">*</Text>}
      </Text>
      <Flex position="relative" align="center">
        <Input
          size="sm"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          borderRadius="6px"
          borderColor="#cbd5e1"
          pr="60px"
          fontSize="13px"
        />
        <Button
          position="absolute"
          right="4px"
          h="24px"
          size="xs"
          fontSize="11px"
          variant="ghost"
          color="#475569"
          onClick={() => setShow(!show)}
          disabled={disabled}
        >
          {show ? 'Hide' : 'Show'}
        </Button>
      </Flex>
    </Box>
  );
};

const WebRootInput: React.FC<{
  label: string;
  isRequired?: boolean;
  webRoot?: string;
  fileName?: string;
  onChange: (base64?: string, filename?: string) => void;
  disabled?: boolean;
}> = ({ label, isRequired, webRoot, fileName, onChange, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      onChange(base64, file.name);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayText = webRoot
    ? fileName
      ? `Using file: ${fileName}`
      : 'File uploaded'
    : 'Not Uploaded Yet';

  return (
    <Box>
      <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
        {label} {isRequired && <Text as="span" color="#dc2626">*</Text>}
      </Text>
      <Flex align="center" gap={2} h="32px">
        <Text fontSize="13px" color={webRoot ? '#0f172a' : '#64748b'} truncate maxW="170px">
          {displayText}
        </Text>
        <input
          ref={fileInputRef}
          type="file"
          accept=".tar"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={disabled}
        />
        <IconButton
          aria-label="Upload .tar file"
          size="sm"
          colorScheme="blue"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Icon name="upload" size={16} />
        </IconButton>
        {webRoot && (
          <IconButton
            aria-label="Delete file"
            size="sm"
            colorScheme="red"
            variant="ghost"
            onClick={() => onChange(undefined, undefined)}
            disabled={disabled}
          >
            <Icon name="trash" size={16} />
          </IconButton>
        )}
      </Flex>
    </Box>
  );
};

export interface CaptivePortalSectionProps {
  config: CaptivePortalConfig;
  onChange: (cfg: CaptivePortalConfig) => void;
  isDisabled?: boolean;
  hideHeader?: boolean;
}

export const CaptivePortalSection: React.FC<CaptivePortalSectionProps> = ({
  config,
  onChange,
  isDisabled = false,
  hideHeader = false,
}) => {
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const currentMode = config.authMode || 'none';

  const handleModeChange = (val: string) => {
    const nextMode = val as CaptiveAuthMode;
    onChange({
      ...config,
      authMode: nextMode,
    });
  };

  const handleAddCredential = () => {
    if (!newUsername.trim()) return;
    const creds = config.credentials || [];
    onChange({
      ...config,
      credentials: [...creds, { username: newUsername.trim(), password: newPassword }],
    });
    setNewUsername('');
    setNewPassword('');
  };

  const handleRemoveCredential = (index: number) => {
    const creds = [...(config.credentials || [])];
    creds.splice(index, 1);
    onChange({
      ...config,
      credentials: creds,
    });
  };

  return (
    <Box w="100%">
      {/* Header with Title and Auth Mode Dropdown */}
      {!hideHeader && (
        <Flex align="center" gap={3} mb={3}>
          <Text fontSize="14px" fontWeight="700" color={themeColors.text.title}>
            Captive Portal
          </Text>
          <Box w="150px">
            <SelectDropdown
              value={currentMode}
              onChange={handleModeChange}
              options={AUTH_MODE_OPTIONS}
              disabled={isDisabled}
              size="sm"
            />
          </Box>
        </Flex>
      )}

      {/* When authMode is selected (not 'none') */}
      {currentMode !== 'none' && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5} mt={2}>
          {/* 1. walled-garden-fqdn (Required ONLY in UAM mode) */}
          <CreatableMultiSelect
            label="walled-garden-fqdn"
            isRequired={currentMode === 'uam'}
            values={config.walledGardenFqdn || []}
            onChange={(values) => onChange({ ...config, walledGardenFqdn: values })}
            placeholder="Example: *.google.com"
            disabled={isDisabled}
          />

          {/* 2. walled-garden-ipaddr */}
          <CreatableMultiSelect
            label="walled-garden-ipaddr"
            values={config.walledGardenIpaddr || []}
            onChange={(values) => onChange({ ...config, walledGardenIpaddr: values })}
            placeholder="Example: 192.168.0.1"
            disabled={isDisabled}
          />

          {/* 3. web-root * */}
          <WebRootInput
            label="web-root"
            isRequired
            webRoot={config.webRoot}
            fileName={config.webRootFileName}
            onChange={(base64, filename) =>
              onChange({ ...config, webRoot: base64, webRootFileName: filename })
            }
            disabled={isDisabled}
          />

          {/* 4. idle-timeout */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              idle-timeout
            </Text>
            <Input
              size="sm"
              type="number"
              value={config.idleTimeout !== undefined ? config.idleTimeout : ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  idleTimeout: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              placeholder="600"
              disabled={isDisabled}
              borderRadius="6px"
              borderColor="#cbd5e1"
              fontSize="13px"
            />
          </Box>

          {/* 5. session-timeout */}
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              session-timeout
            </Text>
            <Input
              size="sm"
              type="number"
              value={config.sessionTimeout !== undefined ? config.sessionTimeout : ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  sessionTimeout: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
              placeholder="Optional"
              disabled={isDisabled}
              borderRadius="6px"
              borderColor="#cbd5e1"
              fontSize="13px"
            />
          </Box>

          {/* MODE: CREDENTIALS */}
          {currentMode === 'credentials' && (
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                credentials <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() => setIsCredModalOpen(true)}
                disabled={isDisabled}
                w="100%"
                fontSize="13px"
              >
                Manage credentials ({(config.credentials || []).length} entries)
              </Button>
            </Box>
          )}

          {/* MODE: UAM (UAM Specific Fields) */}
          {currentMode === 'uam' && (
            <>
              {/* uam-server * */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  uam-server <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  value={config.uamServer || ''}
                  onChange={(e) => onChange({ ...config, uamServer: e.target.value })}
                  placeholder="https://YOUR-LOGIN-ADDRESS.YOURS"
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* uam-secret */}
              <PasswordInput
                label="uam-secret"
                value={config.uamSecret || ''}
                onChange={(val) => onChange({ ...config, uamSecret: val })}
                disabled={isDisabled}
              />

              {/* uam-port * */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  uam-port <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={config.uamPort !== undefined ? config.uamPort : 3990}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      uamPort: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* nasid * */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  nasid <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  value={config.nasid || ''}
                  onChange={(e) => onChange({ ...config, nasid: e.target.value })}
                  placeholder="TestLab"
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* nasmac */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  nasmac
                </Text>
                <Input
                  size="sm"
                  value={config.nasmac || ''}
                  onChange={(e) => onChange({ ...config, nasmac: e.target.value })}
                  placeholder="Optional"
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* mac-format * */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  mac-format <Text as="span" color="#dc2626">*</Text>
                </Text>
                <SelectDropdown
                  value={config.macFormat || 'aabbccddeeff'}
                  onChange={(val) => onChange({ ...config, macFormat: String(val) })}
                  options={MAC_FORMAT_OPTIONS}
                  disabled={isDisabled}
                  w="100%"
                  size="sm"
                />
              </Box>

              {/* ssid */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  ssid
                </Text>
                <Input
                  size="sm"
                  value={config.ssid || ''}
                  onChange={(e) => onChange({ ...config, ssid: e.target.value })}
                  placeholder="Optional"
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* final-redirect-url */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  final-redirect-url
                </Text>
                <Input
                  size="sm"
                  value={config.finalRedirectUrl || ''}
                  onChange={(e) => onChange({ ...config, finalRedirectUrl: e.target.value })}
                  placeholder="Optional"
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* mac-auth */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  mac-auth
                </Text>
                <ToggleSwitch
                  checked={Boolean(config.macAuth)}
                  onChange={(val) => onChange({ ...config, macAuth: val })}
                  disabled={isDisabled}
                />
              </Box>
            </>
          )}

          {/* RADIUS FIELDS (For 'radius' and 'uam' modes) */}
          {(currentMode === 'radius' || currentMode === 'uam') && (
            <>
              {/* auth-server * */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  auth-server <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  value={config.authServer || ''}
                  onChange={(e) => onChange({ ...config, authServer: e.target.value })}
                  placeholder="192.168.1.10"
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* auth-secret * */}
              <PasswordInput
                label="auth-secret"
                isRequired
                value={config.authSecret || ''}
                onChange={(val) => onChange({ ...config, authSecret: val })}
                disabled={isDisabled}
              />

              {/* auth-port * */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  auth-port <Text as="span" color="#dc2626">*</Text>
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={config.authPort !== undefined ? config.authPort : 1812}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      authPort: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* acct-server */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  acct-server
                </Text>
                <Input
                  size="sm"
                  value={config.acctServer || ''}
                  onChange={(e) => onChange({ ...config, acctServer: e.target.value })}
                  placeholder="Optional"
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* acct-secret */}
              <PasswordInput
                label="acct-secret"
                value={config.acctSecret || ''}
                onChange={(val) => onChange({ ...config, acctSecret: val })}
                disabled={isDisabled}
              />

              {/* acct-port */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  acct-port
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={config.acctPort !== undefined ? config.acctPort : 1812}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      acctPort: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>

              {/* acct-interval */}
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                  acct-interval
                </Text>
                <Input
                  size="sm"
                  type="number"
                  value={config.acctInterval !== undefined ? config.acctInterval : 600}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      acctInterval: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  disabled={isDisabled}
                  borderRadius="6px"
                  borderColor="#cbd5e1"
                  fontSize="13px"
                />
              </Box>
            </>
          )}
        </SimpleGrid>
      )}

      {/* Credentials Modal */}
      {isCredModalOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.4)"
          zIndex={2000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Box
            bg="#ffffff"
            borderRadius="8px"
            w="100%"
            maxW="560px"
            boxShadow="0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
            overflow="hidden"
          >
            {/* Modal Header */}
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <HStack gap={2}>
                <Icon name="lock" size={18} color={themeColors.brand.accent} />
                <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                  Manage Credentials
                </Text>
              </HStack>
              <Button
                variant="plain"
                size="xs"
                p={1}
                onClick={() => setIsCredModalOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size={16} />
              </Button>
            </Flex>

            {/* Modal Body */}
            <Box p={4} maxH="380px" overflowY="auto">
              {/* Existing Credentials Table */}
              {(config.credentials || []).length === 0 ? (
                <Box
                  p={4}
                  textAlign="center"
                  bg="#f8fafc"
                  border="1px dashed"
                  borderColor="#cbd5e1"
                  borderRadius="6px"
                  mb={4}
                >
                  <Text fontSize="12px" color="#64748b">
                    No credentials defined yet. Add credentials below.
                  </Text>
                </Box>
              ) : (
                <Box
                  border="1px solid"
                  borderColor="#e2e8f0"
                  borderRadius="6px"
                  overflow="hidden"
                  mb={4}
                >
                  <Table.Root size="sm" variant="outline">
                    <Table.Header bg="#f1f5f9">
                      <Table.Row>
                        <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#475569">
                          Username
                        </Table.ColumnHeader>
                        <Table.ColumnHeader fontSize="11px" fontWeight="700" color="#475569">
                          Password
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          fontSize="11px"
                          fontWeight="700"
                          color="#475569"
                          textAlign="right"
                        >
                          Action
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {config.credentials.map((cred: CaptiveCredential, idx: number) => (
                        <Table.Row key={`${cred.username}-${idx}`}>
                          <Table.Cell fontSize="12px" fontWeight="600" color="#0f172a">
                            {cred.username}
                          </Table.Cell>
                          <Table.Cell fontSize="12px" fontFamily="monospace" color="#64748b">
                            ••••••••
                          </Table.Cell>
                          <Table.Cell textAlign="right">
                            <IconButton
                              aria-label="Delete credential"
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleRemoveCredential(idx)}
                              disabled={isDisabled}
                            >
                              <Icon name="trash" size={14} />
                            </IconButton>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              )}

              {/* Add New Credential Form */}
              <Box p={3} bg="#f8fafc" borderRadius="6px" border="1px solid" borderColor="#e2e8f0">
                <Text fontSize="12px" fontWeight="700" color={themeColors.text.title} mb={2}>
                  Add New Credential
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3} mb={3}>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color="#475569" mb={1}>
                      Username *
                    </Text>
                    <Input
                      size="sm"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. guest_user"
                      borderRadius="4px"
                      borderColor="#cbd5e1"
                      bg="#ffffff"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="11px" fontWeight="600" color="#475569" mb={1}>
                      Password *
                    </Text>
                    <Input
                      size="sm"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Password"
                      borderRadius="4px"
                      borderColor="#cbd5e1"
                      bg="#ffffff"
                    />
                  </Box>
                </SimpleGrid>
                <Flex justify="flex-end">
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={handleAddCredential}
                    disabled={!newUsername.trim() || !newPassword}
                  >
                    Add Credential
                  </Button>
                </Flex>
              </Box>
            </Box>

            {/* Modal Footer */}
            <Flex
              justify="flex-end"
              p={3}
              bg="#f8fafc"
              borderTop="1px solid"
              borderColor={themeColors.panel.divider}
            >
              <Button size="xs" variant="outline" onClick={() => setIsCredModalOpen(false)}>
                Done
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};
