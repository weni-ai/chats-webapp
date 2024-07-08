import { afterEach, describe, expect, it, vi } from 'vitest'
import http from '@/services/api/http';
import Project from '../project';

vi.mock('@/services/api/http');

describe('Project', () => {
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
        limit: 9999,
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
        limit: 9999,
      },
    });

    expect(result).toEqual(expectedData);
  });
});
