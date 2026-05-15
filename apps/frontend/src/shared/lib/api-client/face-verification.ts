/** Same-origin API route; server forwards to Human API (avoids CORS and ensures POST). */
const FACE_VERIFY_API = '/api/face-verify'

/** Human API /api/v1/recognize response debug object */
export interface HumanApiDebug {
  status: string
  message: string
  requestId: string
  timestamp: string
}

/** Human API /api/v1/recognize response shape */
export interface HumanApiResponse {
  humanFace: boolean
  match: boolean
  confidence?: number
  debug: HumanApiDebug
}

/** Normalized result returned to the app */
export interface VerificationResult {
  faceDetected: boolean
  match: boolean
  confidence: number
  reason: string
  requestId?: string
}

/** Payload for verifyFace – only selfie; userId is resolved server-side from auth cookie */
export interface VerifyFacePayload {
  selfieBase64: string
}

function parseHumanApiResponse(data: unknown): HumanApiResponse {
  const raw = data as Record<string, unknown>
  const debug = raw.debug as HumanApiDebug | undefined
  if (!debug || typeof debug.message !== 'string') {
    throw new Error('Invalid response from face verification service')
  }
  return {
    humanFace: Boolean(raw.humanFace),
    match: Boolean(raw.match),
    confidence:
      typeof raw.confidence === 'number' ? raw.confidence : undefined,
    debug: {
      status: String(debug.status ?? ''),
      message: debug.message,
      requestId: String(debug.requestId ?? ''),
      timestamp: String(debug.timestamp ?? ''),
    },
  }
}

/** User-facing message for each error case */
export const FACE_VERIFICATION_ERROR_MESSAGES = {
  no_face: 'No face detected in photo. Please try again with better lighting.',
  no_match:
    'Face verification failed. Please ensure your photo matches your registered face.',
  bad_request: 'Invalid photo format. Please try again.',
  no_registered_face:
    'No registered face found. Please upload a face photo in your profile.',
  server_error:
    'Face verification service unavailable. Please try again later.',
  auth_required: 'Please sign in to verify your face.',
  unknown: 'Face verification failed. Please try again.',
} as const

export class FaceVerificationError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = 'FaceVerificationError'
  }
}

/**
 * Verify a selfie against the user's registered face via Human API.
 * User must be authenticated; userId is taken from the auth store.
 */
export async function verifyFace(
  payload: VerifyFacePayload,
): Promise<VerificationResult> {
  const { selfieBase64 } = payload
  if (!selfieBase64 || typeof selfieBase64 !== 'string') {
    throw new FaceVerificationError(
      FACE_VERIFICATION_ERROR_MESSAGES.bad_request,
      400,
    )
  }

  const res = await fetch(FACE_VERIFY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selfieBase64 }),
    credentials: 'include',
  })

  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new FaceVerificationError(
      FACE_VERIFICATION_ERROR_MESSAGES.server_error,
      res.status,
    )
  }

  const parsed = parseHumanApiResponse(data)
  const requestId = parsed.debug.requestId

  if (!res.ok) {
    const message =
      res.status === 401
        ? FACE_VERIFICATION_ERROR_MESSAGES.auth_required
        : res.status === 400
          ? FACE_VERIFICATION_ERROR_MESSAGES.bad_request
          : res.status === 404
            ? FACE_VERIFICATION_ERROR_MESSAGES.no_registered_face
            : FACE_VERIFICATION_ERROR_MESSAGES.server_error
    throw new FaceVerificationError(message, res.status, requestId)
  }

  const result: VerificationResult = {
    faceDetected: parsed.humanFace,
    match: parsed.match,
    confidence: parsed.confidence ?? 0,
    reason: parsed.debug.message,
    requestId: requestId || undefined,
  }

  return result
}
