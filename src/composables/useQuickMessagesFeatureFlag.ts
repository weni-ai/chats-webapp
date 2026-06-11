export const QUICK_MESSAGES_V2_FEATURE_FLAG = 'weniChatsQuickMessagesV2';

type FeatureFlags = {
  active_features?: string[];
};

export function useQuickMessagesFeatureFlag(
  featureFlags?: FeatureFlags | null,
): boolean {
  return !!featureFlags?.active_features?.includes(
    QUICK_MESSAGES_V2_FEATURE_FLAG,
  );
}
