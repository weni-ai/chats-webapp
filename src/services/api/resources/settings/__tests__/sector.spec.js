import { afterEach, describe, expect, it, vi } from 'vitest';
import http from '@/services/api/http';
import Sector from '../sector';

vi.mock('@/services/api/http');

describe('Sector', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return list of sectors', async () => {
    const expectedData = ['sector1', 'sector2'];

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Sector.list();

    expect(http.get).toHaveBeenCalledWith('/sector/', {
      params: { project: expect.anything() },
    });

    expect(result).toEqual(expectedData);
  });

  it('should return count of available sectors', async () => {
    const expectedData = 5;

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Sector.countOfSectorsAvaible();

    expect(http.get).toHaveBeenCalledWith('/sector/count/', {
      params: { project: expect.anything() },
    });

    expect(result).toEqual(expectedData);
  });

  it('should return a specific sector', async () => {
    const expectedData = { id: '123', name: 'Sector 1' };
    const sectorUuid = '123';

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Sector.find(sectorUuid);

    expect(http.get).toHaveBeenCalledWith(`/sector/${sectorUuid}/`);

    expect(result).toEqual(expectedData);
  });

  it('should return the list of agents of a sector', async () => {
    const expectedData = ['agent1', 'agent2'];
    const sectorUuid = '123';

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Sector.agents({ sectorUuid });

    expect(http.get).toHaveBeenCalledWith(`/sector/${sectorUuid}/agents/`);

    expect(result).toEqual(expectedData);
  });

  it('should create a new sector', async () => {
    const props = { name: 'New Sector' };
    const expectedData = { id: '456', name: 'New Sector' };

    http.post.mockResolvedValue({ data: expectedData });

    const result = await Sector.create(props);

    expect(http.post).toHaveBeenCalledWith('/sector/', {
      ...props,
      project: expect.anything(),
    });

    expect(result).toEqual(expectedData);
  });

  it('should update a sector', async () => {
    const uuid = '456';
    const data = { name: 'Sector Updated' };

    http.patch.mockResolvedValue({ data });

    const result = await Sector.update(uuid, data);

    expect(http.patch).toHaveBeenCalledWith(`/sector/${uuid}/`, data);

    expect(result).toEqual(data);
  });

  it('should return the list of managers of a sector', async () => {
    const expectedData = ['manager1', 'manager2'];
    const sectorUuid = '123';

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Sector.managers(sectorUuid);

    expect(http.get).toHaveBeenCalledWith('/authorization/sector/', {
      params: {
        sector: sectorUuid,
      },
    });

    expect(result).toEqual(expectedData);
  });

  it('should add a manager to a sector', async () => {
    const sectorUuid = '123';
    const managerUuid = '789';

    await Sector.addManager(sectorUuid, managerUuid);

    expect(http.post).toHaveBeenCalledWith('/authorization/sector/', {
      role: 1, // manager
      sector: sectorUuid,
      permission: managerUuid,
    });
  });

  it('should remove a manager', async () => {
    const managerUuid = '789';

    await Sector.removeManager(managerUuid);

    expect(http.delete).toHaveBeenCalledWith(
      `/authorization/sector/${managerUuid}/`,
    );
  });

  it('should return a list of tags for a sector', async () => {
    const expectedData = ['tag1', 'tag2'];
    const sectorUuid = '123';

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Sector.tags(sectorUuid, { limit: 20, next: '' });

    expect(http.get).toHaveBeenCalledWith('/tag/', {
      params: { sector: sectorUuid, limit: 20 },
    });

    expect(result).toEqual(expectedData);
  });

  it('should add a tag to a sector', async () => {
    const sectorUuid = '123';
    const tagName = 'New Tag';
    const expectedData = { id: '456', name: tagName };

    http.post.mockResolvedValue({ data: expectedData });

    const result = await Sector.addTag(sectorUuid, tagName);

    expect(http.post).toHaveBeenCalledWith('/tag/', {
      sector: sectorUuid,
      name: tagName,
    });

    expect(result).toEqual(expectedData);
  });

  it('should remove a tag', async () => {
    const tagUuid = '456';

    await Sector.removeTag(tagUuid);

    expect(http.delete).toHaveBeenCalledWith(`/tag/${tagUuid}/`);
  });
});
