import { describe, it, expect, vi, beforeEach } from 'vitest';
import deleteInternalNote from '@/services/api/websocket/listeners/room/internalNote/delete';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { removeFromGroupedMessages } from '@/utils/messages';

vi.mock('@/store/modules/chats/roomMessages', () => ({
  useRoomMessages: vi.fn(),
}));

vi.mock('@/utils/messages', () => ({
  removeFromGroupedMessages: vi.fn(),
}));

describe('Internal note delete', () => {
  let roomMessagesStoreMock;
  let note;

  beforeEach(() => {
    note = {
      uuid: 'note-123',
      text: 'Test note',
    };

    roomMessagesStoreMock = {
      roomInternalNotes: [
        { uuid: 'note-123', text: 'Test note' },
        { uuid: 'note-456', text: 'Another note' },
      ],
      roomMessages: [
        {
          uuid: 'msg-1',
          text: 'Regular message',
        },
        {
          uuid: 'msg-2',
          text: 'Message with internal note',
          internal_note: {
            uuid: 'note-123',
            text: 'Test note',
          },
        },
        {
          uuid: 'msg-3',
          text: 'Another message',
          internal_note: {
            uuid: 'note-789',
            text: 'Different note',
          },
        },
      ],
      roomMessagesSorted: [
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:00 AM',
              messages: [
                {
                  uuid: 'msg-2',
                  text: 'Message with internal note',
                  internal_note: {
                    uuid: 'note-123',
                    text: 'Test note',
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    useRoomMessages.mockReturnValue(roomMessagesStoreMock);
    vi.clearAllMocks();
  });

  it('should remove the note from roomInternalNotes', () => {
    deleteInternalNote(note);

    expect(roomMessagesStoreMock.roomInternalNotes).toEqual([
      { uuid: 'note-456', text: 'Another note' },
    ]);
  });

  it('should remove the message with matching internal_note from roomMessages', () => {
    deleteInternalNote(note);

    expect(roomMessagesStoreMock.roomMessages).toEqual([
      {
        uuid: 'msg-1',
        text: 'Regular message',
      },
      {
        uuid: 'msg-3',
        text: 'Another message',
        internal_note: {
          uuid: 'note-789',
          text: 'Different note',
        },
      },
    ]);
  });

  it('should call removeFromGroupedMessages when a message with matching internal_note exists', () => {
    deleteInternalNote(note);

    expect(removeFromGroupedMessages).toHaveBeenCalledWith(
      roomMessagesStoreMock.roomMessagesSorted,
      {
        message: {
          uuid: 'msg-2',
          text: 'Message with internal note',
          internal_note: {
            uuid: 'note-123',
            text: 'Test note',
          },
        },
      },
    );
  });

  it('should not call removeFromGroupedMessages when no message with matching internal_note exists', () => {
    const noteWithoutMessage = {
      uuid: 'note-999',
      text: 'Note without message',
    };

    deleteInternalNote(noteWithoutMessage);

    expect(removeFromGroupedMessages).not.toHaveBeenCalled();
  });

  it('should not modify roomMessages when no message with matching internal_note exists', () => {
    const noteWithoutMessage = {
      uuid: 'note-999',
      text: 'Note without message',
    };

    const originalMessages = [...roomMessagesStoreMock.roomMessages];

    deleteInternalNote(noteWithoutMessage);

    expect(roomMessagesStoreMock.roomMessages).toEqual(originalMessages);
  });

  it('should handle multiple notes and only remove the matching one', () => {
    roomMessagesStoreMock.roomInternalNotes = [
      { uuid: 'note-123', text: 'First note' },
      { uuid: 'note-456', text: 'Second note' },
      { uuid: 'note-789', text: 'Third note' },
    ];

    deleteInternalNote(note);

    expect(roomMessagesStoreMock.roomInternalNotes).toEqual([
      { uuid: 'note-456', text: 'Second note' },
      { uuid: 'note-789', text: 'Third note' },
    ]);
  });

  it('should handle empty roomInternalNotes array', () => {
    roomMessagesStoreMock.roomInternalNotes = [];

    deleteInternalNote(note);

    expect(roomMessagesStoreMock.roomInternalNotes).toEqual([]);
  });

  it('should handle empty roomMessages array', () => {
    roomMessagesStoreMock.roomMessages = [];

    deleteInternalNote(note);

    expect(removeFromGroupedMessages).not.toHaveBeenCalled();
    expect(roomMessagesStoreMock.roomMessages).toEqual([]);
  });
});
