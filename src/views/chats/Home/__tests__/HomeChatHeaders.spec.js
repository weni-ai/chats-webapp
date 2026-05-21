import { mount } from '@vue/test-utils';
import { beforeEach, describe, vi } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import HomeChatHeaders from '../HomeChatHeaders.vue';

const mockRouter = { push: vi.fn() };

const createWrapper = ({ store }) => {
  return mount(HomeChatHeaders, {
    global: {
      mocks: {
        $t: (key) => key,
        $tc: (key) => key,
        $router: mockRouter,
      },
      plugins: [store],
      stubs: {
        ModalCloseDiscussion: {
          template: '<div data-testid="modal-close-discussion" />',
        },
        DiscussionHeader: {
          template: '<div data-testid="discussion-header" />',
          props: ['discussionContact', 'clickable'],
        },
        ContactHeader: {
          template: '<div data-testid="chat-header" />',
          props: ['contactName', 'clickable'],
        },
      },
    },
  });
};

describe('HomeChatHeaders.vue', () => {
  let store;
  let wrapper;
  let roomStore;
  let discussionStore;

  beforeEach(() => {
    store = createTestingPinia({
      initialState: {
        rooms: {
          activeRoom: null,
        },
        discussions: {
          activeDiscussion: null,
        },
      },
    });
    wrapper = createWrapper({ store });
    roomStore = useRooms();
    discussionStore = useDiscussions();
  });

  it('renders loading state correctly', async () => {
    await wrapper.setProps({ isLoading: true });

    expect(
      wrapper.findComponent('[data-testid="chat-header-loading"]').exists(),
    ).toBe(true);

    expect(
      wrapper.findComponent('[data-testid="chat-header"]').isVisible(),
    ).toBe(false);
  });

  it('renders room header when room is active and discussion is inactive', async () => {
    roomStore.activeRoom = {
      id: '1',
      contact: { name: 'John Doe' },
      is_24h_valid: true,
    };

    await wrapper.vm.$nextTick();

    expect(
      wrapper.findComponent('[data-testid="chat-header"]').isVisible(),
    ).toBe(true);

    expect(
      wrapper.findComponent('[data-testid="chat-header-send-flow"]').exists(),
    ).toBe(false);

    expect(
      wrapper.findComponent('[data-testid="chat-header-loading"]').isVisible(),
    ).toBe(false);
  });

  it('renders discussion header when discussion is active', async () => {
    discussionStore.activeDiscussion = {
      subject: 'Chat Discussion',
      contact: 'Contact Name',
    };

    expect(wrapper.find('[data-testid="discussion-header"]').exists()).toBe(
      true,
    );
  });

  it('renders send flow header when room is active and not a discussion', async () => {
    roomStore.activeRoom = {
      is_24h_valid: false,
      contact: { name: 'John Doe' },
    };

    await wrapper.vm.$nextTick();

    expect(
      wrapper.findComponent('[data-testid="chat-header-send-flow"]').exists(),
    ).toBe(true);
  });

  it('emits openRoomContactInfo event when avatar or title is clicked', async () => {
    roomStore.activeRoom = { contact: { name: 'John Doe' } };

    await wrapper.vm.$nextTick();

    await wrapper.find('[data-testid="chat-header"]').trigger('click');
    expect(wrapper.emitted('openRoomContactInfo')).toBeTruthy();
  });

  it('emits openModalCloseChat event when close button is clicked', async () => {
    roomStore.activeRoom = { contact: { name: 'John Doe' } };
    await wrapper.vm.$nextTick();

    await wrapper.vm.emitOpenModalCloseChat();
    expect(wrapper.emitted('openModalCloseChat')).toBeTruthy();
  });

  it('emits openFlowsTrigger event when send flow is triggered', async () => {
    roomStore.activeRoom = { contact: { name: 'John Doe' } };
    await wrapper.vm.$nextTick();

    await wrapper.vm.emitOpenFlowsTrigger();
    expect(wrapper.emitted('openFlowsTrigger')).toBeTruthy();
  });

  it('emits back event when back method is called', async () => {
    await wrapper.vm.emitBack();
    expect(wrapper.emitted('back')).toBeTruthy();
  });

  describe('openHistory', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('does not navigate when has_history is false', async () => {
      roomStore.activeRoom = {
        uuid: 'room-1',
        urn: 'whatsapp:5511999998888',
        contact: { name: 'John Doe' },
        protocol: 'whatsapp',
        has_history: false,
      };
      await wrapper.vm.$nextTick();

      wrapper.vm.openHistory();

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('navigates with only URN when email and document are absent', async () => {
      roomStore.activeRoom = {
        uuid: 'room-1',
        urn: 'whatsapp:5511999998888',
        contact: { name: 'John Doe' },
        protocol: 'whatsapp',
        has_history: true,
      };
      await wrapper.vm.$nextTick();

      wrapper.vm.openHistory();

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'closed-rooms',
          query: expect.objectContaining({
            contactUrn: '5511999998888',
            from: 'room-1',
          }),
        }),
      );
    });

    it('navigates with URN, email, and sanitized document comma-separated', async () => {
      roomStore.activeRoom = {
        uuid: 'room-2',
        urn: 'whatsapp:5511999998888',
        contact: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          document: '234.234.243-20',
        },
        protocol: 'whatsapp',
        has_history: true,
      };
      await wrapper.vm.$nextTick();

      wrapper.vm.openHistory();

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'closed-rooms',
          query: expect.objectContaining({
            contactUrn: '5511999998888,jane@example.com,23423424320',
            from: 'room-2',
          }),
        }),
      );
    });

    it('navigates with only email when URN is absent', async () => {
      roomStore.activeRoom = {
        uuid: 'room-3',
        urn: '',
        contact: {
          name: 'Contact',
          email: 'only@email.com',
        },
        protocol: '',
        has_history: true,
      };
      await wrapper.vm.$nextTick();

      wrapper.vm.openHistory();

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'closed-rooms',
          query: expect.objectContaining({
            contactUrn: 'only@email.com',
            from: 'room-3',
          }),
        }),
      );
    });

    it('sanitizes document with various special characters', async () => {
      roomStore.activeRoom = {
        uuid: 'room-4',
        urn: '',
        contact: {
          name: 'Contact',
          document: '12.345.678/0001-90',
        },
        protocol: '',
        has_history: true,
      };
      await wrapper.vm.$nextTick();

      wrapper.vm.openHistory();

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'closed-rooms',
          query: expect.objectContaining({
            contactUrn: '12345678000190',
            from: 'room-4',
          }),
        }),
      );
    });
  });
});
