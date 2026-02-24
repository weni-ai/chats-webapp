import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

import MessageManager from '../index.vue';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';
import { useQuickMessages } from '@/store/modules/chats/quickMessages';
import { useRooms } from '@/store/modules/chats/rooms';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useDiscussionMessages } from '@/store/modules/chats/discussionMessages';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';

vi.mock('is-mobile', () => ({ default: vi.fn(() => false) }));

vi.mock('@/views/loadings/chat/MessageManager.vue', () => ({
  default: {
    name: 'MessageManagerLoading',
    template: '<div data-testid="message-manager-loading">Loading</div>',
  },
}));

vi.mock('../TextBox.vue', () => ({
  default: {
    name: 'TextBox',
    template: `
      <div class="text-box" data-testid="text-box">
        <input
          :value="modelValue"
          data-testid="text-input"
          @input="$emit('update:modelValue', $event.target.value)"
          @keydown="$emit('keydown', $event)"
        />
      </div>
    `,
    props: ['modelValue', 'isInternalNote'],
    methods: {
      focus() {},
      clearTextarea() {},
    },
  },
}));

vi.mock('../LoadingBar.vue', () => ({
  default: {
    name: 'LoadingBar',
    template: '<div class="loading-bar"></div>',
    props: ['value'],
  },
}));

vi.mock('../SuggestionBox.vue', () => ({
  default: {
    name: 'SuggestionBox',
    template:
      '<div class="suggestion-box" @open="$emit(\'open\')" @close="$emit(\'close\')" @select="$emit(\'select\', $event)" @open-copilot="$emit(\'open-copilot\')"></div>',
    props: ['search', 'suggestions', 'keyboardEvent', 'copilot'],
  },
}));

vi.mock('../CoPilot.vue', () => ({
  default: {
    name: 'CoPilot',
    template:
      '<div class="co-pilot" @select="$emit(\'select\', $event)" @close="$emit(\'close\')"></div>',
  },
}));

const createWrapper = (props = {}, piniaState = {}) => {
  const pinia = createPinia();
  setActivePinia(pinia);

  const quickMessageSharedStore = useQuickMessageShared();
  const quickMessagesStore = useQuickMessages();
  const roomsStore = useRooms();
  const discussionsStore = useDiscussions();
  const discussionMessagesStore = useDiscussionMessages();
  const roomMessagesStore = useRoomMessages();

  quickMessageSharedStore.quickMessagesShared = [];
  quickMessagesStore.quickMessages = [];
  roomsStore.canUseCopilot = false;
  roomsStore.activeRoom = { uuid: 'room-1' };
  discussionsStore.activeDiscussion = null;
  roomMessagesStore.replyMessage = null;

  discussionMessagesStore.sendDiscussionMessage = vi.fn(() =>
    Promise.resolve(),
  );
  discussionMessagesStore.sendDiscussionMedias = vi.fn(() => Promise.resolve());
  roomMessagesStore.sendRoomMessage = vi.fn(() => Promise.resolve());
  roomMessagesStore.sendRoomMedias = vi.fn(() => Promise.resolve());
  roomMessagesStore.sendRoomInternalNote = vi.fn(() => Promise.resolve());

  if (Object.keys(piniaState).length > 0) {
    if (piniaState.quickMessageShared)
      Object.assign(quickMessageSharedStore, piniaState.quickMessageShared);
    if (piniaState.quickMessages)
      Object.assign(quickMessagesStore, piniaState.quickMessages);
    if (piniaState.rooms) roomsStore.$patch(piniaState.rooms);
    if (piniaState.discussions)
      discussionsStore.activeDiscussion =
        piniaState.discussions.activeDiscussion;
    if (piniaState.roomMessages)
      Object.assign(roomMessagesStore, piniaState.roomMessages);
  }

  return mount(MessageManager, {
    props: {
      modelValue: '',
      ...props,
    },
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
      stubs: {
        UnnnicReplyMessage: {
          name: 'UnnnicReplyMessage',
          template:
            '<div class="unnnic-reply" data-testid="reply-message" @close="$emit(\'close\')"></div>',
          props: ['replyMessage', 'showClose', 'messageType'],
        },
        UnnnicAudioRecorder: {
          name: 'UnnnicAudioRecorder',
          template:
            '<div class="unnnic-audio-recorder" @status="$emit(\'status\', $event)"></div>',
          props: ['modelValue'],
        },
        UnnnicButton: {
          name: 'UnnnicButton',
          template:
            '<button class="unnnic-button" @click="$emit(\'click\')"></button>',
          props: ['type', 'size', 'iconCenter', 'next'],
        },
        UnnnicDropdown: {
          name: 'UnnnicDropdown',
          template:
            '<div class="unnnic-dropdown"><slot name="trigger" /><slot /></div>',
          props: ['position'],
        },
        MoreActionsOption: true,
      },
    },
  });
};

