import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendRoomMessageBySocket } from '@/services/api/websocket/messages';
import {
  isSocketOpen,
  getActiveConnection,
} from '@/services/api/websocket/connectionRegistry';
import {
  resolvePendingRequest,
  clearPendingRequests,
} from '@/services/api/websocket/pendingRequests';
import { SocketNotConnectedError } from '@/services/api/websocket/errors';

vi.mock('@/services/api/websocket/connectionRegistry', () => ({
  isSocketOpen: vi.fn(),
  getActiveConnection: vi.fn(),
}));

describe('sendRoomMessageBySocket', () => {
  const sendMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clearPendingRequests();
    getActiveConnection.mockReturnValue({
      ws: { send: sendMock },
    });
  });

  it('should throw SocketNotConnectedError when socket is closed', async () => {
    isSocketOpen.mockReturnValue(false);

    await expect(
      sendRoomMessageBySocket({
        room: 'room-1',
        text: 'Hello',
        requestId: 'req-1',
      }),
    ).rejects.toBeInstanceOf(SocketNotConnectedError);

    expect(sendMock).not.toHaveBeenCalled();
  });

  it('should send message_create and resolve when ack arrives', async () => {
    isSocketOpen.mockReturnValue(true);

    const promise = sendRoomMessageBySocket({
      room: 'room-1',
      text: 'Hello',
      aiTextImprovement: { status: 'USED', type: 'GRAMMAR_AND_SPELLING' },
      requestId: 'req-1',
    });

    expect(sendMock).toHaveBeenCalledWith({
      type: 'method',
      action: 'message_create',
      content: {
        request_id: 'req-1',
        room: 'room-1',
        text: 'Hello',
        ai_text_improvement: {
          status: 'USED',
          type: 'GRAMMAR_AND_SPELLING',
        },
      },
    });

    resolvePendingRequest('req-1', {
      request_id: 'req-1',
      uuid: 'server-uuid',
      text: 'Hello',
    });

    await expect(promise).resolves.toMatchObject({
      uuid: 'server-uuid',
      text: 'Hello',
    });
  });

  it('should include media in content when media uuids are provided', async () => {
    isSocketOpen.mockReturnValue(true);

    const promise = sendRoomMessageBySocket({
      room: 'room-1',
      text: 'Caption',
      media: ['media-1', 'media-2'],
      requestId: 'req-2',
    });

    expect(sendMock).toHaveBeenCalledWith({
      type: 'method',
      action: 'message_create',
      content: {
        request_id: 'req-2',
        room: 'room-1',
        text: 'Caption',
        media: ['media-1', 'media-2'],
      },
    });

    resolvePendingRequest('req-2', {
      request_id: 'req-2',
      uuid: 'server-uuid-2',
      text: 'Caption',
    });

    await expect(promise).resolves.toMatchObject({
      uuid: 'server-uuid-2',
      text: 'Caption',
    });
  });

  it('should omit media from content for text-only messages', async () => {
    isSocketOpen.mockReturnValue(true);

    sendRoomMessageBySocket({
      room: 'room-1',
      text: 'Hello',
      requestId: 'req-3',
    });

    expect(sendMock).toHaveBeenCalledWith({
      type: 'method',
      action: 'message_create',
      content: {
        request_id: 'req-3',
        room: 'room-1',
        text: 'Hello',
      },
    });
    expect(sendMock.mock.calls[0][0].content.media).toBeUndefined();
  });
});
