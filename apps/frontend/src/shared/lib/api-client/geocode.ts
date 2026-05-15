import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

const PROXY = API_ROUTES.PROXY_PREFIX

export interface GeocodeResult {
  lat: number
  lng: number
}

/**
 * Geocode an address via backend (Google Geocoding API).
 * Returns { lat, lng } or null if not found / error.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const q = address.trim()
  if (!q) return null
  try {
    const response = await laravelApi.post<GeocodeResult>(`${PROXY}/${API_ROUTES.GEOCODE}`, {
      address: q,
    })
    const data = extractData<GeocodeResult>(response)
    if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
      return { lat: data.lat, lng: data.lng }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Reverse geocode lat/lng to a human-readable location name via backend (Google Geocoding API).
 * Returns the location name string or null on error / not found.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await laravelApi.post<{ locationName: string }>(
      `${PROXY}/${API_ROUTES.REVERSE_GEOCODE}`,
      { lat, lng }
    )
    const data = extractData<{ locationName: string }>(response)
    if (data?.locationName && typeof data.locationName === 'string') {
      return data.locationName
    }
    return null
  } catch {
    return null
  }
}