describe('MessageManager', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders message manager when not loading', () => {
      const wrapper = createWrapper({ showSkeletonLoading: false });

      expect(wrapper.find('[data-testid="message-manager"]').exists()).toBe(
        true,
      );
      expect(
        wrapper.find('[data-testid="message-manager-loading"]').exists(),
      ).toBe(true);
      expect(
        wrapper
          .find('[data-testid="message-manager-loading"]')
          .attributes('style'),
      ).toContain('display: none');
    });

    it('shows skeleton loading when showSkeletonLoading is true', () => {
      const wrapper = createWrapper({ showSkeletonLoading: true });

      const loading = wrapper.find('[data-testid="message-manager-loading"]');
      expect(loading.exists()).toBe(true);
    });

    it('shows LoadingBar when loadingFileValue is a number', () => {
      const wrapper = createWrapper({ loadingFileValue: 50 });

      expect(wrapper.findComponent({ name: 'LoadingBar' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'LoadingBar' }).props('value')).toBe(
        50,
      );
    });

    it('does not show LoadingBar when loadingFileValue is null', () => {
      const wrapper = createWrapper({ loadingFileValue: null });

      expect(wrapper.findComponent({ name: 'LoadingBar' }).exists()).toBe(
        false,
      );
    });

    it('applies loading class when loadingFileValue is valid', () => {
      const wrapper = createWrapper({ loadingFileValue: 30 });

      expect(
        wrapper.find('[data-testid="message-manager-box-container"]').classes(),
      ).toContain('loading');
    });

    it('renders TextBox with modelValue', () => {
      const wrapper = createWrapper({ modelValue: 'Hello' });

      const textBox = wrapper.findComponent({ name: 'TextBox' });
      expect(textBox.exists()).toBe(true);
      expect(textBox.props('modelValue')).toBe('Hello');
    });

    it('reflects replyMessage from store when set', async () => {
      const reply = {
        uuid: 'msg-1',
        text: 'Reply text',
        user: { name: 'User' },
        contact: null,
      };
      const wrapper = createWrapper();
      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);
      roomMessagesStore.replyMessage = reply;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.replyMessage).toEqual(reply);
    });
  });

  describe('v-model and textBoxMessage', () => {
    it('emits update:modelValue when TextBox updates', async () => {
      const wrapper = createWrapper({ modelValue: '' });

      await wrapper.find('[data-testid="text-input"]').setValue('New text');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0][0]).toBe('New text');
    });
  });

  describe('internal note', () => {
    it('toggles isInternalNote and clears text when internal note is triggered', async () => {
      const wrapper = createWrapper({ modelValue: 'some text' });

      expect(wrapper.vm.isInternalNote).toBe(false);

      await wrapper.vm.handleInternalNoteInput();
      expect(wrapper.vm.isInternalNote).toBe(true);
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(
        wrapper.emitted('update:modelValue').some((e) => e[0] === ''),
      ).toBe(true);

      await wrapper.vm.handleInternalNoteInput();
      expect(wrapper.vm.isInternalNote).toBe(false);
    });

    it('passes isInternalNote to TextBox', async () => {
      const wrapper = createWrapper();
      expect(
        wrapper.findComponent({ name: 'TextBox' }).props('isInternalNote'),
      ).toBe(false);

      await wrapper.vm.handleInternalNoteInput();
      await wrapper.vm.$nextTick();
      expect(
        wrapper.findComponent({ name: 'TextBox' }).props('isInternalNote'),
      ).toBe(true);
    });
  });

  describe('emits', () => {
    it('emits show-quick-messages when emitShowQuickMessages is called', () => {
      const wrapper = createWrapper();

      wrapper.vm.emitShowQuickMessages();

      expect(wrapper.emitted('show-quick-messages')).toBeTruthy();
      expect(wrapper.emitted('show-quick-messages')).toHaveLength(1);
    });

    it('emits open-file-uploader with files when openFileUploader is called', () => {
      const wrapper = createWrapper();
      const files = [new File([''], 'a.png', { type: 'image/png' })];

      wrapper.vm.openFileUploader(files);

      expect(wrapper.emitted('open-file-uploader')).toBeTruthy();
      expect(wrapper.emitted('open-file-uploader')[0]).toEqual([
        files,
        undefined,
      ]);
    });

    it('emits open-file-uploader with empty array when openFileUploader is called without files', () => {
      const wrapper = createWrapper();

      wrapper.vm.openFileUploader();

      expect(wrapper.emitted('open-file-uploader')[0]).toEqual([[], undefined]);
    });
  });

  describe('setMessage and clearReplyMessage', () => {
    it('setMessage updates textBoxMessage and focuses TextBox', async () => {
      const wrapper = createWrapper();
      const textBox = wrapper.findComponent({ name: 'TextBox' });
      const focusSpy = vi.spyOn(textBox.vm, 'focus');

      wrapper.vm.setMessage('New message');
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue').pop()[0]).toBe('New message');
      expect(focusSpy).toHaveBeenCalled();
    });

    it('clearReplyMessage sets replyMessage to null', () => {
      const wrapper = createWrapper();
      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);
      roomMessagesStore.replyMessage = {
        uuid: '1',
        text: 'R',
        user: { name: 'U' },
        contact: null,
      };

      wrapper.vm.clearReplyMessage();

      expect(wrapper.vm.replyMessage).toBeNull();
    });
  });

  describe('closeSuggestionBox', () => {
    it('clears text when it starts with /', () => {
      const wrapper = createWrapper({ modelValue: '/hello' });

      wrapper.vm.closeSuggestionBox();

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue').pop()[0]).toBe('');
    });

    it('sets isSuggestionBoxOpen to false', () => {
      const wrapper = createWrapper();
      wrapper.vm.isSuggestionBoxOpen = true;

      wrapper.vm.closeSuggestionBox();

      expect(wrapper.vm.isSuggestionBoxOpen).toBe(false);
    });
  });

  describe('onKeyDown', () => {
    it('sends message on Enter without shift', async () => {
      const wrapper = createWrapper({ modelValue: 'Hi' });
      wrapper.vm.sendTextBoxMessage = vi.fn(() => Promise.resolve());
      wrapper.vm.sendAudio = vi.fn(() => Promise.resolve());
      wrapper.vm.$refs.textBox = { clearTextarea: vi.fn() };

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: false,
      });
      event.preventDefault = vi.fn();
      wrapper.vm.onKeyDown(event);

      await flushPromises();

      expect(wrapper.vm.sendTextBoxMessage).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not send on Enter with shift', () => {
      const wrapper = createWrapper();
      const sendSpy = vi.spyOn(wrapper.vm, 'send');

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
      });
      wrapper.vm.onKeyDown(event);

      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('toggles internal note on Escape when isInternalNote', () => {
      const wrapper = createWrapper();
      wrapper.vm.isInternalNote = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      event.preventDefault = vi.fn();
      wrapper.vm.onKeyDown(event);

      expect(wrapper.vm.isInternalNote).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('closes suggestion box on Escape when open', () => {
      const wrapper = createWrapper({ modelValue: '/x' });
      wrapper.vm.isSuggestionBoxOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      wrapper.vm.onKeyDown(event);

      expect(wrapper.vm.isSuggestionBoxOpen).toBe(false);
    });
  });

  describe('send', () => {
    it('sends internal note when isInternalNote is true', async () => {
      const wrapper = createWrapper({ modelValue: '  Note content  ' });
      wrapper.vm.isInternalNote = true;
      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);

      await wrapper.vm.send();

      expect(roomMessagesStore.sendRoomInternalNote).toHaveBeenCalled();
      expect(
        roomMessagesStore.sendRoomInternalNote.mock.calls[0][0].text,
      ).toContain('Note content');
      expect(wrapper.vm.isInternalNote).toBe(false);
    });

    it('does not send internal note when text is empty', async () => {
      const wrapper = createWrapper({ modelValue: '   ' });
      wrapper.vm.isInternalNote = true;
      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);

      await wrapper.vm.send();

      expect(roomMessagesStore.sendRoomInternalNote).not.toHaveBeenCalled();
    });

    it('sends room message when discussionId is null', async () => {
      const wrapper = createWrapper({ modelValue: 'Hello room' });
      wrapper.vm.$refs.textBox = { clearTextarea: vi.fn() };
      const roomMessagesStore = useRoomMessages(wrapper.vm.$pinia);

      await wrapper.vm.send();

      expect(roomMessagesStore.sendRoomMessage).toHaveBeenCalledWith(
        'Hello room',
        null,
      );
      expect(wrapper.vm.replyMessage).toBeNull();
    });

    it('sends discussion message when discussionId is set', async () => {
      const wrapper = createWrapper(
        { modelValue: 'Discussion msg' },
        {
          discussions: {
            activeDiscussion: { uuid: 'disc-1' },
          },
        },
      );
      wrapper.vm.$refs.textBox = { clearTextarea: vi.fn() };
      const discussionMessagesStore = useDiscussionMessages(wrapper.vm.$pinia);

      await wrapper.vm.send();

      expect(
        discussionMessagesStore.sendDiscussionMessage,
      ).toHaveBeenCalledWith('Discussion msg');
    });
  });

  describe('computed', () => {
    it('shortcuts merges quickMessages and quickMessagesShared without duplicates', () => {
      const wrapper = createWrapper(
        {},
        {
          quickMessages: {
            quickMessages: [
              { uuid: 'qm1', name: 'Q1' },
              { uuid: 'qm2', name: 'Q2' },
            ],
          },
          quickMessageShared: {
            quickMessagesShared: [
              { uuid: 'qm1', name: 'Q1 shared' },
              { uuid: 'qm3', name: 'Q3' },
            ],
          },
        },
      );

      const shortcuts = wrapper.vm.shortcuts;
      expect(shortcuts).toHaveLength(3);
      const uuids = shortcuts.map((s) => s.uuid);
      expect(uuids).toContain('qm1');
      expect(uuids).toContain('qm2');
      expect(uuids).toContain('qm3');
    });

    it('isFileLoadingValueValid returns true when loadingFileValue is number', () => {
      const wrapper = createWrapper({ loadingFileValue: 75 });
      expect(wrapper.vm.isFileLoadingValueValid).toBe(true);
    });

    it('isFileLoadingValueValid returns false when loadingFileValue is null', () => {
      const wrapper = createWrapper({ loadingFileValue: null });
      expect(wrapper.vm.isFileLoadingValueValid).toBe(false);
    });

    it('showActionButton is false when isTyping', () => {
      const wrapper = createWrapper();
      wrapper.vm.isTyping = true;
      expect(wrapper.vm.showActionButton).toBe(false);
    });

    it('showSendMessageButton is true when isTyping', () => {
      const wrapper = createWrapper();
      wrapper.vm.isTyping = true;
      expect(wrapper.vm.showSendMessageButton).toBe(true);
    });
  });

  describe('handlePaste', () => {
    it('emits open-file-uploader when pasting image', () => {
      const wrapper = createWrapper();
      const file = new File(['x'], 'image.png', { type: 'image/png' });
      const item = { type: 'image/png', getAsFile: () => file };
      const event = {
        clipboardData: { items: [item] },
      };

      wrapper.vm.handlePaste(event);

      expect(wrapper.emitted('open-file-uploader')).toBeTruthy();
      expect(wrapper.emitted('open-file-uploader')[0][0]).toHaveLength(1);
      expect(wrapper.emitted('open-file-uploader')[0][0][0]).toBeInstanceOf(
        File,
      );
    });
  });
});
