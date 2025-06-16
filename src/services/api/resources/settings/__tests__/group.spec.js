import { afterEach, describe, expect, it, vi } from 'vitest';
import http from '@/services/api/http';
import { getProject } from '@/utils/config';
import Group from '../group';

vi.mock('@/services/api/http');
vi.mock('@/utils/config');

describe('Group', () => {
  const mockProject = 'test-project-uuid';
  const mockGroupUuid = 'group-uuid-123';
  const mockSectorUuid = 'sector-uuid-456';
  const mockOrgUuid = 'org-uuid-789';
  const mockPermissionUuid = 'permission-uuid-abc';

  beforeEach(() => {
    getProject.mockReturnValue(mockProject);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should list groups with nextReq params', async () => {
      const nextReq = 'https://api.example.com/group_sector/?page=2&limit=10';
      const expectedData = { results: ['group1', 'group2'], count: 2 };

      http.get.mockResolvedValue({ data: expectedData });

      const result = await Group.list({ nextReq });

      expect(http.get).toHaveBeenCalledWith('/group_sector/', {
        params: {
          page: '2',
          limit: '10',
          project: mockProject,
        },
      });
      expect(result).toEqual(expectedData);
    });

    it('should list groups without nextReq params', async () => {
      const expectedData = { results: ['group1'], count: 1 };

      http.get.mockResolvedValue({ data: expectedData });

      const result = await Group.list({});

      expect(http.get).toHaveBeenCalledWith('/group_sector/', {
        params: { project: mockProject },
      });
      expect(result).toEqual(expectedData);
    });
  });

  describe('create', () => {
    it('should create a group', async () => {
      const body = { name: 'Test Group', description: 'Test Description' };
      const expectedData = { id: '123', ...body, project: mockProject };

      http.post.mockResolvedValue({ data: expectedData });

      const result = await Group.create(body);

      expect(http.post).toHaveBeenCalledWith('/group_sector/', {
        ...body,
        project: mockProject,
      });
      expect(result).toEqual(expectedData);
    });
  });

  describe('show', () => {
    it('should show a specific group', async () => {
      const expectedData = { id: mockGroupUuid, name: 'Test Group' };

      http.get.mockResolvedValue({ data: expectedData });

      const result = await Group.show(mockGroupUuid);

      expect(http.get).toHaveBeenCalledWith(`/group_sector/${mockGroupUuid}/`);
      expect(result).toEqual(expectedData);
    });
  });

  describe('update', () => {
    it('should update a group', async () => {
      const body = {
        name: 'Updated Group',
        description: 'Updated Description',
      };
      const expectedData = { id: mockGroupUuid, ...body };

      http.patch.mockResolvedValue({ data: expectedData });

      const result = await Group.update({ groupUuid: mockGroupUuid, body });

      expect(http.patch).toHaveBeenCalledWith(
        `/group_sector/${mockGroupUuid}/`,
        {
          ...body,
          project: mockProject,
        },
      );
      expect(result).toEqual(expectedData);
    });
  });

  describe('delete', () => {
    it('should delete a group', async () => {
      const expectedData = { success: true };

      http.delete.mockResolvedValue({ data: expectedData });

      const result = await Group.delete(mockGroupUuid);

      expect(http.delete).toHaveBeenCalledWith(
        `/group_sector/${mockGroupUuid}/`,
      );
      expect(result).toEqual(expectedData);
    });
  });

  describe('listProjects', () => {
    it('should list projects for an organization', async () => {
      const limit = 20;
      const offset = 0;
      const params = { search: 'test' };
      const expectedData = { results: ['project1', 'project2'], count: 2 };

      http.get.mockResolvedValue({ data: expectedData });

      const result = await Group.listProjects({
        limit,
        offset,
        orgUuid: mockOrgUuid,
        params,
      });

      expect(http.get).toHaveBeenCalledWith(`/org/${mockOrgUuid}/projects/`, {
        params: { ...params, limit, offset },
      });
      expect(result).toEqual(expectedData);
    });
  });

  describe('sector management', () => {
    it('should add a sector to a group', async () => {
      const expectedData = { success: true, sector: mockSectorUuid };

      http.post.mockResolvedValue({ data: expectedData });

      const result = await Group.addSector({
        groupUuid: mockGroupUuid,
        sectorUuid: mockSectorUuid,
      });

      expect(http.post).toHaveBeenCalledWith(
        `/group_sector/${mockGroupUuid}/add_sector/`,
        { sector: mockSectorUuid },
      );
      expect(result).toEqual(expectedData);
    });

    it('should remove a sector from a group', async () => {
      const expectedData = { success: true };

      http.post.mockResolvedValue({ data: expectedData });

      const result = await Group.removeSector({
        groupUuid: mockGroupUuid,
        sectorUuid: mockSectorUuid,
      });

      expect(http.post).toHaveBeenCalledWith(
        `/group_sector/${mockGroupUuid}/remove_sector/`,
        { sector: mockSectorUuid },
      );
      expect(result).toEqual(expectedData);
    });
  });

  describe('authorization management', () => {
    const mockRole = 'admin';
    const mockGroupSectorUuid = 'group-sector-uuid-def';

    it('should list authorizations for a group sector', async () => {
      const expectedData = { results: ['auth1', 'auth2'], count: 2 };

      http.get.mockResolvedValue({ data: expectedData });

      const result = await Group.listAuthorization({
        groupSectorUuid: mockGroupSectorUuid,
        role: mockRole,
      });

      expect(http.get).toHaveBeenCalledWith('/authorization/group_sector/', {
        params: {
          group_sector: mockGroupSectorUuid,
          role: mockRole,
          limit: 9999,
        },
      });
      expect(result).toEqual(expectedData);
    });

    it('should add authorization to a group sector', async () => {
      const expectedData = {
        id: 'auth-123',
        role: mockRole,
        permission: mockPermissionUuid,
        group_sector: mockGroupSectorUuid,
      };

      http.post.mockResolvedValue({ data: expectedData });

      const result = await Group.addAuthorization({
        groupSectorUuid: mockGroupSectorUuid,
        permissionUuid: mockPermissionUuid,
        role: mockRole,
      });

      expect(http.post).toHaveBeenCalledWith('/authorization/group_sector/', {
        role: mockRole,
        permission: mockPermissionUuid,
        group_sector: mockGroupSectorUuid,
      });
      expect(result).toEqual(expectedData);
    });

    it('should delete authorization from a group sector', async () => {
      const expectedData = { success: true };

      http.delete.mockResolvedValue({ data: expectedData });

      const result = await Group.deleteAuthorization({
        permissionUuid: mockPermissionUuid,
      });

      expect(http.delete).toHaveBeenCalledWith(
        `/authorization/group_sector/${mockPermissionUuid}/`,
      );
      expect(result).toEqual(expectedData);
    });
  });
});
