'use client'

import { UserManagementView } from '@/features/user-management/components/UserManagementView'

export default function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Staff and admin directory. Visibility and filters follow your role on the server.
        </p>
      </div>
      <UserManagementView />
    </div>
  )
}
