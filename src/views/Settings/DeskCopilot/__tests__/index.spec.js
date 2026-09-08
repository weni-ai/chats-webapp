import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import DeskCopilotSettings from '../index.vue';
import {
  resetCopilotProjectState,
  useCopilotProject,
} from '@/composables/useCopilotProject';
import { resetCopilotProjectsListState } from '@/composables/useCopilotProjectsList';
import CopilotProjectService from '@/services/api/resources/chats/copilotProject';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    getLinkedProject: vi.fn().mockResolvedValue(null),
    canCreate: vi.fn().mockResolvedValue(true),
    create: vi.fn(),
    update: vi.fn(),
    listExistingProjects: vi.fn().mockResolvedValue([]),
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
            '<section data-testid="desk-copilot-empty-state" :data-create-disabled="String(isCreateDisabled)" @click="$emit(\'open-create-modal\')" @dblclick="$emit(\'open-select-modal\')" />',
          props: ['isCreateDisabled'],
        },
        ConnectedProjectCard: {
          template:
            '<article data-testid="desk-copilot-connected-card" @click="$emit(\'open-change-modal\')" @dblclick="$emit(\'open-disconnect-modal\')" />',
          props: ['linkedProject'],
        },
        CreateCopilotProjectModal: {
          template: '<div data-testid="create-copilot-project-modal" />',
          props: ['modelValue'],
        },
        CopilotProjectPickerModal: {
          template:
            '<div data-testid="copilot-project-picker-modal" :data-mode="mode" :data-open="String(modelValue)" />',
          props: ['modelValue', 'mode'],
        },
        DisconnectCopilotProjectModal: {
          template:
            '<div data-testid="disconnect-copilot-project-modal" :data-open="String(modelValue)" />',
          props: ['modelValue'],
        },
      },
    },
  });

describe('DeskCopilotSettings', () => {
  beforeEach(() => {
    resetCopilotProjectState();
    resetCopilotProjectsListState();
    vi.clearAllMocks();
  });

  it('shows the empty state when no project is linked', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(null);
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();

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
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    expect(
      wrapper.find('[data-testid="desk-copilot-connected-card"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="desk-copilot-empty-state"]').exists(),
    ).toBe(false);
  });

  it('opens the picker in connect mode from the empty state', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(null);
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    await wrapper
      .find('[data-testid="desk-copilot-empty-state"]')
      .trigger('dblclick');

    const picker = wrapper.find('[data-testid="copilot-project-picker-modal"]');
    expect(picker.attributes('data-mode')).toBe('connect');
    expect(picker.attributes('data-open')).toBe('true');
  });

  it('opens the picker in change mode from the connected card', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    await wrapper
      .find('[data-testid="desk-copilot-connected-card"]')
      .trigger('click');

    const picker = wrapper.find('[data-testid="copilot-project-picker-modal"]');
    expect(picker.attributes('data-mode')).toBe('change');
    expect(picker.attributes('data-open')).toBe('true');
  });

  it('opens the disconnect modal from the connected card', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    await wrapper
      .find('[data-testid="desk-copilot-connected-card"]')
      .trigger('dblclick');

    expect(
      wrapper
        .find('[data-testid="disconnect-copilot-project-modal"]')
        .attributes('data-open'),
    ).toBe('true');
  });

  it('shows the empty state after the linked project is cleared', async () => {
    CopilotProjectService.getLinkedProject.mockResolvedValue(linkedProject);
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();

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
    CopilotProjectService.getLinkedProject.mockResolvedValue(null);
    CopilotProjectService.canCreate.mockResolvedValue(false);
    const wrapper = createWrapper();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    expect(CopilotProjectService.canCreate).toHaveBeenCalledWith('desk-uuid');
    expect(
      wrapper
        .find('[data-testid="desk-copilot-empty-state"]')
        .attributes('data-create-disabled'),
    ).toBe('true');
  });
});
