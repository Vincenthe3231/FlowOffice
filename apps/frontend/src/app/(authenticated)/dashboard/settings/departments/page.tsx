'use client'

import { PageHeader } from "@/components/shared/PageHeader"
import { DepartmentsView } from '@/features/departments/components/DepartmentsView'

export default function DepartmentsSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Departments" subtitle="Organize teams by department. Top Management can create, edit, and activate or deactivate departments." />
      <DepartmentsView />
    </div>
  )
}
