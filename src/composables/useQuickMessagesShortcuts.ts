type QuickMessage = {
  uuid?: string;
};

type ActiveRoom = {
  queue?: {
    sector?: string;
  };
};

type UseQuickMessagesShortcutsParams = {
  activeRoom?: ActiveRoom | null;
  sharedBySector: (_sectorUuid?: string) => QuickMessage[];
};

export function useQuickMessagesShortcuts({
  activeRoom,
  sharedBySector,
}: UseQuickMessagesShortcutsParams): QuickMessage[] {
  return sharedBySector(activeRoom?.queue?.sector);
}
