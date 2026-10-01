import { describe, it, expect, beforeEach, vi } from 'vitest';

import Group from '@/services/api/resources/settings/group';
import Sector from '@/services/api/resources/settings/sector';
import { listSecondarySectorOrigins } from '../copilotOrigin';

vi.mock('@/services/api/resources/settings/group', () => ({
  default: {
    listProjects: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/sector', () => ({
  default: {
    list: vi.fn(),
  },
}));

describe('listSecondarySectorOrigins', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps sectors from secondary projects to their project uuid', async () => {
    Group.listProjects.mockResolvedValue({
      results: [{ uuid: 'secondary-1' }, { uuid: 'secondary-2' }],
      next: null,
    });
    Sector.list.mockImplementation(({ project }) => {
      if (project === 'secondary-1') {
        return Promise.resolve({
          results: [{ uuid: 'sector-a' }, { uuid: 'sector-b' }],
          next: null,
        });
      }

      return Promise.resolve({
        results: [{ uuid: 'sector-c' }],
        next: null,
      });
    });

    const origins = await listSecondarySectorOrigins('org-1');

    expect(Group.listProjects).toHaveBeenCalledWith({
      orgUuid: 'org-1',
      limit: 50,
      offset: 0,
      params: { its_principal: false },
    });
    expect(Sector.list).toHaveBeenCalledWith({
      project: 'secondary-1',
      limit: 50,
      offset: 0,
    });
    expect(Sector.list).toHaveBeenCalledWith({
      project: 'secondary-2',
      limit: 50,
      offset: 0,
    });
    expect(origins).toEqual({
      'sector-a': 'secondary-1',
      'sector-b': 'secondary-1',
      'sector-c': 'secondary-2',
    });
  });

  it('pages through projects and sectors until next is empty', async () => {
    Group.listProjects
      .mockResolvedValueOnce({
        results: [{ uuid: 'secondary-1' }],
        next: 'https://example.com/projects/?offset=50',
      })
      .mockResolvedValueOnce({
        results: [{ uuid: 'secondary-2' }],
        next: null,
      });
    Sector.list.mockImplementation(({ project, offset }) => {
      if (project === 'secondary-1' && offset === 0) {
        return Promise.resolve({
          results: [{ uuid: 'sector-a' }],
          next: 'https://example.com/sector/?offset=50',
        });
      }

      if (project === 'secondary-1' && offset === 50) {
        return Promise.resolve({
          results: [{ uuid: 'sector-b' }],
          next: null,
        });
      }

      return Promise.resolve({
        results: [{ uuid: 'sector-c' }],
        next: null,
      });
    });

    const origins = await listSecondarySectorOrigins('org-1');

    expect(Group.listProjects).toHaveBeenCalledTimes(2);
    expect(Group.listProjects).toHaveBeenNthCalledWith(2, {
      orgUuid: 'org-1',
      limit: 50,
      offset: 50,
      params: { its_principal: false },
    });
    expect(origins).toEqual({
      'sector-a': 'secondary-1',
      'sector-b': 'secondary-1',
      'sector-c': 'secondary-2',
    });
  });
});
