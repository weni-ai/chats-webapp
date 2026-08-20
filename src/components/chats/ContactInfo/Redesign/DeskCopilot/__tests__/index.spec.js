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
import { copilotSocketManager } from '@/services/copilot/copilotSocketManager';
import i18n from '@/plugins/i18n';

vi.mock('@/composables/useCopilotConnection', () => ({
  useCopilotConnection: vi.fn(),
}));

vi.mock('@/services/copilot/copilotSocketManager', () => ({
  copilotSocketManager: {
    getOrCreateService: vi.fn(),
    setRoomContext: vi.fn(),
    disposeService: vi.fn(),
  },
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

  it('hides the disclaimer when the project has copilot connections', async () => {
    mockCopilotConnection({
      isConfigured: true,
      connection: defaultConnection,
    });
    wrapper = createWrapper();

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(false);
    expect(wrapper.find('[data-testid="desk-copilot-summary"]').exists()).toBe(
      true,
    );
    expect(copilotSocketManager.getOrCreateService).toHaveBeenCalledWith(
      'channel-1',
      defaultConnection,
    );
    expect(copilotSocketManager.setRoomContext).toHaveBeenCalledWith(
      'channel-1',
      'room-1',
    );
  });

  it('hides the summary when has_chats_summary is disabled', async () => {
    mockCopilotConnection();
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
    wrapper = createWrapper();

    await flushPromises();

    expect(wrapper.emitted('loaded')).toBeTruthy();
  });

  it('shows the disclaimer when the connections request is not configured', async () => {
    mockCopilotConnection({ isConfigured: false });
    wrapper = createWrapper();

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(true);
    expect(copilotSocketManager.getOrCreateService).not.toHaveBeenCalled();
  });
});
