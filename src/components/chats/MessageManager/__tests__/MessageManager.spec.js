import { config, flushPromises, mount } from '@vue/test-utils';
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
import MessageManager from '../index.vue';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useMessageManager } from '@/store/modules/chats/messageManager';

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

describe('MessageManager (index.vue)', () => {
  let pinia;
  let textBoxFocus;

  beforeEach(() => {
    textBoxFocus = vi.fn();
    pinia = createTestingPinia({
      stubActions: false,
      initialState: {
        discussions: { activeDiscussion: null },
      },
    });
    setActivePinia(pinia);
  });

  const createWrapper = (props = {}) =>
    mount(MessageManager, {
      props: {
        isLoading: false,
        ...props,
      },
      global: {
        plugins: [pinia],
        stubs: {
          MessageManagerLoading: {
            name: 'MessageManagerLoading',
            template: '<div data-testid="stub-loading" />',
          },
          MessageManagerTextBox: {
            name: 'MessageManagerTextBox',
            inheritAttrs: false,
            template:
              '<div data-testid="stub-text-box"><textarea data-testid="stub-text-box-keydown-source" @keydown="$emit(\'keydown\', $event)" /></div>',
            methods: {
              focus: textBoxFocus,
            },
          },
          SuggestionBox: {
            name: 'SuggestionBox',
            props: ['search', 'keyboardEvent', 'ignoreClickOutside'],
            template:
              '<div data-testid="stub-suggestion-box"><button type="button" data-testid="stub-suggestion-select" @click="$emit(\'select\', \'from-suggestion\')" /><button type="button" data-testid="stub-suggestion-close" @click="$emit(\'close\')" /></div>',
          },
          CoPilot: {
            name: 'CoPilot',
            template:
              '<div data-testid="stub-copilot"><button type="button" data-testid="stub-copilot-select" @click="$emit(\'select\', \'from-copilot\')" /></div>',
          },
        },
      },
    });

  it('renders the message manager root', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="message-manager"]').exists()).toBe(true);
  });

  it('shows loading instead of the text box when isLoading is true', () => {
    const wrapper = createWrapper({ isLoading: true });
    expect(wrapper.find('[data-testid="stub-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="stub-text-box"]').exists()).toBe(false);
  });

  it('shows the text box when isLoading is false', () => {
    const wrapper = createWrapper({ isLoading: false });
    expect(wrapper.find('[data-testid="stub-loading"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="stub-text-box"]').exists()).toBe(true);
  });

  it('renders SuggestionBox when there is no active discussion', () => {
    const discussions = useDiscussions();
    discussions.activeDiscussion = null;

    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="stub-suggestion-box"]').exists()).toBe(
      true,
    );
  });

  it('hides SuggestionBox when a discussion is active', () => {
    const discussions = useDiscussions();
    discussions.activeDiscussion = { uuid: 'd-1' };

    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="stub-suggestion-box"]').exists()).toBe(
      false,
    );
  });

  it('renders CoPilot when isCopilotOpen is true', () => {
    const mm = useMessageManager();
    mm.isCopilotOpen = true;

    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="stub-copilot"]').exists()).toBe(true);
  });

  it('does not render CoPilot when isCopilotOpen is false', () => {
    const mm = useMessageManager();
    mm.isCopilotOpen = false;

    const wrapper = createWrapper();
    expect(wrapper.find('[data-testid="stub-copilot"]').exists()).toBe(false);
  });

  it('sets input from SuggestionBox select, closes copilot, and focuses the text box', async () => {
    const mm = useMessageManager();
    mm.inputMessage = '/';
    mm.isCopilotOpen = true;
    mm.isSuggestionBoxOpen = false;

    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="stub-suggestion-select"]')
      .trigger('click');
    await flushPromises();

    expect(mm.inputMessage).toBe('from-suggestion');
    expect(mm.isCopilotOpen).toBe(false);
    expect(textBoxFocus).toHaveBeenCalled();
  });

  it('sets input from CoPilot select and focuses the text box', async () => {
    const mm = useMessageManager();
    mm.inputMessage = '';
    mm.isCopilotOpen = true;

    const wrapper = createWrapper();
    await wrapper.find('[data-testid="stub-copilot-select"]').trigger('click');
    await flushPromises();

    expect(mm.inputMessage).toBe('from-copilot');
    expect(textBoxFocus).toHaveBeenCalled();
  });

  it('clears input and closes the suggestion flag on Escape while the suggestion box is open', async () => {
    const mm = useMessageManager();
    mm.inputMessage = '/hi';
    mm.isSuggestionBoxOpen = true;

    const wrapper = createWrapper();
    const source = wrapper.find('[data-testid="stub-text-box-keydown-source"]');
    await source.trigger('keydown', { key: 'Escape' });

    expect(mm.isSuggestionBoxOpen).toBe(false);
    expect(mm.inputMessage).toBe('');
  });

  it('forwards keydown to SuggestionBox as keyboardEvent when the suggestion box is open', async () => {
    const mm = useMessageManager();
    mm.inputMessage = '/x';
    mm.isSuggestionBoxOpen = true;

    const wrapper = createWrapper();
    const suggestion = wrapper.findComponent({ name: 'SuggestionBox' });
    await wrapper
      .find('[data-testid="stub-text-box-keydown-source"]')
      .trigger('keydown', { key: 'ArrowDown' });

    expect(suggestion.props('keyboardEvent')?.key).toBe('ArrowDown');
  });

  it('calls sendRoomMessage on Enter without Shift when the suggestion box is closed', async () => {
    const mm = useMessageManager();
    mm.inputMessage = 'hello';
    mm.isSuggestionBoxOpen = false;
    mm.mediaUploadFiles = [];
    const spy = vi.spyOn(mm, 'sendRoomMessage');

    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="stub-text-box-keydown-source"]')
      .trigger('keydown', { key: 'Enter', shiftKey: false });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('calls sendMediasMessage on Enter when there are media files and the suggestion box is closed', async () => {
    const mm = useMessageManager();
    mm.inputMessage = '';
    mm.isSuggestionBoxOpen = false;
    mm.mediaUploadFiles = [new File(['x'], 'a.png', { type: 'image/png' })];
    const spy = vi.spyOn(mm, 'sendMediasMessage');

    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="stub-text-box-keydown-source"]')
      .trigger('keydown', { key: 'Enter', shiftKey: false });

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('does not send on Enter with Shift', async () => {
    const mm = useMessageManager();
    mm.inputMessage = 'hello';
    mm.isSuggestionBoxOpen = false;
    const sendSpy = vi.spyOn(mm, 'sendRoomMessage');
    const mediasSpy = vi.spyOn(mm, 'sendMediasMessage');

    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="stub-text-box-keydown-source"]')
      .trigger('keydown', { key: 'Enter', shiftKey: true });

    expect(sendSpy).not.toHaveBeenCalled();
    expect(mediasSpy).not.toHaveBeenCalled();
    sendSpy.mockRestore();
    mediasSpy.mockRestore();
  });

  it('does not call send when Enter is handled by the suggestion box branch', async () => {
    const mm = useMessageManager();
    mm.inputMessage = '/';
    mm.isSuggestionBoxOpen = true;
    const sendSpy = vi.spyOn(mm, 'sendRoomMessage');

    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="stub-text-box-keydown-source"]')
      .trigger('keydown', { key: 'Enter', shiftKey: false });

    expect(sendSpy).not.toHaveBeenCalled();
    sendSpy.mockRestore();
  });

  it('turns off internal note on Escape when the suggestion box is closed', async () => {
    const mm = useMessageManager();
    mm.isInternalNote = true;
    mm.isSuggestionBoxOpen = false;

    const wrapper = createWrapper();
    const source = wrapper.find('[data-testid="stub-text-box-keydown-source"]');
    await source.trigger('keydown', { key: 'Escape' });

    expect(mm.isInternalNote).toBe(false);
  });

  it('clears input and closes suggestion state when SuggestionBox emits close', async () => {
    const mm = useMessageManager();
    mm.inputMessage = '/abc';
    mm.isSuggestionBoxOpen = true;

    const wrapper = createWrapper();
    await wrapper
      .find('[data-testid="stub-suggestion-close"]')
      .trigger('click');

    expect(mm.isSuggestionBoxOpen).toBe(false);
    expect(mm.inputMessage).toBe('');
  });
});
