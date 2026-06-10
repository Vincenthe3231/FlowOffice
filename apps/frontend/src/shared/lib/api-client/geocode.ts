import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

const PROXY = API_ROUTES.PROXY_PREFIX
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

export interface GeocodeResult {
  lat: number
  lng: number
}

interface GeocodeCacheEntry<T> {
  value: T | null
  expiresAt: number
}

function lsGet<T>(key: string): T | null | undefined {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    const entry: GeocodeCacheEntry<T> = JSON.parse(raw)
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key)
      return undefined
    }
    return entry.value
  } catch {
    return undefined
  }
}

function lsSet<T>(key: string, value: T | null): void {
  try {
    const entry: GeocodeCacheEntry<T> = { value, expiresAt: Date.now() + CACHE_TTL_MS }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const q = address.trim()
  if (!q) return null

  const cacheKey = `geocode:${q.toLowerCase()}`
  const cached = lsGet<GeocodeResult>(cacheKey)
  if (cached !== undefined) return cached

  try {
    const response = await laravelApi.post<GeocodeResult>(`${PROXY}/${API_ROUTES.GEOCODE}`, {
      address: q,
    })
    const data = extractData<GeocodeResult>(response)
    const result =
      data && typeof data.lat === 'number' && typeof data.lng === 'number'
        ? { lat: data.lat, lng: data.lng }
        : null
    lsSet(cacheKey, result)
    return result
  } catch {
    return null
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const cacheKey = `rev_geocode:${lat.toFixed(4)}_${lng.toFixed(4)}`
  const cached = lsGet<string>(cacheKey)
  if (cached !== undefined) return cached

  try {
    const response = await laravelApi.post<{ locationName: string }>(
      `${PROXY}/${API_ROUTES.REVERSE_GEOCODE}`,
      { lat, lng }
    )
    const data = extractData<{ locationName: string }>(response)
    const result =
      data?.locationName && typeof data.locationName === 'string' ? data.locationName : null
    lsSet(cacheKey, result)
    return result
  } catch {
    return null
  }
}
