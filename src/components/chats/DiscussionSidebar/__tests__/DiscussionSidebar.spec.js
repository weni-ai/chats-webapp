import { beforeEach, describe, expect, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import DiscussionSidebar from '../index.vue';

import { useDiscussions } from '@/store/modules/chats/discussions';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { createTestingPinia } from '@pinia/testing';

import Discussion from '@/services/api/resources/chats/discussion';

vi.mock('@/services/api/resources/chats/discussion', () => ({
  default: {
    getDiscussionDetails: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.spyOn(Discussion, 'getDiscussionDetails').mockResolvedValue({
  uuid: '123',
  created_by: {
    first_name: 'User',
    last_name: 'Mock',
    email: 'test@weni.ai',
  },
  room: '1',
  contact: 'Contact Mock',
});

const createWrapper = () => {
  return mount(DiscussionSidebar, {
    global: {
      stubs: { DiscussionAbout: true },
      plugins: [
        createTestingPinia({
          stubActions: false,
          initialState: {
            rooms: {},
            profile: { me: { email: 'user@example.com' } },
            discussions: {
              activeDiscussion: {
                uuid: '1',
                room: '123',
                contact: 'Contact',
                created_by: { email: 'user@example.com' },
              },
            },
          },
        }),
      ],
    },
  });
};

describe('DiscussionSidebar', () => {
  let wrapper;

  let discussionStore;

  let roomMessagesStore;

  beforeEach(() => {
    wrapper = createWrapper();

    discussionStore = useDiscussions();

    roomMessagesStore = useRoomMessages();
  });

  it('should call loadDiscussionDetails when discussion changes', async () => {
    expect(
      wrapper.findComponent({ name: 'DiscussionSidebarLoading' }).exists(),
    ).toBe(true);
  });

  it('should hide loading state once the discussion details are loaded', async () => {
    await flushPromises();
    expect(
      wrapper.findComponent({ name: 'DiscussionSidebarLoading' }).isVisible(),
    ).toBe(false);
    expect(
      wrapper.findComponent({ name: 'AsideSlotTemplate' }).isVisible(),
    ).toBe(true);
  });

  it('should call loadDiscussionDetails on discussion change', async () => {
    const loadDiscussionDetailsSpy = vi.spyOn(
      wrapper.vm,
      'loadDiscussionDetails',
    );

    discussionStore.activeDiscussion = { uuid: '2' };

    await wrapper.vm.$nextTick();

    expect(loadDiscussionDetailsSpy).toHaveBeenCalled();
  });

  it('should update room messages', async () => {
    const getRoomMessagesSpy = vi.spyOn(wrapper.vm, 'getRoomMessages');

    const updateMessagesButton = wrapper.find(
      '[data-testid="update-room-messages-button"]',
    );

    roomMessagesStore.getRoomMessages = vi.fn().mockResolvedValue();

    await updateMessagesButton.trigger('click');

    expect(getRoomMessagesSpy).toHaveBeenCalled();
    expect(wrapper.vm.isMessagesRoomLoading).toBe(false);
  });
});
