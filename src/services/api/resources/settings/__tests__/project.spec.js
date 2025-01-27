import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import http from '@/services/api/http';
import Project from '../project';
import { getProject } from '@/utils/config';

vi.mock('@/services/api/http');
vi.mock('@/utils/config');

describe('Project', () => {
  beforeEach(() => {
    getProject.mockReturnValue('project-uuid');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return admin list', async () => {
    const expectedData = ['admin1', 'admin2'];

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Project.admins();

    expect(http.get).toHaveBeenCalledWith('/permission/project/', {
      params: {
        project: expect.anything(),
        limit: 9999,
      },
    });

    expect(result).toEqual(expectedData);
  });

  it('should return managers list', async () => {
    const expectedData = ['manager1', 'manager2'];

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Project.managers();

    expect(http.get).toHaveBeenCalledWith('/permission/project/', {
      params: {
        project: expect.anything(),
        limit: 20,
      },
    });

    expect(result).toEqual(expectedData);
  });

  it('should return agents list', async () => {
    const expectedData = ['agent1', 'agent2'];

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Project.agents();

    expect(http.get).toHaveBeenCalledWith('/permission/project/', {
      params: {
        project: expect.anything(),
        limit: 20,
      },
    });

    expect(result).toEqual(expectedData);
  });

  it('should fetch all users from the API', async () => {
    const mockResponse = {
      data: [
        { id: 1, name: 'User 1', role: 'Admin' },
        { id: 2, name: 'User 2', role: 'Agent' },
        { id: 3, name: 'User 3', role: 'Manager' },
      ],
    };

    http.get.mockResolvedValueOnce(mockResponse);

    const result = await Project.allUsers();

    expect(http.get).toHaveBeenCalledWith('/project/project-uuid/list_users', {
      params: { limit: 9999 },
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('should fetch project information successfully', async () => {
    const mockResponse = {
      data: { uuid: 'mock-project-uuid', name: 'Test Project', config: {} },
    };

    http.get.mockResolvedValueOnce(mockResponse);

    const result = await Project.getInfo();

    expect(http.get).toHaveBeenCalledWith('/project/project-uuid/');
    expect(result).toEqual(mockResponse);
  });

  it('should update project configuration successfully', async () => {
    const mockData = { setting: 'value' };
    const mockResponse = { success: true };

    http.patch.mockResolvedValueOnce({ data: mockResponse });

    const result = await Project.update(mockData);

    expect(http.patch).toHaveBeenCalledWith('/project/project-uuid/', {
      config: JSON.stringify(mockData),
    });

    expect(result).toEqual(mockResponse);
  });

  it('should handle errors when updating project configuration', async () => {
    const mockData = { setting: 'value' };
    const mockError = { response: { error: 'Something went wrong' } };

    http.patch.mockRejectedValueOnce(mockError);

    const result = await Project.update(mockData);

    expect(http.patch).toHaveBeenCalledWith('/project/project-uuid/', {
      config: JSON.stringify(mockData),
    });
    expect(result).toEqual(mockError.response);
  });
});
