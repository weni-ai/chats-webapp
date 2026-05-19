import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import isMobile from 'is-mobile';

import ClosedChats from '../index.vue';
import History from '@/services/api/resources/chats/history';

import { useRooms } from '@/store/modules/chats/rooms';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useConfig } from '@/store/modules/config';

vi.mock('@/store/modules/chats/rooms', () => ({
  useRooms: vi.fn(),
}));

vi.mock('@/store/modules/chats/roomMessages', () => ({
  useRoomMessages: vi.fn(),
}));

vi.mock('@/store/modules/config', () => ({
  useConfig: vi.fn(),
}));

vi.mock('is-mobile', () => ({
  default: vi.fn(),
}));

vi.mock('@/services/api/resources/chats/history', () => ({
  default: {
    getHistoryContactRoom: vi.fn(),
    getHistoryContactRoomsUuids: vi.fn(),
    getHistoryContactRoomMessages: vi.fn(),
  },
}));

vi.mock('@/utils/messages', () => ({
  treatMessages: vi.fn().mockResolvedValue([]),
  getMessages: vi.fn().mockResolvedValue([]),
}));

const mockRoom = {
  uuid: '123',
  contact: {
    name: 'John Doe',
    external_id: 'contact123',
  },
  user: { first_name: 'Agent Smith' },
  tags: [{ name: 'VIP' }, { name: 'Support' }],
  ended_at: new Date().toISOString(),
};

const mockProject = {
  name: 'Test Project',
  uuid: 'project123',
};

