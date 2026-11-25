import { ROOT_PROPERTY_ID, type PropertyScopeType, type PropertyTreeNode, type ScopeDetails } from '@/api';

export type PropertyLifecycleKind = 'root' | 'operator-linked' | 'normal';

export const getPropertyLifecycleKind = (
  id: string,
  details?: Pick<ScopeDetails, 'operatorId'>
): PropertyLifecycleKind => {
  if (id === ROOT_PROPERTY_ID) return 'root';
  if (details?.operatorId?.trim()) return 'operator-linked';
  return 'normal';
};

export const findTreeNode = (
  nodes: PropertyTreeNode[],
  type?: PropertyScopeType,
  id?: string
): PropertyTreeNode | undefined => {
  for (const node of nodes) {
    if (node.id === id && node.type === type) return node;
    const child = findTreeNode(node.children || [], type, id);
    if (child) return child;
  }
  return undefined;
};

export const flattenTree = (nodes: PropertyTreeNode[]): PropertyTreeNode[] =>
  nodes.flatMap((node) => [node, ...flattenTree(node.children || [])]);

export const collectScopeIds = (node?: PropertyTreeNode): string[] =>
  node ? [node.id, ...node.children.flatMap((child) => collectScopeIds(child))] : [];

export const formatTimestamp = (value?: number | string) => {
  if (!value) return 'Never';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numeric) || numeric <= 0) return String(value);
  const milliseconds = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
  return new Date(milliseconds).toLocaleString();
};
