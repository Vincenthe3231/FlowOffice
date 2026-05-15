import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

const PROXY = API_ROUTES.PROXY_PREFIX

export interface MapsConfigResponse {
  key: string
}

export async function fetchMapsConfig(): Promise<MapsConfigResponse> {
  const response = await laravelApi.get<MapsConfigResponse>(`${PROXY}/${API_ROUTES.MAPS_CONFIG}`)
  const data = extractData<MapsConfigResponse>(response)
  return {
    key: typeof data?.key === 'string' ? data.key : '',
  }
}
