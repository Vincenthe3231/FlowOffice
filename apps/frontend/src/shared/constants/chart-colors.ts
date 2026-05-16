export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--destructive))',
  purple: 'hsl(270, 60%, 55%)',
  cyan: 'hsl(var(--info))',
  pink: 'hsl(340, 65%, 55%)',
  orange: 'hsl(30, 80%, 50%)',
} as const

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.cyan,
  CHART_COLORS.pink,
  CHART_COLORS.orange,
  CHART_COLORS.danger,
] as const

export const CHART_GRID = 'hsl(220, 15%, 90%)'
export const CHART_AXIS = 'hsl(220, 10%, 50%)'
