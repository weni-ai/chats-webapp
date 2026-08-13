import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import DeskCopilotSettings from '../index.vue';
import { resetCopilotProjectState } from '@/composables/useCopilotProject';
import CopilotProjectService from '@/services/api/resources/chats/copilotProject';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    getLinkedProject: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
  },
}));

const linkedProject = {
  name: 'Sales 123',
  assigned_agents: 3,
  created_on: '2026-07-30T00:00:00Z',
  connected_on: '2026-07-30T00:00:00Z',
  uuid: 'copilot-uuid',
  connected_by: 'edu',
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
            '<section data-testid="desk-copilot-empty-state" @click="$emit(\'open-create-modal\')" />',
        },
        ConnectedProjectCard: {
          template: '<article data-testid="desk-copilot-connected-card" />',
          props: ['linkedProject'],
        },
        CreateCopilotProjectModal: {
          template: '<div data-testid="create-copilot-project-modal" />',
          props: ['modelValue'],
        },
      },
    },
  });

describe('DeskCopilotSettings', () => {
  beforeEach(() => {
    resetCopilotProjectState();
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
});
