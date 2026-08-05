import { describe, expect, it } from 'vitest';
import { useQuickMessagesShortcuts } from '../useQuickMessagesShortcuts';

describe('useQuickMessagesShortcuts', () => {
  const sharedBySector = (sectorUuid?: string) => [
    { uuid: 'sector', shortcut: '/sector', text: 'sector', sectorUuid },
  ];

  it('returns sector shortcuts for the active room sector', () => {
    const shortcuts = useQuickMessagesShortcuts({
      activeRoom: { queue: { sector: 'sector-1' } },
      sharedBySector,
    });

    expect(shortcuts).toEqual([
      {
        uuid: 'sector',
        shortcut: '/sector',
        text: 'sector',
        sectorUuid: 'sector-1',
      },
    ]);
  });
});
