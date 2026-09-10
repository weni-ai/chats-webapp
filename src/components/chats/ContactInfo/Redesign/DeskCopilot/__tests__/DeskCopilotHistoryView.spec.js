import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { ref } from 'vue';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import DeskCopilotHistoryView from '../DeskCopilotHistoryView.vue';
import { useCopilotHistory } from '@/composables/assistant/useCopilotHistory';
import i18n from '@/plugins/i18n';

vi.mock('@/composables/assistant/useCopilotHistory', () => ({
  useCopilotHistory: vi.fn(),
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

function mockCopilotHistory({ messages = [], isLoading = false } = {}) {
  useCopilotHistory.mockReturnValue({
    messages: ref(messages),
    isLoading: ref(isLoading),
    hasMore: ref(false),
    error: ref(null),
    loadMore: vi.fn(),
    reload: vi.fn(),
  });
}

const createWrapper = (props = {}) =>
  mount(DeskCopilotHistoryView, {
    props: {
      roomUuid: 'room-1',
      ...props,
    },
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            rooms: {
              activeRoom: { uuid: 'room-1' },
              roomsSummary: {},
              isLoadingActiveRoomSummary: false,
            },
            profile: {
              me: { email: 'agent@example.com', project_permission_role: 1 },
            },
          },
        }),
      ],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        SummaryMessage: {
          name: 'DeskCopilotSummaryMessage',
          template: '<div data-testid="desk-copilot-summary" />',
          props: ['readOnly'],
        },
        AssistantMessageList: {
          name: 'AssistantMessageList',
          template:
            '<div data-testid="assistant-message-list"><div v-if="isLoadingHistory" data-testid="assistant-history-loading" /></div>',
          props: ['messages', 'isLoadingHistory', 'readOnly'],
        },
        Disclaimer: {
          name: 'DeskCopilotDisclaimer',
          template: '<div data-testid="desk-copilot-disclaimer" />',
          props: ['hasSummary', 'isViewMode'],
        },
      },
    },
  });

describe('DeskCopilotHistoryView', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('renders summary and disclaimer when copilot is not configured', async () => {
    mockCopilotHistory();
    wrapper = createWrapper({
      isConfigured: false,
      enableRoomSummary: true,
    });

    await flushPromises();

    expect(wrapper.find('[data-testid="desk-copilot-history"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="desk-copilot-summary"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="assistant-message-list"]').exists(),
    ).toBe(false);

    const summary = wrapper.findComponent({
      name: 'DeskCopilotSummaryMessage',
    });
    expect(summary.props('readOnly')).toBe(true);
  });

  it('renders read-only message list when copilot is configured', async () => {
    mockCopilotHistory({
      messages: [
        {
          id: '1',
          direction: 'human',
          text: 'Hello',
          quickReplies: [],
          status: 'sent',
          timestamp: 1,
        },
      ],
    });
    wrapper = createWrapper({
      isConfigured: true,
      enableRoomSummary: true,
    });

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(false);

    const list = wrapper.findComponent({ name: 'AssistantMessageList' });
    expect(list.exists()).toBe(true);
    expect(list.props('readOnly')).toBe(true);
    expect(list.props('messages')).toHaveLength(1);
  });

  it('shows loading state while history is fetching', async () => {
    mockCopilotHistory({ isLoading: true });
    wrapper = createWrapper({ isConfigured: true });

    await flushPromises();

    expect(
      wrapper.find('[data-testid="assistant-history-loading"]').exists(),
    ).toBe(true);
  });

  it('hides disclaimer while connection is still loading', async () => {
    mockCopilotHistory();
    wrapper = createWrapper({
      isConfigured: false,
      isLoadingConnection: true,
    });

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(false);
  });

  it('passes roomUuid to useCopilotHistory', async () => {
    mockCopilotHistory();
    wrapper = createWrapper({ roomUuid: 'room-history-1' });

    await flushPromises();

    expect(useCopilotHistory).toHaveBeenCalled();
    const [roomUuidArg] = useCopilotHistory.mock.calls[0];
    expect(roomUuidArg.value).toBe('room-history-1');
  });
});
