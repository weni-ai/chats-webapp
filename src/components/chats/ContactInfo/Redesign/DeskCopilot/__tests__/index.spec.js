import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import DeskCopilotTab from '../index.vue';
import Copilot from '@/services/api/resources/chats/copilot';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/copilot', () => ({
  default: {
    listConnections: vi.fn(),
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

const createWrapper = (props = {}) =>
  mount(DeskCopilotTab, {
    props,
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
              me: { project_permission_role: 1 },
            },
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
          props: ['isHistory', 'isViewMode'],
        },
        Disclaimer: {
          name: 'DeskCopilotDisclaimer',
          template: '<div data-testid="desk-copilot-disclaimer" />',
          props: ['isHistory', 'isViewMode'],
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
    Copilot.listConnections.mockResolvedValue([]);
    wrapper = createWrapper();

    await flushPromises();

    expect(Copilot.listConnections).toHaveBeenCalledWith({
      isPrincipal: false,
    });
    expect(wrapper.find('[data-testid="desk-copilot-summary"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(true);
  });

  it('hides the disclaimer when the project has copilot connections', async () => {
    Copilot.listConnections.mockResolvedValue([
      { conection: { socketUrl: 'wss://example.com' } },
    ]);
    wrapper = createWrapper();

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(false);
    expect(wrapper.find('[data-testid="desk-copilot-summary"]').exists()).toBe(
      true,
    );
  });

  it('emits loaded on mount so the contact drawer can leave the skeleton', async () => {
    Copilot.listConnections.mockResolvedValue([]);
    wrapper = createWrapper();

    await flushPromises();

    expect(wrapper.emitted('loaded')).toBeTruthy();
  });

  it('shows the disclaimer when the connections request fails', async () => {
    Copilot.listConnections.mockRejectedValue(new Error('Not found'));
    wrapper = createWrapper();

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(true);
  });
});
