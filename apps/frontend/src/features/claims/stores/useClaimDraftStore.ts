"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomField } from "@/features/claims/types";

const MAX_ATTACHMENT_FILES = 5;

interface ClaimDraftState {
  currentStep: number;
  claimantName: string;
  claimantNickname: string;
  selectedTypeId: string | null;
  selectedTypeKey: string | null;
  selectedSubclaimId: string | null;
  formData: Record<string, unknown>;
  customFields: CustomField[];
  /** Staged files for create submit; not persisted */
  attachmentFiles: File[];
  lastSaved: number;
  hasDraft: boolean;

  setStep: (step: number) => void;
  addAttachmentFile: (file: File) => void;
  removeAttachmentFile: (index: number) => void;
  clearAttachmentFiles: () => void;
  setClaimant: (name: string, nickname: string) => void;
  setType: (id: string | null, key: string | null) => void;
  setSubclaim: (id: string | null) => void;
  setFormData: (data: Record<string, unknown>) => void;
  updateFormField: (key: string, value: unknown) => void;
  setCustomFields: (fields: CustomField[]) => void;
  addCustomField: (field: CustomField) => void;
  removeCustomField: (id: string) => void;
  updateCustomField: (id: string, value: string) => void;
  clearDraft: () => void;
  markDraft: () => void;
}

const initialState = {
  currentStep: 1,
  claimantName: "",
  claimantNickname: "",
  selectedTypeId: null as string | null,
  selectedTypeKey: null as string | null,
  selectedSubclaimId: null as string | null,
  formData: {} as Record<string, unknown>,
  customFields: [] as CustomField[],
  attachmentFiles: [] as File[],
  lastSaved: 0,
  hasDraft: false,
};

export const useClaimDraftStore = create<ClaimDraftState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) =>
        set({ currentStep: step, lastSaved: Date.now(), hasDraft: true }),
      setClaimant: (name, nickname) =>
        set({
          claimantName: name,
          claimantNickname: nickname,
          lastSaved: Date.now(),
          hasDraft: true,
        }),
      setType: (id, key) =>
        set({
          selectedTypeId: id,
          selectedTypeKey: key,
          selectedSubclaimId: null,
          lastSaved: Date.now(),
          hasDraft: true,
        }),
      setSubclaim: (id) =>
        set({ selectedSubclaimId: id, lastSaved: Date.now(), hasDraft: true }),
      setFormData: (data) =>
        set({ formData: data, lastSaved: Date.now(), hasDraft: true }),
      updateFormField: (key, value) =>
        set((s) => ({
          formData: { ...s.formData, [key]: value },
          lastSaved: Date.now(),
          hasDraft: true,
        })),
      setCustomFields: (fields) =>
        set({ customFields: fields, lastSaved: Date.now(), hasDraft: true }),
      addCustomField: (field) =>
        set((s) => ({
          customFields: [...s.customFields, field],
          lastSaved: Date.now(),
          hasDraft: true,
        })),
      removeCustomField: (id) =>
        set((s) => ({
          customFields: s.customFields.filter((f) => f.id !== id),
          lastSaved: Date.now(),
          hasDraft: true,
        })),
      updateCustomField: (id, value) =>
        set((s) => ({
          customFields: s.customFields.map((f) =>
            f.id === id ? { ...f, value } : f
          ),
          lastSaved: Date.now(),
          hasDraft: true,
        })),
      addAttachmentFile: (file) =>
        set((s) => {
          if (s.attachmentFiles.length >= MAX_ATTACHMENT_FILES) return s;
          return {
            attachmentFiles: [...s.attachmentFiles, file],
            lastSaved: Date.now(),
            hasDraft: true,
          };
        }),
      removeAttachmentFile: (index) =>
        set((s) => ({
          attachmentFiles: s.attachmentFiles.filter((_, i) => i !== index),
          lastSaved: Date.now(),
          hasDraft: true,
        })),
      clearAttachmentFiles: () =>
        set({ attachmentFiles: [], lastSaved: Date.now(), hasDraft: true }),
      clearDraft: () => set({ ...initialState }),
      markDraft: () => set({ hasDraft: true, lastSaved: Date.now() }),
    }),
    {
      name: "claim-draft-storage",
      partialize: (s) => ({
        currentStep: s.currentStep,
        claimantName: s.claimantName,
        claimantNickname: s.claimantNickname,
        selectedTypeId: s.selectedTypeId,
        selectedTypeKey: s.selectedTypeKey,
        selectedSubclaimId: s.selectedSubclaimId,
        formData: s.formData,
        customFields: s.customFields,
        lastSaved: s.lastSaved,
        hasDraft: s.hasDraft,
        // attachmentFiles omitted (not serializable)
      }),
    }
  )
);

export const CLAIM_DRAFT_MAX_ATTACHMENT_FILES = MAX_ATTACHMENT_FILES;
