import { colors } from './colors';
import { darkColors } from './darkColors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

// Re-export everything
export { colors, darkColors, typography, spacing, borderRadius, shadows };

// Complete theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};

export type Theme = typeof theme;
