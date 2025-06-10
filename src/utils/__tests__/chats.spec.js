import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetChats, formatContactName } from '../chats';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useRooms } from '@/store/modules/chats/rooms';

vi.mock('@/store/modules/chats/discussions', () => ({
  useDiscussions: vi.fn(),
}));

vi.mock('@/store/modules/chats/discussionMessages', () => ({
  useDiscussionMessages: vi.fn(),
}));

vi.mock('@/store/modules/chats/roomMessages', () => ({
  useRoomMessages: vi.fn(),
}));

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

describe('resetChats', () => {
  const mockResetDiscussionMessages = vi.fn();
  const mockResetRoomMessages = vi.fn();
  const mockSetActiveDiscussion = vi.fn();
  const mockSetActiveRoom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useDiscussionMessages.mockReturnValue({
      resetDiscussionMessages: mockResetDiscussionMessages,
    });

    useRoomMessages.mockReturnValue({
      resetRoomMessages: mockResetRoomMessages,
    });

    useDiscussions.mockReturnValue({
      setActiveDiscussion: mockSetActiveDiscussion,
    });

    useRooms.mockReturnValue({
      setActiveRoom: mockSetActiveRoom,
    });
  });

  it('should call the correct store methods to reset chats', async () => {
    await resetChats();

    expect(mockResetDiscussionMessages).toHaveBeenCalledOnce();
    expect(mockResetRoomMessages).toHaveBeenCalledOnce();
    expect(mockSetActiveDiscussion).toHaveBeenCalledWith(null);
    expect(mockSetActiveRoom).toHaveBeenCalledWith(null);
  });
});

describe('formatContactName', () => {
  it('should format contact name with service chat and protocol', () => {
    const room = {
      service_chat: 'ServiceChatName',
      protocol: 'Protocol123',
      contact: { name: 'John Doe' },
    };

    const result = formatContactName(room);

    expect(result).toBe('ServiceChatName | Protocol123 | John Doe');
  });

  it('should format contact name with only service chat', () => {
    const room = {
      service_chat: 'ServiceChatName',
      contact: { name: 'John Doe' },
    };

    const result = formatContactName(room);

    expect(result).toBe('ServiceChatName | John Doe');
  });

  it('should format contact name with only protocol', () => {
    const room = {
      protocol: 'Protocol123',
      contact: { name: 'John Doe' },
    };

    const result = formatContactName(room);

    expect(result).toBe('Protocol123 | John Doe');
  });

  it('should return only contact name if service chat and protocol are missing', () => {
    const room = {
      contact: { name: 'John Doe' },
    };

    const result = formatContactName(room);

    expect(result).toBe('John Doe');
  });

  it('should handle missing room object normally', () => {
    const result = formatContactName(null);

    expect(result).toBe('');
  });
});
