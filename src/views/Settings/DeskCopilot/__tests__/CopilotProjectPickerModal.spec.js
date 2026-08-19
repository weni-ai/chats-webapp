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
import { ref } from 'vue';

import CopilotProjectPickerModal from '../CopilotProjectPickerModal.vue';
import { resetCopilotProjectState } from '@/composables/useCopilotProject';
import CopilotProjectService from '@/services/api/resources/chats/copilotProject';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import { buildCopilotProjectUrl } from '@/utils/copilotProject';
import i18n from '@/plugins/i18n';

const projects = ref([]);

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    update: vi.fn(),
    getLinkedProject: vi.fn(),
    listExistingProjects: vi.fn(),
    create: vi.fn(),
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

vi.mock('@/composables/useCopilotProjectsList', () => ({
  useCopilotProjectsList: () => ({
    projects,
  }),
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

const existingProjects = [
  {
    name: 'Sales 123',
    assigned_agents: 3,
    uuid: 'copilot-uuid',
    project_uuid: 'desk-uuid',
  },
  {
    name: 'Sales 456',
    assigned_agents: 1,
    uuid: 'copilot-uuid-2',
    project_uuid: 'desk-uuid-2',
  },
];

const updatedProject = {
  name: 'Sales 456',
  assigned_agents: 1,
  created_on: '2026-07-30T00:00:00Z',
  connected_on: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid-2',
  connected_by: 'edu',
};

const createWrapper = ({ mode = 'connect' } = {}) =>
  mount(CopilotProjectPickerModal, {
    props: {
      modelValue: true,
      mode,
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
                org: 'org-uuid',
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
          template:
            '<div data-testid="copilot-project-picker-title"><slot /></div>',
        },
        UnnnicDialogClose: {
          template:
            '<button data-testid="copilot-project-picker-close" @click="$emit(\'click\')"></button>',
        },
        UnnnicDialogFooter: {
          template: '<div><slot /></div>',
        },
        UnnnicRadio: {
          template:
            '<label><input type="radio" :value="value" /><slot /></label>',
          props: ['modelValue', 'value'],
        },
        UnnnicTag: true,
      },
    },
  });

describe('CopilotProjectPickerModal', () => {
  let wrapper;
  const originalOpen = window.open;

  beforeEach(() => {
    vi.clearAllMocks();
    resetCopilotProjectState();
    window.open = vi.fn();
    projects.value = existingProjects;
  });

  afterAll(() => {
    window.open = originalOpen;
  });

  it('renders the connect title', () => {
    wrapper = createWrapper({ mode: 'connect' });

    expect(
      wrapper.find('[data-testid="copilot-project-picker-title"]').text(),
    ).toBe('config_chats.desk_copilot.picker_modal.select_title');
  });

  it('renders the change title and pre-selects the linked project', async () => {
    const { useCopilotProject } = await import(
      '@/composables/useCopilotProject'
    );
    const { setLinkedProject } = useCopilotProject();
    setLinkedProject({
      ...updatedProject,
      uuid: 'copilot-uuid',
      name: 'Sales 123',
    });

    wrapper = createWrapper({ mode: 'change' });
    await wrapper.vm.$nextTick();

    expect(
      wrapper.find('[data-testid="copilot-project-picker-title"]').text(),
    ).toBe('config_chats.desk_copilot.picker_modal.change_title');
    expect(wrapper.vm.selectedUuid).toBe('copilot-uuid');
  });

  it('filters projects by name on the client', async () => {
    wrapper = createWrapper();
    wrapper.vm.searchTerm = '456';
    await wrapper.vm.$nextTick();

    expect(
      wrapper
        .find('[data-testid="copilot-project-picker-option-copilot-uuid"]')
        .exists(),
    ).toBe(false);
    expect(
      wrapper
        .find('[data-testid="copilot-project-picker-option-copilot-uuid-2"]')
        .exists(),
    ).toBe(true);
  });

  it('connects a project, shows a toast and opens a new tab', async () => {
    CopilotProjectService.update.mockResolvedValue(updatedProject);
    wrapper = createWrapper({ mode: 'connect' });
    wrapper.vm.selectedUuid = 'copilot-uuid-2';

    await wrapper.vm.submit();

    expect(CopilotProjectService.update).toHaveBeenCalledWith(
      'desk-uuid',
      'copilot-uuid-2',
    );
    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: expect.any(String),
        type: 'success',
      },
      seconds: 5,
    });
    expect(buildCopilotProjectUrl).toHaveBeenCalledWith('copilot-uuid-2');
    expect(window.open).toHaveBeenCalledWith(
      'https://dash.stg.cloud.weni.ai/projects/copilot-uuid-2',
      '_blank',
      'noopener,noreferrer',
    );
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false]);
  });

  it('changes a project without opening a new tab', async () => {
    CopilotProjectService.update.mockResolvedValue(updatedProject);
    wrapper = createWrapper({ mode: 'change' });
    wrapper.vm.selectedUuid = 'copilot-uuid-2';

    await wrapper.vm.submit();

    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: expect.any(String),
        type: 'success',
      },
      seconds: 5,
    });
    expect(window.open).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual([false]);
  });

  it('shows an error toast and keeps the modal open on failure', async () => {
    CopilotProjectService.update.mockRejectedValue(new Error('API Error'));
    wrapper = createWrapper({ mode: 'connect' });
    wrapper.vm.selectedUuid = 'copilot-uuid-2';

    await wrapper.vm.submit();

    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: expect.any(String),
        type: 'error',
      },
      seconds: 5,
    });
    expect(window.open).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });
});
