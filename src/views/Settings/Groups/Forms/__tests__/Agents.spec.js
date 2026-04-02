import { flushPromises, mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import AgentsForm from '../Agents.vue';

import Project from '@/services/api/resources/settings/project';

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    agents: vi.fn(),
  },
}));

const agentFromApi = {
  uuid: 'agent-uuid-1',
  user: {
    first_name: 'Ada',
    last_name: 'Lovelace',
    email: 'ada@example.com',
  },
};

const secondAgentFromApi = {
  uuid: 'agent-uuid-2',
  user: {
    first_name: 'Alan',
    last_name: 'Turing',
    email: 'alan@example.com',
  },
};

const createWrapper = ({
  modelValue = { agents: [] },
  queuesOptions = [],
  isEditing = false,
} = {}) =>
  mount(AgentsForm, {
    props: {
      modelValue,
      queuesOptions,
      isEditing,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicSelect: {
          name: 'UnnnicSelect',
          template: '<div data-testid="agents-unnic-select" />',
          props: [
            'modelValue',
            'options',
            'label',
            'placeholder',
            'returnObject',
            'clearable',
            'enableSearch',
            'search',
          ],
        },
        SelectedMemberExpanded: {
          name: 'SelectedMemberExpanded',
          template:
            '<button type="button" data-testid="selected-member-remove" @click="$emit(\'remove\')" />',
          props: ['agentName', 'agentEmail', 'queuesOptions', 'agentQueues'],
        },
      },
    },
  });

describe('Agents.vue (ProjectGroupAgentsForm)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Project.agents.mockResolvedValue({
      results: [agentFromApi],
      next: null,
    });
  });

  it('loads agents from Project.agents on mount', async () => {
    createWrapper();
    await flushPromises();

    expect(Project.agents).toHaveBeenCalledWith(0, 50);
  });

  it('maps API agents into select options', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    expect(wrapper.vm.agentsNames).toEqual([
      {
        value: 'agent-uuid-1',
        label: 'Ada Lovelace',
      },
    ]);
  });

  it('adds agent from selectedAgent and resets selection on next tick', async () => {
    const group = { agents: [] };
    const wrapper = createWrapper({
      modelValue: group,
      queuesOptions: [{ uuid: 'q1', name: 'Queue 1' }],
    });
    await flushPromises();

    wrapper.vm.selectedAgent = {
      value: 'agent-uuid-1',
      label: 'Ada Lovelace',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(group.agents).toHaveLength(1);
    expect(group.agents[0].new).toBe(true);
    expect(group.agents[0].queues).toEqual([{ uuid: 'q1', name: 'Queue 1' }]);
    expect(wrapper.vm.selectedAgent).toBe(null);
  });

  it('does not duplicate agent with same email', async () => {
    const group = {
      agents: [
        {
          uuid: 'existing-auth',
          user: { email: 'ada@example.com', first_name: 'A', last_name: 'B' },
          user_email: 'ada@example.com',
          queues: [],
        },
      ],
    };
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    wrapper.vm.selectedAgent = {
      value: 'agent-uuid-1',
      label: 'Ada Lovelace',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(group.agents).toHaveLength(1);
  });

  it('removeAgent removes from group.agents', async () => {
    const agentInGroup = {
      uuid: 'in-group-1',
      new: true,
      user: { email: 'x@test.com' },
      queues: [],
    };
    const group = { agents: [agentInGroup] };
    const wrapper = createWrapper({ modelValue: group, isEditing: false });
    await flushPromises();

    wrapper.vm.removeAgent('in-group-1');

    expect(group.agents).toHaveLength(0);
  });

  it('emits remove-agent when isEditing and agent is not new', async () => {
    const agentInGroup = {
      uuid: 'persisted-1',
      new: false,
      user: { email: 'old@test.com' },
      queues: [],
    };
    const group = { agents: [agentInGroup] };
    const wrapper = createWrapper({ modelValue: group, isEditing: true });
    await flushPromises();

    wrapper.vm.removeAgent('persisted-1');

    expect(wrapper.emitted('remove-agent')).toBeTruthy();
    expect(wrapper.emitted('remove-agent')[0][0]).toEqual(agentInGroup);
    expect(group.agents).toHaveLength(0);
  });

  it('does not emit remove-agent for new agents while editing', async () => {
    const agentInGroup = {
      uuid: 'new-1',
      new: true,
      user: { email: 'n@test.com' },
      queues: [],
    };
    const group = { agents: [agentInGroup] };
    const wrapper = createWrapper({ modelValue: group, isEditing: true });
    await flushPromises();

    wrapper.vm.removeAgent('new-1');

    expect(wrapper.emitted('remove-agent')).toBeFalsy();
  });

  it('emits changeValid when validity changes after adding an agent', async () => {
    const group = { agents: [] };
    const wrapper = createWrapper({ modelValue: group });
    await flushPromises();

    wrapper.vm.selectedAgent = {
      value: 'agent-uuid-1',
      label: 'Ada Lovelace',
    };
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const payloads = wrapper.emitted('changeValid')?.map((e) => e[0]) ?? [];
    expect(payloads).toContain(true);
  });

  it('applies is-editing class when prop is true', async () => {
    const wrapper = createWrapper({ isEditing: true });
    await flushPromises();

    expect(wrapper.find('section').classes()).toContain('is-editing');
  });

  it('photo strips query string from link', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.photo('https://cdn.example.com/p.jpg?v=1')).toBe(
      'https://cdn.example.com/p.jpg',
    );
    expect(wrapper.vm.photo(null)).toBe(null);
  });

  it('fetches next page when API returns next', async () => {
    Project.agents
      .mockResolvedValueOnce({
        results: [agentFromApi],
        next: 'https://api.example.com/next',
      })
      .mockResolvedValueOnce({
        results: [secondAgentFromApi],
        next: null,
      });

    createWrapper();
    await flushPromises();

    expect(Project.agents).toHaveBeenCalledTimes(2);
    expect(Project.agents).toHaveBeenNthCalledWith(1, 0, 50);
    expect(Project.agents).toHaveBeenNthCalledWith(2, 50, 50);
  });
});
