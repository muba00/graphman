/**
 * Design tokens for the app.
 * Dark-themed developer-tool aesthetic, inspired by Postman.
 */
export const colors = {
  // Backgrounds
  bg: '#1E1E1E',
  bgSurface: '#252526',
  bgElevated: '#2D2D30',
  bgInput: '#3C3C3C',
  bgHover: '#383838',

  // Borders
  border: '#404040',
  borderFocused: '#007ACC',

  // Text
  textPrimary: '#D4D4D4',
  textSecondary: '#888888',
  textMuted: '#666666',
  textInverse: '#1E1E1E',

  // Accents
  accent: '#007ACC',
  accentHover: '#1A8AD4',
  accentMuted: '#264F78',

  // GraphQL syntax colors
  syntaxField: '#9CDCFE',
  syntaxType: '#4EC9B0',
  syntaxArg: '#CE9178',
  syntaxKeyword: '#C586C0',
  syntaxDeprecated: '#D7BA7D',
  syntaxScalar: '#B5CEA8',

  // Status
  error: '#F14C4C',
  errorBg: '#5A1D1D',
  success: '#89D185',
  warning: '#CCA700',

  // Checkbox
  checkboxBorder: '#6B6B6B',
  checkboxChecked: '#007ACC',
  checkboxIndeterminate: '#007ACC',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const fonts = {
  mono: 'Menlo',
  monoSize: 13,
  uiSize: 14,
  smallSize: 12,
} as const;
