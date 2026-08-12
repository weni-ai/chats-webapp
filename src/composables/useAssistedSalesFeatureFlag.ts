export const ASSISTED_SALES_FEATURE_FLAG = 'weniChatsAssistedSales';

type FeatureFlags = {
  active_features?: string[];
};

export function useAssistedSalesFeatureFlag(
  featureFlags?: FeatureFlags | null,
): boolean {
  return !!featureFlags?.active_features?.includes(ASSISTED_SALES_FEATURE_FLAG);
}
