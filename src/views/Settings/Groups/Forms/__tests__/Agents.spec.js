import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import AgentsForm from '../Agents.vue';
import Project from '@/services/api/resources/settings/project';
import i18n from '@/plugins/i18n';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

const agentMock = {
  uuid: 'agent-uuid-1',
  user: {
    first_name: 'Ana',
    last_name: 'Costa',
    email: 'ana.costa@weni.ai',
  },
};

const agentMockWithoutName = {
  uuid: 'agent-uuid-2',
  user: {
    first_name: '',
    last_name: '',
    email: 'agent@weni.ai',
  },
};

const queuesOptions = [
  { uuid: 'queue-1', name: 'Sector 1 | Queue 1' },
  { uuid: 'queue-2', name: 'Sector 1 | Queue 2' },
];

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    agents: vi.fn(),
  },
}));

const emptyGroup = () => ({
  agents: [],
});

const createWrapper = (props = {}) => {
  return mount(AgentsForm, {
    props: {
      modelValue: emptyGroup(),
      queuesOptions,
      ...props,
    },
    global: {
      stubs: {
        SelectedMemberExpanded: {
          name: 'SelectedMemberExpanded',
          template:
            '<div data-testid="selected-agent" @click="$emit(\'remove\')">{{ agentName }}</div>',
          props: ['agentName', 'agentEmail', 'queuesOptions', 'agentQueues'],
          emits: ['remove', 'update:agent-queues'],
        },
      },
    },
  });
};

