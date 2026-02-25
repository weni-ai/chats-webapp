import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import RoomMessages from '../RoomMessages.vue';
import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import RoomService from '@/services/api/resources/chats/room';
import RoomNotes from '@/services/api/resources/chats/roomNotes';
import i18n from '@/plugins/i18n';

vi.mock('@/components/chats/chat/ChatMessages/index.vue', () => ({
  default: {
    name: 'ChatMessages',
    template: `
      <div data-testid="chat-messages" @scroll-top="$emit('scroll-top')" @open-room-contact-info="$emit('open-room-contact-info')">
        <slot />
      </div>
    `,
    props: [
      'chatUuid',
      'messages',
      'messagesNext',
      'messagesPrevious',
      'messagesSorted',
      'messagesSendingUuids',
      'messagesFailedUuids',
      'resendMessages',
      'resendMedia',
      'isLoading',
      'isClosedChat',
      'enableReply',
    ],
  },
}));

vi.mock('@/layouts/ChatsLayout/components/ChatSummary/index.vue', () => ({
  default: {
    name: 'ChatSummary',
    template:
      '<div data-testid="chat-summary" @click="$emit(\'close\')">ChatSummary</div>',
    props: ['isGeneratingSummary', 'summaryText', 'feedback', 'skipAnimation'],
  },
}));

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    getSummary: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/chats/roomNotes', () => ({
  default: {
    getInternalNotes: vi.fn(() => Promise.resolve({ results: [] })),
  },
}));

const mockRoom = {
  uuid: 'room-123',
  ended_at: null,
  user: { email: 'agent@test.com' },
  is_24h_valid: true,
};

const createWrapper = (props = {}, piniaState = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);

  const roomsStore = useRooms();
  const roomMessagesStore = useRoomMessages();
  const configStore = useConfig();
  const featureFlagStore = useFeatureFlag();

  roomsStore.$patch({
    activeRoom: mockRoom,
    openActiveRoomSummary: false,
    roomsSummary: {},
    isLoadingActiveRoomSummary: false,
    isCanSendMessageActiveRoom: true,
    isLoadingCanSendMessageStatus: false,
  });

  roomMessagesStore.roomMessages = [];
  roomMessagesStore.roomMessagesNext = '';
  roomMessagesStore.roomMessagesPrevious = '';
  roomMessagesStore.roomMessagesSorted = [];
  roomMessagesStore.roomMessagesSendingUuids = [];
  roomMessagesStore.roomMessagesFailedUuids = [];
  roomMessagesStore.resetRoomMessages = vi.fn();
  roomMessagesStore.getRoomMessages = vi.fn(() => Promise.resolve());
  roomMessagesStore.addRoomMessageSorted = vi.fn();

  configStore.project = { config: { has_chats_summary: false } };
  featureFlagStore.featureFlags = { active_features: [] };

  if (piniaState.rooms) {
    roomsStore.$patch(piniaState.rooms);
  }
  if (piniaState.roomMessages) {
    const { getRoomMessages, addRoomMessageSorted, ...roomMessagesState } =
      piniaState.roomMessages;
    if (Object.keys(roomMessagesState).length > 0) {
      roomMessagesStore.$patch(roomMessagesState);
    }
    if (getRoomMessages) roomMessagesStore.getRoomMessages = getRoomMessages;
    if (addRoomMessageSorted)
      roomMessagesStore.addRoomMessageSorted = addRoomMessageSorted;
  }
  if (piniaState.config) {
    Object.assign(configStore, piniaState.config);
  }
  if (piniaState.featureFlag) {
    Object.assign(featureFlagStore, piniaState.featureFlag);
  }

  return mount(RoomMessages, {
    props: {
      showRoomSummary: false,
      ...props,
    },
    global: {
      plugins: [pinia],
      mocks: {
        $t: (key) => key,
      },
    },
  });
};

