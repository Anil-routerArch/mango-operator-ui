import React, { useState } from 'react';
import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { themeColors } from '@/theme';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { OPEN_FLOW_MODES } from './servicesConstants';
import { CertificateUploadModal } from './CertificateUploadModal';
import type { ServicesSectionData } from '../types';

interface OpenFlowProps {
  data: ServicesSectionData;
  onChange: (data: ServicesSectionData) => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

type OpenFlowCertField = 'ca-certificate' | 'private-key' | 'ssl-certificate';

export const OpenFlow: React.FC<OpenFlowProps> = ({
  data,
  onChange,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const isInputDisabled = disabled || isDefaultConfig;
  const [activeCertField, setActiveCertField] = useState<OpenFlowCertField | null>(null);

  const getCertValue = (field: OpenFlowCertField | null): { value: string; filename?: string } => {
    if (!field) return { value: '', filename: '' };
    if (field === 'ca-certificate') {
      return {
        value: data.openFlow.caCertificate || '',
        filename: data.openFlow.caCertificateFilename || '',
      };
    }
    if (field === 'private-key') {
      return {
        value: data.openFlow.privateKey || '',
        filename: data.openFlow.privateKeyFilename || '',
      };
    }
    return {
      value: data.openFlow.sslCertificate || '',
      filename: data.openFlow.sslCertificateFilename || '',
    };
  };

  const handleSaveCert = (content: string, filename?: string) => {
    if (!activeCertField) return;
    if (activeCertField === 'ca-certificate') {
      onChange({
        ...data,
        openFlow: {
          ...data.openFlow,
          caCertificate: content,
          caCertificateFilename: filename,
        },
      });
    } else if (activeCertField === 'private-key') {
      onChange({
        ...data,
        openFlow: {
          ...data.openFlow,
          privateKey: content,
          privateKeyFilename: filename,
        },
      });
    } else if (activeCertField === 'ssl-certificate') {
      onChange({
        ...data,
        openFlow: {
          ...data.openFlow,
          sslCertificate: content,
          sslCertificateFilename: filename,
        },
      });
    }
  };

  const handleClearCert = (field: OpenFlowCertField) => {
    if (field === 'ca-certificate') {
      onChange({
        ...data,
        openFlow: {
          ...data.openFlow,
          caCertificate: '',
          caCertificateFilename: '',
        },
      });
    } else if (field === 'private-key') {
      onChange({
        ...data,
        openFlow: {
          ...data.openFlow,
          privateKey: '',
          privateKeyFilename: '',
        },
      });
    } else if (field === 'ssl-certificate') {
      onChange({
        ...data,
        openFlow: {
          ...data.openFlow,
          sslCertificate: '',
          sslCertificateFilename: '',
        },
      });
    }
  };

  const renderCertRow = (field: OpenFlowCertField, label: string) => {
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
            cursor={isInputDisabled ? 'not-allowed' : 'pointer'}
            _hover={isInputDisabled ? undefined : { bg: '#2563eb' }}
            onClick={() => !isInputDisabled && setActiveCertField(field)}
            title={`Upload ${label}`}
          >
            <Icon name="upload" size={15} />
          </Box>
          {hasUploaded && !isInputDisabled && (
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
            Open Flow
          </Text>
        </Flex>
        <Box p={4}>
          <VStack gap={4} align="stretch">
            {isDefaultConfig && (
              <Box bg="#fef2f2" border="1px solid #fecaca" borderRadius="6px" p={2.5}>
                <Text fontSize="11px" color="#b91c1c" fontWeight="600">
                  Not supported in OWGW default configurations
                </Text>
                <Text fontSize="11px" color="#b91c1c" mt={0.5}>
                  open-flow is not part of the OpenWiFi Gateway (OWGW) uCentral schema. This service cannot be configured in default configuration.
                </Text>
              </Box>
            )}

            {/* controller */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                controller <Text as="span" color="#dc2626">*</Text>
              </Text>
              <Input
                size="sm"
                value={data.openFlow.controller}
                onChange={(e) => onChange({ ...data, openFlow: { ...data.openFlow, controller: e.target.value } })}
                placeholder=""
                disabled={isInputDisabled}
                borderRadius="8px"
                borderColor="#cbd5e1"
              />
            </Box>

            {/* mode */}
            <Box>
              <Text fontSize="12px" fontWeight="600" color="#334155" mb={1.5}>
                mode <Text as="span" color="#dc2626">*</Text>
              </Text>
              <SelectDropdown
                size="sm"
                value={data.openFlow.mode}
                onChange={(val) => onChange({ ...data, openFlow: { ...data.openFlow, mode: String(val) } })}
                options={OPEN_FLOW_MODES}
                disabled={isInputDisabled}
                w="100%"
              />
            </Box>

            {/* ca-certificate */}
            {renderCertRow('ca-certificate', 'ca-certificate')}

            {/* private-key */}
            {renderCertRow('private-key', 'private-key')}

            {/* ssl-certificate */}
            {renderCertRow('ssl-certificate', 'ssl-certificate')}
          </VStack>
        </Box>
      </Box>

      {/* Certificate Upload Modal */}
      {activeCertField && (
        <CertificateUploadModal
          isOpen={activeCertField !== null}
          onClose={() => setActiveCertField(null)}
          title={activeCertField}
          value={currentCert.value}
          fileName={currentCert.filename}
          onSave={handleSaveCert}
          disabled={isInputDisabled}
        />
      )}
    </>
  );
};
