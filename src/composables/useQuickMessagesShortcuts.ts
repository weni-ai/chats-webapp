import { useQuickMessagesFeatureFlag } from './useQuickMessagesFeatureFlag';

type QuickMessage = {
  uuid?: string;
};

type ActiveRoom = {
  queue?: {
    sector?: string;
  };
};

type FeatureFlags = {
  active_features?: string[];
};

type UseQuickMessagesShortcutsParams = {
  featureFlags?: FeatureFlags | null;
  activeRoom?: ActiveRoom | null;
  sharedBySector: (_sectorUuid?: string) => QuickMessage[];
  quickMessagesShared: QuickMessage[];
};

export function useQuickMessagesShortcuts({
  featureFlags,
  activeRoom,
  sharedBySector,
  quickMessagesShared,
}: UseQuickMessagesShortcutsParams): QuickMessage[] {
  if (useQuickMessagesFeatureFlag(featureFlags)) {
    return sharedBySector(activeRoom?.queue?.sector);
  }

  return quickMessagesShared;
}
