/**
 * Recursively scans a configuration object, array, or JSON string to extract all
 * referenced VariableBlock / Profile UUIDs stored under '__variableBlock'.
 */
export function extractVariableBlockUuids(rawConfigOrSections: unknown): string[] {
  const ids = new Set<string>();

  const scan = (node: unknown) => {
    if (!node) return;
    if (typeof node === 'string') {
      if (node.includes('__variableBlock')) {
        try {
          const parsed = JSON.parse(node);
          scan(parsed);
        } catch {
          // Ignore invalid JSON strings
        }
      }
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        scan(item);
      }
      return;
    }
    if (typeof node === 'object') {
      const record = node as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        if (key === '__variableBlock') {
          if (Array.isArray(value)) {
            for (const v of value) {
              if (typeof v === 'string' && v.trim()) {
                ids.add(v.trim());
              }
            }
          } else if (typeof value === 'string' && value.trim()) {
            ids.add(value.trim());
          }
        } else {
          scan(value);
        }
      }
    }
  };

  scan(rawConfigOrSections);
  return Array.from(ids);
}

