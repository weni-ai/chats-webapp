import { config, mount } from '@vue/test-utils';
import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import i18n from '@/plugins/i18n';
import MessageManagerTextBoxActions from '../Actions.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useDiscussions } from '@/store/modules/chats/discussions';

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

describe('MessageManagerTextBoxActions.vue', () => {
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({
      stubActions: false,
      initialState: {
        discussions: { activeDiscussion: null },
      },
    });
    setActivePinia(pinia);
  });

  const createWrapper = () =>
    mount(MessageManagerTextBoxActions, {
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
      },
    });

  const toolbarActionIcons = (wrapper) =>
    wrapper
      .findAll('[data-testid^="text-box-action-"]')
      .map((w) => w.attributes('data-testid').replace('text-box-action-', ''));

  it('renders the actions root', () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.audioRecorderStatus = 'idle';
    messageManagerStore.mediaUploadFiles = [];
    messageManagerStore.isInternalNote = false;
    messageManagerStore.isSuggestionBoxOpen = false;

    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="text-box-actions"]').exists()).toBe(
      true,
    );
  });

  it('emits send when the send button is clicked', async () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = 'ok';
    messageManagerStore.isInternalNote = false;
    messageManagerStore.audioRecorderStatus = 'idle';
    messageManagerStore.mediaUploadFiles = [];
    messageManagerStore.isSuggestionBoxOpen = false;

    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="text-box-actions-send"]')
      .trigger('click');

    expect(wrapper.emitted('send')).toBeTruthy();
  });

  it('emits focusInput and sets input to "/" when quick message is toggled on', async () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.isSuggestionBoxOpen = false;
    messageManagerStore.audioRecorderStatus = 'idle';
    messageManagerStore.mediaUploadFiles = [];
    messageManagerStore.isInternalNote = false;

    const wrapper = createWrapper();
    await wrapper.find('[data-testid="text-box-action-bolt"]').trigger('click');

    expect(wrapper.emitted('focusInput')).toHaveLength(1);
    expect(messageManagerStore.inputMessage).toBe('/');
  });

  it('emits startAudioRecording when mic is used', async () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.audioRecorderStatus = 'idle';
    messageManagerStore.mediaUploadFiles = [];
    messageManagerStore.isInternalNote = false;
    messageManagerStore.isSuggestionBoxOpen = false;
    const clearSpy = vi.spyOn(messageManagerStore, 'clearInputs');
    const wrapper = createWrapper();
    await wrapper.find('[data-testid="text-box-action-mic"]').trigger('click');

    expect(wrapper.emitted('startAudioRecording')).toBeTruthy();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('emits openUploadFiles when attach is used', async () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.audioRecorderStatus = 'idle';
    messageManagerStore.mediaUploadFiles = [];
    messageManagerStore.isInternalNote = false;
    messageManagerStore.isSuggestionBoxOpen = false;
    const clearSpy = vi.spyOn(messageManagerStore, 'clearInputs');

    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="text-box-action-attach_file_add"]')
      .trigger('click');

    expect(wrapper.emitted('openUploadFiles')).toBeTruthy();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('hides quick message and internal note actions when a discussion is active', () => {
    const discussions = useDiscussions();
    discussions.activeDiscussion = { uuid: 'd-1' };

    const messageManagerStore = useMessageManager();
    messageManagerStore.inputMessage = '';
    messageManagerStore.audioRecorderStatus = 'idle';
    messageManagerStore.mediaUploadFiles = [];
    messageManagerStore.isInternalNote = false;
    messageManagerStore.isSuggestionBoxOpen = false;

    const wrapper = createWrapper();
    const icons = toolbarActionIcons(wrapper);

    expect(icons).not.toContain('bolt');
    expect(icons).not.toContain('add_notes');
    expect(icons).toContain('mic');
    expect(icons).toContain('attach_file_add');
  });
});
