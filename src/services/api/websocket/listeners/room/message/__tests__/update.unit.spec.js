import { describe, it, expect, vi, beforeEach } from 'vitest';
import wsRoomMessageUpdate from '@/services/api/websocket/listeners/room/message/update';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

vi.mock('@/store/modules/chats/roomMessages', () => ({
  useRoomMessages: vi.fn(),
}));

describe('Room message update', () => {
  let appMock;
  let addMessageMock;
  let roomsStoreMock;

  beforeEach(() => {
    appMock = {
      me: {
        email: 'user@example.com',
      },
    };

    addMessageMock = vi.fn();
    roomsStoreMock = {
      addMessage: addMessageMock,
    };

    useRoomMessages.mockReturnValue(roomsStoreMock);
  });

  it('should not add a message if the sender is the current user', async () => {
    const message = {
      user: {
        email: 'user@example.com',
      },
    };

    await wsRoomMessageUpdate(message, { app: appMock });

    expect(addMessageMock).not.toHaveBeenCalled();
  });

  it('should add a message if the sender is different from the current user', async () => {
    const message = {
      user: {
        email: 'otheruser@example.com',
      },
    };

    await wsRoomMessageUpdate(message, { app: appMock });

    expect(addMessageMock).toHaveBeenCalledWith(message);
  });

  it('should add a message if the user is undefined in the message', async () => {
    const message = {
      user: undefined,
    };

    await wsRoomMessageUpdate(message, { app: appMock });

    expect(addMessageMock).toHaveBeenCalledWith(message);
  });
});
