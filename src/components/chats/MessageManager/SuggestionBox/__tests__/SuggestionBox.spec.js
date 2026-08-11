import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import SuggestionBox from '../index.vue';
import i18n from '@/plugins/i18n';

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (config.global.plugins && !config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const personalMessages = [
  { uuid: 'qm-1', shortcut: 'hello', text: 'Hello there' },
  { uuid: 'qm-2', shortcut: 'bye', text: 'Goodbye' },
];

const sharedMessages = [
  { uuid: 'qm-3', shortcut: 'help', text: 'How can I help?' },
  { uuid: 'qm-1', shortcut: 'hello', text: 'Hello duplicate' },
];

const createWrapper = (options = {}) => {
  const {
    search = '/',
    copilot = false,
    keyboardEvent = null,
    quickMessages = personalMessages,
    sharedBySectorMessages = sharedMessages,
    sectorUuid = 'sector-1',
  } = options;

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: false,
    initialState: {
      quickMessages: { quickMessages },
      quickMessagesShared: {
        quickMessagesSharedBySector: {
          [sectorUuid]: sharedBySectorMessages,
        },
      },
      messageManager: { inputMessageFocused: true },
      rooms: { activeRoom: { queue: { sector: sectorUuid } } },
    },
  });
  setActivePinia(pinia);

  return mount(SuggestionBox, {
    props: {
      search,
      trigger: '/',
      copilot,
      keyboardEvent,
    },
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
    },
  });
};

describe('SuggestionBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when search starts with trigger and has no spaces', () => {
    const wrapper = createWrapper({ search: '/' });
    expect(wrapper.find('.suggestion-box').exists()).toBe(true);
  });

  it('should not render when search does not start with trigger', () => {
    const wrapper = createWrapper({ search: 'hello' });
    expect(wrapper.find('.suggestion-box').exists()).toBe(false);
  });

  it('should not render when search contains whitespace', () => {
    const wrapper = createWrapper({ search: '/hello world' });
    expect(wrapper.find('.suggestion-box').exists()).toBe(false);
  });

  it('should emit open when becoming visible', async () => {
    const wrapper = createWrapper({ search: 'hello' });
    expect(wrapper.emitted('open')).toBeFalsy();

    await wrapper.setProps({ search: '/' });

    expect(wrapper.emitted('open')).toBeTruthy();
  });

  it('should emit hide when becoming hidden', async () => {
    const wrapper = createWrapper({ search: '/' });
    await wrapper.setProps({ search: 'hello' });

    expect(wrapper.emitted('hide')).toBeTruthy();
  });

  it('should deduplicate suggestions by uuid', () => {
    const wrapper = createWrapper({ search: '/' });
    expect(wrapper.vm.suggestions).toHaveLength(3);
    expect(wrapper.findAll('[data-testid="suggestion"]')).toHaveLength(3);
  });

  it('should filter suggestions by search text after trigger', () => {
    const wrapper = createWrapper({ search: '/hel' });

    expect(wrapper.vm.filteredSuggestions.map((s) => s.shortcut)).toEqual(
      expect.arrayContaining(['hello', 'help']),
    );
    expect(wrapper.vm.filteredSuggestions).toHaveLength(2);
  });

  it('should show empty state when no suggestions match', () => {
    const wrapper = createWrapper({ search: '/zzzz' });
    expect(wrapper.find('.suggestion-box__no-suggestions').exists()).toBe(true);
    expect(wrapper.find('.suggestion-box__no-suggestions').text()).toBe(
      'quick_messages.no_suggestions',
    );
  });

  it('should emit select when a suggestion is clicked', async () => {
    const wrapper = createWrapper({ search: '/' });
    await wrapper.findAll('[data-testid="suggestion"]')[0].trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0]).toEqual(['Hello there']);
  });

  it('should emit close when close method is called', () => {
    const wrapper = createWrapper({ search: '/' });
    wrapper.vm.close();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should render copilot shortcut when copilot prop is true', () => {
    const withCopilot = createWrapper({ search: '/', copilot: true });
    const withoutCopilot = createWrapper({ search: '/', copilot: false });

    expect(withCopilot.findAll('[data-testid="suggestion"]').length).toBe(
      withoutCopilot.findAll('[data-testid="suggestion"]').length + 1,
    );
    expect(withCopilot.find('.suggestion-box__shortcut.copilot').exists()).toBe(
      true,
    );
  });

  it('should emit open-copilot when copilot shortcut is clicked', async () => {
    const wrapper = createWrapper({ search: '/', copilot: true });
    await wrapper.find('.suggestion-box__shortcut.copilot').trigger('click');
    expect(wrapper.emitted('open-copilot')).toBeTruthy();
  });

  it('should navigate suggestions with arrow keys', async () => {
    const wrapper = createWrapper({ search: '/' });
    expect(wrapper.vm.activeShortcutIndex).toBe(null);

    await wrapper.setProps({
      keyboardEvent: new KeyboardEvent('keydown', { key: 'ArrowDown' }),
    });
    expect(wrapper.vm.activeShortcutIndex).toBe(0);

    await wrapper.setProps({
      keyboardEvent: new KeyboardEvent('keydown', { key: 'ArrowDown' }),
    });
    expect(wrapper.vm.activeShortcutIndex).toBe(1);

    await wrapper.setProps({
      keyboardEvent: new KeyboardEvent('keydown', { key: 'ArrowUp' }),
    });
    expect(wrapper.vm.activeShortcutIndex).toBe(0);
  });

  it('should select active suggestion on Enter', async () => {
    const wrapper = createWrapper({ search: '/' });
    wrapper.vm.activeShortcutIndex = 0;

    await wrapper.setProps({
      keyboardEvent: new KeyboardEvent('keydown', { key: 'Enter' }),
    });

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0]).toEqual(['Hello there']);
  });

  it('should open copilot on Enter when no active suggestion and copilot enabled', async () => {
    const wrapper = createWrapper({
      search: '/zzzz',
      copilot: true,
    });
    wrapper.vm.activeShortcutIndex = 0;

    await wrapper.setProps({
      keyboardEvent: new KeyboardEvent('keydown', { key: 'Enter' }),
    });

    expect(wrapper.emitted('open-copilot')).toBeTruthy();
  });
});
