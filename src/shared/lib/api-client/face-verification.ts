import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

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

const PROXY = API_ROUTES.PROXY_PREFIX

export async function verifyFace(
  payload: VerifyFacePayload,
): Promise<VerificationResult> {
  const response = await laravelApi.post(`${PROXY}/face/verify`, payload)
  return extractData<VerificationResult>(response)
}

