import { setActivePinia, createPinia } from 'pinia';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { useDiscussions } from '../discussions';
import Discussion from '@/services/api/resources/chats/discussion';

vi.mock('@/services/api/resources/chats/discussion', () => ({
  default: {
    listAll: vi.fn(),
    listCloseds: vi.fn(),
    create: vi.fn(),
    addAgent: vi.fn(),
    delete: vi.fn(),
    getDiscussionDetails: vi.fn(),
    getDiscussionAgents: vi.fn(),
  },
}));

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(() => ({
    activeRoom: {
      contact: { name: 'John Doe' },
    },
  })),
}));

describe('useDiscussions Store', () => {
  let discussions;
  beforeEach(() => {
    setActivePinia(createPinia());
    discussions = useDiscussions();
  });

  it('should initialize with default state', () => {
    expect(discussions.discussions).toEqual([]);
    expect(discussions.discussionsCloseds).toEqual([]);
    expect(discussions.activeDiscussion).toBe(null);
    expect(discussions.newMessagesByDiscussion).toEqual({});
  });

  it('should set discussions', () => {
    const mockDiscussions = [{ uuid: '123', subject: 'Test Discussion' }];

    discussions.setDiscussions(mockDiscussions);

    expect(discussions.discussions).toEqual(mockDiscussions);
  });

  it('should add a discussion', () => {
    const discussion = { uuid: '123', subject: 'New Discussion' };

    discussions.addDiscussion(discussion);

    expect(discussions.discussions[0]).toEqual(discussion);
  });

  it('should set active discussion', () => {
    const discussion = { uuid: '123', subject: 'Active Discussion' };

    discussions.setActiveDiscussion(discussion);

    expect(discussions.activeDiscussion).toEqual(discussion);
  });

  it('should fetch all discussions', async () => {
    const mockDiscussions = {
      results: [{ uuid: '123', subject: 'Discussion' }],
    };
    Discussion.listAll.mockResolvedValue(mockDiscussions);

    await discussions.getAll({ viewedAgent: 'agent1', filters: {} });

    expect(Discussion.listAll).toHaveBeenCalledWith({
      viewedAgent: 'agent1',
      filters: {},
    });
    expect(discussions.discussions).toEqual(mockDiscussions.results);
  });

  it('should fetch all closed discussions', async () => {
    const mockClosedDiscussions = {
      results: [{ uuid: '456', subject: 'Closed Discussion' }],
    };
    Discussion.listCloseds.mockResolvedValue(mockClosedDiscussions);

    await discussions.getAllClosed({ roomId: 'room1' });

    expect(Discussion.listCloseds).toHaveBeenCalledWith({ roomId: 'room1' });
    expect(discussions.discussionsCloseds).toEqual(
      mockClosedDiscussions.results,
    );
  });

  it('should create a discussion', async () => {
    const discussionData = {
      queue: 'queue1',
      subject: 'New Subject',
      initial_message: 'Hello',
    };
    const mockResponse = { uuid: '789', subject: 'New Subject' };
    Discussion.create.mockResolvedValue(mockResponse);

    const result = await discussions.create(discussionData);

    expect(Discussion.create).toHaveBeenCalledWith(discussionData);
    expect(discussions.discussions[0]).toEqual({
      ...mockResponse,
      contact: 'John Doe',
    });
    expect(discussions.activeDiscussion).toEqual({
      ...mockResponse,
      contact: 'John Doe',
    });
    expect(result).toEqual(mockResponse);
  });

  it('should remove a discussion', () => {
    discussions.setDiscussions([{ uuid: '123', subject: 'Test' }]);

    discussions.removeDiscussion('123');

    expect(discussions.discussions).toEqual([]);
  });

  it('should delete a discussion', async () => {
    discussions.setActiveDiscussion({ uuid: '123', subject: 'To Delete' });

    Discussion.delete.mockResolvedValue();

    await discussions.delete();

    expect(Discussion.delete).toHaveBeenCalledWith({ discussionUuid: '123' });
    expect(discussions.discussions).toEqual([]);
    expect(discussions.activeDiscussion).toBe(null);
  });

  it('should fetch discussion details', async () => {
    discussions.setActiveDiscussion({ uuid: '123' });

    Discussion.getDiscussionDetails.mockResolvedValue({ data: 'details' });

    const result = await discussions.getDiscussionDetails();

    expect(Discussion.getDiscussionDetails).toHaveBeenCalledWith({
      discussionUuid: '123',
    });
    expect(result).toEqual({ data: 'details' });
  });

  it('should fetch discussion agents', async () => {
    discussions.setActiveDiscussion({ uuid: '123' });

    Discussion.getDiscussionAgents.mockResolvedValue({ data: 'agents' });

    const result = await discussions.getDiscussionAgents();

    expect(Discussion.getDiscussionAgents).toHaveBeenCalledWith({
      discussionUuid: '123',
    });
    expect(result).toEqual({ data: 'agents' });
  });

  it('should get discussion by id', () => {
    discussions.setDiscussions([{ uuid: '123', subject: 'Find Me' }]);

    const result = discussions.getDiscussionById('123');

    expect(result).toEqual({ uuid: '123', subject: 'Find Me' });
  });
});
