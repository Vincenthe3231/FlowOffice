export type { AuditLogEntry, AuditFilter, AuditMeta, AuditCauser, AuditProperties } from '@/shared/lib/api-client/audit'

export const AUDIT_MODULES = [
  { value: 'claims', label: 'Claims' },
  { value: 'leave', label: 'Leave' },
  { value: 'department', label: 'Departments' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'user_management', label: 'User Management' },
  { value: 'leave_type', label: 'Leave Types' },
] as const

export const AUDIT_EVENTS: Record<string, { value: string; label: string }[]> = {
  claims: [
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'paid', label: 'Paid' },
  ],
  leave: [
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ],
  department: [
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
  ],
  onboarding: [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ],
  user_management: [
    { value: 'department_changed', label: 'Department Changed' },
    { value: 'role_changed', label: 'Role Changed' },
  ],
  leave_type: [
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
  ],
}

export const MODULE_BADGE_COLORS: Record<string, string> = {
  claims: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  leave: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  department: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  onboarding: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  user_management: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  attendance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  leave_type: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
}

export const EVENT_BADGE_COLORS: Record<string, string> = {
  submitted: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  paid: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  created: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  updated: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  department_changed: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  role_changed: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  deleted: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
}
