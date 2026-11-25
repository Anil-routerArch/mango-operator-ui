import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { Box, Button, Flex, Spinner, Text, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icons/Icon';
import { themeColors } from '@/theme';
import {
  ROOT_PROPERTY_ID,
  usePropertyMap,
  type PropertyMapNode,
  type PropertyTreeNode,
} from '@/api';

export interface PropertyTreeMapProps {
  nodes: PropertyTreeNode[];
  selected?: PropertyTreeNode;
  onSelect: (node: PropertyTreeNode) => void;
  onOpen?: (node: PropertyTreeNode) => void;
}

interface MapGraphNode {
  id: string;
  type: 'root' | 'entity' | 'venue' | 'device';
  name: string;
  serialNumber?: string;
  deviceCount: number;
  availability?: 'online' | 'offline' | 'unknown';
  originalNode?: PropertyTreeNode;
  children: MapGraphNode[];
  x: number;
  y: number;
  width: number;
  height: number;
  subtreeWidth: number;
}

interface MapGraphEdge {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const NODE_WIDTH = 196;
const NODE_HEIGHT = 56;
const GAP_X = 28;
const GAP_Y = 64;

export const PropertyTreeMap: React.FC<PropertyTreeMapProps> = ({
  nodes,
  selected,
  onSelect,
  onOpen,
}) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const { data: mapData, isLoading: mapLoading, isError: mapError } = usePropertyMap(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Canvas pan & zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const [hasAutoFitted, setHasAutoFitted] = useState(false);

  // Flatten nodes from portfolio tree for quick lookup
  const portfolioNodeMap = useMemo(() => {
    const map = new Map<string, PropertyTreeNode>();
    const walk = (items: PropertyTreeNode[]) => {
      for (const item of items) {
        map.set(`${item.type}-${item.id}`, item);
        map.set(item.id, item);
        if (item.children) walk(item.children);
      }
    };
    walk(nodes);
    return map;
  }, [nodes]);

  // Build the hierarchical tree structure
  const { allNodes, allEdges, graphBounds } = useMemo(() => {
    const buildFromMap = (raw: PropertyMapNode): MapGraphNode => {
      const type: MapGraphNode['type'] = raw.id === ROOT_PROPERTY_ID
        ? 'root'
        : raw.type === 'property'
        ? 'entity'
        : 'venue';

      // Look up matching portfolio summary for device counts
      const matchedPortfolio = portfolioNodeMap.get(raw.id);
      const summaryCount = matchedPortfolio?.summary?.totalDevices;

      const childrenNodes: MapGraphNode[] = [];

      for (const child of raw.children || []) {
        childrenNodes.push(buildFromMap(child));
      }

      // Add devices assigned directly to this scope
      for (const device of raw.devices || []) {
        const serial = device.serialNumber;
        childrenNodes.push({
          id: `device/${serial}`,
          type: 'device',
          name: serial,
          serialNumber: serial,
          deviceCount: 0,
          availability: device.availability,
          children: [],
          x: 0,
          y: 0,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          subtreeWidth: NODE_WIDTH,
        });
      }

      // Compute total device count
      const countDevices = (c: MapGraphNode): number => {
        if (c.type === 'device') return 1;
        return c.children.reduce((acc, sub) => acc + countDevices(sub), 0);
      };
      const computedCount = summaryCount ?? childrenNodes.reduce(
        (acc, sub) => acc + countDevices(sub),
        0
      );

      const originalNode: PropertyTreeNode = matchedPortfolio || {
        id: raw.id,
        name: raw.name || raw.id,
        type: raw.type,
        children: [],
      };

      return {
        id: `${raw.type}/${raw.id}`,
        type,
        name: raw.name || raw.id,
        deviceCount: computedCount,
        originalNode,
        children: childrenNodes,
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        subtreeWidth: NODE_WIDTH,
      };
    };

    // Fallback: keep scope navigation usable when map inventory is unavailable.
    const buildFromPortfolio = (
      pNode: PropertyTreeNode,
      isRootNode: boolean
    ): MapGraphNode => {
      const type: MapGraphNode['type'] = isRootNode
        ? 'root'
        : pNode.type === 'property'
        ? 'entity'
        : 'venue';

      const childNodes = (pNode.children || []).map((c) =>
        buildFromPortfolio(c, false)
      );

      return {
        id: `${pNode.type}/${pNode.id}`,
        type,
        name: pNode.name,
        deviceCount: pNode.summary?.totalDevices ?? 0,
        originalNode: pNode,
        children: childNodes,
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        subtreeWidth: NODE_WIDTH,
      };
    };

    let rootNode: MapGraphNode | null = null;
    if (mapData?.nodes.length === 1) {
      rootNode = buildFromMap(mapData.nodes[0]);
    } else if (mapData && mapData.nodes.length > 1) {
      const children = mapData.nodes.map(buildFromMap);
      rootNode = {
        id: 'synthetic/assigned-scopes',
        type: 'root',
        name: 'Assigned Scopes',
        deviceCount: children.reduce((total, child) => total + child.deviceCount, 0),
        children,
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        subtreeWidth: NODE_WIDTH,
      };
    } else if (nodes.length === 1) {
      rootNode = buildFromPortfolio(nodes[0], nodes[0].id === ROOT_PROPERTY_ID);
    } else if (nodes.length > 1) {
      const children = nodes.map((node) => buildFromPortfolio(node, false));
      rootNode = {
        id: 'synthetic/assigned-scopes',
        type: 'root',
        name: 'Assigned Scopes',
        deviceCount: children.reduce((total, child) => total + child.deviceCount, 0),
        children,
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        subtreeWidth: NODE_WIDTH,
      };
    }

    if (!rootNode) {
      return {
        rootGraphNode: null,
        allNodes: [] as MapGraphNode[],
        allEdges: [] as MapGraphEdge[],
        graphBounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
      };
    }

    // Pass 1: Compute subtree widths bottom-up
    const computeSubtreeWidth = (n: MapGraphNode): number => {
      if (n.children.length === 0) {
        n.subtreeWidth = NODE_WIDTH;
        return NODE_WIDTH;
      }
      let sum = 0;
      for (let i = 0; i < n.children.length; i++) {
        const cw = computeSubtreeWidth(n.children[i]);
        sum += cw;
        if (i > 0) sum += GAP_X;
      }
      n.subtreeWidth = Math.max(NODE_WIDTH, sum);
      return n.subtreeWidth;
    };
    computeSubtreeWidth(rootNode);

    // Pass 2: Layout coordinates top-down
    const flatNodeList: MapGraphNode[] = [];
    const flatEdgeList: MapGraphEdge[] = [];

    const assignCoordinates = (n: MapGraphNode, left: number, depth: number) => {
      n.y = depth * (NODE_HEIGHT + GAP_Y);
      flatNodeList.push(n);

      if (n.children.length === 0) {
        n.x = left;
        return;
      }

      let currentLeft = left;
      const childCenters: number[] = [];

      for (const child of n.children) {
        assignCoordinates(child, currentLeft, depth + 1);
        childCenters.push(child.x + child.width / 2);
        currentLeft += child.subtreeWidth + GAP_X;

        flatEdgeList.push({
          id: `edge/${n.id}->${child.id}`,
          fromX: n.x + n.width / 2, // will re-center after parent x is set
          fromY: n.y + n.height,
          toX: child.x + child.width / 2,
          toY: child.y,
        });
      }

      const firstCenter = childCenters[0];
      const lastCenter = childCenters[childCenters.length - 1];
      n.x = (firstCenter + lastCenter) / 2 - n.width / 2;
    };

    assignCoordinates(rootNode, 0, 0);

    // Re-align edge fromX after parent centers are computed
    for (const edge of flatEdgeList) {
      const parentId = edge.id.split('->')[0].replace('edge/', '');
      const parent = flatNodeList.find((fn) => fn.id === parentId);
      if (parent) {
        edge.fromX = parent.x + parent.width / 2;
        edge.fromY = parent.y + parent.height;
      }
    }

    // Calculate bounding box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const fn of flatNodeList) {
      if (fn.x < minX) minX = fn.x;
      if (fn.y < minY) minY = fn.y;
      if (fn.x + fn.width > maxX) maxX = fn.x + fn.width;
      if (fn.y + fn.height > maxY) maxY = fn.y + fn.height;
    }

    return {
      rootGraphNode: rootNode,
      allNodes: flatNodeList,
      allEdges: flatEdgeList,
      graphBounds: {
        minX,
        minY,
        maxX,
        maxY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      },
    };
  }, [mapData, nodes, portfolioNodeMap]);

  // Fit graph to viewport
  const fitView = useCallback(() => {
    if (!containerRef.current || allNodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    const padding = 60;
    const availableW = clientWidth - padding * 2;
    const availableH = clientHeight - padding * 2;

    const scaleX = availableW / (graphBounds.width || 1);
    const scaleY = availableH / (graphBounds.height || 1);
    const fitScale = Math.min(1.1, Math.max(0.4, Math.min(scaleX, scaleY)));

    const graphCenterX = graphBounds.minX + graphBounds.width / 2;
    const panX = clientWidth / 2 - graphCenterX * fitScale;
    const panY = 50 - graphBounds.minY * fitScale;

    setScale(fitScale);
    setPan({ x: panX, y: Math.max(30, panY) });
  }, [allNodes.length, graphBounds]);

  // Auto-fit on initial render
  useEffect(() => {
    if (!hasAutoFitted && allNodes.length > 0 && containerRef.current) {
      fitView();
      setHasAutoFitted(true);
    }
  }, [hasAutoFitted, allNodes.length, fitView]);

  // Zoom controls
  const zoomIn = () => setScale((s) => Math.min(2.0, Number((s * 1.2).toFixed(2))));
  const zoomOut = () => setScale((s) => Math.max(0.3, Number((s / 1.2).toFixed(2))));

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((prev) => Math.min(2.0, Math.max(0.3, Number((prev * zoomFactor).toFixed(2)))));
  };

  // Mouse drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Minimap calculations
  const minimapW = 180;
  const minimapH = 120;
  const minimapPadding = 12;
  const mmScale = Math.min(
    (minimapW - minimapPadding * 2) / (graphBounds.width || 1),
    (minimapH - minimapPadding * 2) / (graphBounds.height || 1),
    0.15
  );

  const containerW = containerSize.width;
  const containerH = containerSize.height;

  // Viewport box in minimap coordinates
  const vpRectX =
    minimapPadding + (-pan.x / scale - graphBounds.minX) * mmScale;
  const vpRectY =
    minimapPadding + (-pan.y / scale - graphBounds.minY) * mmScale;
  const vpRectW = (containerW / scale) * mmScale;
  const vpRectH = (containerH / scale) * mmScale;

  if (mapLoading && allNodes.length === 0) {
    return (
      <Flex minH="540px" align="center" justify="center" direction="column">
        <Spinner size="md" color="#2563eb" />
        <Text fontSize="12px" color={themeColors.text.muted} mt={2}>
          Loading property hierarchy graph...
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="100%"
      h="calc(100vh - 290px)"
      minH="540px"
      bg="#f8fbff"
      backgroundImage="radial-gradient(#cbd5e1 1.2px, transparent 1.2px)"
      backgroundSize="24px 24px"
      borderRadius="10px"
      border="1px solid"
      borderColor={themeColors.panel.border}
      overflow="hidden"
      cursor={isDragging ? 'grabbing' : 'grab'}
      userSelect="none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {mapError && (
        <Box position="absolute" top="14px" right="14px" zIndex={11} bg="#fff7ed" color="#9a3412" border="1px solid #fdba74" borderRadius="7px" px={3} py={2} fontSize="11px">
          Device assignments are unavailable. Showing the scope hierarchy only.
        </Box>
      )}
      {/* Top-Left Map Legend matching OWPROV UI */}
      <Box
        position="absolute"
        top="14px"
        left="14px"
        bg="#ffffff"
        px={3}
        py={2.5}
        borderRadius="7px"
        border="1px solid"
        borderColor="#e2e8f0"
        boxShadow="0 4px 14px rgba(0,0,0,0.06)"
        zIndex={10}
        minW="140px"
      >
        <Flex align="center" justify="space-between" mb={1.5}>
          <Text fontSize="11px" fontWeight="700">Root</Text>
          <Box w="56px" h="14px" bg="#000000" borderRadius="3px" />
        </Flex>
        <Flex align="center" justify="space-between" mb={1.5}>
          <Text fontSize="11px" fontWeight="700">Entity</Text>
          <Box w="56px" h="14px" bg="#5eead4" borderRadius="3px" />
        </Flex>
        <Flex align="center" justify="space-between" mb={1.5}>
          <Text fontSize="11px" fontWeight="700">Venue</Text>
          <Box w="56px" h="14px" bg="#67e8f9" borderRadius="3px" />
        </Flex>
        <Flex align="center" justify="space-between">
          <Text fontSize="11px" fontWeight="700">Device</Text>
          <Box w="56px" h="14px" bg="#93c5fd" borderRadius="3px" />
        </Flex>
      </Box>

      {/* Main Graph Content Surface */}
      <Box
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h="100%"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG Connector Edges */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '10000px',
            height: '10000px',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {allEdges.map((edge) => {
            const midY = (edge.fromY + edge.toY) / 2;
            const pathD = `M ${edge.fromX} ${edge.fromY} C ${edge.fromX} ${midY}, ${edge.toX} ${midY}, ${edge.toX} ${edge.toY}`;
            return (
              <g key={edge.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx={edge.fromX} cy={edge.fromY} r={2.5} fill="#64748b" />
                <circle cx={edge.toX} cy={edge.toY} r={2.5} fill="#64748b" />
              </g>
            );
          })}
        </svg>

        {/* Nodes Layer */}
        {allNodes.map((n) => {
          const isSelected =
            selected &&
            n.originalNode &&
            selected.id === n.originalNode.id &&
            selected.type === n.originalNode.type;

          let cardBg = '#67e8f9'; // Venue
          let cardColor = '#0f172a';
          if (n.type === 'root') {
            cardBg = '#000000';
            cardColor = '#ffffff';
          } else if (n.type === 'entity') {
            cardBg = '#5eead4';
            cardColor = '#0f172a';
          } else if (n.type === 'device') {
            cardBg = '#93c5fd';
            cardColor = '#0f172a';
          }

          return (
            <Box
              key={n.id}
              position="absolute"
              left={`${n.x}px`}
              top={`${n.y}px`}
              w={`${n.width}px`}
              h={`${n.height}px`}
              bg={cardBg}
              color={cardColor}
              borderRadius="6px"
              border={isSelected ? '2.5px solid #2563eb' : '1px solid rgba(0,0,0,0.1)'}
              boxShadow={
                isSelected
                  ? '0 0 0 3px rgba(37,99,235,0.25), 0 4px 12px rgba(0,0,0,0.12)'
                  : '0 2px 8px rgba(0,0,0,0.06)'
              }
              cursor="pointer"
              transition="transform 0.1s ease, box-shadow 0.1s ease"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (n.type === 'device' && n.serialNumber) {
                  navigate(`/devices?serial=${encodeURIComponent(n.serialNumber)}`);
                } else if (n.originalNode) {
                  onSelect(n.originalNode);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (n.type === 'device' && n.serialNumber) {
                  navigate(`/devices?serial=${encodeURIComponent(n.serialNumber)}`);
                } else if (n.originalNode && onOpen) {
                  onOpen(n.originalNode);
                }
              }}
              title={n.type === 'device' ? `Open Device ${n.serialNumber}` : n.originalNode ? `${n.name} (${n.originalNode.type} · ${n.originalNode.id})` : n.name}
            >
              {/* Connector handle dots */}
              {n.type !== 'root' && (
                <Box
                  position="absolute"
                  top="-4px"
                  left="50%"
                  transform="translateX(-50%)"
                  w="8px"
                  h="8px"
                  borderRadius="50%"
                  bg="#475569"
                  border="1.5px solid #ffffff"
                />
              )}
              {n.children.length > 0 && (
                <Box
                  position="absolute"
                  bottom="-4px"
                  left="50%"
                  transform="translateX(-50%)"
                  w="8px"
                  h="8px"
                  borderRadius="50%"
                  bg="#475569"
                  border="1.5px solid #ffffff"
                />
              )}

              <Flex
                h="100%"
                direction="column"
                justify="center"
                align="center"
                px={2.5}
                py={1}
              >
                <Text
                  fontSize="12px"
                  fontWeight="750"
                  textAlign="center"
                  maxW="180px"
                  truncate
                  lineHeight="1.2"
                >
                  {n.name}
                </Text>

                {/* Sub-label */}
                {n.type === 'device' ? (
                  <Flex align="center" gap={2} mt={1}>
                    <Box
                      w="8px"
                      h="8px"
                      borderRadius="50%"
                      bg={
                        n.availability === 'online'
                          ? '#22c55e'
                          : n.availability === 'offline'
                          ? '#ef4444'
                          : '#94a3b8'
                      }
                    />
                    <Text fontSize="10px" fontWeight="650" textTransform="capitalize">{n.availability || 'unknown'}</Text>
                  </Flex>
                ) : (
                  <Flex align="center" gap={1} mt={0.5}>
                    <Icon name="wifi" size={13} color={cardColor} />
                    <Text fontSize="11px" fontWeight="700">
                      {n.deviceCount}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Box>
          );
        })}
      </Box>

      {/* Bottom-Left Zoom Controls matching Image 1 */}
      <VStack
        position="absolute"
        bottom="16px"
        left="16px"
        bg="#ffffff"
        borderRadius="7px"
        border="1px solid"
        borderColor="#e2e8f0"
        boxShadow="0 4px 12px rgba(0,0,0,0.08)"
        zIndex={10}
        gap={0}
        overflow="hidden"
      >
        <Button
          size="xs"
          minW="32px"
          h="32px"
          p={0}
          bg="transparent"
          borderRadius={0}
          _hover={{ bg: '#f1f5f9' }}
          onClick={zoomIn}
          aria-label="Zoom in"
          title="Zoom In"
        >
          <Icon name="plus" size={14} />
        </Button>
        <Box w="100%" h="1px" bg="#e2e8f0" />
        <Button
          size="xs"
          minW="32px"
          h="32px"
          p={0}
          bg="transparent"
          borderRadius={0}
          _hover={{ bg: '#f1f5f9' }}
          onClick={zoomOut}
          aria-label="Zoom out"
          title="Zoom Out"
        >
          <Icon name="minus" size={14} />
        </Button>
        <Box w="100%" h="1px" bg="#e2e8f0" />
        <Button
          size="xs"
          minW="32px"
          h="32px"
          p={0}
          bg="transparent"
          borderRadius={0}
          _hover={{ bg: '#f1f5f9' }}
          onClick={fitView}
          aria-label="Fit to view"
          title="Fit to View"
        >
          <Icon name="maximize" size={13} />
        </Button>
      </VStack>

      {/* Bottom-Right Minimap matching Image 1 */}
      <Box
        position="absolute"
        bottom="16px"
        right="16px"
        w={`${minimapW}px`}
        h={`${minimapH}px`}
        bg="#ffffff"
        borderRadius="7px"
        border="1px solid"
        borderColor="#e2e8f0"
        boxShadow="0 4px 14px rgba(0,0,0,0.08)"
        zIndex={10}
        overflow="hidden"
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${minimapW} ${minimapH}`}>
          {/* Miniature nodes */}
          {allNodes.map((fn) => {
            const rx =
              minimapPadding + (fn.x - graphBounds.minX) * mmScale;
            const ry =
              minimapPadding + (fn.y - graphBounds.minY) * mmScale;
            const rw = Math.max(8, fn.width * mmScale);
            const rh = Math.max(3, fn.height * mmScale);

            let color = '#67e8f9';
            if (fn.type === 'root') color = '#000000';
            else if (fn.type === 'entity') color = '#5eead4';
            else if (fn.type === 'device') color = '#93c5fd';

            return (
              <rect
                key={`mm-${fn.id}`}
                x={rx}
                y={ry}
                width={rw}
                height={rh}
                fill={color}
                rx={1}
              />
            );
          })}

          {/* Viewport rect indicator */}
          <rect
            x={Math.max(0, vpRectX)}
            y={Math.max(0, vpRectY)}
            width={Math.min(minimapW, vpRectW)}
            height={Math.min(minimapH, vpRectH)}
            fill="rgba(37,99,235,0.08)"
            stroke="#2563eb"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        </svg>

        <Text
          position="absolute"
          bottom="3px"
          right="6px"
          fontSize="9px"
          fontWeight="600"
          color="#94a3b8"
          pointerEvents="none"
        >
          React Flow
        </Text>
      </Box>
    </Box>
  );
};
