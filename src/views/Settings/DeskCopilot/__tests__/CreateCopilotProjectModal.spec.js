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

import CreateCopilotProjectModal from '../CreateCopilotProjectModal.vue';
import CopilotProjectService from '@/services/api/resources/chats/copilotProject';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import { buildCopilotProjectUrl } from '@/utils/copilotProject';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    create: vi.fn(),
    getLinkedProject: vi.fn(),
  },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

vi.mock('@/utils/copilotProject', () => ({
  buildCopilotProjectUrl: vi.fn(
    (uuid) => `https://dash.stg.cloud.weni.ai/projects/${uuid}`,
  ),
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

const createdProject = {
  name: 'Sales 123',
  assigned_agents: 0,
  created_on: '2026-07-30T00:00:00Z',
  connected_on: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  connected_by: 'edu',
};

const createWrapper = () =>
  mount(CreateCopilotProjectModal, {
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
        UnnnicDisclaimer: true,
      },
    },
  });

describe('CreateCopilotProjectModal', () => {
  let wrapper;
  const originalOpen = window.open;

  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
    wrapper = createWrapper();
  });

  afterAll(() => {
    window.open = originalOpen;
  });

  it('prefills the current project name', () => {
    expect(wrapper.vm.projectName).toBe('Sales 123');
  });

  it('creates the project, shows a toast and opens a new tab', async () => {
    CopilotProjectService.create.mockResolvedValue(createdProject);

    await wrapper.vm.createProject();

    expect(CopilotProjectService.create).toHaveBeenCalledWith(
      'Sales 123',
      'desk-uuid',
    );
    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: expect.any(String),
        type: 'success',
      },
      seconds: 5,
    });
    expect(buildCopilotProjectUrl).toHaveBeenCalledWith('copilot-uuid');
    expect(window.open).toHaveBeenCalledWith(
      'https://dash.stg.cloud.weni.ai/projects/copilot-uuid',
      '_blank',
      'noopener,noreferrer',
    );
    expect(wrapper.emitted('created')[0]).toEqual([createdProject]);
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false]);
  });

  it('shows an error toast and keeps the modal open on failure', async () => {
    CopilotProjectService.create.mockRejectedValue(new Error('API Error'));

    await wrapper.vm.createProject();

    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: expect.any(String),
        type: 'error',
      },
      seconds: 5,
    });
    expect(wrapper.emitted('created')).toBeFalsy();
    expect(window.open).not.toHaveBeenCalled();
  });

  it('does not create when the name is empty', async () => {
    wrapper.vm.projectName = '   ';
    await wrapper.vm.createProject();

    expect(CopilotProjectService.create).not.toHaveBeenCalled();
  });
});
