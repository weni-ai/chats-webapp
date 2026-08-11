import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import CoPilot from '../CoPilot.vue';
import { useRooms } from '@/store/modules/chats/rooms';
import { useMessageManager } from '@/store/modules/chats/messageManager';
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

const createWrapper = (options = {}) => {
  const {
    copilotSuggestion = '',
    getCopilotSuggestion = vi.fn().mockResolvedValue(200),
  } = options;

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    stubActions: true,
    initialState: {
      rooms: {
        copilotSuggestion,
      },
      messageManager: {
        isCopilotOpen: true,
        inputMessage: '',
      },
    },
  });
  setActivePinia(pinia);

  const roomsStore = useRooms();
  roomsStore.getCopilotSuggestion = getCopilotSuggestion;
  roomsStore.clearCopilotSuggestion = vi.fn();

  return mount(CoPilot, {
    global: {
      plugins: [pinia],
      mocks: { $t: (key) => key },
      stubs: {
        UnnnicIcon: {
          name: 'UnnnicIcon',
          template: '<span data-testid="icon" :data-icon="icon" />',
          props: ['icon', 'size'],
        },
      },
      directives: {
        'click-outside': {
          mounted() {},
          unmounted() {},
        },
      },
    },
  });
};

describe('CoPilot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render in loading state initially', () => {
    const wrapper = createWrapper();
    expect(wrapper.classes()).toContain('loading');
    expect(wrapper.find('.co-pilot__header__title h1').text()).toBe(
      'copilot.loading',
    );
    expect(wrapper.find('.co-pilot__response__loading').exists()).toBe(true);
  });

  it('should call getCopilotSuggestion on mount', async () => {
    const getCopilotSuggestion = vi.fn().mockResolvedValue(200);
    createWrapper({ getCopilotSuggestion });
    await flushPromises();

    expect(getCopilotSuggestion).toHaveBeenCalled();
  });

  it('should stop loading when suggestion arrives', async () => {
    const wrapper = createWrapper({ copilotSuggestion: '' });
    const roomsStore = useRooms();

    roomsStore.copilotSuggestion = 'Try this reply';
    await wrapper.vm.$nextTick();
    await flushPromises();

    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.classes()).not.toContain('loading');
    expect(wrapper.find('.co-pilot__response__suggestion').text()).toBe(
      'Try this reply',
    );
  });

  it('should enter error state when suggestion request fails', async () => {
    const getCopilotSuggestion = vi.fn().mockResolvedValue(500);
    const wrapper = createWrapper({ getCopilotSuggestion });
    await flushPromises();

    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.classes()).toContain('error');
    expect(wrapper.find('.co-pilot__header__title h1').text()).toBe(
      'copilot.error',
    );
  });

  it('should stop loading after suggestion timeout', async () => {
    const getCopilotSuggestion = vi.fn().mockResolvedValue(200);
    const wrapper = createWrapper({ getCopilotSuggestion });

    expect(wrapper.vm.isLoading).toBe(true);

    vi.advanceTimersByTime(45_000);
    await flushPromises();

    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('should close when close button is clicked', async () => {
    const wrapper = createWrapper();
    const messageStore = useMessageManager();

    await wrapper.find('.co-pilot__header__close').trigger('click');

    expect(messageStore.isCopilotOpen).toBe(false);
  });

  it('should emit select, clear suggestion and close on suggestion click', async () => {
    const wrapper = createWrapper({ copilotSuggestion: 'Suggested text' });
    wrapper.vm.isLoading = false;
    await wrapper.vm.$nextTick();

    const roomsStore = useRooms();
    const messageStore = useMessageManager();

    await wrapper.find('.co-pilot__response__suggestion').trigger('click');

    expect(wrapper.emitted('select')).toEqual([['Suggested text']]);
    expect(roomsStore.clearCopilotSuggestion).toHaveBeenCalled();
    expect(messageStore.isCopilotOpen).toBe(false);
  });
});
