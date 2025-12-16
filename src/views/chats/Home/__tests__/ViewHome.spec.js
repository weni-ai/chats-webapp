import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { createTestingPinia } from '@pinia/testing';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { createRouter, createWebHistory } from 'vue-router';
import UnnnicSystem from '@/plugins/UnnnicSystem';
import ViewHome from '../index.vue';

import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';
import { useFeatureFlag } from '@/store/modules/featureFlag';

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

const discussionMock = {
  uuid: '123',
  subject: 'test',
  created_by: 'test@weni.ai',
  contact: 'test',
  created_on: '2025-04-16T09:23:16.804251-03:00',
  is_active: true,
  is_queued: false,
};

vi.mock('@/services/api/resources/chats/room', () => ({
  default: {
    getRoomTags: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

vi.mock('@/services/api/resources/chats/linkContact', () => ({
  default: { getLinketContact: vi.fn().mockResolvedValue({ Detail: true }) },
}));

vi.mock('@/services/api/resources/chats/pauseStatus');

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    tags: vi.fn().mockResolvedValue({ results: [] }),
    list: vi.fn().mockResolvedValue([]),
    listByProject: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

vi.mock('@/services/api/resources/chats/media', () => ({
  default: {
    listFromContactAndRoom: vi.fn().mockResolvedValue({ results: [] }),
  },
}));

vi.mock('@/services/api/resources/settings/sector.js', () => ({
  default: {
    countOfSectorsAvaible: vi.fn().mockResolvedValue({ sector_count: 2 }),
  },
}));

vi.mock('@/services/api/resources/chats/flowsTrigger.js', () => ({
  default: {
    listAccess: vi.fn().mockResolvedValue({
      can_trigger_flows: true,
      can_access_dashboard: true,
    }),
  },
}));

vi.mock('@/services/api/resources/chats/roomNotes', () => ({
  default: {
    getInternalNotes: vi.fn(() => ({
      results: [],
    })),
  },
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {},
  },
  fallbackWarn: false,
  missingWarn: false,
});

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'home' }],
});

config.global.plugins = [i18n];

describe('ViewHome.vue', () => {
  let wrapper;
  let pinia;

  const createWrapper = () => {
    return mount(ViewHome, {
      global: {
        plugins: [pinia, UnnnicSystem, router],
        mocks: {
          $tc: (msg) => msg,
        },
      },
    });
  };
  beforeEach(async () => {
    pinia = createTestingPinia({ createSpy: vi.fn });
    wrapper = createWrapper();
    useRoomMessages().getRoomMessages = vi.fn().mockResolvedValue([]);
    useDiscussionMessages().getDiscussionMessages = vi
      .fn()
      .mockResolvedValue([]);
    await flushPromises();
  });

  it('should render ChatsBackground when no room or discussion and skeleton is not active', () => {
    expect(
      wrapper.findComponent('[data-testid="chats-background"]').exists(),
    ).toBe(true);
  });

  it('should render HomeChat when room or discussion exists', async () => {
    const roomsStore = useRooms();
    roomsStore.activeRoom = roomMock;
    await flushPromises();
    expect(wrapper.findComponent('[data-testid="home-chat"]').exists()).toBe(
      true,
    );
  });

  it('should render ContactInfo if room exists and discussion does not', async () => {
    const roomsStore = useRooms();
    roomsStore.activeRoom = roomMock;
    const featureFlagsStore = useFeatureFlag();
    featureFlagsStore.featureFlags = {
      active_features: ['weniChatsContactInfoV2'],
    };
    const homeChat = wrapper.findComponent('[data-testid="home-chat"]');
    await homeChat.vm.$emit('open-room-contact-info');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent('[data-testid="contact-info"]').exists()).toBe(
      true,
    );
  });

  it('should render DiscussionSidebar if discussion exists', async () => {
    const discussionsStore = useDiscussions();
    discussionsStore.getDiscussionDetails = vi.fn().mockResolvedValue({
      uuid: '123',
      created_by: {
        first_name: 'Test',
        last_name: 'Test',
        email: 'test@weni.ai',
      },
      room: '456',
      contact: 'Contact',
      created_on: '2025-04-16T09:23:16.804251-03:00',
    });
    discussionsStore.activeDiscussion = discussionMock;
    await wrapper.vm.$nextTick();
    expect(
      wrapper.findComponent('[ data-testid="discussion-sidebar"]').exists(),
    ).toBe(true);
  });

  it('calls closeRoomContactInfo when event is emitted from HomeChat', async () => {
    const homeChat = wrapper.findComponent('[data-testid="home-chat"]');

    await homeChat.vm.$emit('close-room-contact-info');
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isRoomContactInfoOpen).toBe(false);
  });

  it('calls openFlowsTrigger with contact from room', async () => {
    const roomsStore = useRooms();
    roomsStore.activeRoom = roomMock;
    await wrapper.vm.$nextTick();

    const openFlowsTriggerSpy = vi.spyOn(wrapper.vm, 'openFlowsTrigger');

    const chatsLayout = wrapper.findComponent('[data-testid="chats-layout"]');

    const chatsLayoutOpenFlowsTriggerSpy = vi.spyOn(
      chatsLayout.vm,
      'openFlowsTrigger',
    );

    const homeChat = wrapper.findComponent('[data-testid="home-chat"]');
    await homeChat.vm.$emit('open-flows-trigger');

    expect(openFlowsTriggerSpy).toHaveBeenCalled();
    expect(chatsLayoutOpenFlowsTriggerSpy).toHaveBeenCalledWith({
      contact: roomMock.contact,
    });
  });
});
