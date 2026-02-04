import { mount } from '@vue/test-utils';
import { beforeEach, describe } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';

import HomeChatHeaders from '../HomeChatHeaders.vue';

const createWrapper = ({ store }) => {
  return mount(HomeChatHeaders, {
    global: {
      plugins: [store],
      stubs: {
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
      wrapper.findComponent({ name: 'UnnnicChatsHeader' }).isVisible(),
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

    await wrapper.find('.unnnic-chats-header__infos__title').trigger('click');
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
});
