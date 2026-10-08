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
import DeskCopilotHistoryView from '../DeskCopilotHistoryView.vue';
import { useCopilotConversationUrl } from '@/composables/assistant/useCopilotConversationUrl';
import i18n from '@/plugins/i18n';

vi.mock('@/composables/assistant/useCopilotConversationUrl', () => ({
  useCopilotConversationUrl: vi.fn(),
}));

vi.mock('@/utils/hostBridge', () => ({
  emitToHost: vi.fn(),
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

const historyUrl =
  'https://dash.weni.ai/projects/copilot-project/ai-conversations/conversations?search=room-1&start=2026-02-01&end=2026-02-11';

function mockConversationUrl({ url = undefined, isLoading = false } = {}) {
  useCopilotConversationUrl.mockReturnValue({
    url: computed(() => url),
    isLoading: ref(isLoading),
  });
}

const defaultRoom = {
  uuid: 'room-1',
  created_on: '2026-02-01T12:00:00Z',
  ended_at: '2026-02-11T15:00:00Z',
};

const createWrapper = ({
  props = {},
  projectPermissionRole = 1,
  stubDisclaimer = true,
} = {}) =>
  mount(DeskCopilotHistoryView, {
    props: {
      room: defaultRoom,
      originProjectUuid: 'origin-project',
      ...props,
    },
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            rooms: {
              activeRoom: defaultRoom,
              roomsSummary: {},
              isLoadingActiveRoomSummary: false,
            },
            profile: {
              me: {
                email: 'agent@example.com',
                project_permission_role: projectPermissionRole,
              },
            },
            config: {
              project: {
                uuid: 'current-project',
                config: {},
              },
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
        ...(stubDisclaimer
          ? {
              Disclaimer: {
                name: 'DeskCopilotDisclaimer',
                template: '<div data-testid="desk-copilot-disclaimer" />',
                props: ['hasSummary', 'isViewMode', 'originProjectUuid'],
              },
            }
          : {}),
        UnnnicIcon: true,
        UnnnicButton: {
          name: 'UnnnicButton',
          inheritAttrs: false,
          props: ['text', 'loading', 'disabled', 'type', 'size', 'iconLeft'],
          template:
            '<button class="unnnic-button" :data-testid="$attrs[\'data-testid\']" :disabled="disabled" @click="$emit(\'click\')"><slot />{{ text }}</button>',
        },
      },
    },
  });

describe('DeskCopilotHistoryView', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders a read-only summary and disclaimer when copilot is not configured', async () => {
    mockConversationUrl();
    wrapper = createWrapper({
      props: {
        isConfigured: false,
        enableRoomSummary: true,
      },
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
      wrapper.find('[data-testid="desk-copilot-view-history-button"]').exists(),
    ).toBe(false);

    const summary = wrapper.findComponent({
      name: 'DeskCopilotSummaryMessage',
    });
    expect(summary.props('readOnly')).toBe(true);
  });

  it('shows the view complete history button when copilot is configured', async () => {
    mockConversationUrl({ url: historyUrl });
    wrapper = createWrapper({
      props: {
        isConfigured: true,
        enableRoomSummary: true,
      },
    });

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(false);
    expect(wrapper.find('[data-testid="desk-copilot-summary"]').exists()).toBe(
      true,
    );

    const button = wrapper.findComponent({ name: 'UnnnicButton' });
    expect(button.exists()).toBe(true);
    expect(button.props('text')).toBe(
      'contact_info.desk_copilot.view_complete_history',
    );
    expect(button.props('disabled')).toBe(false);
    expect(button.props('iconLeft')).toBe('arrow_outward');
  });

  it('opens the conversations URL in a new tab', async () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);
    mockConversationUrl({ url: historyUrl });
    wrapper = createWrapper({
      props: { isConfigured: true },
    });

    await flushPromises();
    await wrapper
      .find('[data-testid="desk-copilot-view-history-button"]')
      .trigger('click');

    expect(windowOpen).toHaveBeenCalledWith(
      historyUrl,
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('disables the button while the conversations URL is loading', async () => {
    mockConversationUrl({ isLoading: true });
    wrapper = createWrapper({
      props: { isConfigured: true },
    });

    await flushPromises();

    const button = wrapper.findComponent({ name: 'UnnnicButton' });
    expect(button.exists()).toBe(true);
    expect(button.props('loading')).toBe(true);
    expect(button.props('disabled')).toBe(true);
  });

  it('hides the button when configured but no URL can be built', async () => {
    mockConversationUrl({ url: undefined, isLoading: false });
    wrapper = createWrapper({
      props: { isConfigured: true },
    });

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-view-history-button"]').exists(),
    ).toBe(false);
    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(false);
  });

  it('hides disclaimer while connection is still loading', async () => {
    mockConversationUrl();
    wrapper = createWrapper({
      props: {
        isConfigured: false,
        isLoadingConnection: true,
      },
    });

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(false);
  });

  it('passes origin project and room to the conversations URL composable', async () => {
    mockConversationUrl({ url: historyUrl });
    wrapper = createWrapper({
      props: {
        isConfigured: true,
        originProjectUuid: 'origin-2',
        room: defaultRoom,
      },
    });

    await flushPromises();

    expect(useCopilotConversationUrl).toHaveBeenCalled();
    const [originArg, roomArg, enabledArg] =
      useCopilotConversationUrl.mock.calls[0];
    expect(originArg.value).toBe('origin-2');
    expect(roomArg.value).toEqual(defaultRoom);
    expect(enabledArg.value).toBe(true);
  });

  it('shows the enable button for admin users when copilot is not configured', async () => {
    mockConversationUrl();
    wrapper = createWrapper({
      props: {
        isConfigured: false,
        enableRoomSummary: true,
      },
      projectPermissionRole: 1,
      stubDisclaimer: false,
    });

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-enable-button"]').exists(),
    ).toBe(true);
  });

  it('hides the enable button for agent users when copilot is not configured', async () => {
    mockConversationUrl();
    wrapper = createWrapper({
      props: {
        isConfigured: false,
        enableRoomSummary: true,
      },
      projectPermissionRole: 2,
      stubDisclaimer: false,
    });

    await flushPromises();

    expect(
      wrapper.find('[data-testid="desk-copilot-enable-button"]').exists(),
    ).toBe(false);
  });
});
