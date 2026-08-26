import { describe, it, expect } from 'vitest';
import {
  ASSISTED_SALES_FEATURE_FLAG,
  useAssistedSalesFeatureFlag,
} from '../useAssistedSalesFeatureFlag';

describe('useAssistedSalesFeatureFlag', () => {
  it('exports the assisted sales feature flag name', () => {
    expect(ASSISTED_SALES_FEATURE_FLAG).toBe('weniChatsAssistedSales');
  });

  it('returns true when the flag is active', () => {
    expect(
      useAssistedSalesFeatureFlag({
        active_features: ['weniChatsAssistedSales'],
      }),
    ).toBe(true);
  });

  it('returns false when the flag is not active', () => {
    expect(
      useAssistedSalesFeatureFlag({
        active_features: ['weniChatsMessageDictation'],
      }),
    ).toBe(false);
  });

  it('returns false when feature flags are missing', () => {
    expect(useAssistedSalesFeatureFlag(null)).toBe(false);
    expect(useAssistedSalesFeatureFlag(undefined)).toBe(false);
    expect(useAssistedSalesFeatureFlag({})).toBe(false);
  });
});
