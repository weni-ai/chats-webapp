import { describe, expect, it } from 'vitest';
import { QUICK_MESSAGES_V2_FEATURE_FLAG } from '../useQuickMessagesFeatureFlag';
import { useQuickMessagesShortcuts } from '../useQuickMessagesShortcuts';

describe('useQuickMessagesShortcuts', () => {
  const sharedBySector = (sectorUuid?: string) => [
    { uuid: 'sector', shortcut: '/sector', text: 'sector', sectorUuid },
  ];
  const quickMessagesShared = [
    { uuid: 'shared', shortcut: '/shared', text: 'shared' },
  ];

  it('returns sector shortcuts when v2 flag is enabled', () => {
    const shortcuts = useQuickMessagesShortcuts({
      featureFlags: { active_features: [QUICK_MESSAGES_V2_FEATURE_FLAG] },
      activeRoom: { queue: { sector: 'sector-1' } },
      sharedBySector,
      quickMessagesShared,
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

  it('returns project shared shortcuts when v2 flag is disabled', () => {
    const shortcuts = useQuickMessagesShortcuts({
      featureFlags: { active_features: [] },
      activeRoom: { queue: { sector: 'sector-1' } },
      sharedBySector,
      quickMessagesShared,
    });

    expect(shortcuts).toEqual(quickMessagesShared);
  });
});
