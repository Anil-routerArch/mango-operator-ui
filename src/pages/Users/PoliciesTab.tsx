import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
  Input,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';

export interface ResourcePermission {
  resource: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface PolicyItem {
  id: string;
  name: string;
  type: 'Built-in' | 'Custom';
  usedByUsers: number;
  scopedAssignmentsCount: number;
  modified: string;
  description: string;
  permissions: ResourcePermission[];
}

// Initial dummy policies matching the exact layout and data
const INITIAL_POLICIES: PolicyItem[] = [
  {
    id: 'pol-admin',
    name: 'Administrator',
    type: 'Built-in',
    usedByUsers: 6,
    scopedAssignmentsCount: 8,
    modified: '1 Sep 2026',
    description: 'Full administrative access across all resources and operations.',
    permissions: [
      { resource: 'Property', read: true, create: true, update: true, delete: true },
      { resource: 'Venue', read: true, create: true, update: true, delete: true },
      { resource: 'Device', read: true, create: true, update: true, delete: true },
      { resource: 'Configuration', read: true, create: true, update: true, delete: true },
      { resource: 'Configuration Profile', read: true, create: true, update: true, delete: true },
    ],
  },
  {
    id: 'pol-net-op',
    name: 'Network Operator',
    type: 'Built-in',
    usedByUsers: 9,
    scopedAssignmentsCount: 14,
    modified: '2 Sep 2026',
    description: 'Monitor devices and manage network configuration.',
    permissions: [
      { resource: 'Property', read: true, create: false, update: false, delete: false },
      { resource: 'Venue', read: true, create: false, update: false, delete: false },
      { resource: 'Device', read: true, create: false, update: true, delete: false },
      { resource: 'Configuration', read: true, create: true, update: true, delete: false },
      { resource: 'Configuration Profile', read: true, create: true, update: true, delete: false },
    ],
  },
  {
    id: 'pol-installer',
    name: 'Installer',
    type: 'Built-in',
    usedByUsers: 4,
    scopedAssignmentsCount: 6,
    modified: '28 Aug 2026',
    description: 'Device onboarding, inventory provisioning and local venue testing.',
    permissions: [
      { resource: 'Property', read: true, create: false, update: false, delete: false },
      { resource: 'Venue', read: true, create: false, update: false, delete: false },
      { resource: 'Device', read: true, create: true, update: true, delete: false },
      { resource: 'Configuration', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration Profile', read: true, create: false, update: false, delete: false },
    ],
  },
  {
    id: 'pol-csr',
    name: 'CSR',
    type: 'Built-in',
    usedByUsers: 3,
    scopedAssignmentsCount: 4,
    modified: '28 Aug 2026',
    description: 'Customer service support, monitoring and end-user assistance.',
    permissions: [
      { resource: 'Property', read: true, create: false, update: false, delete: false },
      { resource: 'Venue', read: true, create: false, update: false, delete: false },
      { resource: 'Device', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration Profile', read: true, create: false, update: false, delete: false },
    ],
  },
  {
    id: 'pol-readonly',
    name: 'Read Only',
    type: 'Built-in',
    usedByUsers: 5,
    scopedAssignmentsCount: 7,
    modified: '28 Aug 2026',
    description: 'Audit and reporting view-only access across properties.',
    permissions: [
      { resource: 'Property', read: true, create: false, update: false, delete: false },
      { resource: 'Venue', read: true, create: false, update: false, delete: false },
      { resource: 'Device', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration Profile', read: true, create: false, update: false, delete: false },
    ],
  },
  {
    id: 'pol-firmware',
    name: 'Firmware Operator',
    type: 'Custom',
    usedByUsers: 2,
    scopedAssignmentsCount: 3,
    modified: '25 Aug 2026',
    description: 'Dedicated firmware upgrade and scheduled rollout management.',
    permissions: [
      { resource: 'Property', read: true, create: false, update: false, delete: false },
      { resource: 'Venue', read: true, create: false, update: false, delete: false },
      { resource: 'Device', read: true, create: false, update: true, delete: false },
      { resource: 'Configuration', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration Profile', read: true, create: false, update: false, delete: false },
    ],
  },
  {
    id: 'pol-prop-mgr',
    name: 'Property Manager',
    type: 'Custom',
    usedByUsers: 1,
    scopedAssignmentsCount: 2,
    modified: '20 Aug 2026',
    description: 'Property and venue configuration boundary management.',
    permissions: [
      { resource: 'Property', read: true, create: false, update: true, delete: false },
      { resource: 'Venue', read: true, create: true, update: true, delete: false },
      { resource: 'Device', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration Profile', read: true, create: false, update: false, delete: false },
    ],
  },
  {
    id: 'pol-auditor',
    name: 'Auditor',
    type: 'Custom',
    usedByUsers: 0,
    scopedAssignmentsCount: 0,
    modified: '15 Aug 2026',
    description: 'Compliance inspection and security policy review.',
    permissions: [
      { resource: 'Property', read: true, create: false, update: false, delete: false },
      { resource: 'Venue', read: true, create: false, update: false, delete: false },
      { resource: 'Device', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration', read: true, create: false, update: false, delete: false },
      { resource: 'Configuration Profile', read: true, create: false, update: false, delete: false },
    ],
  },
];

interface PoliciesTabProps {
  isCreatePolicyOpen?: boolean;
  onCloseCreatePolicy?: () => void;
}

export const PoliciesTab: React.FC<PoliciesTabProps> = ({
  isCreatePolicyOpen = false,
  onCloseCreatePolicy,
}) => {
  const [policies, setPolicies] = useState<PolicyItem[]>(INITIAL_POLICIES);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('pol-net-op');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'permissions'>('permissions');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // New policy modal state
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyDesc, setNewPolicyDesc] = useState('');
  const [newPolicyPreset, setNewPolicyPreset] = useState('Network Operator');

  // Filtered policies list
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesType =
        typeFilter === 'All Types' || p.type.toLowerCase() === typeFilter.toLowerCase();
      return matchesSearch && matchesType;
    });
  }, [policies, search, typeFilter]);

  // Selected policy
  const selectedPolicy = useMemo(() => {
    return (
      policies.find((p) => p.id === selectedPolicyId) ||
      filteredPolicies[0] ||
      policies[0]
    );
  }, [policies, selectedPolicyId, filteredPolicies]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / pageSize));
  const paginatedPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPolicies.slice(startIndex, startIndex + pageSize);
  }, [filteredPolicies, currentPage, pageSize]);

  // KPI Calculations
  const totalPoliciesCount = policies.length;
  const builtInCount = policies.filter((p) => p.type === 'Built-in').length;
  const customCount = policies.filter((p) => p.type === 'Custom').length;
  const totalActiveAssignments = policies.reduce((acc, p) => acc + p.scopedAssignmentsCount, 0);

  // Handle Save Policy action
  const handleSavePolicy = () => {
    alert(`Policy "${selectedPolicy.name}" changes saved successfully.`);
  };

  return (
    <VStack gap={4} align="stretch" w="100%">
      {/* 1. Architecture Info Banner: Policies define permitted actions */}
      <Flex
        minH="76px"
        bg="#f0f7ff"
        border="1px solid #bfdbfe"
        borderRadius="6px"
        p="16px 20px"
        align="center"
        justify="space-between"
        wrap="wrap"
        gap={4}
      >
        <HStack gap={3.5} align="center">
          <Flex
            w="42px"
            h="42px"
            borderRadius="50%"
            bg="#ffffff"
            border="1.5px solid #0869ff"
            align="center"
            justify="center"
            color="#0869ff"
            flexShrink={0}
          >
            <Icon name="shield" size={20} />
          </Flex>
          <Box>
            <Text fontSize="15px" fontWeight="700" color="#0f172a">
              Policies define permitted actions
            </Text>
            <Text fontSize="13px" color="#64748b" mt={0.5}>
              Assign policies to properties or venues through a user's scoped access.
            </Text>
          </Box>
        </HStack>

        {/* Right Flow Diagram: Policy ──> Scoped Access */}
        <HStack gap={3} align="center">
          <HStack
            gap={2}
            px={3}
            py={1.5}
            bg="#ffffff"
            border="1px solid #bfdbfe"
            borderRadius="20px"
          >
            <Box color="#0869ff">
              <Icon name="file" size={15} />
            </Box>
            <Text fontSize="12px" fontWeight="600" color="#1e293b">
              Policy
            </Text>
          </HStack>

          <HStack gap={1} color="#94a3b8">
            <Box w="36px" h="1.5px" bg="#94a3b8" />
            <Icon name="arrowRight" size={13} />
          </HStack>

          <HStack
            gap={2}
            px={3}
            py={1.5}
            bg="#ffffff"
            border="1px solid #bfdbfe"
            borderRadius="20px"
          >
            <Box color="#0869ff">
              <Icon name="building" size={15} />
            </Box>
            <Text fontSize="12px" fontWeight="600" color="#1e293b">
              Scoped Access
            </Text>
          </HStack>
        </HStack>
      </Flex>

      {/* 2. KPI Cards Grid (4 Cards) */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} gap={4}>
        {/* Card 1: Total Policies */}
        <Flex
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          p="16px"
          align="center"
          gap={3.5}
        >
          <Flex
            w="40px"
            h="40px"
            borderRadius="8px"
            bg="#eff6ff"
            border="1px solid #bfdbfe"
            color="#2563eb"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon name="shield" size={20} />
          </Flex>
          <Box>
            <Text fontSize="12px" fontWeight="500" color="#64748b">
              Total Policies
            </Text>
            <Text fontSize="22px" fontWeight="700" color="#0f172a" lineHeight="1.2">
              {totalPoliciesCount}
            </Text>
          </Box>
        </Flex>

        {/* Card 2: Built-in */}
        <Flex
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          p="16px"
          align="center"
          gap={3.5}
        >
          <Flex
            w="40px"
            h="40px"
            borderRadius="8px"
            bg="#f0fdf4"
            border="1px solid #bbf7d0"
            color="#16a34a"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon name="check" size={20} />
          </Flex>
          <Box>
            <Text fontSize="12px" fontWeight="500" color="#64748b">
              Built-in
            </Text>
            <Text fontSize="22px" fontWeight="700" color="#0f172a" lineHeight="1.2">
              {builtInCount}
            </Text>
          </Box>
        </Flex>

        {/* Card 3: Custom */}
        <Flex
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          p="16px"
          align="center"
          gap={3.5}
        >
          <Flex
            w="40px"
            h="40px"
            borderRadius="8px"
            bg="#fff7ed"
            border="1px solid #fed7aa"
            color="#ea580c"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon name="edit" size={20} />
          </Flex>
          <Box>
            <Text fontSize="12px" fontWeight="500" color="#64748b">
              Custom
            </Text>
            <Text fontSize="22px" fontWeight="700" color="#0f172a" lineHeight="1.2">
              {customCount}
            </Text>
          </Box>
        </Flex>

        {/* Card 4: Active Assignments */}
        <Flex
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          p="16px"
          align="center"
          gap={3.5}
        >
          <Flex
            w="40px"
            h="40px"
            borderRadius="8px"
            bg="#faf5ff"
            border="1px solid #e9d8fd"
            color="#7c3aed"
            align="center"
            justify="center"
            flexShrink={0}
          >
            <Icon name="users" size={20} />
          </Flex>
          <Box>
            <Text fontSize="12px" fontWeight="500" color="#64748b">
              Active Assignments
            </Text>
            <Text fontSize="22px" fontWeight="700" color="#0f172a" lineHeight="1.2">
              {totalActiveAssignments}
            </Text>
          </Box>
        </Flex>
      </SimpleGrid>

      {/* 3. Split Panel: Policies Table (Left) + Policy Details (Right) */}
      <Flex gap={5} align="flex-start" direction={{ base: 'column', lg: 'row' }}>
        {/* Left Panel: Policies Table */}
        <Box
          flex="1"
          w="100%"
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          p={5}
        >
          <Text fontSize="16px" fontWeight="700" color="#0f172a" mb={4}>
            Policies
          </Text>

          {/* Search & Filter Bar */}
          <Flex gap={3} mb={4}>
            <Box position="relative" flex="1">
              <Box position="absolute" left="10px" top="10px" color="#94a3b8">
                <Icon name="search" size={16} />
              </Box>
              <Input
                placeholder="Search policies..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                pl="34px"
                h="36px"
                fontSize="13px"
                borderRadius="4px"
              />
            </Box>

            <SelectDropdown
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(String(val));
                setCurrentPage(1);
              }}
              options={['All Types', 'Built-in', 'Custom']}
              w="140px"
              h="36px"
            />
          </Flex>

          {/* Table Header */}
          <Flex
            py={2.5}
            px={3}
            bg="#f8fafc"
            borderBottom="1px solid"
            borderColor={themeColors.panel.border}
            fontSize="11px"
            fontWeight="700"
            color="#64748b"
            textTransform="uppercase"
            letterSpacing="0.05em"
          >
            <Box flex="1.8">Policy</Box>
            <Box flex="1">Type</Box>
            <Box flex="1">Used By</Box>
            <Box flex="1.2">Modified</Box>
            <Box w="24px" />
          </Flex>

          {/* Table Rows */}
          {paginatedPolicies.map((p) => {
            const isSelected = p.id === selectedPolicy.id;
            return (
              <Flex
                key={p.id}
                align="center"
                py={3}
                px={3}
                borderBottom="1px solid"
                borderColor={themeColors.panel.divider}
                bg={isSelected ? '#eff6ff' : 'transparent'}
                border={isSelected ? '1px solid #bfdbfe' : undefined}
                borderRadius={isSelected ? '4px' : undefined}
                cursor="pointer"
                onClick={() => setSelectedPolicyId(p.id)}
                _hover={{ bg: isSelected ? '#eff6ff' : '#f8fafc' }}
                transition="all 0.15s ease"
              >
                {/* Policy Name & Icon */}
                <HStack flex="1.8" gap={2.5} minW={0} pr={2}>
                  <Flex
                    w="24px"
                    h="24px"
                    borderRadius="50%"
                    bg={isSelected ? '#dbeafe' : '#f1f5f9'}
                    color={isSelected ? '#1d4ed8' : '#64748b'}
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Icon name="shield" size={13} />
                  </Flex>
                  <Text
                    fontSize="13px"
                    fontWeight={isSelected ? '700' : '600'}
                    color={isSelected ? '#1e40af' : '#0f172a'}
                    lineClamp={1}
                  >
                    {p.name}
                  </Text>
                </HStack>

                {/* Type */}
                <Box flex="1">
                  <Text fontSize="12px" color="#64748b">
                    {p.type}
                  </Text>
                </Box>

                {/* Used By */}
                <Box flex="1">
                  <Text fontSize="12px" color="#64748b">
                    {p.usedByUsers} users
                  </Text>
                </Box>

                {/* Modified */}
                <Box flex="1.2">
                  <Text fontSize="12px" color="#64748b">
                    {p.modified}
                  </Text>
                </Box>

                {/* Arrow */}
                <Box w="24px" textAlign="right" color={isSelected ? '#1e40af' : '#94a3b8'}>
                  <Icon name="chevronRight" size={15} />
                </Box>
              </Flex>
            );
          })}

          {/* Pagination Footer */}
          <Flex justify="space-between" align="center" pt={4} mt={1}>
            <Text fontSize="12px" color="#64748b">
              Showing {Math.min(filteredPolicies.length, (currentPage - 1) * pageSize + 1)}–
              {Math.min(filteredPolicies.length, currentPage * pageSize)} of{' '}
              {filteredPolicies.length}
            </Text>

            <HStack gap={1}>
              <Button
                variant="outline"
                size="xs"
                h="28px"
                w="28px"
                p={0}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <Icon name="chevronLeft" size={14} />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <Button
                  key={pg}
                  size="xs"
                  h="28px"
                  w="28px"
                  p={0}
                  bg={pg === currentPage ? '#ffffff' : 'transparent'}
                  borderColor={pg === currentPage ? '#0869ff' : 'transparent'}
                  border="1px solid"
                  color={pg === currentPage ? '#0869ff' : '#64748b'}
                  fontWeight={pg === currentPage ? '700' : '400'}
                  onClick={() => setCurrentPage(pg)}
                >
                  {pg}
                </Button>
              ))}

              <Button
                variant="outline"
                size="xs"
                h="28px"
                w="28px"
                p={0}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <Icon name="chevronRight" size={14} />
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Right Panel: Selected Policy Details */}
        <Box
          flex="1.05"
          w="100%"
          bg="#ffffff"
          border="1px solid"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          p={5}
        >
          {/* Policy Title Row */}
          <Flex justify="space-between" align="flex-start" mb={4}>
            <HStack gap={3} align="flex-start">
              <Flex
                w="40px"
                h="40px"
                borderRadius="50%"
                bg="#eff6ff"
                border="1px solid #bfdbfe"
                color="#0869ff"
                align="center"
                justify="center"
                flexShrink={0}
                mt="2px"
              >
                <Icon name="shield" size={20} />
              </Flex>
              <Box>
                <HStack gap={2}>
                  <Text fontSize="17px" fontWeight="700" color="#0f172a">
                    {selectedPolicy.name}
                  </Text>
                  <Badge
                    colorScheme="blue"
                    variant="subtle"
                    fontSize="11px"
                    px={2}
                    borderRadius="4px"
                  >
                    {selectedPolicy.type}
                  </Badge>
                </HStack>
                <Text fontSize="12px" color="#64748b" mt={0.5}>
                  {selectedPolicy.description}
                </Text>
              </Box>
            </HStack>

            <Button
              variant="outline"
              size="xs"
              h="28px"
              w="28px"
              p={0}
              color="#64748b"
              title="More options"
            >
              <Icon name="more" size={16} />
            </Button>
          </Flex>

          {/* Subtabs: Overview & Permissions */}
          <Flex borderBottom="1px solid" borderColor={themeColors.panel.divider} gap={4} mb={4}>
            <Button
              variant="plain"
              onClick={() => setActiveDetailTab('overview')}
              px={2}
              pb={2}
              pt={1}
              fontSize="13px"
              fontWeight={activeDetailTab === 'overview' ? '600' : '400'}
              color={activeDetailTab === 'overview' ? '#0f172a' : '#64748b'}
              position="relative"
              _after={
                activeDetailTab === 'overview'
                  ? {
                      content: '""',
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      bg: '#0869ff',
                    }
                  : undefined
              }
            >
              Overview
            </Button>
            <Button
              variant="plain"
              onClick={() => setActiveDetailTab('permissions')}
              px={2}
              pb={2}
              pt={1}
              fontSize="13px"
              fontWeight={activeDetailTab === 'permissions' ? '600' : '400'}
              color={activeDetailTab === 'permissions' ? '#0f172a' : '#64748b'}
              position="relative"
              _after={
                activeDetailTab === 'permissions'
                  ? {
                      content: '""',
                      position: 'absolute',
                      bottom: '-1px',
                      left: 0,
                      right: 0,
                      height: '2px',
                      bg: '#0869ff',
                    }
                  : undefined
              }
            >
              Permissions
            </Button>
          </Flex>

          {activeDetailTab === 'permissions' ? (
            <VStack gap={4} align="stretch">
              {/* Policy Preset Field */}
              <Box>
                <Text fontSize="11px" fontWeight="600" color="#64748b" mb={1}>
                  Policy preset
                </Text>
                <Input
                  value={selectedPolicy.name}
                  readOnly
                  disabled
                  bg="#f8fafc"
                  h="36px"
                  fontSize="13px"
                  borderRadius="4px"
                  borderColor={themeColors.panel.border}
                />
                <Text fontSize="11px" color="#94a3b8" mt={1}>
                  {selectedPolicy.type === 'Built-in'
                    ? 'Built-in presets are protected from deletion.'
                    : 'Custom policy assigned to scoped entity/venue assignments.'}
                </Text>
              </Box>

              {/* Resource permissions Table */}
              <Box>
                <Text fontSize="13px" fontWeight="700" color="#0f172a" mb={2.5}>
                  Resource permissions
                </Text>

                <Box
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  borderRadius="6px"
                  overflow="hidden"
                >
                  {/* Table Header */}
                  <Flex
                    bg="#f8fafc"
                    py={2}
                    px={3}
                    borderBottom="1px solid"
                    borderColor={themeColors.panel.border}
                    fontSize="11px"
                    fontWeight="700"
                    color="#64748b"
                  >
                    <Box flex="1.8">Resource</Box>
                    <Box flex="1" textAlign="center">Read</Box>
                    <Box flex="1" textAlign="center">Create</Box>
                    <Box flex="1" textAlign="center">Update</Box>
                    <Box flex="1" textAlign="center">Delete</Box>
                  </Flex>

                  {/* Rows */}
                  {selectedPolicy.permissions.map((perm) => (
                    <Flex
                      key={perm.resource}
                      py={2.5}
                      px={3}
                      borderBottom="1px solid"
                      borderColor={themeColors.panel.divider}
                      _last={{ borderBottom: 'none' }}
                      align="center"
                      fontSize="12px"
                    >
                      <Box flex="1.8" fontWeight="600" color="#0f172a">
                        {perm.resource}
                      </Box>

                      {/* Read */}
                      <Flex flex="1" justify="center">
                        {perm.read ? (
                          <Flex
                            w="16px"
                            h="16px"
                            borderRadius="50%"
                            border="1.5px solid #16a34a"
                            color="#16a34a"
                            align="center"
                            justify="center"
                          >
                            <Icon name="check" size={10} />
                          </Flex>
                        ) : (
                          <Text color="#94a3b8" fontWeight="600">—</Text>
                        )}
                      </Flex>

                      {/* Create */}
                      <Flex flex="1" justify="center">
                        {perm.create ? (
                          <Flex
                            w="16px"
                            h="16px"
                            borderRadius="50%"
                            border="1.5px solid #16a34a"
                            color="#16a34a"
                            align="center"
                            justify="center"
                          >
                            <Icon name="check" size={10} />
                          </Flex>
                        ) : (
                          <Text color="#94a3b8" fontWeight="600">—</Text>
                        )}
                      </Flex>

                      {/* Update */}
                      <Flex flex="1" justify="center">
                        {perm.update ? (
                          <Flex
                            w="16px"
                            h="16px"
                            borderRadius="50%"
                            border="1.5px solid #16a34a"
                            color="#16a34a"
                            align="center"
                            justify="center"
                          >
                            <Icon name="check" size={10} />
                          </Flex>
                        ) : (
                          <Text color="#94a3b8" fontWeight="600">—</Text>
                        )}
                      </Flex>

                      {/* Delete */}
                      <Flex flex="1" justify="center">
                        {perm.delete ? (
                          <Flex
                            w="16px"
                            h="16px"
                            borderRadius="50%"
                            border="1.5px solid #16a34a"
                            color="#16a34a"
                            align="center"
                            justify="center"
                          >
                            <Icon name="check" size={10} />
                          </Flex>
                        ) : (
                          <Text color="#94a3b8" fontWeight="600">—</Text>
                        )}
                      </Flex>
                    </Flex>
                  ))}
                </Box>
              </Box>

              {/* Policy impact callout box */}
              <Flex
                p={3}
                borderRadius="6px"
                bg="#eff6ff"
                border="1px solid #bfdbfe"
                gap={2.5}
                align="flex-start"
              >
                <Box color="#0869ff" mt="1px">
                  <Icon name="info" size={16} />
                </Box>
                <Box>
                  <Text fontSize="12px" fontWeight="700" color="#1e40af">
                    Policy impact
                  </Text>
                  <Text fontSize="11px" color="#1e40af" mt={0.5}>
                    {selectedPolicy.usedByUsers} users across {selectedPolicy.scopedAssignmentsCount} scoped assignments will be affected by permission changes.
                  </Text>
                </Box>
              </Flex>

              {/* Bottom Actions */}
              <Flex justify="space-between" pt={2}>
                <Button
                  variant="outline"
                  size="sm"
                  h="34px"
                  px={4}
                  borderRadius="4px"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  h="34px"
                  px={5}
                  bg="#1a9c52"
                  color="#ffffff"
                  _hover={{ bg: '#15803d' }}
                  borderRadius="4px"
                  fontWeight="600"
                  onClick={handleSavePolicy}
                >
                  Save policy
                </Button>
              </Flex>
            </VStack>
          ) : (
            /* Overview Subtab */
            <VStack gap={4} align="stretch" fontSize="13px">
              <Box p={3} bg="#f8fafc" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px">
                <Text fontWeight="700" color="#0f172a" mb={1}>Policy Summary</Text>
                <Text color="#64748b" fontSize="12px">
                  {selectedPolicy.description}
                </Text>
              </Box>

              <SimpleGrid columns={2} gap={3}>
                <Box p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px">
                  <Text fontSize="11px" color="#64748b" fontWeight="600">POLICY TYPE</Text>
                  <Text fontSize="14px" fontWeight="700" color="#0f172a" mt={1}>
                    {selectedPolicy.type}
                  </Text>
                </Box>
                <Box p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px">
                  <Text fontSize="11px" color="#64748b" fontWeight="600">LAST MODIFIED</Text>
                  <Text fontSize="14px" fontWeight="700" color="#0f172a" mt={1}>
                    {selectedPolicy.modified}
                  </Text>
                </Box>
                <Box p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px">
                  <Text fontSize="11px" color="#64748b" fontWeight="600">ACTIVE USERS</Text>
                  <Text fontSize="14px" fontWeight="700" color="#0869ff" mt={1}>
                    {selectedPolicy.usedByUsers} Users
                  </Text>
                </Box>
                <Box p={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px">
                  <Text fontSize="11px" color="#64748b" fontWeight="600">SCOPED ASSIGNMENTS</Text>
                  <Text fontSize="14px" fontWeight="700" color="#16a34a" mt={1}>
                    {selectedPolicy.scopedAssignmentsCount} Venues / Entities
                  </Text>
                </Box>
              </SimpleGrid>
            </VStack>
          )}
        </Box>
      </Flex>

      {/* 4. Create Policy Modal */}
      {isCreatePolicyOpen && (
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
            w="min(520px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.3)"
            p={6}
          >
            <Flex justify="space-between" align="center" pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
              <HStack gap={2}>
                <Box color="#0869ff">
                  <Icon name="shield" size={20} />
                </Box>
                <Text fontSize="16px" fontWeight="700" color="#0f172a">
                  Create new policy
                </Text>
              </HStack>
              <Button
                variant="plain"
                size="xs"
                p={1}
                cursor="pointer"
                onClick={onCloseCreatePolicy}
              >
                <Icon name="x" size={18} />
              </Button>
            </Flex>

            <VStack gap={3.5} align="stretch" mt={4}>
              <Box>
                <Text fontSize="12px" fontWeight="600" color="#64748b" mb={1}>
                  Policy Name <Box as="span" color="#ef4444">*</Box>
                </Text>
                <Input
                  placeholder="e.g. Venue Support Engineer"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  h="36px"
                  fontSize="13px"
                  borderRadius="4px"
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#64748b" mb={1}>
                  Description
                </Text>
                <Input
                  placeholder="Describe permitted capabilities and operations"
                  value={newPolicyDesc}
                  onChange={(e) => setNewPolicyDesc(e.target.value)}
                  h="36px"
                  fontSize="13px"
                  borderRadius="4px"
                />
              </Box>

              <Box>
                <Text fontSize="12px" fontWeight="600" color="#64748b" mb={1}>
                  Clone from preset
                </Text>
                <SelectDropdown
                  value={newPolicyPreset}
                  onChange={(val) => setNewPolicyPreset(String(val))}
                  options={['Network Operator', 'Installer', 'CSR', 'Read Only']}
                  w="100%"
                  h="36px"
                />
              </Box>
            </VStack>

            <Flex justify="flex-end" gap={2} mt={6} pt={3} borderTop="1px solid" borderColor={themeColors.panel.divider}>
              <Button
                variant="outline"
                size="sm"
                h="34px"
                px={4}
                onClick={onCloseCreatePolicy}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                h="34px"
                px={5}
                bg="#1a9c52"
                color="#ffffff"
                _hover={{ bg: '#15803d' }}
                fontWeight="600"
                onClick={() => {
                  if (!newPolicyName.trim()) return;
                  const newPol: PolicyItem = {
                    id: `pol-${Date.now()}`,
                    name: newPolicyName.trim(),
                    type: 'Custom',
                    usedByUsers: 0,
                    scopedAssignmentsCount: 0,
                    modified: 'Just now',
                    description: newPolicyDesc.trim() || 'Custom operator policy.',
                    permissions: [
                      { resource: 'Property', read: true, create: false, update: false, delete: false },
                      { resource: 'Venue', read: true, create: false, update: false, delete: false },
                      { resource: 'Device', read: true, create: false, update: true, delete: false },
                      { resource: 'Configuration', read: true, create: false, update: false, delete: false },
                      { resource: 'Configuration Profile', read: true, create: false, update: false, delete: false },
                    ],
                  };
                  setPolicies((prev) => [newPol, ...prev]);
                  setSelectedPolicyId(newPol.id);
                  setNewPolicyName('');
                  setNewPolicyDesc('');
                  if (onCloseCreatePolicy) onCloseCreatePolicy();
                }}
              >
                Create policy
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </VStack>
  );
};

export default PoliciesTab;
