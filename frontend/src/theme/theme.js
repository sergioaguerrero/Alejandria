/**
 * @file theme.js
 * @description Global design system theme — Alejandría
 *
 * Official palette:
 *   Main background  → #0B1220
 *   Surfaces         → #111C30
 *   Secondary blue   → #1D3557
 *   Accent           → #60A5FA
 *   Main text        → #F8FAFC
 *
 * Typography: Inter (Google Fonts)
 */

import { createTheme, alpha } from '@mui/material/styles';

// ─── Design Tokens ───────────────────────────────────────────────────────

export const DARK_COLORS = {
  bgMain:     '#0B1220',  // global background
  surface:    '#111C30',  // cards, panels, forms
  secondary:  '#1D3557',  // differentiated sections, active nav
  accent:     '#60A5FA',  // primary buttons, links, interactive details
  textMain:   '#F8FAFC',  // main text, headings
  textMuted:  '#94A3B8',  // secondary text / metadata
  error:      '#F87171',  // error states
  warning:    '#FBBF24',  // warning states
  success:    '#34D399',  // success states
  divider:    'rgba(96, 165, 250, 0.12)',
};

export const LIGHT_COLORS = {
  bgMain:     '#F8FAFC',  // global background
  surface:    '#FFFFFF',  // cards, panels, forms
  secondary:  '#F1F5F9',  // differentiated sections, active nav
  accent:     '#2563EB',  // primary buttons, links, interactive details
  textMain:   '#0F172A',  // main text, headings
  textMuted:  '#64748B',  // secondary text / metadata
  error:      '#DC2626',  // error states
  warning:    '#D97706',  // warning states
  success:    '#059669',  // success states
  divider:    'rgba(15, 23, 42, 0.10)',
};

// ─── MUI Theme ────────────────────────────────────────────────────────────────

