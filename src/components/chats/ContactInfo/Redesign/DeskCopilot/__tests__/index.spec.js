import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { computed, ref } from 'vue';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import DeskCopilotTab from '../index.vue';
import { useCopilotConnection } from '@/composables/useCopilotConnection';
import { useCopilotChat } from '@/composables/assistant/useCopilotChat';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import i18n from '@/plugins/i18n';

vi.mock('@/composables/useCopilotConnection', () => ({
  useCopilotConnection: vi.fn(),
}));

vi.mock('@/composables/assistant/useCopilotChat', () => ({
  useCopilotChat: vi.fn(),
}));

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

const defaultConnection = {
  socketUrl: 'wss://example.com',
  channelUuid: 'channel-1',
  host: 'https://flows.weni.ai',
  connectOn: 'mount',
  storage: 'local',
  callbackUrl: '',
};

function mockCopilotConnection({
  isConfigured = false,
  isLoading = false,
  connection = undefined,
} = {}) {
  useCopilotConnection.mockReturnValue({
    connection: ref(connection),
    isConfigured: computed(() => isConfigured),
    isLoading: ref(isLoading),
    reload: vi.fn(),
  });
}

function mockCopilotChat({
  messages = [],
  isThinking = false,
  isLoadingHistory = false,
  cartCount = 0,
  suggestions = [],
} = {}) {
  useCopilotChat.mockReturnValue({
    messages: ref(messages),
    isThinking: ref(isThinking),
    isLoadingHistory: ref(isLoadingHistory),
    cartCount: ref(cartCount),
    suggestions: ref(suggestions),
    sendMessage: vi.fn(),
  });
}

const createWrapper = (props = {}, piniaState = {}) =>
  mount(DeskCopilotTab, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            rooms: {
              activeRoom: { uuid: 'room-1', queue: { sector: 'sector-1' } },
              roomsSummary: {},
              isLoadingActiveRoomSummary: false,
            },
            profile: {
              me: { project_permission_role: 1 },
            },
            config: {
              project: { config: { has_chats_summary: true } },
            },
            messageManager: {
              inputMessage: '',
              inputMessageFocused: false,
            },
            ...piniaState,
          },
        }),
      ],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        DeskCopilotSummaryMessage: {
          name: 'DeskCopilotSummaryMessage',
          template: '<div data-testid="desk-copilot-summary" />',
        },
        SummaryMessage: {
          name: 'DeskCopilotSummaryMessage',
          template: '<div data-testid="desk-copilot-summary" />',
        },
        DeskCopilotDisclaimer: {
          name: 'DeskCopilotDisclaimer',
          template: '<div data-testid="desk-copilot-disclaimer" />',
          props: ['hasSummary', 'isHistory', 'isViewMode'],
        },
        Disclaimer: {
          name: 'DeskCopilotDisclaimer',
          template: '<div data-testid="desk-copilot-disclaimer" />',
          props: ['hasSummary', 'isHistory', 'isViewMode'],
        },
        AssistantMessageList: {
          name: 'AssistantMessageList',
          template:
            '<div data-testid="assistant-message-list" @click="$emit(\'send\', \'Suggested text\')"><div v-if="isLoadingHistory" data-testid="assistant-history-loading" /></div>',
          props: ['messages', 'isThinking', 'isLoadingHistory'],
        },
        AssistantInput: {
          name: 'AssistantInput',
          template: '<div data-testid="assistant-input" />',
        },
        SuggestionChips: {
          name: 'AssistantSuggestionChips',
          template: '<div data-testid="assistant-suggestion-chips" />',
          props: ['suggestions'],
        },
        CartBadge: {
          name: 'AssistantCartBadge',
          template: '<div data-testid="assistant-cart-badge" />',
          props: ['count'],
        },
        UnnnicButton: {
          name: 'UnnnicButton',
          inheritAttrs: false,
          template: '<button v-bind="$attrs" @click="$emit(\'click\')" />',
        },
      },
    },
  });

describe('DeskCopilotTab', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('renders the summary and disclaimer when there are no connections', async () => {
    mockCopilotConnection();
    mockCopilotChat();
    wrapper = createWrapper();

    await flushPromises();

    expect(useCopilotConnection).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="desk-copilot-summary"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(true);
  });

  it('hides the disclaimer and shows chat UI when configured', async () => {
    mockCopilotConnection({
      isConfigured: true,
      connection: defaultConnection,
    });
    mockCopilotChat({
      cartCount: 1,
      suggestions: ['Ask about color'],
    });
    wrapper = createWrapper();

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="assistant-message-list"]').exists(),
    ).toBe(true);
    expect(wrapper.find('[data-testid="assistant-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="assistant-cart-badge"]').exists()).toBe(
      true,
    );
    expect(useCopilotChat).toHaveBeenCalled();
    const [, roomUuid] = useCopilotChat.mock.calls[0];
    expect(roomUuid.value).toBe('room-1');
  });

  it('sends the AI suggestion into the main chat input', async () => {
    mockCopilotConnection({
      isConfigured: true,
      connection: defaultConnection,
    });
    mockCopilotChat();
    wrapper = createWrapper();

    await flushPromises();
    await wrapper
      .find('[data-testid="assistant-message-list"]')
      .trigger('click');

    const messageManager = useMessageManager();
    expect(messageManager.inputMessage).toBe('Suggested text');
    expect(messageManager.inputMessageFocused).toBe(true);
  });

  it('hides the summary when has_chats_summary is disabled', async () => {
    mockCopilotConnection();
    mockCopilotChat();
    wrapper = createWrapper(
      {},
      {
        config: {
          project: { config: { has_chats_summary: false } },
        },
      },
    );

    await flushPromises();

    expect(wrapper.find('[data-testid="desk-copilot-summary"]').exists()).toBe(
      false,
    );
    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(true);
  });

  it('emits loaded on mount so the contact drawer can leave the skeleton', async () => {
    mockCopilotConnection();
    mockCopilotChat();
    wrapper = createWrapper();

    await flushPromises();

    expect(wrapper.emitted('loaded')).toBeTruthy();
  });

  it('shows the history loading state while the conversation is restored', async () => {
    mockCopilotConnection({
      isConfigured: true,
      connection: defaultConnection,
    });
    mockCopilotChat({ isLoadingHistory: true });
    wrapper = createWrapper();

    await flushPromises();

    expect(
      wrapper.find('[data-testid="assistant-history-loading"]').exists(),
    ).toBe(true);
  });
});
