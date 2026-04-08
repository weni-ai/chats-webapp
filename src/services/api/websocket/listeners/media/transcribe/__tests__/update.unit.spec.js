import { describe, it, expect, vi, beforeEach } from 'vitest';

import transcribeUpdate from '@/services/api/websocket/listeners/media/transcribe/update';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

vi.mock('@/store/modules/chats/roomMessages', () => ({
  useRoomMessages: vi.fn(),
}));

describe('Media transcribe update listener', () => {
  let updateMessageMock;
  let roomMessages;

  beforeEach(() => {
    updateMessageMock = vi.fn();
    roomMessages = [];

    useRoomMessages.mockReturnValue({
      roomMessages,
      updateMessage: updateMessageMock,
    });
  });

  it('does nothing when no message matches message_uuid', () => {
    roomMessages.push({
      uuid: 'other-uuid',
      media: [{ id: 'm1' }],
    });

    transcribeUpdate({
      message_uuid: 'missing-uuid',
      text: 'Hi',
      status: 'completed',
    });

    expect(updateMessageMock).not.toHaveBeenCalled();
  });

  it('does nothing when the message has no media at index 0', () => {
    roomMessages.push({
      uuid: 'msg-1',
      media: [],
    });

    transcribeUpdate({
      message_uuid: 'msg-1',
      text: 'Hi',
      status: 'completed',
    });

    expect(updateMessageMock).not.toHaveBeenCalled();
  });

  it('merges transcription into media[0] and calls updateMessage', () => {
    const existingMessage = {
      uuid: 'msg-1',
      media: [
        {
          url: 'https://example.com/a.ogg',
          transcription: { text: '', status: 'pending' },
        },
      ],
    };
    roomMessages.push(existingMessage);

    transcribeUpdate({
      message_uuid: 'msg-1',
      text: 'Transcribed line',
      status: 'completed',
    });

    expect(existingMessage.media[0].transcription).toEqual({
      text: 'Transcribed line',
      status: 'completed',
    });
    expect(updateMessageMock).toHaveBeenCalledTimes(1);
    expect(updateMessageMock).toHaveBeenCalledWith({
      reorderMessageMinute: true,
      message: existingMessage,
    });
  });
});
