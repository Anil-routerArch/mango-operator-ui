import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  VStack,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { themeColors } from '@/theme';
import {
  useGetManagementRoles,
  useCreateManagementRole,
  useUpdateManagementRole,
  useDeleteManagementRole,
  useGetEntities,
  useGetVenues,
  useGetManagementPolicies,
} from '@/api';
import type { User } from '@/types/user';
import type { ManagementRole, ManagementPolicy } from '@/types/managementRole';

// Helper: Parse policy entries into resource/access list
const getPolicyPermissions = (policy?: ManagementPolicy) => {
  if (!policy || !Array.isArray(policy.entries)) return [];
  const map: Record<string, string[]> = {};
  const resources: string[] = [];

  policy.entries.forEach((entry) => {
    const accesses = Array.isArray(entry.access)
      ? entry.access
      : entry.access
      ? [entry.access]
      : ['NOACCESS'];
    if (Array.isArray(entry.resources)) {
      entry.resources.forEach((res) => {
        const displayResource = res === 'device' ? 'inventory' : res;
        if (!resources.includes(displayResource)) {
          resources.push(displayResource);
        }
        if (!map[displayResource]) {
          map[displayResource] = [];
        }
        accesses.forEach((acc) => {
          if (!map[displayResource].includes(acc)) {
            map[displayResource].push(acc);
          }
        });
      });
    }
  });

  return resources.map((res) => ({
    resource: res,
    access: map[res] && map[res].length > 0 ? map[res].join(', ') : 'NOACCESS',
  }));
};

// Helper: Badge color by access type
const getAccessBadgeColor = (access: string) => {
  const upper = access.toUpperCase();
  if (upper.includes('FULL')) return { bg: '#e6fffa', text: '#234e52', border: '#b2f5ea' };
  if (upper.includes('UPDATE')) return { bg: '#faf5ff', text: '#553c9e', border: '#e9d8fd' };
  if (upper.includes('READ')) return { bg: '#ebf8ff', text: '#2a4365', border: '#bee3f8' };
  return { bg: '#edf2f7', text: '#4a5568', border: '#e2e8f0' };
};

