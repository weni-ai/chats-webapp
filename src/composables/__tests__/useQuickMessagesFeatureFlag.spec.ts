import { describe, expect, it } from 'vitest';
import {
  QUICK_MESSAGES_V2_FEATURE_FLAG,
  useQuickMessagesFeatureFlag,
} from '../useQuickMessagesFeatureFlag';

describe('useQuickMessagesFeatureFlag', () => {
  it('returns true when the v2 flag is active', () => {
    expect(
      useQuickMessagesFeatureFlag({
        active_features: [QUICK_MESSAGES_V2_FEATURE_FLAG],
      }),
    ).toBe(true);
  });

  it('returns false when the v2 flag is not active', () => {
    expect(useQuickMessagesFeatureFlag({ active_features: [] })).toBe(false);
    expect(useQuickMessagesFeatureFlag(null)).toBe(false);
    expect(useQuickMessagesFeatureFlag(undefined)).toBe(false);
  });
});
