import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createWebHistory } from 'vue-router';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useProfile } from '@/store/modules/profile';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';

import HomeChat from '../HomeChat.vue';
import HomeChatModals from '../HomeChatModals.vue';
import RoomMessages from '@/components/chats/chat/RoomMessages.vue';
import MessageManager from '@/components/chats/MessageManager/index.vue';
import ChatsDropzone from '@/layouts/ChatsLayout/components/ChatsDropzone/index.vue';

import RoomService from '@/services/api/resources/chats/room';

import { setActivePinia } from 'pinia';

vi.mock('@/services/api/resources/chats/message');

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    updateReadMessages: vi.fn(),
    getRoomTags: vi.fn(() => ({ results: [] })),
    getCanSendMessageStatus: vi.fn(() => ({ can_send_message: true })),
  },
}));

vi.mock('@/services/api/resources/chats/roomNotes', () => ({
  default: { getInternalNotes: vi.fn() },
}));

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: { tags: vi.fn(() => ({ results: [] })) },
}));

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/chat/:roomId?', name: 'chat', component: HomeChat },
    {
      path: '/discussions/:discussionId?',
      name: 'discussion',
      component: HomeChat,
    },
  ],
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
    useRoomMessages().getRoomMessages = vi.fn().mockResolvedValue([]);
    useDiscussionMessages().getDiscussionMessages = vi
      .fn()
      .mockResolvedValue([]);
    wrapper = createWrapper();
  });

  describe('common tests', () => {
    it('renders correctly', async () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('emits open-room-contact-info when the event is triggered', async () => {
      await wrapper.vm.emitOpenRoomContactInfo();
      expect(wrapper.emitted('open-room-contact-info')).toBeTruthy();
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

    it('should emit close-room-contact-info when got-chat is emitted', async () => {
      const closeRoomContactInfoSpy = vi.spyOn(
        wrapper.vm,
        'emitCloseRoomContactInfo',
      );

      const modals = wrapper.findComponent('[data-testid="home-chat-modals"]');

      await modals.vm.$emit('got-chat');

      await wrapper.vm.$nextTick();

      expect(closeRoomContactInfoSpy).toHaveBeenCalled();
      expect(wrapper.emitted('close-room-contact-info')).toBeTruthy();
    });

    it('should update uploadFilesProgress when file-uploader-progress is emitted', async () => {
      const modals = wrapper.findComponent('[data-testid="home-chat-modals"]');

      const progress = 62;
      await modals.vm.$emit('file-uploader-progress', progress);

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.uploadFilesProgress).toBe(progress);
    });

    it('should update textBoxMessage when select-quick-message is emitted', async () => {
      const text = 'Hello!';

      const modals = wrapper.findComponent('[data-testid="home-chat-modals"]');
      await modals.vm.$emit('select-quick-message', { text });

      await wrapper.vm.$nextTick();
      expect(wrapper.vm.textBoxMessage).toBe(text);
    });

    it('should call configFileUploader and openModal on home-chat-modals ref', () => {
      const modals = wrapper.findComponent('[data-testid="home-chat-modals"]');

      const configFileUploaderSpy = vi.spyOn(modals.vm, 'configFileUploader');

      const openModalSpy = vi.spyOn(modals.vm, 'openModal');

      const fakeFiles = [{ name: 'file1.png', type: 'image' }];
      const fakeType = 'image';

      wrapper.vm.openModalFileUploader(fakeFiles, fakeType);

      expect(configFileUploaderSpy).toHaveBeenCalledWith({
        files: fakeFiles,
        filesType: fakeType,
      });

      expect(openModalSpy).toHaveBeenCalledWith('fileUploader');
    });

    it('redirects to home if not on home route and no active chat', async () => {
      const routerReplaceSpy = vi.spyOn(wrapper.vm.$router, 'replace');

      const result = await wrapper.vm.redirectIfNoChat(null);

      expect(routerReplaceSpy).toHaveBeenCalledWith({ name: 'home' });
      expect(result).toBe(true);
    });

    it('redirects using replace when not mobile and uuids differ', async () => {
      const routerReplaceSpy = vi.spyOn(wrapper.vm.$router, 'replace');
      wrapper.vm.isMobile = false;

      await wrapper.vm.redirectToActiveChat({
        routeName: 'room',
        paramName: 'roomId',
        activeChatUuid: 'uuid-123',
        pathChatUuid: 'uuid-456',
      });

      expect(routerReplaceSpy).toHaveBeenCalledWith({
        name: 'room',
        params: { roomId: 'uuid-123' },
      });
    });

    it('redirects using push when mobile and uuids differ', async () => {
      const routerPushSpy = vi.spyOn(wrapper.vm.$router, 'push');
      wrapper.vm.isMobile = true;

      await wrapper.vm.redirectToActiveChat({
        routeName: 'discussion',
        paramName: 'discussionId',
        activeChatUuid: 'abc',
        pathChatUuid: 'xyz',
      });

      expect(routerPushSpy).toHaveBeenCalledWith({
        name: 'discussion',
        params: { discussionId: 'abc' },
      });
    });
  });

  describe('rooms cases tests', () => {
    beforeEach(async () => {
      await router.push('/chat/123');
      await router.isReady();
    });
    it('renders RoomMessages when room exists', async () => {
      const roomsStore = useRooms();

      roomsStore.activeRoom = roomMock;

      await wrapper.vm.$nextTick();

      expect(wrapper.findComponent({ name: 'RoomMessages' }).exists()).toBe(
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

    it('clear activeRoom and activeDiscussion when clearActiveChats is called', async () => {
      const roomsStore = useRooms();
      roomsStore.activeRoom = roomMock;
      roomsStore.setActiveRoom = (room) => (roomsStore.activeRoom = room);

      const discussionsStore = useDiscussions();
      discussionsStore.activeDiscussion = { uuid: '123' };
      discussionsStore.setActiveDiscussion = (discussion) =>
        (discussionsStore.activeDiscussion = discussion);

      await wrapper.vm.$nextTick();

      await wrapper.vm.clearActiveChats();

      await wrapper.vm.$nextTick();

      expect(roomsStore.activeRoom).toBe(null);
      expect(discussionsStore.activeDiscussion).toBe(null);
    });

    it('should show MessageManager on open valid room', async () => {
      const roomsStore = useRooms();
      roomsStore.activeRoom = { ...roomMock, is_24h_valid: true };
      roomsStore.isCanSendMessageActiveRoom = true;
      roomsStore.isLoadingCanSendMessageStatus = false;

      await wrapper.vm.$nextTick();
      const manager = wrapper.findComponent('[data-testid="message-manager"]');

      expect(manager.exists()).toBe(true);
    });

    it('calls resetRoomNewMessages on change activeRoom', async () => {
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

    it('should handle full watch logic for room change', async () => {
      const roomsStore = useRooms();

      roomsStore.rooms = [{ uuid: '123', user: { email: 'user@email.com' } }];

      roomsStore.newMessagesByRoom = { 1: 5 };

      wrapper.vm.getCanUseCopilot = vi.fn();
      wrapper.vm.readMessages = vi.fn();
      wrapper.vm.shouldRedirect = vi.fn().mockResolvedValue(false);
      wrapper.vm.resetNewMessagesByRoom = vi.fn(() => vi.fn());
      wrapper.vm.redirectToActiveChat = vi.fn();

      roomsStore.activeRoom = roomMock;

      await flushPromises();

      expect(wrapper.vm.shouldRedirect).toHaveBeenCalledWith(roomMock);
      expect(wrapper.vm.redirectToActiveChat).toHaveBeenCalledWith({
        routeName: 'room',
        paramName: 'roomId',
        activeChatUuid: roomMock.uuid,
        pathChatUuid: '123',
      });
      expect(wrapper.vm.getCanUseCopilot).toHaveBeenCalled();
      expect(wrapper.vm.readMessages).toHaveBeenCalled();
      expect(wrapper.vm.isChatSkeletonActive).toBe(false);
      expect(wrapper.vm.textBoxMessage).toBe('');
    });

    it('renders "get chat" button and calls openModal when clicked', async () => {
      const roomsStore = useRooms();
      const discussionsStore = useDiscussions();

      roomsStore.room = {};
      discussionsStore.discussion = null;

      const getChatButton = wrapper.find('[data-testid="get-chat-button"]');
      expect(getChatButton.exists()).toBe(true);

      const openModalSpy = vi.spyOn(wrapper.vm, 'openModal');

      await getChatButton.trigger('click');

      expect(openModalSpy).toHaveBeenCalledWith('getChat');
    });

    it('calls Room.updateReadMessages if room is valid and belongs to the user', async () => {
      const profileStore = useProfile();
      profileStore.me = { email: 'testuser@weni.ai' };

      const roomsStore = useRooms();
      roomsStore.activeRoom = roomMock;

      await flushPromises();

      const updateReadMessagesSpy = vi
        .spyOn(RoomService, 'updateReadMessages')
        .mockResolvedValue({});

      await wrapper.vm.readMessages();

      expect(updateReadMessagesSpy).toHaveBeenCalledWith('1', true);
    });

    it('calls getCanSendMessageStatus when feature flag is active and platform is whatsapp', async () => {
      const featureFlagStore = useFeatureFlag();
      featureFlagStore.featureFlags = {
        active_features: ['weniChatsIs24hValidOptimization'],
      };

      const roomsStore = useRooms();
      roomsStore.activeRoom = null;
      roomsStore.setIsLoadingCanSendMessageStatus = vi.fn();
      roomsStore.setIsCanSendMessageActiveRoom = vi.fn();

      const getCanSendMessageStatusSpy = vi
        .spyOn(RoomService, 'getCanSendMessageStatus')
        .mockResolvedValue({ can_send_message: true });

      await wrapper.vm.$nextTick();

      const newRoom = { ...roomMock, urn: 'whatsapp:123456789' };
      roomsStore.activeRoom = newRoom;

      await flushPromises();

      expect(getCanSendMessageStatusSpy).toHaveBeenCalledWith(newRoom.uuid);
      expect(roomsStore.setIsCanSendMessageActiveRoom).toHaveBeenCalledWith(
        true,
      );
    });

    it('sets isCanSendMessageActiveRoom to true when platform is not whatsapp', async () => {
      const roomsStore = useRooms();
      roomsStore.activeRoom = null;
      roomsStore.isCanSendMessageActiveRoom = false;
      roomsStore.setIsCanSendMessageActiveRoom = vi.fn(
        (value) => (roomsStore.isCanSendMessageActiveRoom = value),
      );

      await wrapper.vm.$nextTick();

      const newRoom = { ...roomMock, urn: 'telegram:123456789' };
      roomsStore.activeRoom = newRoom;

      await flushPromises();

      expect(roomsStore.setIsCanSendMessageActiveRoom).toHaveBeenCalledWith(
        true,
      );
    });

    it('handles error when getCanSendMessageStatus fails', async () => {
      const featureFlagStore = useFeatureFlag();
      featureFlagStore.featureFlags = {
        active_features: ['weniChatsIs24hValidOptimization'],
      };

      const roomsStore = useRooms();
      roomsStore.activeRoom = null;
      roomsStore.setIsLoadingCanSendMessageStatus = vi.fn();
      roomsStore.setIsCanSendMessageActiveRoom = vi.fn();

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.spyOn(RoomService, 'getCanSendMessageStatus').mockRejectedValue(
        new Error('API Error'),
      );

      await wrapper.vm.$nextTick();

      const newRoom = { ...roomMock, urn: 'whatsapp:123456789' };
      roomsStore.activeRoom = newRoom;

      await flushPromises();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting can send message status:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('discussion cases tests', () => {
    beforeEach(async () => {
      await router.push('/discussions/discussion-uuid-123');
      await router.isReady();
    });
    it('renders DiscussionMessages when discussion exists', async () => {
      const discussionsStore = useDiscussions();
      discussionsStore.activeDiscussion = { uuid: '123' };
      await wrapper.vm.$nextTick();
      expect(
        wrapper.findComponent({ name: 'DiscussionMessages' }).exists(),
      ).toBe(true);
    });

    it('redirects and resets unread messages when discussion changes', async () => {
      const shouldRedirectSpy = vi
        .spyOn(wrapper.vm, 'shouldRedirect')
        .mockResolvedValue(false);

      const redirectToActiveChatSpy = vi.spyOn(
        wrapper.vm,
        'redirectToActiveChat',
      );

      const resetActiveChatUnreadMessagesSpy = vi.spyOn(
        wrapper.vm,
        'resetActiveChatUnreadMessages',
      );

      const discussionsStore = useDiscussions();

      await wrapper.vm.$nextTick();

      const discussion = {
        uuid: 'discussion-uuid-123',
      };

      discussionsStore.discussions = [discussion];
      discussionsStore.activeDiscussion = discussion;

      await flushPromises();

      expect(shouldRedirectSpy).toHaveBeenCalledWith(discussion);

      expect(redirectToActiveChatSpy).toHaveBeenCalledWith({
        routeName: 'discussion',
        paramName: 'discussionId',
        activeChatUuid: 'discussion-uuid-123',
        pathChatUuid: 'discussion-uuid-123',
      });

      expect(resetActiveChatUnreadMessagesSpy).toHaveBeenCalled();
    });

    it('calls handlingSetActiveDiscussion when handling discussion change', async () => {
      const discussionsStore = useDiscussions();

      discussionsStore.discussions = [{ uuid: '123' }, { uuid: '456' }];

      const setActiveDiscussionSpy = vi.spyOn(
        discussionsStore,
        'setActiveDiscussion',
      );

      await wrapper.vm.handlingSetActiveDiscussion('456');

      expect(setActiveDiscussionSpy).toHaveBeenCalled();
      expect(setActiveDiscussionSpy).toHaveBeenCalledWith({ uuid: '456' });
    });

    it('calls whenJoinDiscussion on join event', async () => {
      const spyWhenJoinDiscussion = vi.spyOn(wrapper.vm, 'whenJoinDiscussion');

      const discussionsStore = useDiscussions();

      discussionsStore.discussions = [{ uuid: '123' }, { uuid: '456' }];
      discussionsStore.activeDiscussion = { uuid: '123', is_queued: false };

      await flushPromises();

      await wrapper.find('[data-testid="join-discussion"]').trigger('click');

      expect(spyWhenJoinDiscussion).toHaveBeenCalled();
      expect(wrapper.vm.tempJoinedDiscussions[0]).toBe('123');
      expect(wrapper.vm.isCurrentUserInDiscussion).toBe(true);
    });
  });
});
