import { afterEach, describe, expect, it, vi } from 'vitest';
import http from '@/services/api/http';
import Queue from '../queue';

vi.mock('@/services/api/http');

describe('Queue', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create a queue', async () => {
    const name = 'Queue 1';
    const sectorUuid = '123';
    const defaultMessage = 'Default message';

    const expectedData = {
      id: '456',
      name,
      sector: sectorUuid,
      default_message: defaultMessage,
    };

    http.post.mockResolvedValue({ data: expectedData });

    const result = await Queue.create({
      name,
      sectorUuid,
      default_message: defaultMessage,
    });

    expect(http.post).toHaveBeenCalledWith('/queue/', {
      name,
      sector: sectorUuid,
      default_message: defaultMessage,
      project: expect.anything(),
    });

    expect(result).toEqual(expectedData);
  });

  it('should list queues', async () => {
    const sectorUuid = '123';
    const offset = 0;
    const limit = 10;
    const expectedData = ['queue1', 'queue2'];

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Queue.list(sectorUuid, offset, limit);

    expect(http.get).toHaveBeenCalledWith('/queue/', {
      params: {
        sector: sectorUuid,
        ordering: '-created_on',
        offset,
        limit,
      },
    });

    expect(result).toEqual(expectedData);
  });

  it('should list queues by project', async () => {
    const expectedData = ['queue1', 'queue2'];

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Queue.listByProject();

    expect(http.get).toHaveBeenCalledWith('/queue/', {
      params: {
        project: expect.anything(),
        ordering: '-created_on',
        limit: 1000,
      },
    });

    expect(result).toEqual(expectedData);
  });

  it('should delete a queue', async () => {
    const queueUuid = '456';

    await Queue.delete(queueUuid);

    expect(http.delete).toHaveBeenCalledWith(`/queue/${queueUuid}/`);
  });

  it('should list agents in a queue', async () => {
    const queueUuid = '123';
    const offset = 0;
    const limit = 10;
    const expectedData = ['agent1', 'agent2'];

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Queue.agents(queueUuid, offset, limit);

    expect(http.get).toHaveBeenCalledWith('/authorization/queue/', {
      params: {
        queue: queueUuid,
        offset,
        limit,
      },
    });

    expect(result).toEqual(expectedData);
  });

  it('should add an agent to a queue', async () => {
    const queueUuid = '123';
    const agentUuid = '789';

    await Queue.addAgent(queueUuid, agentUuid);

    expect(http.post).toHaveBeenCalledWith('/authorization/queue/', {
      queue: queueUuid,
      permission: agentUuid,
    });
  });

  it('should remove an agent', async () => {
    const agentUuid = '789';

    await Queue.removeAgent(agentUuid);

    expect(http.delete).toHaveBeenCalledWith(
      `/authorization/queue/${agentUuid}/`,
    );
  });

  it('should edit a queue', async () => {
    const queueInfo = { uuid: '456', default_message: 'Updated message' };
    const expectedData = { default_message: 'Updated message' };

    http.patch.mockResolvedValue(expectedData);

    const result = await Queue.editQueue(queueInfo);

    expect(http.patch).toHaveBeenCalledWith(`/queue/${queueInfo.uuid}/`, {
      default_message: queueInfo.default_message,
    });

    expect(result).toEqual(expectedData);
  });

  it('should get queue information', async () => {
    const queueUuid = '456';
    const expectedData = { id: '456', name: 'Queue 1', default_message: '' };

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Queue.getQueueInformation(queueUuid);

    expect(http.get).toHaveBeenCalledWith(`/queue/${queueUuid}/`);

    expect(result).toEqual(expectedData);
  });

  it('should list tags in a queue', async () => {
    const queueUuid = '123';
    const limit = 20;
    const next = '';
    const expectedData = ['tag1', 'tag2'];

    http.get.mockResolvedValue({ data: expectedData });

    const result = await Queue.tags(queueUuid, { limit, next });

    expect(http.get).toHaveBeenCalledWith('/tag/', {
      params: { queue: queueUuid, limit },
    });

    expect(result).toEqual(expectedData);
  });
});