describe('ClosedChats.vue', () => {
  let wrapper;
  let setActiveRoomSpy;
  let getRoomMessagesSpy;
  let resetRoomMessagesSpy;

  beforeEach(() => {
    vi.clearAllMocks();

    setActiveRoomSpy = vi.fn();
    getRoomMessagesSpy = vi.fn().mockResolvedValue();
    resetRoomMessagesSpy = vi.fn();

    useRooms.mockReturnValue({
      activeRoomSummary: {
        summary: '',
        status: '',
        feedback: {
          liked: null,
          text: null,
        },
      },
      setActiveRoom: setActiveRoomSpy,
      activeRoom: null,
    });

    useRoomMessages.mockReturnValue({
      getRoomMessages: getRoomMessagesSpy,
      resetRoomMessages: resetRoomMessagesSpy,
      roomMessagesNext: null,
      roomMessages: [],
    });

    useConfig.mockReturnValue({
      project: mockProject,
    });

    isMobile.mockReset().mockReturnValue(false);

    History.getHistoryContactRoom.mockReset().mockResolvedValue(mockRoom);

    History.getHistoryContactRoomsUuids
      .mockReset()
      .mockResolvedValue({ results: ['uuid1', 'uuid2'] });

    History.getHistoryContactRoomMessages
      .mockReset()
      .mockResolvedValue({ results: [] });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const createWrapper = (props = {}) => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    });

    if (props.hasNextPage) {
      useRoomMessages.mockReturnValue({
        ...useRoomMessages(),
        roomMessagesNext: 'nextpage',
      });
    }

    if (props.noProject) {
      useConfig.mockReturnValue({
        project: null,
      });
    }

    return mount(ClosedChats, {
      props: {
        roomId: props.roomId || '',
      },
      global: {
        plugins: [pinia],
        mocks: {
          $t: (key) => key,
          $d: () => '01/01/2023',
          $route: {
            query: {},
            params: { roomId: props.roomId || '' },
          },
          $router: {
            push: vi.fn(),
          },
        },
        stubs: {
          ContactHeader: {
            template: '<div data-testid="contact-header"></div>',
          },
          ClosedChatsHeaderLoading: {
            template: '<div data-testid="closed-chats-header-loading"></div>',
          },
          ChatHeaderLoading: {
            template: '<div data-testid="chat-header-loading"></div>',
          },
          ChatsHeader: {
            template: '<div data-testid="unnnic-chats-header"><slot /></div>',
            props: [
              'title',
              'subtitle',
              'avatarIcon',
              'crumbs',
              'close',
              'size',
              'avatarName',
            ],
            emits: ['crumb-click'],
          },
          RoomMessages: {
            template: '<div data-testid="room-messages"></div>',
          },
          ContactInfo: {
            template: '<div data-testid="contact-info"></div>',
            props: ['isHistory', 'closedRoom'],
            emits: ['close'],
          },
          ClosedChatsRoomsTable: {
            template: '<div data-testid="closed-chats-rooms-table"></div>',
          },
          WarningArchivedMessages: {
            template: '<div data-testid="warning-archived-messages"></div>',
          },
        },
      },
    });
  };

  describe('Rendering and Initial State', () => {
    it('renders header loading state initially', async () => {
      useConfig.mockReturnValue({
        project: null,
      });

      wrapper = createWrapper();

      expect(
        wrapper.find('[data-testid="closed-chats-header-loading"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="closed-chats-page-header"]').exists(),
      ).toBe(false);
    });

    it('back button on project header navigates back to home', async () => {
      wrapper = createWrapper();

      await wrapper
        .find('[data-testid="closed-chats-page-header"]')
        .find('[data-testid="back-button"]')
        .trigger('click');

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ name: 'home' });
    });

    it('renders rooms table when no roomId is provided', async () => {
      wrapper = createWrapper();

      expect(
        wrapper.find('[data-testid="closed-chats-rooms-table"]').isVisible(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="closed-chats-selected-chat"]').exists(),
      ).toBe(false);
    });

    it('shows loading state when roomId is provided', async () => {
      History.getHistoryContactRoom.mockReturnValueOnce(new Promise(() => {}));

      wrapper = createWrapper({ roomId: '123' });

      await wrapper.setData({ isLoadingSelectedRoom: true });

      expect(wrapper.vm.isLoadingSelectedRoom).toBe(true);
      expect(wrapper.find('[data-testid="chat-header-loading"]').exists()).toBe(
        true,
      );
    });

    it('renders selected room info when roomId is provided', async () => {
      wrapper = createWrapper({ roomId: '123' });

      await wrapper.setData({
        selectedRoom: mockRoom,
        isLoadingSelectedRoom: false,
      });

      expect(wrapper.find('[data-testid="contact-info"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="room-messages"]').exists()).toBe(true);
    });

    it('renders WarningArchivedMessages when room is archived', async () => {
      const archivedRoom = {
        ...mockRoom,
        is_archived: true,
        archived_conversation_file_url: 'https://example.com/archive.zip',
      };

      History.getHistoryContactRoom.mockReset().mockResolvedValue(archivedRoom);

      wrapper = createWrapper({ roomId: '123' });

      await wrapper.vm.$options.watch.roomId.handler.call(
        wrapper.vm,
        '123',
        '',
      );

      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedRoom.is_archived).toBe(true);
      expect(
        wrapper.vm.selectedRoom.archived_conversation_file_url,
      ).toBeTruthy();
      expect(
        wrapper.find('[data-testid="warning-archived-messages"]').exists(),
      ).toBe(true);
    });

    it('does not render WarningArchivedMessages when room is not archived', async () => {
      wrapper = createWrapper({ roomId: '123' });

      await wrapper.setData({
        selectedRoom: mockRoom,
        isLoadingSelectedRoom: false,
      });

      await wrapper.vm.$nextTick();

      expect(
        wrapper.find('[data-testid="warning-archived-messages"]').exists(),
      ).toBe(false);
    });

    it('does not render WarningArchivedMessages when archived_conversation_file_url is missing', async () => {
      const roomWithoutUrl = {
        ...mockRoom,
        is_archived: true,
        archived_conversation_file_url: '',
      };

      wrapper = createWrapper({ roomId: '123' });

      await wrapper.setData({
        selectedRoom: roomWithoutUrl,
        isLoadingSelectedRoom: false,
      });

      await wrapper.vm.$nextTick();

      expect(
        wrapper.find('[data-testid="warning-archived-messages"]').exists(),
      ).toBe(false);
    });
  });

  describe('API Calls and Data Fetching', () => {
    it('calls getHistoryContactRoom when roomId is provided', async () => {
      wrapper = createWrapper({ roomId: '123' });

      await wrapper.vm.$options.watch.roomId.handler.call(
        wrapper.vm,
        '123',
        '',
      );

      expect(History.getHistoryContactRoom).toHaveBeenCalledWith({
        room: '123',
      });
    });

    it('fetches room messages when room is not archived', async () => {
      History.getHistoryContactRoom.mockReset().mockResolvedValue(mockRoom);

      wrapper = createWrapper({ roomId: '123' });

      await wrapper.vm.$options.watch.roomId.handler.call(
        wrapper.vm,
        '123',
        '',
      );

      expect(getRoomMessagesSpy).toHaveBeenCalled();
    });

    it('does not fetch room messages when room is archived', async () => {
      const archivedRoom = {
        ...mockRoom,
        is_archived: true,
        archived_conversation_file_url: 'https://example.com/archive.zip',
      };

      History.getHistoryContactRoom.mockReset().mockResolvedValue(archivedRoom);

      wrapper = createWrapper({ roomId: '123' });

      getRoomMessagesSpy.mockClear();

      await wrapper.vm.$options.watch.roomId.handler.call(
        wrapper.vm,
        '123',
        '',
      );

      expect(getRoomMessagesSpy).not.toHaveBeenCalled();
    });

    it('redirects to closed-rooms when room is not found', async () => {
      History.getHistoryContactRoom.mockResolvedValueOnce({ status: 404 });

      wrapper = createWrapper({ roomId: '123' });

      await wrapper.vm.$options.watch.roomId.handler.call(
        wrapper.vm,
        '123',
        '',
      );

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith({
        name: 'closed-rooms',
      });
    });

    it('resets room data when roomId becomes empty', async () => {
      wrapper = createWrapper();

      await wrapper.vm.$options.watch.roomId.handler.call(
        wrapper.vm,
        '',
        '123',
      );

      expect(setActiveRoomSpy).toHaveBeenCalledWith(null);
      expect(resetRoomMessagesSpy).toHaveBeenCalled();
    });
  });

  describe('Navigation and Routing', () => {
    it('navigates back to home when backToHome is called', async () => {
      wrapper = createWrapper();

      await wrapper.vm.backToHome();
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ name: 'home' });
    });
  });

  describe('Component Methods', () => {
    it('calls getHistoryContactRoomMessages when chatScrollTop is called and roomMessagesNext exists', async () => {
      useRoomMessages.mockReturnValue({
        ...useRoomMessages(),
        roomMessagesNext: 'nextpage',
      });

      wrapper = createWrapper();

      await wrapper.vm.chatScrollTop();

      expect(getRoomMessagesSpy).toHaveBeenCalled();
    });

    it('does not call getHistoryContactRoomMessages when roomMessagesNext is null', async () => {
      useRoomMessages.mockReturnValue({
        ...useRoomMessages(),
        roomMessagesNext: null,
      });

      wrapper = createWrapper();

      await wrapper.vm.chatScrollTop();

      expect(getRoomMessagesSpy).not.toHaveBeenCalled();
    });
  });

  describe('Watches', () => {
    it('updates isLoadingHeader when project changes', async () => {
      useConfig.mockReturnValue({
        project: null,
      });

      wrapper = createWrapper();
      expect(wrapper.vm.isLoadingHeader).toBe(true);

      await wrapper.vm.$options.watch.project.handler.call(
        wrapper.vm,
        mockProject,
        null,
      );

      expect(wrapper.vm.isLoadingHeader).toBe(false);
    });
  });
});