export function getAppTheme(mode = 'dark') {
  const COLORS = mode === 'light' ? LIGHT_COLORS : DARK_COLORS;

  return createTheme({
  // 1. Palette
  palette: {
    mode,

    background: {
      default: COLORS.bgMain,
      paper:   COLORS.surface,
    },

    primary: {
      main:         COLORS.accent,
      dark:         '#3B82F6',
      light:        '#93C5FD',
      contrastText: mode === 'light' ? '#FFFFFF' : '#0B1220',
    },

    secondary: {
      main:         COLORS.secondary,
      dark:         '#152944',
      light:        '#2A4A70',
      contrastText: COLORS.textMain,
    },

    text: {
      primary:   COLORS.textMain,
      secondary: COLORS.textMuted,
      disabled:  'rgba(248, 250, 252, 0.38)',
    },

    error: {
      main: COLORS.error,
      contrastText: '#0B1220',
    },

    warning: {
      main: COLORS.warning,
      contrastText: '#0B1220',
    },

    success: {
      main: COLORS.success,
      contrastText: '#0B1220',
    },

    divider: COLORS.divider,

    // Tokens accessible from sx={{ color: 'surface.main' }}
    surface: {
      main: COLORS.surface,
    },
  },

  // 2. Typography — Inter
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',

    // Main headings: 48–64px, weight 800
    h1: {
      fontSize: 'clamp(2.5rem, 5vw, 4rem)',     // 40–64px
      fontWeight: 800,
      letterSpacing: '-0.03em',
      lineHeight: 1.1,
      color: COLORS.textMain,
    },

    // Section headings: 28–36px, weight 700
    h2: {
      fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', // 28–36px
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
      color: COLORS.textMain,
    },

    // Sub-sections: 20–24px, weight 600
    h3: {
      fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
      color: COLORS.textMain,
    },

    h4: {
      fontSize: '1.25rem',  // 20px
      fontWeight: 600,
      letterSpacing: '-0.01em',
      color: COLORS.textMain,
    },

    h5: {
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      color: COLORS.textMain,
    },

    h6: {
      fontSize: '1rem',     // 16px
      fontWeight: 600,
      color: COLORS.textMain,
    },

    // Subtitles: 20–24px, weight 500
    subtitle1: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: COLORS.textMuted,
      lineHeight: 1.5,
    },

    subtitle2: {
      fontSize: '1rem',
      fontWeight: 500,
      color: COLORS.textMuted,
      lineHeight: 1.5,
    },

    // General text: 16px, weight 400, line-height 1.6
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      color: COLORS.textMain,
    },

    body2: {
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.5,
      color: COLORS.textMuted,
    },

    // Navigation: 15–17px, weight 500
    button: {
      fontSize: '0.9375rem', // 15px
      fontWeight: 600,
      letterSpacing: '0.01em',
      textTransform: 'none', // no automatic uppercase
    },

    // Labels and metadata: 13–14px
    caption: {
      fontSize: '0.8125rem', // 13px
      fontWeight: 400,
      color: COLORS.textMuted,
      lineHeight: 1.4,
    },

    overline: {
      fontSize: '0.75rem',   // 12px
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: COLORS.accent,
    },
  },

  // 3. Shape — global radii
  shape: {
    borderRadius: 10, // base 10px; scaled with multiplier in sx
  },

  // 4. Base spacing (8px by default — keep)
  spacing: 8,

  // 5. Smooth transitions
  transitions: {
    duration: {
      shortest:      150,
      shorter:       200,
      short:         250,
      standard:      300,
      complex:       375,
      enteringScreen: 225,
      leavingScreen:  195,
    },
  },

  // 6. Component overrides
  components: {

    // ── CssBaseline: global background ──────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': { boxSizing: 'border-box' },
        body: {
          backgroundColor: COLORS.bgMain,
          color: COLORS.textMain,
          margin: 0,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '#root': {
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
        },
        // Respects reduced-motion preference
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },

    // ── Button ──────────────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        variant: 'contained',
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 22px',
          fontWeight: 600,
          fontSize: '0.9375rem',
          textTransform: 'none',
          transition: 'background-color 200ms, box-shadow 200ms, transform 150ms',
          '&:active': { transform: 'scale(0.98)' },
          '&:focus-visible': {
            outline: `2px solid ${COLORS.accent}`,
            outlineOffset: 3,
          },
        },
        // Primary: accent background, dark text
        containedPrimary: {
          backgroundColor: COLORS.accent,
          color: '#0B1220',
          '&:hover': {
            backgroundColor: '#3B82F6',
          },
          '&:disabled': {
            backgroundColor: alpha(COLORS.accent, 0.3),
            color: alpha('#0B1220', 0.5),
          },
        },
        // Secondary: medium blue background
        containedSecondary: {
          backgroundColor: COLORS.secondary,
          color: COLORS.textMain,
          '&:hover': {
            backgroundColor: '#264673',
          },
        },
        // Outline
        outlined: {
          borderColor: alpha(COLORS.accent, 0.5),
          color: COLORS.accent,
          '&:hover': {
            borderColor: COLORS.accent,
            backgroundColor: alpha(COLORS.accent, 0.08),
          },
        },
        // Text
        text: {
          color: COLORS.accent,
          '&:hover': {
            backgroundColor: alpha(COLORS.accent, 0.08),
          },
        },
      },
    },

    // ── IconButton ───────────────────────────────────────────────────────────
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: `2px solid ${COLORS.accent}`,
            outlineOffset: 2,
          },
        },
      },
    },

    // ── TextField / Input ────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(COLORS.secondary, 0.4),
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(COLORS.textMain, 0.15),
            transition: 'border-color 200ms',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(COLORS.accent, 0.5),
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: COLORS.accent,
            borderWidth: 1.5,
          },
          '&.Mui-error .MuiOutlinedInput-notchedOutline': {
            borderColor: COLORS.error,
          },
          '&.Mui-disabled': {
            opacity: 0.5,
          },
        },
        input: {
          color: COLORS.textMain,
          '&::placeholder': {
            color: COLORS.textMuted,
            opacity: 1,
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: COLORS.textMuted,
          '&.Mui-focused': { color: COLORS.accent },
          '&.Mui-error':   { color: COLORS.error },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: COLORS.textMuted,
          '&.Mui-error': { color: COLORS.error },
        },
      },
    },

    // ── Select ───────────────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        icon: { color: COLORS.textMuted },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.divider}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: COLORS.textMain,
          '&:hover': {
            backgroundColor: alpha(COLORS.accent, 0.1),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(COLORS.accent, 0.15),
            color: COLORS.accent,
            '&:hover': {
              backgroundColor: alpha(COLORS.accent, 0.2),
            },
          },
          '&:focus-visible': {
            outline: `2px solid ${COLORS.accent}`,
            outlineOffset: -2,
          },
        },
      },
    },

    // ── Card ─────────────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.divider}`,
          borderRadius: 12,
          transition: 'border-color 200ms, box-shadow 200ms',
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          '&:last-child': { paddingBottom: '20px' },
        },
      },
    },

    MuiCardActionArea: {
      styleOverrides: {
        root: {
          '&:hover .MuiCardActionArea-focusHighlight': {
            opacity: 0.06,
          },
          '&:focus-visible': {
            outline: `2px solid ${COLORS.accent}`,
            outlineOffset: 2,
          },
        },
      },
    },

    // ── Paper ────────────────────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none', // remove MUI dark mode default gradient
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.divider}`,
        },
      },
    },

    // ── AppBar / Navigation ───────────────────────────────────────────────────
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: alpha(COLORS.bgMain, 0.92),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${COLORS.divider}`,
          color: COLORS.textMain,
        },
      },
    },

    MuiToolbar: {
      styleOverrides: {
        root: {
          paddingLeft:  '24px !important',
          paddingRight: '24px !important',
          minHeight:    '64px !important',
        },
      },
    },

    // ── Drawer / Sidebar ──────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: COLORS.surface,
          borderRight: `1px solid ${COLORS.divider}`,
        },
      },
    },

    // ── Tabs ─────────────────────────────────────────────────────────────────
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${COLORS.divider}`,
        },
        indicator: {
          backgroundColor: COLORS.accent,
          height: 2,
          borderRadius: '2px 2px 0 0',
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          color: COLORS.textMuted,
          fontWeight: 500,
          fontSize: '0.9375rem',
          textTransform: 'none',
          padding: '12px 20px',
          '&.Mui-selected': {
            color: COLORS.accent,
            fontWeight: 600,
          },
          '&:focus-visible': {
            outline: `2px solid ${COLORS.accent}`,
            outlineOffset: -2,
            borderRadius: 4,
          },
        },
      },
    },

    // ── Chip ─────────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
        filledDefault: {
          backgroundColor: alpha(COLORS.secondary, 0.8),
          color: COLORS.textMain,
          '&:hover': { backgroundColor: COLORS.secondary },
        },
        outlinedPrimary: {
          borderColor: alpha(COLORS.accent, 0.5),
          color: COLORS.accent,
          '&:hover': {
            borderColor: COLORS.accent,
            backgroundColor: alpha(COLORS.accent, 0.08),
          },
        },
      },
    },

    // ── Alert ─────────────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontSize: '0.9rem',
          alignItems: 'flex-start',
        },
        filledError: {
          backgroundColor: alpha(COLORS.error, 0.15),
          color: COLORS.error,
          border: `1px solid ${alpha(COLORS.error, 0.3)}`,
        },
        filledSuccess: {
          backgroundColor: alpha(COLORS.success, 0.15),
          color: COLORS.success,
          border: `1px solid ${alpha(COLORS.success, 0.3)}`,
        },
        filledWarning: {
          backgroundColor: alpha(COLORS.warning, 0.12),
          color: COLORS.warning,
          border: `1px solid ${alpha(COLORS.warning, 0.3)}`,
        },
        filledInfo: {
          backgroundColor: alpha(COLORS.accent, 0.12),
          color: COLORS.accent,
          border: `1px solid ${alpha(COLORS.accent, 0.3)}`,
        },
        standardError: {
          backgroundColor: alpha(COLORS.error, 0.12),
          color: COLORS.error,
          border: `1px solid ${alpha(COLORS.error, 0.25)}`,
          '& .MuiAlert-icon': { color: COLORS.error },
        },
        standardSuccess: {
          backgroundColor: alpha(COLORS.success, 0.12),
          color: COLORS.success,
          border: `1px solid ${alpha(COLORS.success, 0.25)}`,
          '& .MuiAlert-icon': { color: COLORS.success },
        },
        standardWarning: {
          backgroundColor: alpha(COLORS.warning, 0.10),
          color: COLORS.warning,
          border: `1px solid ${alpha(COLORS.warning, 0.25)}`,
          '& .MuiAlert-icon': { color: COLORS.warning },
        },
        standardInfo: {
          backgroundColor: alpha(COLORS.accent, 0.10),
          color: COLORS.accent,
          border: `1px solid ${alpha(COLORS.accent, 0.25)}`,
          '& .MuiAlert-icon': { color: COLORS.accent },
        },
      },
    },

    // ── Dialog / Modal ────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.divider}`,
          borderRadius: 14,
          backgroundImage: 'none',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 700,
          color: COLORS.textMain,
          padding: '24px 28px 16px',
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '0 28px 20px' },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 28px 24px',
          gap: 8,
        },
      },
    },

    // ── Table ─────────────────────────────────────────────────────────────────
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          border: `1px solid ${COLORS.divider}`,
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: alpha(COLORS.secondary, 0.6),
            color: COLORS.textMuted,
            fontWeight: 600,
            fontSize: '0.8125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: `1px solid ${COLORS.divider}`,
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: alpha(COLORS.secondary, 0.3),
          },
          '&:last-child td': { border: 0 },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${COLORS.divider}`,
          color: COLORS.textMain,
          padding: '14px 16px',
        },
      },
    },

    // ── LinearProgress ────────────────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
          backgroundColor: alpha(COLORS.accent, 0.18),
        },
        bar: {
          borderRadius: 4,
          backgroundColor: COLORS.accent,
        },
      },
    },

    // ── CircularProgress ──────────────────────────────────────────────────────
    MuiCircularProgress: {
      defaultProps: { color: 'primary' },
      styleOverrides: {
        circle: { strokeLinecap: 'round' },
      },
    },

    // ── Snackbar ──────────────────────────────────────────────────────────────
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        autoHideDuration: 4000,
      },
    },

    // ── Tooltip ──────────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: COLORS.secondary,
          color: COLORS.textMain,
          fontSize: '0.8125rem',
          border: `1px solid ${COLORS.divider}`,
          borderRadius: 6,
          padding: '6px 12px',
        },
        arrow: { color: COLORS.secondary },
      },
    },

    // ── Divider ───────────────────────────────────────────────────────────────
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: COLORS.divider },
      },
    },

    // ── Checkbox / Radio / Switch ─────────────────────────────────────────────
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: alpha(COLORS.textMain, 0.4),
          '&.Mui-checked': { color: COLORS.accent },
          '&:focus-visible': {
            outline: `2px solid ${COLORS.accent}`,
            outlineOffset: 2,
          },
        },
      },
    },

    MuiRadio: {
      styleOverrides: {
        root: {
          color: alpha(COLORS.textMain, 0.4),
          '&.Mui-checked': { color: COLORS.accent },
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        track: {
          backgroundColor: alpha(COLORS.textMain, 0.2),
          opacity: 1,
        },
        thumb: { color: COLORS.textMain },
        switchBase: {
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: COLORS.accent,
            opacity: 1,
          },
          '&.Mui-checked .MuiSwitch-thumb': {
            color: '#0B1220',
          },
        },
      },
    },

    // ── Link ──────────────────────────────────────────────────────────────────
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: {
        root: {
          color: COLORS.accent,
          '&:hover': { color: '#93C5FD' },
          '&:focus-visible': {
            outline: `2px solid ${COLORS.accent}`,
            outlineOffset: 2,
            borderRadius: 2,
          },
        },
      },
    },

    // ── Avatar ────────────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: COLORS.secondary,
          color: COLORS.accent,
          fontWeight: 700,
        },
      },
    },

    // ── Badge ─────────────────────────────────────────────────────────────────
    MuiBadge: {
      styleOverrides: {
        badge: {
          backgroundColor: COLORS.accent,
          color: '#0B1220',
          fontWeight: 700,
          fontSize: '0.7rem',
        },
      },
    },

    // ── Breadcrumbs ───────────────────────────────────────────────────────────
    MuiBreadcrumbs: {
      styleOverrides: {
        separator: { color: COLORS.textMuted },
        li: { color: COLORS.textMuted },
      },
    },

    // ── Pagination ────────────────────────────────────────────────────────────
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          color: COLORS.textMuted,
          border: `1px solid ${COLORS.divider}`,
          '&.Mui-selected': {
            backgroundColor: COLORS.accent,
            color: '#0B1220',
            fontWeight: 700,
            border: 'none',
            '&:hover': { backgroundColor: '#3B82F6' },
          },
          '&:hover': {
            backgroundColor: alpha(COLORS.accent, 0.1),
          },
        },
      },
    },

    // ── Skeleton ──────────────────────────────────────────────────────────────
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: {
          backgroundColor: alpha(COLORS.secondary, 0.6),
          '&::after': {
            background: `linear-gradient(90deg, transparent, ${alpha(COLORS.accent, 0.06)}, transparent)`,
          },
        },
      },
    },

    // ── Autocomplete ──────────────────────────────────────────────────────────
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.divider}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        },
        option: {
          color: COLORS.textMain,
          '&[aria-selected="true"]': {
            backgroundColor: `${alpha(COLORS.accent, 0.15)} !important`,
            color: COLORS.accent,
          },
          '&:hover': {
            backgroundColor: alpha(COLORS.accent, 0.08),
          },
        },
        noOptions: {
          color: COLORS.textMuted,
        },
      },
    },

    // ── ListItem ──────────────────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: alpha(COLORS.accent, 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(COLORS.accent, 0.12),
            color: COLORS.accent,
            '& .MuiListItemIcon-root': { color: COLORS.accent },
            '&:hover': { backgroundColor: alpha(COLORS.accent, 0.16) },
          },
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: COLORS.textMuted,
          minWidth: 40,
        },
      },
    },
  },
});
}

const theme = getAppTheme('dark');
const COLORS = DARK_COLORS;

export { COLORS };
export default theme;
