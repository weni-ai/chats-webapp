import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { groupMessages } from '@/utils/messages';
import { useRooms } from '@/store/modules/chats/rooms';
import moment from 'moment';
import * as UtilsArray from '@/utils/array';

vi.mock('@/store/modules/profile', () => ({
  useProfile: () => ({
    me: { email: 'user@example.com' },
  }),
}));

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

describe('Messages utils', () => {
  let roomsStoreMock;

  beforeEach(() => {
    roomsStoreMock = {
      activeRoom: { uuid: 'active-room-uuid' },
    };

    useRooms.mockReturnValue(roomsStoreMock);
  });

  describe('groupMessages', () => {
    let messagesReference;

    beforeEach(() => {
      messagesReference = [];
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should add a new message to a new date group', () => {
      const message = {
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'Test message',
      };

      groupMessages(messagesReference, { message, addBefore: false });

      expect(messagesReference).toEqual([
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30 AM',
              messages: [message],
            },
          ],
        },
      ]);
    });

    it('should add a message to an existing date group but a new minute group', () => {
      messagesReference = [
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30 AM',
              messages: [{ content: 'Existing message' }],
            },
          ],
        },
      ];

      const message = {
        created_on: moment('2024-01-01T10:31:00').toISOString(),
        content: 'New message',
      };

      groupMessages(messagesReference, { message, addBefore: false });

      expect(messagesReference).toEqual([
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30 AM',
              messages: [{ content: 'Existing message' }],
            },
            {
              minute: '10:31 AM',
              messages: [message],
            },
          ],
        },
      ]);
    });

    it('should add a message to an existing minute group', async () => {
      messagesReference = [
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [{ content: 'Existing message' }],
            },
          ],
        },
      ];

      const message = {
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'New message',
      };

      groupMessages(messagesReference, { message, addBefore: false });

      setTimeout(() => {
        expect(messagesReference).toEqual([
          {
            date: '01/01/2024',
            minutes: [
              {
                minute: '10:30',
                messages: [
                  { content: 'Existing message' },
                  {
                    created_on: expect.any(String),
                    content: 'New message',
                  },
                ],
              },
            ],
          },
        ]);
      }, 1000);
    });

    it('should add a message at the beginning of an existing minute group if addBefore is true', () => {
      messagesReference = [
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30',
              messages: [{ content: 'Existing message' }],
            },
          ],
        },
      ];

      const message = {
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'New message',
      };

      groupMessages(messagesReference, { message, addBefore: true });

      setTimeout(() => {
        expect(messagesReference).toEqual([
          {
            date: '01/01/2024',
            minutes: [
              {
                minute: '10:30',
                messages: [
                  { content: 'New message' },
                  {
                    content: 'Existing message',
                    created_on: expect.any(String),
                  },
                ],
              },
            ],
          },
        ]);
      }, 1000);
    });

    it('should create a new date group if the date does not exist', () => {
      messagesReference = [
        {
          date: '11/20/2024',
          minutes: [
            {
              minute: '10:30 AM',
              messages: [{ content: 'Old message' }],
            },
          ],
        },
      ];

      const message = {
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'New message',
      };

      groupMessages(messagesReference, { message, addBefore: false });

      expect(messagesReference).toEqual([
        {
          date: '11/20/2024',
          minutes: [
            {
              minute: '10:30 AM',
              messages: [{ content: 'Old message' }],
            },
          ],
        },
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30 AM',
              messages: [message],
            },
          ],
        },
      ]);
    });

    it('should remove duplicate messages in the same minute group', () => {
      const message = {
        uuid: 'duplicate-message-uuid',
        created_on: moment('2024-01-01T10:30:00').toISOString(),
        content: 'Duplicate message',
      };

      const removeDuplicatedItemsSpy = vi.spyOn(
        UtilsArray,
        'removeDuplicatedItems',
      );

      messagesReference = [
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30 AM',
              messages: [message],
            },
          ],
        },
      ];

      groupMessages(messagesReference, { message, addBefore: false });

      expect(messagesReference).toEqual([
        {
          date: '01/01/2024',
          minutes: [
            {
              minute: '10:30 AM',
              messages: [message],
            },
          ],
        },
      ]);
      expect(removeDuplicatedItemsSpy).toHaveBeenCalled();
    });
  });
});
