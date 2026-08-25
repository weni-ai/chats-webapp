export const MEDIA_MESSAGES_WITH_TEXT_FEATURE_FLAG =
  'weniChatsEnableMediaMessagesWithText';

type FeatureFlags = {
  active_features?: string[];
};

export function useMediaMessagesWithTextFeatureFlag(
  featureFlags?: FeatureFlags | null,
): boolean {
  return !!featureFlags?.active_features?.includes(
    MEDIA_MESSAGES_WITH_TEXT_FEATURE_FLAG,
  );
}
