export type ShiftStatus = 'active' | 'inactive'

export interface ShiftApi {
  id: number
  name: string
  code: string
  startTime: string
  endTime: string
  color: string | null
  status: ShiftStatus
  createdBy: number | null
  createdAt: string
  updatedAt: string
}

export interface UserShiftApi {
  id: number
  userId: number
  user: { id: number; name: string; email: string }
  shiftId: number
  shift: { id: number; name: string; startTime: string; endTime: string }
  effectiveDate: string
  endDate: string | null
  notes: string | null
  assignedBy: { id: number; name: string } | null
  createdAt: string
}
