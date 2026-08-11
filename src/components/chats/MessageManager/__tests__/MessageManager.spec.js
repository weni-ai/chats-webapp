import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import MessageManager from '../index.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useProfile } from '@/store/modules/profile';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';
import { useConfig } from '@/store/modules/config';
import i18n from '@/plugins/i18n';

vi.mock('is-mobile', () => ({ default: vi.fn(() => false) }));

vi.mock('../MessageManagerLoading.vue', () => ({
  default: {
    name: 'MessageManagerLoading',
    template: '<div data-testid="message-manager-loading">Loading</div>',
  },
}));

vi.mock('../TextBox/index.vue', () => ({
  default: {
    name: 'MessageManagerTextBox',
    template:
      '<div data-testid="message-manager-text-box" @keydown="$emit(\'keydown\', $event)" />',
    emits: ['keydown'],
    methods: {
      focus: vi.fn(),
    },
  },
}));

vi.mock('../SuggestionBox/index.vue', () => ({
  default: {
    name: 'SuggestionBox',
    template:
      '<div data-testid="suggestion-box" @select="$emit(\'select\', $event)" @close="$emit(\'close\')" />',
    props: ['search', 'keyboardEvent', 'ignoreClickOutside'],
    emits: ['open', 'hide', 'close', 'select'],
  },
}));

vi.mock('../CoPilot.vue', () => ({
  default: {
    name: 'CoPilot',
    template:
      '<div data-testid="co-pilot" @select="$emit(\'select\', $event)" />',
    emits: ['select'],
  },
}));

const createWrapper = (props = {}, piniaState = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);

  const roomsStore = useRooms();
  const discussionsStore = useDiscussions();
  const profileStore = useProfile();
  const roomMessagesStore = useRoomMessages();
  const discussionMessagesStore = useDiscussionMessages();
  const messageManagerStore = useMessageManager();

  roomsStore.activeRoom = { uuid: 'room-1', user: { email: 'agent@test.com' } };
  discussionsStore.activeDiscussion = null;
  profileStore.me = { email: 'agent@test.com' };

  roomMessagesStore.sendRoomMessage = vi.fn(() => Promise.resolve());
  roomMessagesStore.sendRoomMedias = vi.fn(() => Promise.resolve());
  roomMessagesStore.sendRoomInternalNote = vi.fn(() => Promise.resolve());
  discussionMessagesStore.sendDiscussionMessage = vi.fn(() =>
    Promise.resolve(),
  );
  discussionMessagesStore.sendDiscussionMedias = vi.fn(() => Promise.resolve());

  if (piniaState.rooms) {
    roomsStore.$patch(piniaState.rooms);
  }

  if (piniaState.discussions) {
    discussionsStore.activeDiscussion = piniaState.discussions.activeDiscussion;
  }

  if (piniaState.messageManager) {
    messageManagerStore.$patch(piniaState.messageManager);
  }

  if (piniaState.config) {
    useConfig().$patch(piniaState.config);
  }

  return mount(MessageManager, {
    props,
    global: {
      plugins: [pinia],
      stubs: {
        UnnnicDisclaimer: {
          template:
            '<div data-testid="disabled-input-disclaimer"><slot /></div>',
          props: ['description', 'type'],
        },
      },
    },
  });
};

