'use client'

import { useParams } from 'next/navigation'
import { UserDetailView } from '@/features/user-management/components/UserDetailView'

export default function UserManagementDetailPage() {
  const params = useParams()
  const userUuid = typeof params.userUuid === 'string' ? params.userUuid : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User details</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View directory information. Super admins can assign a department.
        </p>
      </div>
      {userUuid ? (
        <UserDetailView userUuid={userUuid} />
      ) : (
        <p className="text-sm text-muted-foreground">Invalid user.</p>
      )}
    </div>
  )
}
