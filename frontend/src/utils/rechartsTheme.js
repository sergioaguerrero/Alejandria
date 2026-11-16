/**
 * @file rechartsTheme.js
 * @description Shared Recharts axis and tooltip style builders synced with the active MUI theme.
 */

/**
 * Builds theme-aware props for Recharts axes and tooltips across light and dark modes.
 * @param {import('@mui/material').Theme} theme
 */
export function createRechartsThemeProps(theme) {
  const getChartAxisProps = (fontSize = 12) => ({
    tick: { fontSize, fill: theme.palette.text.secondary },
    axisLine: { stroke: theme.palette.divider },
    tickLine: { stroke: theme.palette.divider },
  });

  const tooltipProps = {
    cursor: { fill: theme.palette.action.hover },
    contentStyle: {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
      color: theme.palette.text.primary,
      boxShadow: theme.shadows[4],
    },
    itemStyle: { color: theme.palette.text.primary },
    labelStyle: { color: theme.palette.text.secondary, fontWeight: 600, marginBottom: 4 },
  };

  return { getChartAxisProps, tooltipProps };
}
