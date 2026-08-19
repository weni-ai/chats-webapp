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

import DisconnectCopilotProjectModal from '../DisconnectCopilotProjectModal.vue';
import {
  resetCopilotProjectState,
  useCopilotProject,
} from '@/composables/useCopilotProject';
import CopilotProjectService from '@/services/api/resources/chats/copilotProject';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    remove: vi.fn(),
    getLinkedProject: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listExistingProjects: vi.fn(),
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

const linkedProject = {
  name: 'Sales 123',
  assignedAgents: 3,
  createdOn: '2026-07-30T00:00:00Z',
  connectedOn: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  connectedBy: 'edu',
};

const createWrapper = () =>
  mount(DisconnectCopilotProjectModal, {
    props: {
      modelValue: true,
    },
    global: {
      plugins: [createTestingPinia()],
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

describe('DisconnectCopilotProjectModal', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    resetCopilotProjectState();
    setActivePinia(createTestingPinia());
    const { setLinkedProject } = useCopilotProject();
    setLinkedProject(linkedProject);
    wrapper = createWrapper();
  });

  it('renders the disconnect title', () => {
    expect(
      wrapper.find('[data-testid="disconnect-copilot-project-title"]').text(),
    ).toBe('config_chats.desk_copilot.disconnect_modal.title');
  });

  it('disconnects the project, shows a toast and closes the modal', async () => {
    CopilotProjectService.remove.mockResolvedValue();

    await wrapper.vm.disconnect();

    expect(CopilotProjectService.remove).toHaveBeenCalledWith('copilot-uuid');
    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: expect.any(String),
        type: 'success',
      },
      seconds: 5,
    });
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false]);
  });

  it('shows an error toast and keeps the modal open on failure', async () => {
    CopilotProjectService.remove.mockRejectedValue(new Error('API Error'));

    await wrapper.vm.disconnect();

    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: expect.any(String),
        type: 'error',
      },
      seconds: 5,
    });
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });
});
