import React, { useState } from 'react';
import { Box, Flex, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import { GeneralInfoCard } from '../GeneralInfoCard';
import { SingleInterface } from './SingleInterface';
import { CreateInterfaceModal } from './CreateInterfaceModal';
import { ManageEthernetPortsModal } from './ManageEthernetPortsModal';
import { createNewInterface } from './interfacesConstants';
import type {
  InterfaceEthernetItem,
  InterfacesSectionData,
  SingleInterfaceConfigItem,
} from '../types';

export interface InterfacesSectionProps {
  data: InterfacesSectionData;
  onChange: (data: InterfacesSectionData) => void;
  onDeleteSection: () => void;
  disabled?: boolean;
  isDefaultConfig?: boolean;
}

export const InterfacesSection: React.FC<InterfacesSectionProps> = ({
  data,
  onChange,
  onDeleteSection,
  disabled = false,
  isDefaultConfig = false,
}) => {
  const [selectedIfaceId, setSelectedIfaceId] = useState<string>(
    () => data.interfaces[0]?.id || ''
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [activeEthernetIndex, setActiveEthernetIndex] = useState<number | null>(null);

  const activeIface =
    data.interfaces.find((i) => i.id === selectedIfaceId) || data.interfaces[0];

  const handleUpdateActiveIface = (updated: SingleInterfaceConfigItem) => {
    onChange({
      ...data,
      interfaces: data.interfaces.map((i) => (i.id === updated.id ? updated : i)),
    });
  };

  const handleCreateInterface = ({
    name,
    role,
  }: {
    name: string;
    role: 'upstream' | 'downstream';
  }) => {
    const newIface = createNewInterface(name, role);
    onChange({
      ...data,
      interfaces: [...data.interfaces, newIface],
    });
    setSelectedIfaceId(newIface.id);
  };

  const handleDeleteInterface = (id: string) => {
    const filtered = data.interfaces.filter((i) => i.id !== id);
    onChange({
      ...data,
      interfaces: filtered,
    });
    if (selectedIfaceId === id) {
      setSelectedIfaceId(filtered[0]?.id || '');
    }
  };

  const handleSaveEthernet = (ethernet: InterfaceEthernetItem[]) => {
    if (!activeIface) return;
    const allPorts = Array.from(new Set(ethernet.flatMap((e) => e.selectPorts)));
    const updated: SingleInterfaceConfigItem = {
      ...activeIface,
      ethernet,
      selectPorts: allPorts.length > 0 ? allPorts : activeIface.selectPorts,
    };
    handleUpdateActiveIface(updated);
  };

  const activeIdx = activeIface ? data.interfaces.indexOf(activeIface) : 0;

  return (
    <>
      <VStack gap={4} align="stretch">
        {/* General Information Card */}
        <GeneralInfoCard
          meta={data.meta}
          onChange={(meta) => onChange({ ...data, meta })}
          onDeleteSection={onDeleteSection}
          disabled={disabled}
          isDefaultConfig={isDefaultConfig}
        />

        {/* If no interfaces created yet: show "Add Interface +" button as in Image 1 */}
        {data.interfaces.length === 0 ? (
          <Box textAlign="center" py={4}>
            {!disabled && (
              <Box
                as="button"
                px={6}
                py={2.5}
                borderRadius="4px"
                bg="#2563eb"
                color="#ffffff"
                fontSize="14px"
                fontWeight="600"
                cursor="pointer"
                _hover={{ bg: '#1d4ed8' }}
                onClick={() => setIsAddModalOpen(true)}
              >
                Add Interface +
              </Box>
            )}
          </Box>
        ) : (
          /* If interfaces exist: show interface tabs and active interface card as in Image 2 */
          <Box
            border="1px solid"
            borderColor={themeColors.panel.border}
            borderRadius="8px"
            bg="#ffffff"
            overflow="hidden"
          >
            {/* Interface Tabs Bar */}
            <Flex
              px={3}
              pt={2}
              bg="#f8fafc"
              borderBottom="1px solid"
              borderColor={themeColors.panel.divider}
              align="center"
              gap={1}
              overflowX="auto"
            >
              {data.interfaces.map((iface) => {
                const isTabActive = activeIface?.id === iface.id;
                return (
                  <Box
                    key={iface.id}
                    as="button"
                    px={3.5}
                    py={2}
                    fontSize="12px"
                    fontWeight="700"
                    cursor="pointer"
                    borderTop="2px solid"
                    borderColor={isTabActive ? themeColors.brand.accent : 'transparent'}
                    color={isTabActive ? themeColors.brand.accent : themeColors.text.secondary}
                    bg={isTabActive ? '#ffffff' : 'transparent'}
                    borderRadius="4px 4px 0 0"
                    borderLeft={isTabActive ? '1px solid' : 'none'}
                    borderRight={isTabActive ? '1px solid' : 'none'}
                    borderLeftColor={themeColors.panel.divider}
                    borderRightColor={themeColors.panel.divider}
                    onClick={() => setSelectedIfaceId(iface.id)}
                  >
                    {iface.name} ({iface.role})
                  </Box>
                );
              })}

              {!disabled && (
                <Box
                  as="button"
                  w="26px"
                  h="26px"
                  borderRadius="4px"
                  bg="#2563eb"
                  color="#ffffff"
                  display="grid"
                  placeItems="center"
                  cursor="pointer"
                  _hover={{ bg: '#1d4ed8' }}
                  onClick={() => setIsAddModalOpen(true)}
                  title="Add Interface"
                  ml={1}
                >
                  <Icon name="plus" size={14} />
                </Box>
              )}
            </Flex>

            {/* Active Interface Body */}
            {activeIface && (
              <SingleInterface
                iface={activeIface}
                onChange={handleUpdateActiveIface}
                onDelete={handleDeleteInterface}
                onManageEthernetPorts={() => setActiveEthernetIndex(activeIdx)}
                canDelete={true}
                disabled={disabled}
                isDefaultConfig={isDefaultConfig}
              />
            )}
          </Box>
        )}
      </VStack>

      {/* Add Interface Modal */}
      <CreateInterfaceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={handleCreateInterface}
        disabled={disabled}
      />

      {/* Manage Ethernet Ports Modal */}
      <ManageEthernetPortsModal
        isOpen={activeEthernetIndex !== null}
        interfaceIndex={activeEthernetIndex ?? 0}
        interfaceName={activeIface?.name || 'configuration'}
        ethernet={activeIface?.ethernet || []}
        onClose={() => setActiveEthernetIndex(null)}
        onSave={handleSaveEthernet}
        disabled={disabled}
      />
    </>
  );
};
