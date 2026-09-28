import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import ReconnectCopilotProjectModal from '../ReconnectCopilotProjectModal.vue';
import {
  resetCopilotProjectState,
  useCopilotProject,
} from '@/composables/useCopilotProject';
import CopilotProjectService from '@/services/api/resources/chats/copilotProject';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    reconnect: vi.fn(),
    getLinkedProject: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    canCreate: vi.fn(),
  },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
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

const disconnectedProject = {
  name: 'Sales 123',
  assignedAgents: 3,
  createdOn: '2026-07-30T00:00:00Z',
  connectedOn: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  projectUuid: 'desk-uuid',
  connectedBy: 'edu',
  isConnected: false,
  disconnectedBy: 'ana',
  disconnectedOn: '2026-09-10T00:00:00Z',
};

const createWrapper = () =>
  mount(ReconnectCopilotProjectModal, {
    props: {
      modelValue: true,
    },
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            config: {
              project: {
                uuid: 'desk-uuid',
                name: 'Sales 123',
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
        UnnnicDialog: {
          template: '<div><slot /></div>',
          props: ['open'],
        },
        UnnnicDialogContent: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogHeader: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogTitle: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogClose: {
          template:
            '<button data-testid="dialog-close" @click="$emit(\'click\')"></button>',
        },
        UnnnicDialogFooter: {
          template: '<div><slot /></div>',
        },
      },
    },
  });

describe('ReconnectCopilotProjectModal', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    resetCopilotProjectState();
    setActivePinia(
      createTestingPinia({
        initialState: {
          config: {
            project: {
              uuid: 'desk-uuid',
              name: 'Sales 123',
              config: {},
            },
          },
        },
      }),
    );
    const { setLinkedProject } = useCopilotProject();
    setLinkedProject(disconnectedProject);
    wrapper = createWrapper();
  });

  it('renders the reconnect title', () => {
    expect(
      wrapper.find('[data-testid="reconnect-copilot-project-title"]').text(),
    ).toBe('config_chats.desk_copilot.reconnect_modal.title');
  });

  it('reconnects the project, shows a toast and closes the modal', async () => {
    CopilotProjectService.reconnect.mockResolvedValue({
      ...disconnectedProject,
      isConnected: true,
      connectedBy: 'edu',
    });

    await wrapper.vm.reconnect();

    expect(CopilotProjectService.reconnect).toHaveBeenCalledWith(
      'copilot-uuid',
    );
    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: expect.any(String),
        type: 'success',
      },
      seconds: 5,
    });
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false]);
  });

  it('shows an error toast, closes the modal and keeps the project disconnected', async () => {
    CopilotProjectService.reconnect.mockRejectedValue(new Error('API Error'));
    const { linkedProject: project } = useCopilotProject();

    await wrapper.vm.reconnect();

    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: expect.any(String),
        type: 'error',
      },
      seconds: 5,
    });
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false]);
    expect(project.value?.isConnected).toBe(false);
  });
});
