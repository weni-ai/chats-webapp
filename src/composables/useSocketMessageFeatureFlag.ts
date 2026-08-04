export const SOCKET_MESSAGE_SEND_FEATURE_FLAG = 'weniChatsSocketMessageSend';

type FeatureFlags = {
  active_features?: string[];
};

export function useSocketMessageFeatureFlag(
  featureFlags?: FeatureFlags | null,
): boolean {
  return !!featureFlags?.active_features?.includes(
    SOCKET_MESSAGE_SEND_FEATURE_FLAG,
  );
}