describe('RoomMessages.vue', () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();
    consoleLogSpy.mockClear();
  });

  describe('rendering', () => {
    it('renders ChatMessages with room data from store', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      const wrapper = createWrapper();

      await flushPromises();

      const chatMessages = wrapper.findComponent({ name: 'ChatMessages' });
      expect(chatMessages.exists()).toBe(true);
      expect(chatMessages.props('chatUuid')).toBe(mockRoom.uuid);
      expect(chatMessages.props('messages')).toEqual([]);
      expect(chatMessages.props('enableReply')).toBe(false);
    });

    it('does not render ChatSummary when showRoomSummary is false', async () => {
      const wrapper = createWrapper({ showRoomSummary: false });
      await flushPromises();

      expect(wrapper.find('[data-testid="chat-summary"]').exists()).toBe(false);
    });

    it('does not render ChatSummary when enableRoomSummary (has_chats_summary) is false', async () => {
      const wrapper = createWrapper(
        { showRoomSummary: true },
        {
          config: {
            project: { config: { has_chats_summary: false } },
          },
        },
      );
      await flushPromises();

      expect(wrapper.find('[data-testid="chat-summary"]').exists()).toBe(false);
    });

    it('renders ChatSummary when all conditions are met', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      RoomService.getSummary.mockResolvedValue({
        status: 'DONE',
        summary: 'Resumo',
        feedback: null,
      });

      const wrapper = createWrapper(
        { showRoomSummary: true },
        {
          config: {
            project: { config: { has_chats_summary: true } },
          },
          rooms: {
            openActiveRoomSummary: true,
            roomsSummary: {
              [mockRoom.uuid]: { summary: 'Summary', feedback: null },
            },
          },
          roomMessages: {
            roomMessages: [],
            roomMessagesSorted: [],
          },
        },
      );

      await flushPromises();
      wrapper.vm.isLoadingMessages = false;
      wrapper.vm.silentLoadingMessages = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="chat-summary"]').exists()).toBe(true);
    });
  });

  describe('emits', () => {
    it('emits open-room-contact-info when ChatMessages emits it', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      const wrapper = createWrapper();
      await flushPromises();

      const chatMessages = wrapper.findComponent({ name: 'ChatMessages' });
      await chatMessages.vm.$emit('open-room-contact-info');

      expect(wrapper.emitted('open-room-contact-info')).toBeTruthy();
      expect(wrapper.emitted('open-room-contact-info')).toHaveLength(1);
    });
  });

  describe('watch room.uuid', () => {
    it('calls resetRoomMessages and getRoomMessages when room.uuid is set', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      const wrapper = createWrapper();
      await flushPromises();

      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);
      expect(roomMessagesStore.resetRoomMessages).toHaveBeenCalled();
      expect(roomMessagesStore.getRoomMessages).toHaveBeenCalled();
    });

    it('loads room data when room.uuid is set (messages and internal notes)', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });

      const wrapper = createWrapper();
      await flushPromises();

      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);
      expect(roomMessagesStore.getRoomMessages).toHaveBeenCalled();
      expect(roomMessagesStore.resetRoomMessages).toHaveBeenCalled();
    });

    it('sets isLoadingMessages to false after loading', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });

      const wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.isLoadingMessages).toBe(false);
    });
  });

  describe('searchForMoreMessages', () => {
    it('calls getRoomMessages when roomMessagesNext exists', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      const wrapper = createWrapper();
      await flushPromises();

      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);
      const getRoomMessagesSpy = vi.fn(() => Promise.resolve());
      roomMessagesStore.roomMessagesNext = 'next-cursor';
      roomMessagesStore.getRoomMessages = getRoomMessagesSpy;
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      wrapper.vm.searchForMoreMessages();

      expect(getRoomMessagesSpy).toHaveBeenCalled();
    });

    it('does nothing when roomMessagesNext is empty', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      const wrapper = createWrapper(
        {},
        { roomMessages: { roomMessagesNext: '' } },
      );
      await flushPromises();

      wrapper.vm.page = 0;
      wrapper.vm.searchForMoreMessages();

      expect(wrapper.vm.page).toBe(0);
    });
  });

  describe('setRoomSummary', () => {
    it('updates roomsSummary and clears loading state', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      const wrapper = createWrapper();
      await flushPromises();

      const roomsStore = useRooms(wrapper.vm.$pinia);
      wrapper.vm.setRoomSummary('New summary', { rating: 5 }, 'DONE');

      expect(roomsStore.roomsSummary[mockRoom.uuid]).toEqual({
        summary: 'New summary',
        feedback: { rating: 5 },
        status: 'DONE',
      });
      expect(roomsStore.isLoadingActiveRoomSummary).toBe(false);
    });
  });

  describe('getRoomSummary', () => {
    it('calls setRoomSummary with summary when status is DONE', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      RoomService.getSummary.mockResolvedValue({
        status: 'DONE',
        summary: 'Summary text',
        feedback: null,
      });

      const wrapper = createWrapper();
      await flushPromises();

      vi.spyOn(wrapper.vm, 'setRoomSummary');
      await wrapper.vm.getRoomSummary();

      expect(wrapper.vm.setRoomSummary).toHaveBeenCalledWith(
        'Summary text',
        null,
        'DONE',
      );
    });

    it('calls setRoomSummary with unavailable text when status is UNAVAILABLE', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      RoomService.getSummary.mockResolvedValue({
        status: 'UNAVAILABLE',
        summary: '',
        feedback: null,
      });

      const wrapper = createWrapper();
      await flushPromises();

      vi.spyOn(wrapper.vm, 'setRoomSummary');
      await wrapper.vm.getRoomSummary();

      const unavailableText = i18n.global.t('chats.summary.unavailable');
      expect(wrapper.vm.setRoomSummary).toHaveBeenCalledWith(
        unavailableText,
        null,
        'UNAVAILABLE',
      );
    });

    it('calls setRoomSummary with error text when API throws', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      RoomService.getSummary.mockRejectedValue(new Error('Network error'));

      const wrapper = createWrapper();
      await flushPromises();

      vi.spyOn(wrapper.vm, 'setRoomSummary');
      await wrapper.vm.getRoomSummary();

      const errorText = i18n.global.t('chats.summary.error');
      expect(wrapper.vm.setRoomSummary).toHaveBeenCalledWith(errorText);
    });

    it('does not call API when room is null', async () => {
      const pinia = createPinia();
      setActivePinia(pinia);
      const roomsStore = useRooms();
      roomsStore.activeRoom = null;

      const wrapper = mount(RoomMessages, {
        props: { showRoomSummary: false },
        global: {
          plugins: [pinia],
          mocks: { $t: (key) => key },
        },
      });

      await wrapper.vm.getRoomSummary();

      expect(RoomService.getSummary).not.toHaveBeenCalled();
    });
  });

  describe('getRoomInternalNotes', () => {
    it('adds chip when internal notes exist and room is active', async () => {
      const lastSystemMessage = {
        uuid: 'sys-1',
        created_on: '2024-01-01T12:00:00Z',
        user: null,
        contact: null,
      };
      RoomNotes.getInternalNotes.mockResolvedValue({
        results: [{ uuid: 'note-1', content: 'Note' }],
      });

      const wrapper = createWrapper(
        {},
        {
          roomMessages: {
            roomMessages: [lastSystemMessage],
            addRoomMessageSorted: vi.fn(),
          },
        },
      );
      await flushPromises();

      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);
      roomMessagesStore.roomMessages = [lastSystemMessage];
      roomMessagesStore.addRoomMessageSorted = vi.fn();

      await wrapper.vm.getRoomInternalNotes();

      expect(roomMessagesStore.addRoomMessageSorted).toHaveBeenCalledWith({
        message: expect.objectContaining({
          text: '{"see_all_internal_notes_chip":true}',
          created_on: lastSystemMessage.created_on,
        }),
        reorderMessageMinute: true,
      });
    });

    it('does not add chip when no last system message', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({
        results: [{ uuid: 'n1' }],
      });

      const wrapper = createWrapper(
        {},
        {
          roomMessages: {
            roomMessages: [
              { user: { id: 1 }, contact: null },
              { user: null, contact: { id: 1 } },
            ],
            addRoomMessageSorted: vi.fn(),
          },
        },
      );
      await flushPromises();

      const roomMessagesStore = useRoomMessages();
      roomMessagesStore.addRoomMessageSorted = vi.fn();

      await wrapper.vm.getRoomInternalNotes();

      expect(roomMessagesStore.addRoomMessageSorted).not.toHaveBeenCalled();
    });
  });

  describe('handlingGetRoomSummary', () => {
    it('starts loading and interval when room has no summary yet', async () => {
      vi.useFakeTimers();
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      RoomService.getSummary.mockResolvedValue({
        status: 'DONE',
        summary: 'S',
        feedback: null,
      });

      const wrapper = createWrapper(
        {},
        {
          rooms: { roomsSummary: {} },
          config: { project: { config: { has_chats_summary: true } } },
        },
      );
      await flushPromises();

      wrapper.vm.handlingGetRoomSummary();

      expect(RoomService.getSummary).toHaveBeenCalled();
      expect(wrapper.vm.getRoomSummaryInterval).not.toBe(null);

      vi.useRealTimers();
    });

    it('sets skipSummaryAnimation when room already has summary', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      const wrapper = createWrapper(
        {},
        {
          rooms: {
            roomsSummary: { [mockRoom.uuid]: { summary: 'Existing' } },
          },
          config: { project: { config: { has_chats_summary: true } } },
        },
      );
      await flushPromises();

      wrapper.vm.handlingGetRoomSummary();

      expect(wrapper.vm.skipSummaryAnimation).toBe(true);
      expect(RoomService.getSummary).not.toHaveBeenCalled();
    });
  });

  describe('ChatMessages scroll-top', () => {
    it('emits scroll-top to trigger searchForMoreMessages', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
      const wrapper = createWrapper();
      await flushPromises();

      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);
      const getRoomMessagesSpy = vi.fn(() => Promise.resolve());
      roomMessagesStore.roomMessagesNext = 'cursor';
      roomMessagesStore.getRoomMessages = getRoomMessagesSpy;
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const chatMessages = wrapper.findComponent({ name: 'ChatMessages' });
      await chatMessages.vm.$emit('scroll-top');

      expect(getRoomMessagesSpy).toHaveBeenCalled();
    });
  });
});
