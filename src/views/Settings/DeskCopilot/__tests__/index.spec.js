import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import DeskCopilotSettings from '../index.vue';
import {
  resetCopilotProjectState,
  useCopilotProject,
} from '@/composables/useCopilotProject';
import CopilotProjectService from '@/services/api/resources/chats/copilotProject';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    getLinkedProject: vi.fn().mockResolvedValue(null),
    canCreate: vi.fn().mockResolvedValue(true),
    create: vi.fn(),
    reconnect: vi.fn(),
    remove: vi.fn(),
  },
}));

const linkedProject = {
  name: 'Sales 123',
  assignedAgents: 3,
  createdOn: '2026-07-30T00:00:00Z',
  connectedOn: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  connectedBy: 'edu',
  isConnected: true,
};

const disconnectedProject = {
  ...linkedProject,
  isConnected: false,
  disconnectedBy: 'ana',
  disconnectedOn: '2026-09-10T00:00:00Z',
};

const createWrapper = () =>
  mount(DeskCopilotSettings, {
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
        InfoCard: {
          template: '<section data-testid="desk-copilot-info-card" />',
        },
        EmptyState: {
          template:
            '<section data-testid="desk-copilot-empty-state" :data-create-disabled="String(isCreateDisabled)" @click="$emit(\'open-create-modal\')" />',
          props: ['isCreateDisabled'],
        },
        ConnectedProjectCard: {
          template:
            '<article data-testid="desk-copilot-connected-card" :data-readonly="String(readOnly)" @click="$emit(\'open-disconnect-modal\')" @dblclick="$emit(\'open-reconnect-modal\')" />',
          props: ['linkedProject', 'readOnly'],
        },
        CreateCopilotProjectModal: {
          template: '<div data-testid="create-copilot-project-modal" />',
          props: ['modelValue'],
        },
        DisconnectCopilotProjectModal: {
          template:
            '<div data-testid="disconnect-copilot-project-modal" :data-open="String(modelValue)" />',
          props: ['modelValue'],
        },
        ReconnectCopilotProjectModal: {
          template:
            '<div data-testid="reconnect-copilot-project-modal" :data-open="String(modelValue)" />',
          props: ['modelValue'],
        },
        UnnnicDisclaimer: {
          inheritAttrs: false,
          template:
            '<div v-bind="$attrs"><slot />{{ title }}{{ description }}</div>',
          props: ['type', 'title', 'description'],
        },
      },
    },
  });

async function flush(wrapper) {
  await wrapper.vm.$nextTick();
  await Promise.resolve();
  await Promise.resolve();
  await wrapper.vm.$nextTick();
}

describe('DeskCopilotSettings', () => {
  beforeEach(() => {
    resetCopilotProjectState();
    vi.clearAllMocks();
    CopilotProjectService.getLinkedProject.mockResolvedValue(null);
    CopilotProjectService.canCreate.mockResolvedValue(true);
  });

  it('shows the empty state when no project is linked', async () => {
    const wrapper = createWrapper();
    await flush(wrapper);

    expect(
      wrapper.find('[data-testid="desk-copilot-info-card"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-empty-state"]').exists(),
    ).toBe(true);
  });

  it('shows the connected card when a project is linked', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);
    const wrapper = createWrapper();
    await flush(wrapper);

    expect(
      wrapper.find('[data-testid="desk-copilot-connected-card"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-empty-state"]').exists(),
    ).toBe(false);
    expect(
      wrapper
        .find('[data-testid="desk-copilot-disconnected-disclaimer"]')
        .exists(),
    ).toBe(false);
  });

  it('shows the disconnected disclaimer and reconnect card', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(
      disconnectedProject,
    );
    const wrapper = createWrapper();
    await flush(wrapper);

    expect(
      wrapper
        .find('[data-testid="desk-copilot-disconnected-disclaimer"]')
        .exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-connected-card"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-empty-state"]').exists(),
    ).toBe(false);
  });

  it('opens the disconnect modal from the connected card', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);
    const wrapper = createWrapper();
    await flush(wrapper);

    await wrapper
      .find('[data-testid="desk-copilot-connected-card"]')
      .trigger('click');

    expect(
      wrapper
        .find('[data-testid="disconnect-copilot-project-modal"]')
        .attributes('data-open'),
    ).toBe('true');
  });

  it('opens the reconnect modal from the disconnected card', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(
      disconnectedProject,
    );
    const wrapper = createWrapper();
    await flush(wrapper);

    await wrapper
      .find('[data-testid="desk-copilot-connected-card"]')
      .trigger('dblclick');

    expect(
      wrapper
        .find('[data-testid="reconnect-copilot-project-modal"]')
        .attributes('data-open'),
    ).toBe('true');
  });

  it('shows the empty state after the linked project is cleared', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);
    const wrapper = createWrapper();
    await flush(wrapper);

    const { setLinkedProject } = useCopilotProject();
    setLinkedProject(null);
    await wrapper.vm.$nextTick();

    expect(
      wrapper.find('[data-testid="desk-copilot-empty-state"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-connected-card"]').exists(),
    ).toBe(false);
  });

  it('calls canCreate when the settings tab mounts', async () => {
    CopilotProjectService.canCreate.mockResolvedValue(false);
    const wrapper = createWrapper();
    await flush(wrapper);

    expect(CopilotProjectService.canCreate).toHaveBeenCalledWith('desk-uuid');
    expect(
      wrapper.find('[data-testid="desk-copilot-no-permission"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-empty-state"]').exists(),
    ).toBe(false);
  });

  it('shows a read-only card for users without permission when connected', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);
    CopilotProjectService.canCreate.mockResolvedValue(false);
    const wrapper = createWrapper();
    await flush(wrapper);

    expect(
      wrapper.find('[data-testid="desk-copilot-connected-card"]').exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('[data-testid="desk-copilot-connected-card"]')
        .attributes('data-readonly'),
    ).toBe('true');
    expect(
      wrapper.find('[data-testid="desk-copilot-no-permission"]').exists(),
    ).toBe(false);
  });

  it('hides the disconnected card for users without permission', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(
      disconnectedProject,
    );
    CopilotProjectService.canCreate.mockResolvedValue(false);
    const wrapper = createWrapper();
    await flush(wrapper);

    expect(
      wrapper.find('[data-testid="desk-copilot-no-permission"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-connected-card"]').exists(),
    ).toBe(false);
  });
});
