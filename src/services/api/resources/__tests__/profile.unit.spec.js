import { beforeEach, describe, vi } from 'vitest';
import profileApi from '../profile';
import http from '@/services/api/http';
import { getProject, getToken } from '@/utils/config';

vi.mock('@/services/api/http');
vi.mock('@/utils/config');

describe('Profile services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('me', () => {
    it('should call the correct endpoint and return user data', async () => {
      const mockResponse = { data: { name: 'Test User' } };
      http.get.mockResolvedValue(mockResponse);
      getProject.mockReturnValue('project-uuid');

      const result = await profileApi.me();

      expect(http.get).toHaveBeenCalledWith('/accounts/profile/', {
        params: { project_uuid: 'project-uuid' },
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('onboarded', () => {
    it('should verify user onboarding status', async () => {
      const mockResponse = { data: { first_access: false } };
      http.get.mockResolvedValue(mockResponse);
      getProject.mockReturnValue('project-uuid');

      const result = await profileApi.onboarded();

      expect(http.get).toHaveBeenCalledWith(
        '/permission/project/verify_access/',
        { params: { project: 'project-uuid' } },
      );
      expect(result).toBe(true);
    });
  });

  describe('onboard', () => {
    it('should call the correct endpoint to onboard user', async () => {
      getProject.mockReturnValue('project-uuid');
      http.patch.mockResolvedValue();

      await profileApi.onboard();

      expect(http.patch).toHaveBeenCalledWith(
        '/permission/project/update_access/?project=project-uuid',
      );
    });
  });

  describe('status', () => {
    it('should fetch the project connection status', async () => {
      const mockResponse = { data: { connection_status: 'online' } };
      http.get.mockResolvedValue(mockResponse);
      getProject.mockReturnValue('project-uuid');
      getToken.mockReturnValue('fake-token');

      const result = await profileApi.status();

      expect(http.get).toHaveBeenCalledWith(
        '/internal/permission/project/status/?project=project-uuid',
        {
          headers: { Authorization: 'Bearer fake-token' },
        },
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateStatus', () => {
    it('should update the project connection status', async () => {
      const payload = { projectUuid: 'project-uuid', status: 'offline' };
      http.post.mockResolvedValue();

      await profileApi.updateStatus(payload);

      expect(http.post).toHaveBeenCalledWith(
        '/internal/permission/project/status/',
        {
          project: 'project-uuid',
          status: 'offline',
        },
      );
    });
  });
});
