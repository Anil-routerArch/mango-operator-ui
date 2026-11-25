import React, { useMemo, useState } from 'react';
import { Box, Button, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import type { PropertyScopeType, PropertyTreeNode } from '@/api';

interface Props {
  nodes: PropertyTreeNode[];
  selectedType?: PropertyScopeType;
  selectedId?: string;
  onSelect: (node: PropertyTreeNode) => void;
}

const TreeRow: React.FC<{
  node: PropertyTreeNode;
  depth: number;
  selectedType?: PropertyScopeType;
  selectedId?: string;
  expanded: Set<string>;
  toggle: (id: string) => void;
  onSelect: (node: PropertyTreeNode) => void;
}> = ({ node, depth, selectedType, selectedId, expanded, toggle, onSelect }) => {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const isSelected = node.id === selectedId && node.type === selectedType;
  return (
    <Box>
      <Flex
        align="center"
        gap={1}
        minH="38px"
        pl={`${8 + depth * 18}px`}
        pr={2}
        borderLeft={isSelected ? `3px solid ${themeColors.brand.accent}` : '3px solid transparent'}
        bg={isSelected ? themeColors.brand.accentLight : 'transparent'}
        _hover={{ bg: isSelected ? themeColors.brand.accentLight : themeColors.canvas.bg }}
      >
        <Button
          aria-label={isOpen ? 'Collapse scope' : 'Expand scope'}
          visibility={hasChildren ? 'visible' : 'hidden'}
          minW="24px"
          w="24px"
          h="24px"
          p={0}
          bg="transparent"
          onClick={() => toggle(node.id)}
        >
          <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14} />
        </Button>
        <Button
          flex="1"
          justifyContent="flex-start"
          h="34px"
          px={1}
          bg="transparent"
          color={themeColors.text.primary}
          fontSize="12px"
          fontWeight={isSelected ? '700' : '500'}
          overflow="hidden"
          onClick={() => onSelect(node)}
        >
          <Flex align="center" gap={2} minW={0}>
            <Icon name={node.type === 'property' ? 'building' : 'landmark'} size={15} />
            <Text truncate>{node.name || 'Unnamed scope'}</Text>
          </Flex>
        </Button>
      </Flex>
      {hasChildren && isOpen && node.children.map((child) => (
        <TreeRow
          key={`${child.type}-${child.id}`}
          node={child}
          depth={depth + 1}
          selectedType={selectedType}
          selectedId={selectedId}
          expanded={expanded}
          toggle={toggle}
          onSelect={onSelect}
        />
      ))}
    </Box>
  );
};

const filterTree = (nodes: PropertyTreeNode[], search: string): PropertyTreeNode[] => {
  if (!search.trim()) return nodes;
  const query = search.toLowerCase();
  return nodes.flatMap((node) => {
    const children = filterTree(node.children, search);
    if (node.name.toLowerCase().includes(query) || children.length > 0) {
      return [{ ...node, children }];
    }
    return [];
  });
};

export const PropertyHierarchy: React.FC<Props> = ({ nodes, selectedType, selectedId, onSelect }) => {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(nodes.map((n) => n.id)));
  const filtered = useMemo(() => filterTree(nodes, search), [nodes, search]);

  const toggle = (id: string) => setExpanded((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <Box
      w={{ base: '100%', lg: '300px' }}
      minW={{ lg: '300px' }}
      border="1px solid"
      borderColor={themeColors.panel.border}
      borderRadius="8px"
      bg={themeColors.panel.bg}
      overflow="hidden"
    >
      <Box p={3} borderBottom="1px solid" borderColor={themeColors.panel.divider}>
        <Text fontSize="13px" fontWeight="700" mb={2}>Property hierarchy</Text>
        <Flex position="relative" align="center">
          <Box position="absolute" left="10px" color={themeColors.text.muted} zIndex={1}>
            <Icon name="search" size={15} />
          </Box>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search properties or venues"
            pl="32px"
            h="36px"
            fontSize="12px"
          />
        </Flex>
      </Box>
      <VStack align="stretch" gap={0} py={1} maxH={{ base: '280px', lg: 'calc(100vh - 230px)' }} overflowY="auto">
        {filtered.length === 0 ? (
          <Text px={4} py={6} textAlign="center" fontSize="12px" color={themeColors.text.muted}>
            No matching authorized scope.
          </Text>
        ) : filtered.map((node) => (
          <TreeRow
            key={`${node.type}-${node.id}`}
            node={node}
            depth={0}
            selectedType={selectedType}
            selectedId={selectedId}
            expanded={search ? new Set(filtered.map((n) => n.id).concat(Array.from(expanded))) : expanded}
            toggle={toggle}
            onSelect={onSelect}
          />
        ))}
      </VStack>
    </Box>
  );
};