export const UserScopedAccessTab: React.FC<{ user: User }> = ({ user }) => {
  // 1. Fetch live assignments and catalog from OWPROV (Port 16005)
  const { data: roles = [], isLoading: rolesLoading } = useGetManagementRoles(user.id);
  const { data: entities = [], isLoading: entitiesLoading } = useGetEntities();
  const { data: venues = [], isLoading: venuesLoading } = useGetVenues();
  const { data: policies = [], isLoading: policiesLoading } = useGetManagementPolicies();

  const createRoleMutation = useCreateManagementRole();
  const updateRoleMutation = useUpdateManagementRole();
  const deleteRoleMutation = useDeleteManagementRole();

  // 2. UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [selectedVenueIds, setSelectedVenueIds] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const venueDropdownRef = useRef<HTMLDivElement>(null);

  // Close venue dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (venueDropdownRef.current && !venueDropdownRef.current.contains(event.target as Node)) {
        setIsVenueDropdownOpen(false);
      }
    };
    if (isVenueDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVenueDropdownOpen]);
  
  // Edit & Delete State
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editPolicyId, setEditPolicyId] = useState('');
  const [roleToDelete, setRoleToDelete] = useState<ManagementRole | null>(null);
  const [inspectedPolicy, setInspectedPolicy] = useState<ManagementPolicy | null>(null);

  const isLoading = rolesLoading || entitiesLoading || venuesLoading || policiesLoading;

  // Filter venues by selected entity
  const filteredVenues = selectedEntity
    ? venues.filter((v) => v.entity === selectedEntity)
    : [];

  // Resolution helpers
  const getEntityName = (entityId?: string) => {
    if (!entityId) return 'Default Entity';
    const found = entities.find((e) => e.id === entityId);
    return found ? found.name : entityId;
  };

  const getVenueName = (venueId?: string) => {
    if (!venueId || venueId === '__entity_wide__') return 'Entity-wide (All Venues)';
    const found = venues.find((v) => v.id === venueId);
    return found ? found.name : venueId;
  };

  const getPolicy = (policyId?: string) => {
    return policies.find((p) => p.id === policyId);
  };

  const getPolicyName = (policyId?: string) => {
    if (!policyId) return 'No Policy';
    const found = policies.find((p) => p.id === policyId);
    return found ? found.name : policyId;
  };

  // Form options
  const entityOptions = entities.map((e) => ({ label: e.name, value: e.id }));
  const policyOptions = policies.map((p) => ({ label: p.name, value: p.id }));

  // Venue selection helpers matching owprov-ui behavior
  const venueSelectionLabel = () => {
    if (!selectedEntity) return 'Select entity first...';
    if (selectedVenueIds.length === 0) return 'Entity-wide (All Venues)';
    if (selectedVenueIds.length === 1) {
      return getVenueName(selectedVenueIds[0]);
    }
    return `${selectedVenueIds.length} venues selected`;
  };

  const setEntityWide = () => {
    setSelectedVenueIds([]);
  };

  const toggleVenueSelection = (venueId: string) => {
    setSelectedVenueIds((current) => {
      const next = current.includes(venueId)
        ? current.filter((id) => id !== venueId)
        : [...current, venueId];
      // AI-NOTE: Selecting all venues intentionally collapses the selection to an empty array [],
      // which is submitted and rendered as Entity-wide scope per API v2.1 specifications.
      if (filteredVenues.length > 0 && filteredVenues.every((v) => next.includes(v.id))) {
        return [];
      }
      return next;
    });
  };

  // Handle Create Scope Assignment via V2 API
  const handleCreate = () => {
    if (!selectedEntity || !selectedPolicy) return;
    setCreateError(null);

    const payload = {
      name: `Policy-${Math.random().toString(36).substring(2, 10)}`,
      description: 'User scoped policy assignment',
      managementPolicy: selectedPolicy,
      users: [user.id],
      entity: selectedEntity,
      venueIds: selectedVenueIds, // sends [] for Entity-wide or ['venueId1', 'venueId2']
    };

    createRoleMutation.mutate(payload, {
      onSuccess: () => {
        setSelectedEntity('');
        setSelectedVenueIds([]);
        setSelectedPolicy('');
        setIsVenueDropdownOpen(false);
        setShowAddForm(false);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.ErrorDescription || err?.message || 'Failed to assign policy scope.';
        setCreateError(msg);
      },
    });
  };

  // Handle Update Assigned Policy
  const handleUpdate = (role: ManagementRole) => {
    if (!editPolicyId) return;
    updateRoleMutation.mutate(
      {
        id: role.id,
        managementPolicy: editPolicyId,
      },
      {
        onSuccess: () => {
          setEditingRoleId(null);
          setEditPolicyId('');
        },
      }
    );
  };

  // Handle Delete Assigned Scope
  const handleDelete = () => {
    if (!roleToDelete) return;
    deleteRoleMutation.mutate(roleToDelete.id, {
      onSuccess: () => {
        setRoleToDelete(null);
      },
    });
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="240px" direction="column" gap={3}>
        <Spinner size="md" color={themeColors.brand.primary} />
        <Text fontSize="13px" color={themeColors.text.secondary}>
          Loading scoped access policies from OpenWiFi...
        </Text>
      </Flex>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Header bar */}
      <Flex justify="space-between" align="center">
        <Box>
          <HStack gap={2}>
            <Text fontSize="14px" fontWeight="600" color={themeColors.text.title}>
              Scoped Access & Policies
            </Text>
            <Badge colorScheme="blue" variant="subtle" fontSize="11px" px={2} borderRadius="4px">
              {roles.length} {roles.length === 1 ? 'assignment' : 'assignments'}
            </Badge>
          </HStack>
          <Text fontSize="12px" color={themeColors.text.secondary} mt={0.5}>
            Determine which entities, venues, and policy permissions apply to this user.
          </Text>
        </Box>

        {!showAddForm && (
          <Button
            size="xs"
            bg={themeColors.brand.primary}
            color="#ffffff"
            _hover={{ bg: themeColors.brand.primaryHover }}
            onClick={() => {
              if (entities.length > 0 && !selectedEntity) {
                setSelectedEntity(entities[0].id);
              }
              setSelectedVenueIds([]);
              if (policies.length > 0 && !selectedPolicy) {
                setSelectedPolicy(policies[0].id);
              }
              setCreateError(null);
              setShowAddForm(true);
            }}
            cursor="pointer"
            h="28px"
            px={2.5}
          >
            <HStack gap={1.5}>
              <Icon name="plus" size={13} />
              <Text fontSize="12px" fontWeight="600">Assign Scope</Text>
            </HStack>
          </Button>
        )}
      </Flex>

      {/* Root/Admin Platform Capabilities Banner */}
      {(user.userRole === 'root' || user.userRole === 'admin') && (
        <Flex
          p={3}
          borderRadius="6px"
          bg="#f0f7ff"
          border="1px solid #c2dcff"
          align="flex-start"
          gap={2.5}
        >
          <Box color={themeColors.brand.accent} mt="1px">
            <Icon name="shield" size={16} />
          </Box>
          <Box fontSize="12px">
            <Text fontWeight="600" color={themeColors.brand.accent}>
              Platform-Level {user.userRole.toUpperCase()} Access
            </Text>
            <Text color={themeColors.text.secondary} mt={0.5}>
              This user possesses platform-wide {user.userRole} credentials. Additional scoped roles below apply explicit policy limits when operating in tenant entity or venue contexts.
            </Text>
          </Box>
        </Flex>
      )}

      {/* Assign New Scope Form */}
      {showAddForm && (
        <Box
          p={4}
          borderRadius="6px"
          bg="#f8fafc"
          border="1px solid"
          borderColor={themeColors.brand.accent}
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.04)"
        >
          <Text fontSize="13px" fontWeight="700" color={themeColors.text.title} mb={3}>
            Assign New Entity or Venue Scope
          </Text>

          {createError && (
            <Flex
              p={2.5}
              mb={3}
              borderRadius="4px"
              bg="#fff5f5"
              border="1px solid #feb2b2"
              color={themeColors.status.error.text}
              fontSize="12px"
              align="center"
              justify="space-between"
            >
              <Text>{createError}</Text>
              <Button
                variant="plain"
                size="xs"
                p={0.5}
                color={themeColors.status.error.text}
                cursor="pointer"
                onClick={() => setCreateError(null)}
              >
                <Icon name="x" size={14} />
              </Button>
            </Flex>
          )}

          <Flex gap={3} wrap="wrap" align="flex-start" mb={3}>
            {/* Entity Selector */}
            <Box flex="1" minW="180px">
              <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary} mb={1}>
                Entity <Box as="span" color={themeColors.text.required}>*</Box>
              </Text>
              <SelectDropdown
                value={selectedEntity}
                onChange={(val) => {
                  setSelectedEntity(String(val));
                  setSelectedVenueIds([]);
                  setIsVenueDropdownOpen(false);
                }}
                options={entityOptions}
                placeholder="Select Entity..."
                w="100%"
                h="36px"
              />
            </Box>

            {/* Venue Boundary Selector (Multi-Select) */}
            <Box flex="1.2" minW="220px" position="relative" ref={venueDropdownRef}>
              <Flex justify="space-between" align="center" mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  Venue Boundary
                </Text>
                {selectedVenueIds.length > 0 && (
                  <Button
                    variant="plain"
                    p={0}
                    h="auto"
                    fontSize="11px"
                    color={themeColors.brand.accent}
                    cursor="pointer"
                    onClick={setEntityWide}
                  >
                    Reset to Entity-wide
                  </Button>
                )}
              </Flex>

              {/* Custom Multi-Select Trigger */}
              <Flex
                align="center"
                justify="space-between"
                h="36px"
                px={3}
                bg={!selectedEntity ? '#f1f5f9' : '#ffffff'}
                border="1px solid"
                borderColor={
                  isVenueDropdownOpen
                    ? themeColors.brand.accent
                    : themeColors.panel.border
                }
                borderRadius="4px"
                cursor={!selectedEntity ? 'not-allowed' : 'pointer'}
                opacity={!selectedEntity ? 0.6 : 1}
                boxShadow={
                  isVenueDropdownOpen
                    ? `0 0 0 1px ${themeColors.brand.accent}`
                    : undefined
                }
                onClick={() => {
                  if (selectedEntity) {
                    setIsVenueDropdownOpen((prev) => !prev);
                  }
                }}
                transition="border-color 0.15s ease, box-shadow 0.15s ease"
              >
                <HStack gap={2} minW={0} flex="1">
                  <Text
                    fontSize="13px"
                    lineClamp={1}
                    color={
                      !selectedEntity
                        ? themeColors.text.muted
                        : selectedVenueIds.length === 0
                        ? themeColors.text.primary
                        : themeColors.brand.accent
                    }
                    fontWeight={selectedVenueIds.length > 0 ? '600' : '400'}
                  >
                    {venueSelectionLabel()}
                  </Text>
                  {selectedVenueIds.length > 0 && (
                    <Badge
                      colorScheme="blue"
                      variant="subtle"
                      fontSize="10px"
                      px={1.5}
                      borderRadius="3px"
                    >
                      {selectedVenueIds.length}
                    </Badge>
                  )}
                </HStack>
                <Box
                  transform={isVenueDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                  transition="transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  color={themeColors.text.muted}
                  ml={2}
                >
                  <Icon name="chevronDown" size={14} />
                </Box>
              </Flex>

              {/* Multi-Select Dropdown Menu */}
              {isVenueDropdownOpen && selectedEntity && (
                <Box
                  position="absolute"
                  top="calc(100% + 4px)"
                  left={0}
                  right={0}
                  minW="280px"
                  bg="#ffffff"
                  border="1px solid"
                  borderColor={themeColors.panel.border}
                  borderRadius="6px"
                  boxShadow="0 8px 24px rgba(0, 0, 0, 0.12)"
                  zIndex={2100}
                  overflow="hidden"
                >
                  <Box p={1.5} maxH="260px" overflowY="auto">
                    {/* Option 1: Entity-wide */}
                    <Flex
                      align="center"
                      gap={2.5}
                      p={2}
                      borderRadius="4px"
                      cursor="pointer"
                      _hover={{ bg: '#f1f5f9' }}
                      onClick={setEntityWide}
                    >
                      <Flex
                        align="center"
                        justify="center"
                        w="16px"
                        h="16px"
                        borderRadius="3px"
                        border="1px solid"
                        borderColor={
                          selectedVenueIds.length === 0
                            ? themeColors.brand.accent
                            : '#cbd5e1'
                        }
                        bg={
                          selectedVenueIds.length === 0
                            ? themeColors.brand.accent
                            : '#ffffff'
                        }
                        color="#ffffff"
                        flexShrink={0}
                        transition="all 0.15s ease"
                      >
                        {selectedVenueIds.length === 0 && (
                          <Icon name="check" size={11} color="#ffffff" />
                        )}
                      </Flex>
                      <Box minW={0} flex="1">
                        <HStack justify="space-between">
                          <Text fontSize="12px" fontWeight="600" color={themeColors.text.title}>
                            Entity-wide
                          </Text>
                          <Badge fontSize="10px" colorScheme="purple" variant="subtle" px={1.5}>
                            Default
                          </Badge>
                        </HStack>
                        <Text fontSize="11px" color={themeColors.text.secondary}>
                          Applies to all venues under this entity
                        </Text>
                      </Box>
                    </Flex>

                    {/* Divider */}
                    <Box
                      h="1px"
                      bg={themeColors.panel.divider}
                      my={1.5}
                      mx={1}
                    />

                    {/* Specific Venues Header */}
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      textTransform="uppercase"
                      color={themeColors.text.muted}
                      px={2}
                      py={1}
                      letterSpacing="0.5px"
                    >
                      Specific Venues ({filteredVenues.length})
                    </Text>

                    {filteredVenues.length === 0 ? (
                      <Box px={2} py={2} textAlign="center">
                        <Text fontSize="11px" color={themeColors.text.muted}>
                          No venues configured for this entity.
                        </Text>
                        <Text fontSize="10px" color={themeColors.text.muted} mt={0.5}>
                          (Role will apply Entity-wide)
                        </Text>
                      </Box>
                    ) : (
                      filteredVenues.map((v) => {
                        const isChecked = selectedVenueIds.includes(v.id);
                        return (
                          <Flex
                            key={v.id}
                            align="center"
                            gap={2.5}
                            p={2}
                            borderRadius="4px"
                            cursor="pointer"
                            _hover={{ bg: '#f1f5f9' }}
                            onClick={() => toggleVenueSelection(v.id)}
                          >
                            <Flex
                              align="center"
                              justify="center"
                              w="16px"
                              h="16px"
                              borderRadius="3px"
                              border="1px solid"
                              borderColor={
                                isChecked ? themeColors.brand.accent : '#cbd5e1'
                              }
                              bg={
                                isChecked ? themeColors.brand.accent : '#ffffff'
                              }
                              color="#ffffff"
                              flexShrink={0}
                              transition="all 0.15s ease"
                            >
                              {isChecked && (
                                <Icon name="check" size={11} color="#ffffff" />
                              )}
                            </Flex>
                            <Box minW={0} flex="1">
                              <Text
                                fontSize="12px"
                                fontWeight={isChecked ? '600' : '400'}
                                color={
                                  isChecked
                                    ? themeColors.brand.accent
                                    : themeColors.text.title
                                }
                                lineClamp={1}
                              >
                                {v.name}
                              </Text>
                              {v.description && (
                                <Text fontSize="10px" color={themeColors.text.muted} lineClamp={1}>
                                  {v.description}
                                </Text>
                              )}
                            </Box>
                          </Flex>
                        );
                      })
                    )}
                  </Box>

                  {/* Dropdown footer summary */}
                  <Flex
                    px={3}
                    py={2}
                    bg="#f8fafc"
                    borderTop="1px solid"
                    borderColor={themeColors.panel.divider}
                    justify="space-between"
                    align="center"
                  >
                    <Text fontSize="11px" color={themeColors.text.secondary}>
                      {selectedVenueIds.length === 0
                        ? 'Entity-wide scope'
                        : `${selectedVenueIds.length} of ${filteredVenues.length} selected`}
                    </Text>
                    <Button
                      size="xs"
                      variant="plain"
                      h="22px"
                      fontSize="11px"
                      color={themeColors.brand.accent}
                      onClick={() => setIsVenueDropdownOpen(false)}
                    >
                      Done
                    </Button>
                  </Flex>
                </Box>
              )}

              {/* Selected venue chips / badges when specific venues are chosen */}
              {selectedVenueIds.length > 0 && (
                <Flex wrap="wrap" gap={1.5} mt={2}>
                  {selectedVenueIds.map((vid) => (
                    <Badge
                      key={vid}
                      variant="subtle"
                      colorScheme="blue"
                      fontSize="10px"
                      py={0.5}
                      px={1.5}
                      borderRadius="3px"
                    >
                      <HStack gap={1}>
                        <Text lineClamp={1}>{getVenueName(vid)}</Text>
                        <Box
                          as="span"
                          cursor="pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVenueSelection(vid);
                          }}
                          color={themeColors.text.secondary}
                          _hover={{ color: themeColors.status.error.text }}
                        >
                          <Icon name="x" size={10} />
                        </Box>
                      </HStack>
                    </Badge>
                  ))}
                </Flex>
              )}
            </Box>

            {/* Policy Selector */}
            <Box flex="1.2" minW="220px">
              <HStack justify="space-between" mb={1}>
                <Text fontSize="11px" fontWeight="600" color={themeColors.text.secondary}>
                  Management Policy <Box as="span" color={themeColors.text.required}>*</Box>
                </Text>
                {selectedPolicy && (
                  <Button
                    variant="plain"
                    p={0}
                    h="auto"
                    fontSize="11px"
                    color={themeColors.brand.accent}
                    cursor="pointer"
                    onClick={() => setInspectedPolicy(getPolicy(selectedPolicy) || null)}
                  >
                    <HStack gap={1}>
                      <Icon name="info" size={12} />
                      <Text>View permissions</Text>
                    </HStack>
                  </Button>
                )}
              </HStack>
              <SelectDropdown
                value={selectedPolicy}
                onChange={(val) => setSelectedPolicy(String(val))}
                options={policyOptions}
                placeholder="Select Policy..."
                w="100%"
                h="36px"
              />
            </Box>
          </Flex>

          <Flex justify="flex-end" gap={2}>
            <Button
              variant="outline"
              size="xs"
              h="30px"
              px={3}
              onClick={() => {
                setShowAddForm(false);
                setIsVenueDropdownOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="xs"
              h="30px"
              px={4}
              bg={themeColors.brand.primary}
              color="#ffffff"
              _hover={{ bg: themeColors.brand.primaryHover }}
              onClick={handleCreate}
              disabled={createRoleMutation.isPending || !selectedEntity || !selectedPolicy}
            >
              {createRoleMutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </Button>
          </Flex>
        </Box>
      )}

      {/* Scoped Roles List */}
      {roles.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          p={8}
          border="1px dashed"
          borderColor={themeColors.panel.border}
          borderRadius="6px"
          bg="#ffffff"
          gap={2}
        >
          <Box color={themeColors.text.muted}>
            <Icon name="building" size={32} />
          </Box>
          <Text fontSize="13px" fontWeight="600" color={themeColors.text.secondary}>
            No scoped policies assigned to this user
          </Text>
          <Text fontSize="11px" color={themeColors.text.muted} textAlign="center" maxW="360px">
            By assigning an entity or venue scope, you can grant this user granular permissions according to an access policy.
          </Text>
        </Flex>
      ) : (
        <Box border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" overflow="hidden" bg="#ffffff">
          {/* Table Header */}
          <Flex
            bg="#f8fafc"
            borderBottom="1px solid"
            borderColor={themeColors.panel.border}
            py={2.5}
            px={3}
            fontSize="11px"
            fontWeight="700"
            color={themeColors.text.secondary}
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            <Box flex="1.5">Entity Scope</Box>
            <Box flex="1.5">Venue Boundary</Box>
            <Box flex="1.8">Assigned Policy</Box>
            <Box w="80px" textAlign="right">Actions</Box>
          </Flex>

          {/* Table Rows */}
          {roles.map((role) => {
            const isEditingThis = editingRoleId === role.id;
            const policyObj = getPolicy(role.managementPolicy);
            const isEntityWide = !role.venue || role.venue === '';

            return (
              <Flex
                key={role.id}
                align="center"
                py={3}
                px={3}
                borderBottom="1px solid"
                borderColor={themeColors.panel.divider}
                fontSize="12px"
                _last={{ borderBottom: 'none' }}
                _hover={{ bg: '#fbfdff' }}
                transition="background 0.15s ease"
              >
                {/* Entity */}
                <HStack flex="1.5" gap={2} minW={0} pr={2}>
                  <Box color={themeColors.brand.accent} flexShrink={0}>
                    <Icon name="building" size={16} />
                  </Box>
                  <Text fontWeight="600" color={themeColors.text.title} lineClamp={1}>
                    {getEntityName(role.entity)}
                  </Text>
                </HStack>

                {/* Venue Boundary */}
                <Box flex="1.5" pr={2}>
                  {isEntityWide ? (
                    <Box
                      as="span"
                      fontSize="10px"
                      fontWeight="600"
                      px="8px"
                      py="2px"
                      borderRadius="12px"
                      bg="#e6fffa"
                      color="#234e52"
                      border="1px solid #b2f5ea"
                    >
                      Entity-wide
                    </Box>
                  ) : (
                    <Text color={themeColors.text.primary} lineClamp={1}>
                      {getVenueName(role.venue)}
                    </Text>
                  )}
                </Box>

                {/* Policy */}
                <Box flex="1.8" pr={2}>
                  {isEditingThis ? (
                    <HStack gap={1}>
                      <SelectDropdown
                        value={editPolicyId}
                        onChange={(val) => setEditPolicyId(String(val))}
                        options={policyOptions}
                        w="160px"
                        h="30px"
                        fontSize="12px"
                      />
                      <Button
                        size="xs"
                        h="30px"
                        bg={themeColors.brand.primary}
                        color="#ffffff"
                        onClick={() => handleUpdate(role)}
                        disabled={updateRoleMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="xs"
                        h="30px"
                        variant="ghost"
                        onClick={() => setEditingRoleId(null)}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  ) : (
                    <HStack gap={2}>
                      <Box
                        as="span"
                        fontSize="11px"
                        fontWeight="600"
                        px="8px"
                        py="1px"
                        borderRadius="12px"
                        bg="#f1f5f9"
                        color={themeColors.text.primary}
                        border="1px solid"
                        borderColor={themeColors.panel.border}
                      >
                        {getPolicyName(role.managementPolicy)}
                      </Box>
                      {policyObj && (
                        <Button
                          variant="plain"
                          p={0}
                          h="auto"
                          color={themeColors.text.muted}
                          _hover={{ color: themeColors.brand.accent }}
                          cursor="pointer"
                          onClick={() => setInspectedPolicy(policyObj)}
                          title="Inspect policy permissions"
                        >
                          <Icon name="info" size={14} />
                        </Button>
                      )}
                    </HStack>
                  )}
                </Box>

                {/* Actions */}
                <HStack w="80px" justify="flex-end" gap={1}>
                  {!isEditingThis && (
                    <>
                      <Button
                        variant="plain"
                        size="xs"
                        p={1}
                        h="28px"
                        w="28px"
                        color={themeColors.text.secondary}
                        _hover={{ color: themeColors.brand.accent }}
                        cursor="pointer"
                        onClick={() => {
                          setEditingRoleId(role.id);
                          setEditPolicyId(role.managementPolicy);
                        }}
                        title="Change policy"
                      >
                        <Icon name="edit" size={14} />
                      </Button>
                      <Button
                        variant="plain"
                        size="xs"
                        p={1}
                        h="28px"
                        w="28px"
                        color={themeColors.status.error.text}
                        _hover={{ color: '#c53030' }}
                        cursor="pointer"
                        onClick={() => setRoleToDelete(role)}
                        title="Revoke access"
                      >
                        <Icon name="trash" size={14} />
                      </Button>
                    </>
                  )}
                </HStack>
              </Flex>
            );
          })}
        </Box>
      )}

      {/* Modal 1: Policy Permissions Inspector */}
      {inspectedPolicy && (
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
            w="min(500px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.3)"
            p={5}
          >
            <Flex justify="space-between" align="center" pb={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
              <HStack gap={2}>
                <Box color={themeColors.brand.primary}>
                  <Icon name="shield" size={18} />
                </Box>
                <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                  Policy: {inspectedPolicy.name}
                </Text>
              </HStack>
              <Button
                variant="plain"
                size="xs"
                p={1}
                cursor="pointer"
                onClick={() => setInspectedPolicy(null)}
              >
                <Icon name="x" size={16} />
              </Button>
            </Flex>

            {inspectedPolicy.description && (
              <Text fontSize="12px" color={themeColors.text.secondary} my={3}>
                {inspectedPolicy.description}
              </Text>
            )}

            <Box mt={3} border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" overflow="hidden">
              <Flex bg="#f8fafc" py={2} px={3} fontSize="11px" fontWeight="700" color={themeColors.text.secondary} borderBottom="1px solid" borderColor={themeColors.panel.border}>
                <Box flex="1.5">Resource</Box>
                <Box flex="1.5">Permitted Access</Box>
              </Flex>
              {getPolicyPermissions(inspectedPolicy).map((perm) => {
                const badge = getAccessBadgeColor(perm.access);
                return (
                  <Flex
                    key={perm.resource}
                    py={2}
                    px={3}
                    borderBottom="1px solid"
                    borderColor={themeColors.panel.divider}
                    _last={{ borderBottom: 'none' }}
                    align="center"
                    fontSize="12px"
                  >
                    <Box flex="1.5" fontWeight="600" textTransform="capitalize" color={themeColors.text.title}>
                      {perm.resource}
                    </Box>
                    <Box flex="1.5">
                      <Box
                        as="span"
                        fontSize="10px"
                        fontWeight="700"
                        px="8px"
                        py="2px"
                        borderRadius="10px"
                        bg={badge.bg}
                        color={badge.text}
                        border={`1px solid ${badge.border}`}
                      >
                        {perm.access}
                      </Box>
                    </Box>
                  </Flex>
                );
              })}
            </Box>

            <Flex justify="flex-end" mt={4}>
              <Button
                size="xs"
                h="30px"
                px={4}
                bg={themeColors.brand.primary}
                color="#ffffff"
                onClick={() => setInspectedPolicy(null)}
              >
                Close
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Modal 2: Revoke Scope Confirmation Dialog */}
      {roleToDelete && (
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
            w="min(440px, 95vw)"
            bg="#ffffff"
            borderRadius="8px"
            boxShadow="0 20px 50px rgba(0,0,0,0.3)"
            p={5}
          >
            <Flex justify="space-between" align="center" mb={2}>
              <HStack gap={2}>
                <Box color={themeColors.status.error.text}>
                  <Icon name="trash" size={18} />
                </Box>
                <Text fontSize="15px" fontWeight="700" color={themeColors.text.title}>
                  Revoke Scoped Access
                </Text>
              </HStack>
              <Button
                variant="plain"
                size="xs"
                p={1}
                cursor="pointer"
                onClick={() => setRoleToDelete(null)}
              >
                <Icon name="x" size={16} />
              </Button>
            </Flex>

            <Text fontSize="12px" color={themeColors.text.secondary} mb={3}>
              Are you sure you want to revoke this scoped role assignment? The user will immediately lose policy permissions on this entity/venue.
            </Text>

            <Box p={3} bg="#f8fafc" border="1px solid" borderColor={themeColors.panel.border} borderRadius="6px" fontSize="12px" mb={4}>
              <Text><b>Entity:</b> {getEntityName(roleToDelete.entity)}</Text>
              <Text mt={1}><b>Venue:</b> {getVenueName(roleToDelete.venue)}</Text>
              <Text mt={1}><b>Policy:</b> {getPolicyName(roleToDelete.managementPolicy)}</Text>
            </Box>

            <Flex justify="flex-end" gap={2}>
              <Button
                variant="outline"
                size="xs"
                h="30px"
                px={3}
                onClick={() => setRoleToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                h="30px"
                px={4}
                bg={themeColors.status.error.text}
                color="#ffffff"
                _hover={{ bg: '#c53030' }}
                onClick={handleDelete}
                disabled={deleteRoleMutation.isPending}
              >
                {deleteRoleMutation.isPending ? 'Revoking...' : 'Revoke Access'}
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </VStack>
  );
};

export default UserScopedAccessTab;