describe('MessageManager', () => {
  beforeEach(() => {
    config.global.plugins = (config.global.plugins || []).filter(
      (plugin) => plugin !== i18n,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (config.global.plugins && !config.global.plugins.includes(i18n)) {
      config.global.plugins.push(i18n);
    }
  });

  describe('rendering', () => {
    it('renders loading state when isLoading is true', () => {
      const wrapper = createWrapper({ isLoading: true });

      expect(
        wrapper.find('[data-testid="message-manager-loading"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="message-manager-text-box"]').exists(),
      ).toBe(false);
    });

    it('renders text box when isLoading is false', () => {
      const wrapper = createWrapper({ isLoading: false });

      expect(
        wrapper.find('[data-testid="message-manager-text-box"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="message-manager-loading"]').exists(),
      ).toBe(false);
    });

    it('shows disabled input disclaimer when input is disabled', () => {
      const wrapper = createWrapper(
        { isLoading: false },
        {
          config: {
            project: { config: { restrict_offline_agents: true } },
            status: 'OFFLINE',
          },
        },
      );

      expect(
        wrapper.find('[data-testid="disabled-input-disclaimer"]').exists(),
      ).toBe(true);
    });

    it('renders suggestion box outside discussions', () => {
      const wrapper = createWrapper();

      expect(wrapper.find('[data-testid="suggestion-box"]').exists()).toBe(true);
    });

    it('does not render suggestion box in discussions', () => {
      const wrapper = createWrapper(
        {},
        {
          discussions: {
            activeDiscussion: { uuid: 'discussion-1' },
          },
        },
      );

      expect(wrapper.find('[data-testid="suggestion-box"]').exists()).toBe(
        false,
      );
    });

    it('renders copilot when isCopilotOpen is true', () => {
      const wrapper = createWrapper(
        {},
        {
          messageManager: {
            isCopilotOpen: true,
          },
        },
      );

      expect(wrapper.find('[data-testid="co-pilot"]').exists()).toBe(true);
    });
  });

  describe('setMessage', () => {
    it('updates inputMessage and closes copilot', async () => {
      const wrapper = createWrapper(
        {},
        {
          messageManager: {
            inputMessage: '',
            isCopilotOpen: true,
          },
        },
      );
      const messageManagerStore = useMessageManager();

      await wrapper
        .findComponent({ name: 'SuggestionBox' })
        .vm.$emit('select', 'Selected text');
      await wrapper.vm.$nextTick();

      expect(messageManagerStore.inputMessage).toBe('Selected text');
      expect(messageManagerStore.isCopilotOpen).toBe(false);
    });
  });

  describe('closeSuggestionBox', () => {
    it('clears input and closes suggestion box', async () => {
      const wrapper = createWrapper();
      const messageManagerStore = useMessageManager();

      messageManagerStore.inputMessage = '/hello';
      messageManagerStore.isSuggestionBoxOpen = true;

      await wrapper
        .findComponent({ name: 'SuggestionBox' })
        .vm.$emit('close');
      await wrapper.vm.$nextTick();

      expect(messageManagerStore.inputMessage).toBe('');
      expect(messageManagerStore.isSuggestionBoxOpen).toBe(false);
    });
  });

  describe('onKeyDown', () => {
    it('sends room message on Enter without shift', async () => {
      const wrapper = createWrapper();
      const messageManagerStore = useMessageManager();
      const roomMessagesStore = useRoomMessages();

      messageManagerStore.inputMessage = 'Hello';

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: false,
      });
      event.preventDefault = vi.fn();

      await wrapper
        .findComponent({ name: 'MessageManagerTextBox' })
        .vm.$emit('keydown', event);

      expect(roomMessagesStore.sendRoomMessage).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('sends medias on Enter when files are attached', async () => {
      const wrapper = createWrapper();
      const messageManagerStore = useMessageManager();
      const roomMessagesStore = useRoomMessages();

      messageManagerStore.mediaUploadFiles = [
        new File(['content'], 'image.png', { type: 'image/png' }),
      ];

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: false,
      });
      event.preventDefault = vi.fn();

      await wrapper
        .findComponent({ name: 'MessageManagerTextBox' })
        .vm.$emit('keydown', event);

      expect(roomMessagesStore.sendRoomMedias).toHaveBeenCalled();
    });

    it('does not send on Enter with shift', async () => {
      const wrapper = createWrapper();
      const messageManagerStore = useMessageManager();
      const sendRoomMessageSpy = vi.spyOn(messageManagerStore, 'sendRoomMessage');

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
      });

      await wrapper
        .findComponent({ name: 'MessageManagerTextBox' })
        .vm.$emit('keydown', event);

      expect(sendRoomMessageSpy).not.toHaveBeenCalled();
    });

    it('toggles internal note on Escape when isInternalNote is true', async () => {
      const wrapper = createWrapper();
      const messageManagerStore = useMessageManager();

      messageManagerStore.isInternalNote = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      event.preventDefault = vi.fn();

      await wrapper
        .findComponent({ name: 'MessageManagerTextBox' })
        .vm.$emit('keydown', event);

      expect(messageManagerStore.isInternalNote).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('closes suggestion box on Escape when it is open', async () => {
      const wrapper = createWrapper();
      const messageManagerStore = useMessageManager();

      messageManagerStore.isSuggestionBoxOpen = true;
      messageManagerStore.inputMessage = '/hello';

      const event = new KeyboardEvent('keydown', { key: 'Escape' });

      await wrapper
        .findComponent({ name: 'MessageManagerTextBox' })
        .vm.$emit('keydown', event);

      expect(messageManagerStore.isSuggestionBoxOpen).toBe(false);
      expect(messageManagerStore.inputMessage).toBe('');
    });
  });
});
