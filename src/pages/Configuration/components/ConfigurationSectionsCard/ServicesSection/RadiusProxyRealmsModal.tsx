import React, { useMemo, useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Table,
  Text,
  VStack,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { ToggleSwitch } from '../ToggleSwitch';
import { CertificateUploadModal } from './CertificateUploadModal';

export interface RadiusProxyRealmItem {
  realm: string;
  port: number;
  autoDiscover: boolean;
  secret: string;
  useLocalCertificates: boolean;
  caCertificate?: string;
  caCertificateFilename?: string;
  certificate?: string;
  certificateFilename?: string;
  privateKey?: string;
  privateKeyFilename?: string;
  privateKeyPassword?: string;
}

interface RadiusProxyRealmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  realms: RadiusProxyRealmItem[];
  onSave: (realms: RadiusProxyRealmItem[]) => void;
  disabled?: boolean;
}

type RealmSortField = 'realm' | 'port' | 'secret' | null;
type RealmCertField = 'ca-certificate' | 'certificate' | 'private-key';

export const RadiusProxyRealmsModal: React.FC<RadiusProxyRealmsModalProps> = ({
  isOpen,
  onClose,
  realms,
  onSave,
  disabled = false,
}) => {
  const [draftRealms, setDraftRealms] = useState<RadiusProxyRealmItem[]>(() => [...realms]);

  // Form inputs
  const [realm, setRealm] = useState<string>('*');
  const [port, setPort] = useState<number>(22);
  const [autoDiscover, setAutoDiscover] = useState<boolean>(false);
  const [secret, setSecret] = useState<string>('');
  const [useLocalCertificates, setUseLocalCertificates] = useState<boolean>(false);
  const [caCertificate, setCaCertificate] = useState<string>('');
  const [caCertificateFilename, setCaCertificateFilename] = useState<string>('');
  const [certificate, setCertificate] = useState<string>('');
  const [certificateFilename, setCertificateFilename] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [privateKeyFilename, setPrivateKeyFilename] = useState<string>('');
  const [privateKeyPassword, setPrivateKeyPassword] = useState<string>('');

  const [activeCertModal, setActiveCertModal] = useState<RealmCertField | null>(null);

  // Sorting & pagination
  const [sortField, setSortField] = useState<RealmSortField>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const sortedRealms = useMemo(() => {
    if (!sortField) return draftRealms;
    return [...draftRealms].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'port') {
        cmp = a.port - b.port;
      } else if (sortField === 'realm') {
        cmp = a.realm.localeCompare(b.realm);
      } else if (sortField === 'secret') {
        cmp = a.secret.localeCompare(b.secret);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [draftRealms, sortField, sortAsc]);

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(sortedRealms.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRealms = sortedRealms.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSort = (field: RealmSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleReset = () => {
    setRealm('*');
    setPort(22);
    setAutoDiscover(false);
    setSecret('');
    setUseLocalCertificates(false);
    setCaCertificate('');
    setCaCertificateFilename('');
    setCertificate('');
    setCertificateFilename('');
    setPrivateKey('');
    setPrivateKeyFilename('');
    setPrivateKeyPassword('');
  };

  const handleAdd = () => {
    if (!realm.trim() || !secret.trim()) return;
    setDraftRealms([
      ...draftRealms,
      {
        realm: realm.trim(),
        port: Number(port) || 22,
        autoDiscover,
        secret: secret.trim(),
        useLocalCertificates,
        caCertificate,
        caCertificateFilename,
        certificate,
        certificateFilename,
        privateKey,
        privateKeyFilename,
        privateKeyPassword: privateKeyPassword.trim(),
      },
    ]);
    handleReset();
  };

  const handleDelete = (indexToDelete: number) => {
    const actualItem = paginatedRealms[indexToDelete];
    const updated = draftRealms.filter((r) => r !== actualItem);
    setDraftRealms(updated);
    if (safePage > Math.max(1, Math.ceil(updated.length / pageSize))) {
      setCurrentPage(Math.max(1, Math.ceil(updated.length / pageSize)));
    }
  };

  const handleSave = () => {
    onSave(draftRealms);
    onClose();
  };

  const isAddValid = Boolean(realm.trim() && secret.trim());

  const getCertModalProps = () => {
    if (activeCertModal === 'ca-certificate') {
      return {
        value: caCertificate,
        filename: caCertificateFilename,
      };
    }
    if (activeCertModal === 'certificate') {
      return {
        value: certificate,
        filename: certificateFilename,
      };
    }
    if (activeCertModal === 'private-key') {
      return {
        value: privateKey,
        filename: privateKeyFilename,
      };
    }
    return { value: '', filename: '' };
  };

  const handleSaveCert = (content: string, filename?: string) => {
    if (activeCertModal === 'ca-certificate') {
      setCaCertificate(content);
      setCaCertificateFilename(filename || '');
    } else if (activeCertModal === 'certificate') {
      setCertificate(content);
      setCertificateFilename(filename || '');
    } else if (activeCertModal === 'private-key') {
      setPrivateKey(content);
      setPrivateKeyFilename(filename || '');
    }
  };

  const renderCertUploadRow = (
    field: RealmCertField,
    label: string,
    val: string,
    fn: string,
    onClear: () => void
  ) => {
    const hasUploaded = Boolean(val.trim());

    return (
      <Box key={field}>
        <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
          {label} <Text as="span" color="#dc2626">*</Text>
        </Text>
        <Flex align="center" gap={3}>
          <Text fontSize="12px" color="#64748b" minW="100px">
            {hasUploaded ? (fn ? `Using ${fn}` : 'Uploaded') : 'Not Uploaded Yet'}
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
            onClick={() => setActiveCertModal(field)}
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
              onClick={onClear}
              title={`Remove ${label}`}
            >
              <Icon name="trash" size={13} />
            </Box>
          )}
        </Flex>
      </Box>
    );
  };

  const certModalProps = getCertModalProps();

  return (
    <>
      <Box
        position="fixed"
        inset="0"
        bg="rgba(5, 12, 23, 0.54)"
        display="grid"
        placeItems="center"
        zIndex="1500"
        p={4}
      >
        <Box
          w="min(960px, 95vw)"
          maxH="90vh"
          display="flex"
          flexDirection="column"
          bg="#ffffff"
          borderRadius="12px"
          boxShadow="0 20px 50px rgba(0,0,0,0.3)"
          border="1px solid"
          borderColor={themeColors.panel.border}
          overflow="hidden"
        >
          {/* Header */}
          <Flex
            px={5}
            py={3.5}
            align="center"
            justify="space-between"
            borderBottom="1px solid"
            borderColor="#e2e8f0"
            bg="#ffffff"
          >
            <Text fontSize="15px" fontWeight="700" color="#1e293b">
              configuration.radius-proxy.realms
            </Text>

            <HStack gap={2}>
              {!disabled && (
                <Box
                  as="button"
                  w="32px"
                  h="32px"
                  borderRadius="8px"
                  bg="#2563eb"
                  color="#ffffff"
                  display="grid"
                  placeItems="center"
                  cursor="pointer"
                  _hover={{ bg: '#1d4ed8' }}
                  onClick={handleSave}
                  title="Save realms"
                >
                  <Icon name="save" size={16} />
                </Box>
              )}

              <Box
                as="button"
                w="32px"
                h="32px"
                borderRadius="50%"
                border="1px solid"
                borderColor="#cbd5e1"
                color="#64748b"
                display="grid"
                placeItems="center"
                cursor="pointer"
                _hover={{ bg: '#f1f5f9', color: '#0f172a' }}
                onClick={onClose}
                title="Close"
              >
                <Icon name="x" size={15} />
              </Box>
            </HStack>
          </Flex>

          {/* Modal Scrollable Body */}
          <Box p={6} overflowY="auto" flex="1">
            <VStack gap={5} align="stretch">
              {/* Form Input Fields */}
              {!disabled && (
                <Box>
                  {/* Row 1: realm, port, auto-discover */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={3.5} alignItems="flex-start">
                    <Box>
                      <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                        realm <Text as="span" color="#dc2626">*</Text>
                      </Text>
                      <Input
                        value={realm}
                        onChange={(e) => setRealm(e.target.value)}
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                        size="sm"
                      />
                    </Box>

                    <Box w="120px">
                      <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                        port <Text as="span" color="#dc2626">*</Text>
                      </Text>
                      <Input
                        type="number"
                        min={0}
                        max={65535}
                        value={port}
                        onChange={(e) => setPort(Number(e.target.value) || 22)}
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                        size="sm"
                      />
                    </Box>

                    <Box>
                      <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                        auto-discover <Text as="span" color="#dc2626">*</Text>
                      </Text>
                      <ToggleSwitch
                        checked={autoDiscover}
                        onChange={(checked) => setAutoDiscover(checked)}
                        disabled={disabled}
                      />
                    </Box>
                  </SimpleGrid>

                  {/* Row 2: secret, use-local-certificates, ca-certificate */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={3.5} alignItems="flex-start">
                    <Box>
                      <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                        secret <Text as="span" color="#dc2626">*</Text>
                      </Text>
                      <Input
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                        size="sm"
                      />
                    </Box>

                    <Box>
                      <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                        use-local-certificates <Text as="span" color="#dc2626">*</Text>
                      </Text>
                      <ToggleSwitch
                        checked={useLocalCertificates}
                        onChange={(checked) => setUseLocalCertificates(checked)}
                        disabled={disabled}
                      />
                    </Box>

                    <Box>
                      {renderCertUploadRow(
                        'ca-certificate',
                        'ca-certificate',
                        caCertificate,
                        caCertificateFilename,
                        () => {
                          setCaCertificate('');
                          setCaCertificateFilename('');
                        }
                      )}
                    </Box>
                  </SimpleGrid>

                  {/* Row 3: certificate, private-key, private-key-password */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={3.5} alignItems="flex-start">
                    <Box>
                      {renderCertUploadRow(
                        'certificate',
                        'certificate',
                        certificate,
                        certificateFilename,
                        () => {
                          setCertificate('');
                          setCertificateFilename('');
                        }
                      )}
                    </Box>

                    <Box>
                      {renderCertUploadRow(
                        'private-key',
                        'private-key',
                        privateKey,
                        privateKeyFilename,
                        () => {
                          setPrivateKey('');
                          setPrivateKeyFilename('');
                        }
                      )}
                    </Box>

                    <Box>
                      <Text fontSize="12px" fontWeight="600" color="#475569" mb={1.5}>
                        private-key-password <Text as="span" color="#dc2626">*</Text>
                      </Text>
                      <Input
                        value={privateKeyPassword}
                        onChange={(e) => setPrivateKeyPassword(e.target.value)}
                        borderRadius="8px"
                        borderColor="#cbd5e1"
                        size="sm"
                      />
                    </Box>
                  </SimpleGrid>

                  {/* Row 4: Action Buttons (Add, Reset) */}
                  <Flex justify="flex-end" gap={2}>
                    <Box
                      as="button"
                      px={4}
                      py={1.5}
                      borderRadius="16px"
                      bg={isAddValid ? '#2563eb' : '#94a3b8'}
                      color="#ffffff"
                      fontSize="12px"
                      fontWeight="600"
                      cursor={isAddValid ? 'pointer' : 'not-allowed'}
                      _hover={isAddValid ? { bg: '#1d4ed8' } : undefined}
                      onClick={handleAdd}
                    >
                      Add
                    </Box>

                    <Box
                      as="button"
                      px={4}
                      py={1.5}
                      borderRadius="16px"
                      border="1px solid"
                      borderColor="#cbd5e1"
                      bg="#ffffff"
                      color="#475569"
                      fontSize="12px"
                      fontWeight="600"
                      cursor="pointer"
                      _hover={{ bg: '#f8fafc' }}
                      onClick={handleReset}
                    >
                      Reset
                    </Box>
                  </Flex>
                </Box>
              )}

              {/* Realms Table */}
              <Box
                border="1px solid"
                borderColor="#e2e8f0"
                borderRadius="8px"
                overflow="hidden"
              >
                <Table.Root size="sm" variant="outline">
                  <Table.Header bg="#ffffff">
                    <Table.Row borderBottom="1px solid #e2e8f0">
                      <Table.ColumnHeader
                        fontSize="11px"
                        fontWeight="700"
                        color="#64748b"
                        py={3}
                        px={4}
                        cursor="pointer"
                        onClick={() => handleSort('realm')}
                      >
                        REALM ○
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        fontSize="11px"
                        fontWeight="700"
                        color="#64748b"
                        py={3}
                        px={4}
                        cursor="pointer"
                        onClick={() => handleSort('port')}
                      >
                        PORT ○
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        fontSize="11px"
                        fontWeight="700"
                        color="#64748b"
                        py={3}
                        px={4}
                        cursor="pointer"
                        onClick={() => handleSort('secret')}
                      >
                        SECRET ○
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        fontSize="11px"
                        fontWeight="700"
                        color="#64748b"
                        py={3}
                        px={4}
                        textAlign="right"
                      >
                        ACTIONS
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {paginatedRealms.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={4} py={12} textAlign="center">
                          <Text fontSize="14px" fontWeight="700" color="#64748b">
                            Empty List
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      paginatedRealms.map((r, idx) => (
                        <Table.Row key={`${r.realm}-${r.port}-${idx}`} _hover={{ bg: '#f8fafc' }}>
                          <Table.Cell py={3} px={4} fontSize="13px" fontWeight="600" color="#1e293b">
                            {r.realm}
                          </Table.Cell>
                          <Table.Cell py={3} px={4} fontSize="13px" color="#475569">
                            {r.port}
                          </Table.Cell>
                          <Table.Cell py={3} px={4} fontSize="13px" color="#475569">
                            {r.secret}
                          </Table.Cell>
                          <Table.Cell py={3} px={4} textAlign="right">
                            {!disabled && (
                              <Box
                                as="button"
                                w="26px"
                                h="26px"
                                borderRadius="4px"
                                bg="#fee2e2"
                                color="#dc2626"
                                display="inline-grid"
                                placeItems="center"
                                cursor="pointer"
                                _hover={{ bg: '#fca5a5' }}
                                onClick={() => handleDelete(idx)}
                                title="Delete Realm"
                              >
                                <Icon name="trash" size={13} />
                              </Box>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Root>
              </Box>
            </VStack>
          </Box>

          {/* Pagination Footer */}
          <Flex
            px={5}
            py={3}
            align="center"
            justify="space-between"
            borderTop="1px solid"
            borderColor="#e2e8f0"
            bg="#ffffff"
            wrap="wrap"
            gap={3}
          >
            <HStack gap={1.5}>
              <Box
                as="button"
                w="28px"
                h="28px"
                borderRadius="4px"
                border="1px solid"
                borderColor="#cbd5e1"
                display="grid"
                placeItems="center"
                fontSize="12px"
                color={safePage <= 1 ? '#cbd5e1' : '#64748b'}
                cursor={safePage <= 1 ? 'not-allowed' : 'pointer'}
                _hover={safePage <= 1 ? undefined : { bg: '#f1f5f9' }}
                onClick={() => setCurrentPage(1)}
                title="First Page"
              >
                «
              </Box>
              <Box
                as="button"
                w="28px"
                h="28px"
                borderRadius="4px"
                border="1px solid"
                borderColor="#cbd5e1"
                display="grid"
                placeItems="center"
                fontSize="12px"
                color={safePage <= 1 ? '#cbd5e1' : '#64748b'}
                cursor={safePage <= 1 ? 'not-allowed' : 'pointer'}
                _hover={safePage <= 1 ? undefined : { bg: '#f1f5f9' }}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                ‹
              </Box>
            </HStack>

            <HStack gap={3} fontSize="12px" color="#64748b">
              <Text>
                Page <Text as="span" fontWeight="700" color="#0f172a">{draftRealms.length === 0 ? 0 : safePage}</Text> of{' '}
                <Text as="span" fontWeight="700" color="#0f172a">{draftRealms.length === 0 ? 0 : totalPages}</Text>
              </Text>

              <HStack gap={1.5}>
                <Text>Go to page</Text>
                <Input
                  size="xs"
                  w="46px"
                  h="26px"
                  type="number"
                  value={safePage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= 1 && val <= totalPages) {
                      setCurrentPage(val);
                    }
                  }}
                  textAlign="center"
                  borderRadius="4px"
                  borderColor="#cbd5e1"
                />
              </HStack>

              <Box w="100px">
                <SelectDropdown
                  size="sm"
                  value={pageSize}
                  onChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: '5', label: 'Show 5' },
                    { value: '10', label: 'Show 10' },
                    { value: '20', label: 'Show 20' },
                    { value: '50', label: 'Show 50' },
                  ]}
                />
              </Box>
            </HStack>

            <HStack gap={1.5}>
              <Box
                as="button"
                w="28px"
                h="28px"
                borderRadius="4px"
                border="1px solid"
                borderColor="#cbd5e1"
                display="grid"
                placeItems="center"
                fontSize="12px"
                color={safePage >= totalPages ? '#cbd5e1' : '#64748b'}
                cursor={safePage >= totalPages ? 'not-allowed' : 'pointer'}
                _hover={safePage >= totalPages ? undefined : { bg: '#f1f5f9' }}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                ›
              </Box>
              <Box
                as="button"
                w="28px"
                h="28px"
                borderRadius="4px"
                border="1px solid"
                borderColor="#cbd5e1"
                display="grid"
                placeItems="center"
                fontSize="12px"
                color={safePage >= totalPages ? '#cbd5e1' : '#64748b'}
                cursor={safePage >= totalPages ? 'not-allowed' : 'pointer'}
                _hover={safePage >= totalPages ? undefined : { bg: '#f1f5f9' }}
                onClick={() => setCurrentPage(totalPages)}
                title="Last Page"
              >
                »
              </Box>
            </HStack>
          </Flex>
        </Box>
      </Box>

      {/* Nested Certificate Modal */}
      {activeCertModal && (
        <CertificateUploadModal
          isOpen={activeCertModal !== null}
          onClose={() => setActiveCertModal(null)}
          title={activeCertModal}
          value={certModalProps.value}
          fileName={certModalProps.filename}
          onSave={handleSaveCert}
          disabled={disabled}
        />
      )}
    </>
  );
};

