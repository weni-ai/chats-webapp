import { describe, it, expect, vi, beforeEach } from 'vitest';
import discussionService from '../discussion';
import http from '@/services/api/http';
import { useRooms } from '@/store/modules/chats/rooms';
import { getProject } from '@/utils/config';

vi.mock('@/services/api/http');
vi.mock('@/store/modules/chats/rooms');
vi.mock('@/utils/config');

const mockRoom = { uuid: 'mock-room-uuid' };

beforeEach(() => {
  vi.resetAllMocks();
  useRooms.mockReturnValue({ activeRoom: mockRoom });
  getProject.mockReturnValue('mock-project-uuid');
});

describe('discussionService', () => {
  it('should create a discussion', async () => {
    const mockResponse = { id: 'mock-discussion-id' };
    http.post.mockResolvedValue({ data: mockResponse });

    const payload = {
      queue: 'mock-queue',
      subject: 'mock-subject',
      initial_message: 'mock-message',
    };

    const result = await discussionService.create(payload);

    expect(http.post).toHaveBeenCalledWith('discussion/', {
      room: 'mock-room-uuid',
      queue: 'mock-queue',
      subject: 'mock-subject',
      initial_message: 'mock-message',
    });
    expect(result).toEqual(mockResponse);
  });

  it('should delete a discussion', async () => {
    const mockDiscussionUuid = 'mock-discussion-uuid';

    http.delete.mockResolvedValue({ status: 200 });

    await discussionService.delete({
      discussionUuid: mockDiscussionUuid,
    });

    expect(http.delete).toHaveBeenCalledWith(
      `discussion/${mockDiscussionUuid}/`,
    );
  });

  it('should add an agent to a discussion', async () => {
    const mockDiscussionUuid = 'mock-discussion-uuid';
    const mockEmail = 'agent@example.com';
    const mockResponse = { success: true };
    http.post.mockResolvedValue({ data: mockResponse });

    const result = await discussionService.addAgent({
      discussionUuid: mockDiscussionUuid,
      user_email: mockEmail,
    });

    expect(http.post).toHaveBeenCalledWith(
      `discussion/${mockDiscussionUuid}/add_agents/`,
      { user_email: mockEmail },
    );
    expect(result).toEqual(mockResponse);
  });

  it('should get discussion details', async () => {
    const mockDiscussionUuid = 'mock-discussion-uuid';
    const mockResponse = { id: mockDiscussionUuid };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await discussionService.getDiscussionDetails({
      discussionUuid: mockDiscussionUuid,
    });

    expect(http.get).toHaveBeenCalledWith(`discussion/${mockDiscussionUuid}/`);
    expect(result).toEqual(mockResponse);
  });

  it('should get discussion agents', async () => {
    const mockDiscussionUuid = 'mock-discussion-uuid';
    const mockResponse = { agents: [] };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await discussionService.getDiscussionAgents({
      discussionUuid: mockDiscussionUuid,
    });

    expect(http.get).toHaveBeenCalledWith(
      `discussion/${mockDiscussionUuid}/list_agents/`,
    );
    expect(result).toEqual(mockResponse);
  });

  it('should get sectors', async () => {
    const mockResponse = { sectors: [] };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await discussionService.getSectors();

    expect(http.get).toHaveBeenCalledWith(
      `project/mock-project-uuid/list_discussion_sector/`,
      { limit: 9999 },
    );
    expect(result).toEqual(mockResponse);
  });

  it('should list all discussions', async () => {
    const mockResponse = { discussions: [] };
    http.get.mockResolvedValue({ data: mockResponse });

    const filters = { status: 'active' };
    const viewedAgent = 'agent@example.com';

    const result = await discussionService.listAll({ viewedAgent, filters });

    expect(http.get).toHaveBeenCalledWith('discussion/', {
      params: {
        project: 'mock-project-uuid',
        is_active: true,
        limit: 9999,
        status: 'active',
        email: 'agent@example.com',
      },
    });
    expect(result).toEqual(mockResponse);
  });

  it('should list closed discussions', async () => {
    const mockRoomId = 'mock-room-id';
    const mockResponse = { discussions: [] };
    http.get.mockResolvedValue({ data: mockResponse });

    const result = await discussionService.listCloseds({ roomId: mockRoomId });

    expect(http.get).toHaveBeenCalledWith('discussion/', {
      params: {
        project: 'mock-project-uuid',
        room: mockRoomId,
      },
    });
    expect(result).toEqual(mockResponse);
  });
});
