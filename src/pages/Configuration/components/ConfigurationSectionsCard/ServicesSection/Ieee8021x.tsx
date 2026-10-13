import React, { useState } from 'react';
import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { Icon } from '@/components/icons/Icon';
import { ToggleSwitch } from '../ToggleSwitch';
import { Ieee8021xUsersModal, type Ieee8021xUserItem } from './Ieee8021xUsersModal';
import { CertificateUploadModal } from './CertificateUploadModal';
import type { ServicesSectionData } from '../types';

interface Ieee8021xProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
}

type CertField = 'ca-certificate' | 'private-key' | 'server-certificate';

export const Ieee8021x: React.FC<Ieee8021xProps> = ({ data, onChange, disabled = false }) => {
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [activeCertField, setActiveCertField] = useState<CertField | null>(null);

  const getCertValue = (field: CertField | null): { value: string; filename?: string } => {
    if (!field) return { value: '', filename: '' };
    if (field === 'ca-certificate') {
      return {
        value: data.ieee8021x.caCertificate || '',
        filename: data.ieee8021x.caCertificateFilename || '',
      };
    }
    if (field === 'private-key') {
      return {
        value: data.ieee8021x.privateKey || '',
        filename: data.ieee8021x.privateKeyFilename || '',
      };
    }
    return {
      value: data.ieee8021x.serverCertificate || '',
      filename: data.ieee8021x.serverCertificateFilename || '',
    };
  };

  const handleSaveCert = (content: string, filename?: string) => {
    if (!activeCertField) return;
    if (activeCertField === 'ca-certificate') {
      onChange({
        ...data,
        ieee8021x: {
          ...data.ieee8021x,
          caCertificate: content,
          caCertificateFilename: filename,
        },
      });
    } else if (activeCertField === 'private-key') {
      onChange({
        ...data,
        ieee8021x: {
          ...data.ieee8021x,
          privateKey: content,
          privateKeyFilename: filename,
        },
      });
    } else if (activeCertField === 'server-certificate') {
      onChange({
        ...data,
        ieee8021x: {
          ...data.ieee8021x,
          serverCertificate: content,
          serverCertificateFilename: filename,
        },
      });
    }
  };

  const handleClearCert = (field: CertField) => {
    if (field === 'ca-certificate') {
      onChange({
        ...data,
        ieee8021x: {
          ...data.ieee8021x,
          caCertificate: '',
          caCertificateFilename: '',
        },
      });
    } else if (field === 'private-key') {
      onChange({
        ...data,
        ieee8021x: {
          ...data.ieee8021x,
          privateKey: '',
          privateKeyFilename: '',
        },
      });
    } else if (field === 'server-certificate') {
      onChange({
        ...data,
        ieee8021x: {
          ...data.ieee8021x,
          serverCertificate: '',
          serverCertificateFilename: '',
        },
      });
    }
  };

  const renderCertRow = (field: CertField, label: string) => {
    const { value, filename } = getCertValue(field);
    const hasUploaded = Boolean(value.trim());

    return (
      <Box key={field}>
        <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
          {label} <Text as="span" color="#dc2626">*</Text>
        </Text>
        <Flex align="center" gap={3}>
          <Text fontSize="12px" color="#64748b" minW="110px">
            {hasUploaded ? (filename ? `Using ${filename}` : 'Uploaded') : 'Not Uploaded Yet'}
          </Text>
          <Box
            as="button"
            w="30px"
            h="30px"
            borderRadius="8px"
            bg="#3b82f6"
            color="#ffffff"
            display="grid"
            placeItems="center"
            cursor={disabled ? 'not-allowed' : 'pointer'}
            _hover={disabled ? undefined : { bg: '#2563eb' }}
            onClick={() => setActiveCertField(field)}
            title={`Upload ${label}`}
          >
            <Icon name="upload" size={15} />
          </Box>
          {hasUploaded && !disabled && (
            <Box
              as="button"
              w="26px"
              h="26px"
              borderRadius="6px"
              bg="#fee2e2"
              color="#dc2626"
              display="grid"
              placeItems="center"
              cursor="pointer"
              _hover={{ bg: '#fca5a5' }}
              onClick={() => handleClearCert(field)}
              title={`Remove ${label}`}
            >
              <Icon name="trash" size={13} />
            </Box>
          )}
        </Flex>
      </Box>
    );
  };

  const currentCert = getCertValue(activeCertField);

  return (
    <>
      <Box
        border="1px solid"
        borderColor={themeColors.panel.border}
        borderRadius="8px"
        bg="#ffffff"
        position="relative"
        overflow="visible"
      >
        <Flex px={4} py={3} borderBottom="1px solid" borderColor={themeColors.panel.divider} bg="#f8fafc">
          <Text
            fontSize="14px"
            fontWeight="700"
            color={themeColors.text.title}
            textDecoration="underline"
            textUnderlineOffset="3px"
          >
            Ieee8021x
          </Text>
        </Flex>

        <Box p={4}>
          <VStack gap={4} align="stretch">
            {/* use-local-certificates */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                use-local-certificates <Text as="span" color="#dc2626">*</Text>
              </Text>
              <ToggleSwitch
                checked={data.ieee8021x.useLocalCertificates}
                onChange={(checked) =>
                  onChange({
                    ...data,
                    ieee8021x: { ...data.ieee8021x, useLocalCertificates: checked },
                  })
                }
                disabled={disabled}
              />
            </Box>

            {/* Certificates */}
            {renderCertRow('ca-certificate', 'ca-certificate')}
            {renderCertRow('private-key', 'private-key')}
            {renderCertRow('server-certificate', 'server-certificate')}

            {/* Users */}
            <Box pt={1}>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={2}>
                users <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Box
                as="button"
                px={4}
                py={2}
                borderRadius="8px"
                bg="#3b82f6"
                color="#ffffff"
                fontSize="12px"
                fontWeight="600"
                cursor={disabled ? 'not-allowed' : 'pointer'}
                _hover={disabled ? undefined : { bg: '#2563eb' }}
                onClick={() => setIsUsersModalOpen(true)}
              >
                Manage users ({data.ieee8021x.users.length} entries)
              </Box>
            </Box>
          </VStack>
        </Box>
      </Box>

      {/* Users Modal */}
      <Ieee8021xUsersModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        users={data.ieee8021x.users}
        onSave={(newUsers: Ieee8021xUserItem[]) =>
          onChange({
            ...data,
            ieee8021x: { ...data.ieee8021x, users: newUsers },
          })
        }
        disabled={disabled}
      />

      {/* Certificate Upload Modal */}
      {activeCertField && (
        <CertificateUploadModal
          isOpen={activeCertField !== null}
          onClose={() => setActiveCertField(null)}
          title={activeCertField}
          value={currentCert.value}
          fileName={currentCert.filename}
          onSave={handleSaveCert}
          disabled={disabled}
        />
      )}
    </>
  );
};
