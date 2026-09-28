import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { themeColors } from './colors';

// Helper to recursively convert string color values to Chakra token objects ({ value: string })
type RecursiveTokens<T> = {
  [K in keyof T]: T[K] extends string
    ? { value: string }
    : T[K] extends object
    ? RecursiveTokens<T[K]>
    : never;
};

function toTokens<T extends Record<string, any>>(obj: T): RecursiveTokens<T> {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      result[key] = { value: val };
    } else if (typeof val === 'object' && val !== null) {
      result[key] = toTokens(val);
    }
  }
  return result;
}

const colorTokens = toTokens(themeColors);

export const customConfig = defineConfig({
  globalCss: {
    'html, body': {
      margin: 0,
      padding: 0,
      backgroundColor: themeColors.canvas.bg,
      color: themeColors.text.primary,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    '*': {
      boxSizing: 'border-box',
    },
  },
  theme: {
    tokens: {
      colors: colorTokens,
      fonts: {
        heading: { value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
        body: { value: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
      },
      radii: {
        sm: { value: '6px' },
        md: { value: '8px' },
        lg: { value: '12px' },
        xl: { value: '16px' },
        full: { value: '9999px' },
      },
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);

// Re-export themeColors and types for direct usage in components
export { themeColors };
export type { ThemeColors } from './colors';
export default system;
