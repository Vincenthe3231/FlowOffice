import { featuresConfig, FeatureKey } from '@/config/features.config'

export function useFeatureFlag(flag: FeatureKey): boolean {
  return featuresConfig[flag]
}
