import { supabase } from '@/shared/lib/supabase'

export interface VerificationResult {
  faceDetected: boolean
  match: boolean
  confidence: number
  reason: string
}

export interface VerifyFacePayload {
  selfieBase64: string
  avatarUrl?: string
}

export async function verifyFace(
  payload: VerifyFacePayload,
): Promise<VerificationResult> {
  const { data, error } = await supabase.functions.invoke('verify-face', {
    body: {
      selfie_base64: payload.selfieBase64,
      avatar_url: payload.avatarUrl,
    },
  })

  if (error) {
    throw new Error(`Face verification failed: ${error.message}`)
  }

  const raw = data as {
    face_detected?: boolean
    match?: boolean
    confidence?: number
    reason?: string
  }

  return {
    faceDetected: Boolean(raw.face_detected),
    match: Boolean(raw.match),
    confidence: Number(raw.confidence),
    reason: String(raw.reason ?? ''),
  }
}
