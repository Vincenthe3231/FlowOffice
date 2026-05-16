export const STATUS_COLORS: Record<string, string> = {
  approved: 'hsl(var(--success))',
  paid: 'hsl(var(--success))',
  present: 'hsl(var(--success))',
  pending: 'hsl(var(--warning))',
  pending_l1: 'hsl(var(--warning))',
  pending_l2: 'hsl(var(--warning))',
  pending_l3: 'hsl(var(--warning))',
  pending_l4: 'hsl(var(--warning))',
  rejected: 'hsl(var(--destructive))',
  cancelled: 'hsl(var(--muted-foreground))',
  draft: 'hsl(var(--muted-foreground))',
  absent: 'hsl(var(--destructive))',
  late: 'hsl(var(--warning))',
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status.toLowerCase()] ?? 'hsl(var(--muted-foreground))'
}
