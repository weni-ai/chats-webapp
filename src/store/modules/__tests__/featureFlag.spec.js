import { setActivePinia, createPinia } from 'pinia';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { useFeatureFlag } from '../featureFlag';

import FeatureFlag from '@/services/api/resources/featureFlag/featureFlag';

vi.mock('@/services/api/resources/featureFlag/featureFlag', () => ({
  default: {
    getAllFeatureFlags: vi.fn(),
  },
}));

describe('useFeatureFlag Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const featureFlagStore = useFeatureFlag();

    expect(featureFlagStore.featureFlags).toEqual({});
    expect(featureFlagStore.isLoadingFeatureFlags).toBe(false);
  });

  it('should set loading state to true when getFeatureFlags is called', async () => {
    const featureFlagStore = useFeatureFlag();

    FeatureFlag.getAllFeatureFlags.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({}), 100)),
    );

    const promise = featureFlagStore.getFeatureFlags();

    expect(featureFlagStore.isLoadingFeatureFlags).toBe(true);

    await promise;
  });

  it('should fetch and update feature flags when getFeatureFlags is called successfully', async () => {
    const featureFlagStore = useFeatureFlag();
    const mockFeatureFlags = {
      feature_1: { enabled: true, name: 'Feature 1' },
      feature_2: { enabled: false, name: 'Feature 2' },
    };

    FeatureFlag.getAllFeatureFlags.mockResolvedValue(mockFeatureFlags);

    await featureFlagStore.getFeatureFlags();

    expect(featureFlagStore.featureFlags).toEqual(mockFeatureFlags);
    expect(featureFlagStore.isLoadingFeatureFlags).toBe(false);
    expect(FeatureFlag.getAllFeatureFlags).toHaveBeenCalledTimes(1);
  });

  it('should handle empty feature flags response', async () => {
    const featureFlagStore = useFeatureFlag();

    FeatureFlag.getAllFeatureFlags.mockResolvedValue({});

    await featureFlagStore.getFeatureFlags();

    expect(featureFlagStore.featureFlags).toEqual({});
    expect(featureFlagStore.isLoadingFeatureFlags).toBe(false);
  });

  it('should handle array response from API', async () => {
    const featureFlagStore = useFeatureFlag();
    const mockFeatureFlagsArray = [
      { id: 1, name: 'feature_1', enabled: true },
      { id: 2, name: 'feature_2', enabled: false },
    ];

    FeatureFlag.getAllFeatureFlags.mockResolvedValue(mockFeatureFlagsArray);

    await featureFlagStore.getFeatureFlags();

    expect(featureFlagStore.featureFlags).toEqual(mockFeatureFlagsArray);
    expect(featureFlagStore.isLoadingFeatureFlags).toBe(false);
  });

  it('should handle API errors gracefully and set loading to false', async () => {
    const featureFlagStore = useFeatureFlag();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockError = new Error('API Error');
    FeatureFlag.getAllFeatureFlags.mockRejectedValue(mockError);

    await featureFlagStore.getFeatureFlags();

    expect(featureFlagStore.featureFlags).toEqual({});
    expect(featureFlagStore.isLoadingFeatureFlags).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error getting feature flags',
      mockError,
    );

    consoleSpy.mockRestore();
  });

  it('should maintain previous feature flags state when API call fails', async () => {
    const featureFlagStore = useFeatureFlag();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const initialFeatureFlags = { feature_1: { enabled: true } };
    featureFlagStore.featureFlags = initialFeatureFlags;

    const mockError = new Error('Network Error');
    FeatureFlag.getAllFeatureFlags.mockRejectedValue(mockError);

    await featureFlagStore.getFeatureFlags();

    expect(featureFlagStore.featureFlags).toEqual(initialFeatureFlags);
    expect(featureFlagStore.isLoadingFeatureFlags).toBe(false);

    consoleSpy.mockRestore();
  });

  it('should handle multiple concurrent calls correctly', async () => {
    const featureFlagStore = useFeatureFlag();
    const mockFeatureFlags = { feature_1: { enabled: true } };

    FeatureFlag.getAllFeatureFlags.mockResolvedValue(mockFeatureFlags);

    const promises = [
      featureFlagStore.getFeatureFlags(),
      featureFlagStore.getFeatureFlags(),
      featureFlagStore.getFeatureFlags(),
    ];

    await Promise.all(promises);

    expect(featureFlagStore.featureFlags).toEqual(mockFeatureFlags);
    expect(featureFlagStore.isLoadingFeatureFlags).toBe(false);
    expect(FeatureFlag.getAllFeatureFlags).toHaveBeenCalledTimes(3);
  });

  it('should reset loading state even if API call throws synchronously', async () => {
    const featureFlagStore = useFeatureFlag();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    FeatureFlag.getAllFeatureFlags.mockImplementation(() => {
      throw new Error('Synchronous error');
    });

    await featureFlagStore.getFeatureFlags();

    expect(featureFlagStore.isLoadingFeatureFlags).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