describe('ProjectGroupAgentsForm', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    Project.agents = vi.fn().mockResolvedValue({
      results: [agentMock, agentMockWithoutName],
      next: null,
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render title, select and editing class', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.find('.groups-agents-form__title').text()).toBe(
        i18n.global.t('config_chats.groups.agents_form.title'),
      );
      expect(wrapper.findComponent({ name: 'UnnnicSelect' }).exists()).toBe(
        true,
      );
      expect(wrapper.classes()).not.toContain('is-editing');

      await wrapper.setProps({ isEditing: true });
      expect(wrapper.classes()).toContain('is-editing');
    });

    it('should render SelectedMemberExpanded for group agents', async () => {
      wrapper = createWrapper({
        modelValue: {
          agents: [
            {
              ...agentMock,
              queues: queuesOptions,
            },
          ],
        },
      });
      await flushPromises();

      const agents = wrapper.findAllComponents({
        name: 'SelectedMemberExpanded',
      });
      expect(agents.length).toBe(1);
      expect(agents.at(0).props('agentName')).toBe('Ana Costa');
      expect(agents.at(0).props('agentEmail')).toBe('ana.costa@weni.ai');
      expect(agents.at(0).props('queuesOptions')).toEqual(queuesOptions);
    });

    it('should render agent with user_name and user_email fallbacks', async () => {
      wrapper = createWrapper({
        modelValue: {
          agents: [
            {
              uuid: 'agent-3',
              user_name: 'Fallback Agent',
              user_email: 'fallback@weni.ai',
              queues: [],
            },
          ],
        },
      });
      await flushPromises();

      const agent = wrapper.findComponent({ name: 'SelectedMemberExpanded' });
      expect(agent.props('agentName')).toBe('Fallback Agent');
      expect(agent.props('agentEmail')).toBe('fallback@weni.ai');
    });
  });

  describe('Mounted - listAgentsOptions', () => {
    it('should load agents with empty queues on mount', async () => {
      wrapper = createWrapper();
      await flushPromises();

      expect(Project.agents).toHaveBeenCalledWith(0, 50);
      expect(wrapper.vm.agents).toEqual([
        { ...agentMock, queues: [] },
        { ...agentMockWithoutName, queues: [] },
      ]);
    });

    it('should paginate agents while next is truthy', async () => {
      Project.agents = vi
        .fn()
        .mockResolvedValueOnce({
          results: [agentMock],
          next: 'next-page',
        })
        .mockResolvedValueOnce({
          results: [agentMockWithoutName],
          next: null,
        });

      wrapper = createWrapper();
      await flushPromises();

      expect(Project.agents).toHaveBeenCalledTimes(2);
      expect(wrapper.vm.agents.length).toBe(2);
    });
  });

  describe('Computed', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should map agentsNames with full name or email fallback', () => {
      expect(wrapper.vm.agentsNames).toEqual([
        { value: 'agent-uuid-1', label: 'Ana Costa' },
        { value: 'agent-uuid-2', label: 'agent@weni.ai' },
      ]);
    });

    it('should be valid only when there is at least one agent', async () => {
      expect(wrapper.vm.valid).toBe(false);

      await wrapper.setProps({
        modelValue: { agents: [agentMock] },
      });
      expect(wrapper.vm.valid).toBe(true);
    });

    it('should emit changeValid when valid changes', async () => {
      await wrapper.setProps({
        modelValue: { agents: [agentMock] },
      });
      await flushPromises();

      expect(wrapper.emitted('changeValid')).toBeTruthy();
      expect(wrapper.emitted('changeValid').at(-1)[0]).toBe(true);
    });
  });

  describe('addAgent', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should add agent with queuesOptions when selected and clear selection', async () => {
      wrapper.vm.selectedAgent = {
        value: agentMock.uuid,
        label: 'Ana Costa',
      };
      await flushPromises();

      expect(wrapper.vm.group.agents).toEqual([
        { ...agentMock, queues: queuesOptions, new: true },
      ]);
      expect(wrapper.vm.selectedAgent).toBeNull();
    });

    it('should not add duplicate agent by permission', async () => {
      await wrapper.setProps({
        modelValue: {
          agents: [{ permission: agentMock.uuid, user: agentMock.user }],
        },
      });
      await flushPromises();

      wrapper.vm.addAgent({ ...agentMock, queues: [] });

      expect(wrapper.vm.group.agents.length).toBe(1);
    });

    it('should not add duplicate agent by email', async () => {
      await wrapper.setProps({
        modelValue: {
          agents: [
            {
              uuid: 'other-uuid',
              user_email: agentMock.user.email,
              queues: [],
            },
          ],
        },
      });
      await flushPromises();

      wrapper.vm.addAgent({ ...agentMock, queues: [] });

      expect(wrapper.vm.group.agents.length).toBe(1);
    });

    it('should ignore selection without value', async () => {
      wrapper.vm.selectedAgent = null;
      await flushPromises();
      expect(wrapper.vm.group.agents).toEqual([]);
    });
  });

  describe('removeAgent', () => {
    it('should remove agent without emitting when creating', async () => {
      wrapper = createWrapper({
        modelValue: {
          agents: [{ ...agentMock, queues: [] }],
        },
      });
      await flushPromises();

      wrapper.vm.removeAgent(agentMock.uuid);

      expect(wrapper.vm.group.agents).toEqual([]);
      expect(wrapper.emitted('remove-agent')).toBeFalsy();
    });

    it('should emit remove-agent when editing an existing agent', async () => {
      const existingAgent = { ...agentMock, queues: [] };
      wrapper = createWrapper({
        isEditing: true,
        modelValue: { agents: [existingAgent] },
      });
      await flushPromises();

      wrapper.vm.removeAgent(existingAgent.uuid);

      expect(wrapper.emitted('remove-agent')[0][0]).toEqual(existingAgent);
      expect(wrapper.vm.group.agents).toEqual([]);
    });

    it('should not emit remove-agent for newly added agents while editing', async () => {
      const newAgent = { ...agentMock, queues: [], new: true };
      wrapper = createWrapper({
        isEditing: true,
        modelValue: { agents: [newAgent] },
      });
      await flushPromises();

      wrapper.vm.removeAgent(newAgent.uuid);

      expect(wrapper.emitted('remove-agent')).toBeFalsy();
      expect(wrapper.vm.group.agents).toEqual([]);
    });
  });

  describe('photo', () => {
    beforeEach(async () => {
      wrapper = createWrapper();
      await flushPromises();
    });

    it('should strip query string from photo url', () => {
      expect(wrapper.vm.photo('http://photo.link/image.jpg?token=abc')).toBe(
        'http://photo.link/image.jpg',
      );
    });

    it('should return original value for empty photo links', () => {
      expect(wrapper.vm.photo(null)).toBeNull();
      expect(wrapper.vm.photo('')).toBe('');
    });
  });
});
