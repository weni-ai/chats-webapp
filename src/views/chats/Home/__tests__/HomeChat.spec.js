import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createWebHistory } from 'vue-router';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';

import HomeChat from '../HomeChat.vue';
import HomeChatModals from '../HomeChatModals.vue';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import MessageManager from '@/components/chats/MessageManager/index.vue';
import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone/index.vue';

import { setActivePinia } from 'pinia';

vi.mock('@/services/api/resources/chats/message');

vi.mock('@/services/api/resources/chats/room');

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: { tags: vi.fn(() => ({ results: [] })) },
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/chat/:roomId?', name: 'chat', component: HomeChat }],
});

const roomMock = {
  uuid: '1',
  user: {
    first_name: 'Test',
    last_name: 'User',
    email: 'testuser@weni.ai',
  },
  queue: {
    uuid: '1',
    name: 'Queue',
    sector: '1',
    sector_name: 'Sector',
  },
  contact: {
    uuid: '1',
    name: 'John Doe',
    external_id: '123',
  },
  unread_msgs: 0,
  last_message: 'Last message',
  is_waiting: false,
  is_24h_valid: false,
  last_interaction: '2025-02-04T11:44:46.139681-03:00',
  can_edit_custom_fields: true,
  custom_fields: null,
  urn: 'whatsapp:123456789',
  transfer_history: {
    to: {
      name: 'Test1',
      type: 'user',
    },
    from: {
      name: 'Test2',
      type: 'user',
    },
    action: 'pick',
  },
  protocol: null,
  service_chat: null,
  is_active: true,
};

