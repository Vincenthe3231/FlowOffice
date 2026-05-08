'use client'

import { DepartmentsView } from '@/features/departments/components/DepartmentsView'

export default function DepartmentsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Departments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Organize teams by department. Top Management can create, edit, and activate or deactivate
          departments.
        </p>
      </div>
      <DepartmentsView />
    </div>
  )
}
