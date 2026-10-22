import React, { useState } from 'react';
import {
  Box,
  HStack,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ToggleSwitch } from './ConfigurationSectionsCard/ToggleSwitch';
import { RadiusUsersModal } from './RadiusUsersModal';
import type { RadiusConfigData } from '../types/radius';

export interface RadiusSectionProps {
  config: RadiusConfigData;
  onChange: (updated: RadiusConfigData) => void;
  disabled?: boolean;
}

export const RadiusSection: React.FC<RadiusSectionProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const [showAuthSecret, setShowAuthSecret] = useState(false);
  const [showAcctSecret, setShowAcctSecret] = useState(false);
  const [showDynSecret, setShowDynSecret] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  return (
    <VStack gap={5} align="stretch">
      <Text fontSize="15px" fontWeight="700" color="#1e293b" textDecoration="underline">
        interface.ssid.radius
      </Text>

      {/* Authentication */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={4} alignItems="end">
        <Box>
          <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
            authentication.host <Text as="span" color="#dc2626">*</Text>
          </Text>
          <Input
            size="sm"
            value={config.authentication.host}
            onChange={(e) =>
              onChange({
                ...config,
                authentication: {
                  ...config.authentication,
                  host: e.target.value,
                },
              })
            }
            placeholder="192.168.178.192"
            disabled={disabled}
            borderRadius="8px"
            borderColor="#cbd5e1"
          />
        </Box>

        <Box w={{ base: '100%', sm: '120px' }}>
          <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
            authentication.port <Text as="span" color="#dc2626">*</Text>
          </Text>
          <Input
            size="sm"
            type="number"
            min={1}
            max={65535}
            value={config.authentication.port}
            onChange={(e) =>
              onChange({
                ...config,
                authentication: {
                  ...config.authentication,
                  port: Number(e.target.value) || 1812,
                },
              })
            }
            disabled={disabled}
            borderRadius="8px"
            borderColor="#cbd5e1"
          />
        </Box>

        <Box>
          <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
            authentication.secret <Text as="span" color="#dc2626">*</Text>
          </Text>
          <HStack gap={1}>
            <Input
              size="sm"
              type={showAuthSecret ? 'text' : 'password'}
              value={config.authentication.secret}
              onChange={(e) =>
                onChange({
                  ...config,
                  authentication: {
                    ...config.authentication,
                    secret: e.target.value,
                  },
                })
              }
              placeholder="Secret"
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
            <Box
              as="button"
              px={2.5}
              py={1.5}
              borderRadius="6px"
              border="1px solid"
              borderColor="#cbd5e1"
              fontSize="11px"
              fontWeight="600"
              color="#475569"
              bg="#f8fafc"
              cursor="pointer"
              _hover={{ bg: '#f1f5f9' }}
              onClick={() => setShowAuthSecret(!showAuthSecret)}
            >
              {showAuthSecret ? 'Hide' : 'Show'}
            </Box>
          </HStack>
        </Box>

        <Box pb={1.5}>
          <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
            authentication.mac-filter
          </Text>
          <ToggleSwitch
            checked={Boolean(config.authentication.macFilter)}
            onChange={(checked) =>
              onChange({
                ...config,
                authentication: {
                  ...config.authentication,
                  macFilter: checked,
                },
              })
            }
            disabled={disabled}
          />
        </Box>
      </SimpleGrid>

      {/* Enable Accounting */}
      <Box pt={2}>
        <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
          Enable Accounting
        </Text>
        <ToggleSwitch
          checked={config.accountingEnabled}
          onChange={(checked) =>
            onChange({
              ...config,
              accountingEnabled: checked,
              accounting: checked
                ? config.accounting || {
                    host: '192.168.178.192',
                    port: 1813,
                    secret: '',
                  }
                : undefined,
            })
          }
          disabled={disabled}
        />
      </Box>

      {config.accountingEnabled && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              accounting.host <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={config.accounting?.host ?? '192.168.178.192'}
              onChange={(e) =>
                onChange({
                  ...config,
                  accounting: {
                    host: e.target.value,
                    port: config.accounting?.port ?? 1813,
                    secret: config.accounting?.secret ?? '',
                  },
                })
              }
              placeholder="192.168.178.192"
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>

          <Box w={{ base: '100%', sm: '120px' }}>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              accounting.port <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              min={1}
              max={65535}
              value={config.accounting?.port ?? 1813}
              onChange={(e) =>
                onChange({
                  ...config,
                  accounting: {
                    host: config.accounting?.host ?? '192.168.178.192',
                    port: Number(e.target.value) || 1813,
                    secret: config.accounting?.secret ?? '',
                  },
                })
              }
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              accounting.secret <Text as="span" color="#dc2626">*</Text>
            </Text>
            <HStack gap={1}>
              <Input
                size="sm"
                type={showAcctSecret ? 'text' : 'password'}
                value={config.accounting?.secret ?? ''}
                onChange={(e) =>
                  onChange({
                    ...config,
                    accounting: {
                      host: config.accounting?.host ?? '192.168.178.192',
                      port: config.accounting?.port ?? 1813,
                      secret: e.target.value,
                    },
                  })
                }
                placeholder="Secret"
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
              <Box
                as="button"
                px={2.5}
                py={1.5}
                borderRadius="6px"
                border="1px solid"
                borderColor="#cbd5e1"
                fontSize="11px"
                fontWeight="600"
                color="#475569"
                bg="#f8fafc"
                cursor="pointer"
                _hover={{ bg: '#f1f5f9' }}
                onClick={() => setShowAcctSecret(!showAcctSecret)}
              >
                {showAcctSecret ? 'Hide' : 'Show'}
              </Box>
            </HStack>
          </Box>
        </SimpleGrid>
      )}

      {/* Enable Dynamic Authorization */}
      <Box pt={2}>
        <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
          Enable Dynamic Authorization
        </Text>
        <ToggleSwitch
          checked={config.dynamicAuthorizationEnabled}
          onChange={(checked) =>
            onChange({
              ...config,
              dynamicAuthorizationEnabled: checked,
              dynamicAuthorization: checked
                ? config.dynamicAuthorization || {
                    host: '192.168.178.192',
                    port: 1814,
                    secret: '',
                  }
                : undefined,
            })
          }
          disabled={disabled}
        />
      </Box>

      {config.dynamicAuthorizationEnabled && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4} alignItems="end">
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              dynamic-authorization.host <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={config.dynamicAuthorization?.host ?? '192.168.178.192'}
              onChange={(e) =>
                onChange({
                  ...config,
                  dynamicAuthorization: {
                    host: e.target.value,
                    port: config.dynamicAuthorization?.port ?? 1814,
                    secret: config.dynamicAuthorization?.secret ?? '',
                  },
                })
              }
              placeholder="192.168.178.192"
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>

          <Box w={{ base: '100%', sm: '120px' }}>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              dynamic-authorization.port <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              type="number"
              min={1}
              max={65535}
              value={config.dynamicAuthorization?.port ?? 1814}
              onChange={(e) =>
                onChange({
                  ...config,
                  dynamicAuthorization: {
                    host: config.dynamicAuthorization?.host ?? '192.168.178.192',
                    port: Number(e.target.value) || 1814,
                    secret: config.dynamicAuthorization?.secret ?? '',
                  },
                })
              }
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              dynamic-authorization.secret <Text as="span" color="#dc2626">*</Text>
            </Text>
            <HStack gap={1}>
              <Input
                size="sm"
                type={showDynSecret ? 'text' : 'password'}
                value={config.dynamicAuthorization?.secret ?? ''}
                onChange={(e) =>
                  onChange({
                    ...config,
                    dynamicAuthorization: {
                      host: config.dynamicAuthorization?.host ?? '192.168.178.192',
                      port: config.dynamicAuthorization?.port ?? 1814,
                      secret: e.target.value,
                    },
                  })
                }
                placeholder="Secret"
                disabled={disabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
              <Box
                as="button"
                px={2.5}
                py={1.5}
                borderRadius="6px"
                border="1px solid"
                borderColor="#cbd5e1"
                fontSize="11px"
                fontWeight="600"
                color="#475569"
                bg="#f8fafc"
                cursor="pointer"
                _hover={{ bg: '#f1f5f9' }}
                onClick={() => setShowDynSecret(!showDynSecret)}
              >
                {showDynSecret ? 'Hide' : 'Show'}
              </Box>
            </HStack>
          </Box>
        </SimpleGrid>
      )}

      {/* nas-identifier and chargeable-user-id */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} alignItems="end" pt={2}>
        <Box>
          <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
            nas-identifier
          </Text>
          <Input
            size="sm"
            value={config.nasIdentifier ?? ''}
            onChange={(e) => onChange({ ...config, nasIdentifier: e.target.value })}
            placeholder="NAS Identifier"
            disabled={disabled}
            borderRadius="8px"
            borderColor="#cbd5e1"
          />
        </Box>

        <Box pb={1.5}>
          <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
            chargeable-user-id
          </Text>
          <ToggleSwitch
            checked={Boolean(config.chargeableUserId)}
            onChange={(checked) => onChange({ ...config, chargeableUserId: checked })}
            disabled={disabled}
          />
        </Box>
      </SimpleGrid>

      {/* Enable Local */}
      <Box pt={2}>
        <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
          Enable Local
        </Text>
        <ToggleSwitch
          checked={config.localEnabled}
          onChange={(checked) => onChange({ ...config, localEnabled: checked })}
          disabled={disabled}
        />
      </Box>

      {config.localEnabled && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} alignItems="end">
          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              server-identity <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Input
              size="sm"
              value={config.serverIdentity ?? 'uCentral'}
              onChange={(e) => onChange({ ...config, serverIdentity: e.target.value })}
              placeholder="uCentral"
              disabled={disabled}
              borderRadius="8px"
              borderColor="#cbd5e1"
            />
          </Box>

          <Box>
            <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
              users <Text as="span" color="#dc2626">*</Text>
            </Text>
            <Box
              as="button"
              px={3.5}
              py={1.5}
              borderRadius="8px"
              bg="#2563eb"
              color="#ffffff"
              fontSize="12px"
              fontWeight="600"
              cursor={disabled ? 'not-allowed' : 'pointer'}
              opacity={disabled ? 0.6 : 1}
              _hover={disabled ? undefined : { bg: '#1d4ed8' }}
              onClick={() => setIsUsersModalOpen(true)}
            >
              Manage users ({config.users?.length ?? 0} entries)
            </Box>
          </Box>
        </SimpleGrid>
      )}

      {/* Users Modal */}
      <RadiusUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        users={config.users || []}
        onSave={(newUsers) => {
          onChange({ ...config, users: newUsers });
        }}
        disabled={disabled}
      />
    </VStack>
  );
};