describe('HomeChat.vue', () => {
  let pinia;
  let wrapper;

  const createWrapper = () => {
    return mount(HomeChat, {
      global: {
        mocks: {
          $route: {
            params: {
              roomId: 'uuid-123',
              discussionId: null,
            },
          },
          $router: {
            replace: vi.fn(),
            push: vi.fn(),
          },
        },
        plugins: [router, pinia],
        components: {
          RoomMessages,
          HomeChatModals,
          MessageManager,
          ChatsDropzone,
        },
      },
    });
  };

  beforeEach(async () => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
    });
    setActivePinia(pinia);
    wrapper = createWrapper();
    router.push('/chat/123');
    await router.isReady();
  });

  it('renders correctly', async () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('emits open-room-contact-info when the event is triggered', async () => {
    await wrapper.vm.emitOpenRoomContactInfo();
    expect(wrapper.emitted('open-room-contact-info')).toBeTruthy();
  });

  it('renders RoomMessages when room exists', async () => {
    const roomsStore = useRooms();
    const roomMessagesStore = useRoomMessages();
    roomMessagesStore.getRoomMessages = vi.fn().mockResolvedValue([]);

    roomsStore.activeRoom = roomMock;

    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent({ name: 'RoomMessages' }).exists()).toBe(true);
  });

  it('renders DiscussionMessages when discussion exists', async () => {
    const discussionsStore = useDiscussions();
    discussionsStore.activeDiscussion = { uuid: '123' };
    const discussionsMessages = useDiscussionMessages();
    discussionsMessages.getDiscussionMessages = vi.fn().mockResolvedValue([]);
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent({ name: 'DiscussionMessages' }).exists()).toBe(
      true,
    );
  });

  it('calls setActiveRoom when handling room change', async () => {
    const roomsStore = useRooms();

    roomsStore.rooms = [{ uuid: '123' }, { uuid: '456' }];

    const setActiveRoomSpy = vi.spyOn(roomsStore, 'setActiveRoom');

    await wrapper.vm.handlingSetActiveRoom('456');

    expect(setActiveRoomSpy).toHaveBeenCalled();
    expect(setActiveRoomSpy).toHaveBeenCalledWith({ uuid: '456' });
  });

  it('opens the modal when openModal is called', async () => {
    const roomsStore = useRooms();
    roomsStore.activeRoom = roomMock;

    const roomMessagesStore = useRoomMessages();
    roomMessagesStore.getRoomMessages = vi.fn().mockResolvedValue([]);

    await wrapper.vm.$nextTick();

    const modals = wrapper.findComponent('[data-testid="home-chat-modals"]');

    const spyOpenModal = vi.spyOn(modals.vm, 'openModal');

    const header = wrapper.findComponent('[data-testid="home-chat-headers"]');

    await header.vm.$emit('open-modal-close-chat');

    await wrapper.vm.$nextTick();

    expect(spyOpenModal).toHaveBeenCalledWith('closeChat');
    expect(modals.vm.modalsShowing.closeChat).toBe(true);
  });

  it('emits open-room-contact-info when emitOpenRoomContactInfo is called', async () => {
    await wrapper.vm.emitOpenRoomContactInfo();
    expect(wrapper.emitted('open-room-contact-info')).toBeTruthy();
  });

  it('emits close-room-contact-info when emitCloseRoomContactInfo is called', async () => {
    await wrapper.vm.emitCloseRoomContactInfo();
    expect(wrapper.emitted('close-room-contact-info')).toBeTruthy();
  });

  it('emits handle-show-quick-messages when emitHandleShowQuickMessages is called', async () => {
    await wrapper.vm.emitHandleShowQuickMessages();
    expect(wrapper.emitted('handle-show-quick-messages')).toBeTruthy();
  });

  it('emits open-flows-trigger when emitOpenFlowsTrigger is called', async () => {
    await wrapper.vm.emitOpenFlowsTrigger();
    expect(wrapper.emitted('open-flows-trigger')).toBeTruthy();
  });

  it('clear activeRoom and activeDiscussion when clearActiveChats is called', async () => {
    const roomsStore = useRooms();
    roomsStore.activeRoom = roomMock;
    roomsStore.setActiveRoom = (room) => (roomsStore.activeRoom = room);

    const roomMessagesStore = useRoomMessages();
    roomMessagesStore.getRoomMessages = vi.fn().mockResolvedValue([]);

    const discussionsStore = useDiscussions();
    discussionsStore.activeDiscussion = { uuid: '123' };
    discussionsStore.setActiveDiscussion = (discussion) =>
      (discussionsStore.activeDiscussion = discussion);

    const discussionsMessages = useDiscussionMessages();
    discussionsMessages.getDiscussionMessages = vi.fn().mockResolvedValue([]);

    await wrapper.vm.$nextTick();

    await wrapper.vm.clearActiveChats();

    await wrapper.vm.$nextTick();

    expect(roomsStore.activeRoom).toBe(null);
    expect(discussionsStore.activeDiscussion).toBe(null);
  });

  it('should show MessageManager on open valid room', async () => {
    const roomsStore = useRooms();
    roomsStore.activeRoom = { ...roomMock, is_24h_valid: true };
    const roomMessagesStore = useRoomMessages();
    roomMessagesStore.getRoomMessages = vi.fn().mockResolvedValue([]);

    const wrapper = createWrapper();

    await wrapper.vm.$nextTick();
    const manager = wrapper.findComponent('[data-testid="message-manager"]');

    expect(manager.exists()).toBe(true);
  });

  it('calls resetRoomNewMessages on change activeRoom', async () => {
    const roomMessagesStore = useRoomMessages();
    roomMessagesStore.getRoomMessages = vi.fn().mockResolvedValue([]);

    const roomsStore = useRooms();

    roomsStore.activeRoom = { ...roomMock };

    roomsStore.resetRoomNewMessages = vi.fn();

    const resetSpy = vi.spyOn(roomsStore, 'resetRoomNewMessages');

    await wrapper.vm.resetActiveChatUnreadMessages({
      chatPathUuid: '1',
      activeChatUuid: '1',
      unreadMessages: { 1: true },
      resetUnreadMessages: roomsStore.resetRoomNewMessages,
    });

    expect(resetSpy).toHaveBeenCalled();
  });

  it('calls openModal with "quickMessages" if isMobile is true', async () => {
    wrapper.vm.isMobile = true;

    const openModalSpy = vi.spyOn(wrapper.vm, 'openModal');

    await wrapper.vm.handleShowQuickMessages();

    expect(openModalSpy).toHaveBeenCalledWith('quickMessages');
  });

  it('calls emitHandleShowQuickMessages if isMobile is false', async () => {
    const emitHandleShowQuickMessagesMock = vi.fn();

    wrapper.vm.isMobile = false;
    wrapper.vm.emitHandleShowQuickMessages = emitHandleShowQuickMessagesMock;

    await wrapper.vm.handleShowQuickMessages();

    expect(emitHandleShowQuickMessagesMock).toHaveBeenCalled();
  });

  it('updates textBoxMessage with the given value', () => {
    wrapper.vm.updateTextBoxMessage('Hello world');

    expect(wrapper.vm.textBoxMessage).toBe('Hello world');
  });

  it('updates uploadFilesProgress  with the given value', () => {
    wrapper.vm.setUploadFilesProgress('100');

    expect(wrapper.vm.uploadFilesProgress).toBe('100');
  });

  it('returns the uuid when activeChat has a uuid', () => {
    expect(wrapper.vm.isValidChat({ uuid: 'abc-123' })).toBe('abc-123');
    expect(wrapper.vm.isValidChat({})).toBe(undefined);
  });

  it('should handle full watch logic for room change', async () => {
    const roomsStore = useRooms();
    roomsStore.rooms = [
      { uuid: 'uuid-123', user: { email: 'user@email.com' } },
    ];

    roomsStore.newMessagesByRoom = { 'uuid-123': 5 };

    const mockRoom = {
      uuid: 'uuid-123',
      user: { email: 'user@email.com' },
      is_24h_valid: true,
    };

    wrapper.vm.getCanUseCopilot = vi.fn();
    wrapper.vm.readMessages = vi.fn();
    wrapper.vm.shouldRedirect = vi.fn().mockResolvedValue(false);
    wrapper.vm.resetNewMessagesByRoom = vi.fn(() => vi.fn());
    wrapper.vm.redirectToActiveChat = vi.fn();

    const oldRoom = { uuid: 'old-room' };
    await wrapper.vm.$options.watch.room.handler.call(
      wrapper.vm,
      mockRoom,
      oldRoom,
    );
    await flushPromises();

    expect(wrapper.vm.shouldRedirect).toHaveBeenCalledWith(mockRoom);
    expect(wrapper.vm.redirectToActiveChat).toHaveBeenCalledWith({
      routeName: 'room',
      paramName: 'roomId',
      activeChatUuid: mockRoom.uuid,
      pathChatUuid: 'uuid-123',
    });
    expect(wrapper.vm.getCanUseCopilot).toHaveBeenCalled();
    expect(wrapper.vm.readMessages).toHaveBeenCalled();
    expect(wrapper.vm.isChatSkeletonActive).toBe(false);
    expect(wrapper.vm.textBoxMessage).toBe('');
  });
});
