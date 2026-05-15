"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { LEAVE_DRAFT_MAX_ATTACHMENT_FILES } from "@/features/leave/data"

interface LeaveDraftState {
  currentStep: number
  selectedLeaveTypeId: string | null
  startDate: string
  endDate: string
  dayType: "full" | "am" | "pm"
  reason: string
  /** Staged files for upload on submit; not persisted to localStorage. */
  attachmentFiles: File[]
  lastSaved: number
  hasDraft: boolean

  setStep: (step: number) => void
  setLeaveType: (id: string | null) => void
  setDates: (startDate: string, endDate: string) => void
  setDayType: (dayType: "full" | "am" | "pm") => void
  setReason: (reason: string) => void
  addAttachmentFile: (file: File) => void
  removeAttachmentFile: (index: number) => void
  clearAttachmentFiles: () => void
  clearDraft: () => void
  markDraft: () => void
}

const initialState = {
  currentStep: 1,
  selectedLeaveTypeId: null as string | null,
  startDate: "",
  endDate: "",
  dayType: "full" as const,
  reason: "",
  attachmentFiles: [] as File[],
  lastSaved: 0,
  hasDraft: false,
}

export const useLeaveDraftStore = create<LeaveDraftState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) =>
        set({ currentStep: step, lastSaved: Date.now(), hasDraft: true }),

      setLeaveType: (id) =>
        set({ selectedLeaveTypeId: id, lastSaved: Date.now(), hasDraft: true }),

      setDates: (startDate, endDate) =>
        set({ startDate, endDate, lastSaved: Date.now(), hasDraft: true }),

      setDayType: (dayType) =>
        set({ dayType, lastSaved: Date.now(), hasDraft: true }),

      setReason: (reason) =>
        set({ reason, lastSaved: Date.now(), hasDraft: true }),

      addAttachmentFile: (file) =>
        set((s) => {
          if (s.attachmentFiles.length >= LEAVE_DRAFT_MAX_ATTACHMENT_FILES) return s
          return {
            attachmentFiles: [...s.attachmentFiles, file],
            lastSaved: Date.now(),
            hasDraft: true,
          }
        }),

      removeAttachmentFile: (index) =>
        set((s) => ({
          attachmentFiles: s.attachmentFiles.filter((_, i) => i !== index),
          lastSaved: Date.now(),
          hasDraft: true,
        })),

      clearAttachmentFiles: () =>
        set({ attachmentFiles: [], lastSaved: Date.now() }),

      clearDraft: () => set({ ...initialState }),

      markDraft: () => set({ hasDraft: true, lastSaved: Date.now() }),
    }),
    {
      name: "leave-draft-storage",
      partialize: (s) => ({
        currentStep: s.currentStep,
        selectedLeaveTypeId: s.selectedLeaveTypeId,
        startDate: s.startDate,
        endDate: s.endDate,
        dayType: s.dayType,
        reason: s.reason,
        lastSaved: s.lastSaved,
        hasDraft: s.hasDraft,
        // attachmentFiles omitted (File objects are not JSON-serializable)
      }),
    }
  )
)
