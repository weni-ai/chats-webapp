import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import http from '@/services/api/http';
import FeatureFlagApi from '../featureFlag';
import { getProject } from '@/utils/config';

vi.mock('@/services/api/http');
vi.mock('@/utils/config');

describe('FeatureFlagApi', () => {
  beforeEach(() => {
    getProject.mockReturnValue('project-uuid');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAllFeatureFlags', () => {
    it('should return all feature flags for the project', async () => {
      const mockFeatureFlags = [
        { id: 1, name: 'feature_1', enabled: true },
        { id: 2, name: 'feature_2', enabled: false },
      ];

      http.get.mockResolvedValue({ data: mockFeatureFlags });

      const result = await FeatureFlagApi.getAllFeatureFlags();

      expect(http.get).toHaveBeenCalledWith('/feature_flags/', {
        params: {
          project_uuid: 'project-uuid',
        },
      });
      expect(result).toEqual(mockFeatureFlags);
    });

    it('should handle empty feature flags response', async () => {
      const mockEmptyResponse = [];

      http.get.mockResolvedValue({ data: mockEmptyResponse });

      const result = await FeatureFlagApi.getAllFeatureFlags();

      expect(http.get).toHaveBeenCalledWith('/feature_flags/', {
        params: {
          project_uuid: 'project-uuid',
        },
      });
      expect(result).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      const mockError = new Error('API Error');

      http.get.mockRejectedValue(mockError);

      await expect(FeatureFlagApi.getAllFeatureFlags()).rejects.toThrow(
        'API Error',
      );

      expect(http.get).toHaveBeenCalledWith('/feature_flags/', {
        params: {
          project_uuid: 'project-uuid',
        },
      });
    });

    it('should use the correct project UUID from config', async () => {
      getProject.mockReturnValue('different-project-uuid');

      http.get.mockResolvedValue({ data: [] });

      await FeatureFlagApi.getAllFeatureFlags();

      expect(getProject).toHaveBeenCalled();
      expect(http.get).toHaveBeenCalledWith('/feature_flags/', {
        params: {
          project_uuid: 'different-project-uuid',
        },
      });
    });

    it('should handle null project UUID', async () => {
      getProject.mockReturnValue(null);

      http.get.mockResolvedValue({ data: [] });

      await FeatureFlagApi.getAllFeatureFlags();

      expect(http.get).toHaveBeenCalledWith('/feature_flags/', {
        params: {
          project_uuid: null,
        },
      });
    });

    it('should handle undefined project UUID', async () => {
      getProject.mockReturnValue(undefined);

      http.get.mockResolvedValue({ data: [] });

      await FeatureFlagApi.getAllFeatureFlags();

      expect(http.get).toHaveBeenCalledWith('/feature_flags/', {
        params: {
          project_uuid: undefined,
        },
      });
    });

    it('should return the exact data structure from API response', async () => {
      const mockComplexResponse = {
        feature_flags: [
          {
            id: 1,
            name: 'advanced_chat_features',
            enabled: true,
            description: 'Enable advanced chat features',
            created_at: '2025-01-08T10:00:00Z',
            updated_at: '2025-01-08T12:00:00Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
        },
      };

      http.get.mockResolvedValue({ data: mockComplexResponse });

      const result = await FeatureFlagApi.getAllFeatureFlags();

      expect(result).toEqual(mockComplexResponse);
      expect(result.feature_flags).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
