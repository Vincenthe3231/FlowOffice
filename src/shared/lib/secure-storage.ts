/**
 * Encrypted storage wrapper for Zustand persist.
 *
 * Uses Web Crypto API (AES-GCM) to encrypt/decrypt values before writing to
 * the underlying storage. PII in the auth store is hidden from casual
 * inspection (DevTools, shared screens).
 *
 * Security note: The key is client-exposed (NEXT_PUBLIC_* or fallback).
 * This provides obfuscation, not protection against attackers with bundle access.
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT = new Uint8Array(0) // No salt; key is already app-specific

export interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

async function getEncryptionKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoder = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv,
      tagLength: 128,
    },
    key,
    encoder.encode(plaintext)
  )
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

async function decrypt(base64: string, key: CryptoKey): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, IV_LENGTH)
    const ciphertext = combined.slice(IV_LENGTH)
    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: 128,
      },
      key,
      ciphertext
    )
    return new TextDecoder().decode(decrypted)
  } catch {
    return null
  }
}

function noopStorage(): StateStorage {
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
}

/**
 * Creates a StateStorage that encrypts on setItem and decrypts on getItem.
 * Compatible with Zustand persist via createJSONStorage.
 *
 * @param baseStorage - Underlying storage (e.g. localStorage). Pass null for SSR/no-op.
 * @param secret - Secret for derivation (32+ chars recommended). Use NEXT_PUBLIC_AUTH_STORE_SECRET.
 */
export function createEncryptedStorage(
  baseStorage: Storage | null,
  secret: string
): StateStorage {
  if (baseStorage == null) {
    return noopStorage()
  }

  if (
    typeof crypto === 'undefined' ||
    !crypto.subtle ||
    !crypto.getRandomValues
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[secure-storage] Web Crypto unavailable; auth store will not persist encrypted.'
      )
    }
    return noopStorage()
  }

  const effectiveSecret =
    secret.length >= 32 ? secret : 'fallback-dev-key-min-32-chars-long'
  if (secret.length < 32 && process.env.NODE_ENV === 'development') {
    console.warn(
      '[secure-storage] AUTH_STORE_SECRET should be at least 32 characters for AES-256.'
    )
  }

  let keyPromise: Promise<CryptoKey> | null = null
  const getKey = (): Promise<CryptoKey> => {
    if (!keyPromise) keyPromise = getEncryptionKey(effectiveSecret)
    return keyPromise
  }

  return {
    getItem: async (name: string): Promise<string | null> => {
      const raw = baseStorage.getItem(name)
      if (raw == null || raw === '') return null
      // If it looks like plain JSON (old unencrypted data), return null so store re-initializes
      const trimmed = raw.trim()
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return null
      }
      try {
        const key = await getKey()
        return await decrypt(raw, key)
      } catch {
        return null
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        const key = await getKey()
        const encrypted = await encrypt(value, key)
        baseStorage.setItem(name, encrypted)
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[secure-storage] Encryption failed:', err)
        }
      }
    },
    removeItem: (name: string): void => {
      baseStorage.removeItem(name)
    },
  }
}
