'use client'

import { PageHeader } from "@/components/shared/PageHeader"
import { UserManagementView } from '@/features/user-management/components/UserManagementView'

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="User Management" subtitle="Staff and admin directory. Visibility and filters follow your role on the server." />
      <UserManagementView />
    </div>
  )
}
