import { describe, it, expect } from 'vitest';
import {
  MEDIA_MESSAGES_WITH_TEXT_FEATURE_FLAG,
  useMediaMessagesWithTextFeatureFlag,
} from '../useMediaMessagesWithTextFeatureFlag';

describe('useMediaMessagesWithTextFeatureFlag', () => {
  it('exports the media messages with text feature flag name', () => {
    expect(MEDIA_MESSAGES_WITH_TEXT_FEATURE_FLAG).toBe(
      'weniChatsEnableMediaMessagesWithText',
    );
  });

  it('returns true when the flag is active', () => {
    expect(
      useMediaMessagesWithTextFeatureFlag({
        active_features: ['weniChatsEnableMediaMessagesWithText'],
      }),
    ).toBe(true);
  });

  it('returns false when the flag is not active', () => {
    expect(
      useMediaMessagesWithTextFeatureFlag({
        active_features: ['weniChatsSocketMessageSend'],
      }),
    ).toBe(false);
  });

  it('returns false when feature flags are missing', () => {
    expect(useMediaMessagesWithTextFeatureFlag(null)).toBe(false);
    expect(useMediaMessagesWithTextFeatureFlag(undefined)).toBe(false);
    expect(useMediaMessagesWithTextFeatureFlag({})).toBe(false);
  });
});
