import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import QueueForm from '../Queue/index.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

import Queue from '@/services/api/resources/settings/queue';
import Project from '@/services/api/resources/settings/project';

vi.mock('@/services/api/resources/settings/queue', () => ({
  default: {
    getQueueInformation: vi.fn(),
    agents: vi.fn(),
    addAgent: vi.fn(),
    removeAgent: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    agents: vi.fn(),
  },
}));

vi.spyOn(Project, 'agents').mockResolvedValue({ results: [] });

vi.spyOn(Queue, 'getQueueInformation').mockResolvedValue({});

vi.spyOn(Queue, 'agents').mockResolvedValue({
  results: [
    {
      uuid: '1',
      queue: '1',
      role: 1,
      user: {
        first_name: 'Agent',
        last_name: 'Mock',
        email: 'agent.mock@test.com',
      },
    },
  ],
});

vi.spyOn(Queue, 'addAgent').mockResolvedValue({ data: { uuid: '2' } });

vi.spyOn(Queue, 'removeAgent').mockResolvedValue();

const emptyQueue = () => ({
  name: '',
  default_message: '',
  currentAgents: [],
  queue_limit: { is_active: false, limit: null },
  toAddAgentsUuids: [],
  toRemoveAgentsUuids: [],
  validForm: false,
  agents: 0,
});

const createWrapper = (props = {}) => {
  return mount(QueueForm, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: { profile: { me: { email: 'agent.mock@test.com' } } },
        }),
      ],
    },
    props: {
      modelValue: [emptyQueue()],
      sector: { uuid: '1', name: 'Sector Mock' },
      ...props,
    },
  });
};

describe('FormQueue', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;
  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('shows queue name input in create mode', () => {
    const inputQueueName = wrapper.find('[data-testid="queue-name-input"]');
    expect(inputQueueName.exists()).toBe(true);
  });

  it('shows queue name input in edit mode', async () => {
    await wrapper.setProps({
      modelValue: [
        {
          uuid: '1',
          default_message: '',
          queue_limit: { is_active: false, limit: null },
          ...emptyQueue(),
        },
      ],
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="queue-name-input"]').exists()).toBe(
      true,
    );
  });

  it('should show configure queue title when showHelpers = true', async () => {
    await wrapper.setProps({ showHelpers: true });
    expect(wrapper.find('.queue-form__title').exists()).toBe(true);
  });

  it('should list queue agents on editing mode', async () => {
    const listQueueAgents = vi.spyOn(QueueForm.methods, 'listQueueAgents');

    createWrapper({
      modelValue: [
        {
          uuid: '1',
          default_message: '',
          queue_limit: { is_active: false, limit: null },
          ...emptyQueue(),
        },
      ],
    });

    await flushPromises();

    expect(listQueueAgents).toHaveBeenCalled();
  });

  it('should add an agent to the create queue correctly', async () => {
    const inputsForm = wrapper.findComponent({ name: 'QueueInputsForm' });
    const agent = {
      uuid: '2',
      user: {
        first_name: 'Agent',
        last_name: 'Mock',
        email: 'agent.mock@test.com',
      },
    };

    await inputsForm.vm.handlerAddAgent(agent);

    expect(inputsForm.vm.queueForm.currentAgents).toEqual([agent]);
  });

  it('should add an agent to the editing queue correctly', async () => {
    await wrapper.setProps({
      modelValue: [
        {
          uuid: '1',
          default_message: '',
          currentAgents: [],
          queue_limit: { is_active: false, limit: null },
          ...emptyQueue(),
        },
      ],
    });
    await flushPromises();

    const inputsForm = wrapper.findComponent({ name: 'QueueInputsForm' });
    const agent = {
      uuid: '2',
      user: {
        first_name: 'Agent',
        last_name: 'Mock',
        email: 'agent.mock@test.com',
      },
    };

    await inputsForm.vm.handlerAddAgent(agent);

    expect(inputsForm.vm.queueForm.currentAgents).toEqual([agent]);
  });

  it('should remove an agent from the queue correctly (create)', async () => {
    const agentRow = {
      uuid: '1',
      user: {
        first_name: 'Agent',
        last_name: 'Mock',
        email: 'agent.mock@test.com',
      },
    };
    await wrapper.setProps({
      modelValue: [
        {
          ...emptyQueue(),
          currentAgents: [agentRow],
        },
      ],
    });

    const inputsForm = wrapper.findComponent({ name: 'QueueInputsForm' });
    await inputsForm.vm.handlerRemoveAgent('1');

    expect(inputsForm.vm.queueForm.currentAgents.length).toBe(0);
  });

  it('should remove an agent from the queue correctly (editing)', async () => {
    await wrapper.setProps({
      modelValue: [
        {
          uuid: '1',
          default_message: '',
          queue_limit: { is_active: false, limit: null },
          ...emptyQueue(),
          currentAgents: [
            {
              uuid: '1',
              user: {
                first_name: 'Agent',
                last_name: 'Mock',
                email: 'agent.mock@test.com',
              },
            },
          ],
        },
      ],
    });
    await flushPromises();

    const inputsForm = wrapper.findComponent({ name: 'QueueInputsForm' });
    await inputsForm.vm.handlerRemoveAgent('1');

    expect(inputsForm.vm.queueForm.currentAgents.length).toBe(0);
  });

  it('should render queue form after loading', async () => {
    await wrapper.setData({ loadingInfo: false });
    expect(wrapper.find('.sector-queues-form').exists()).toBe(true);
  });

  it('should render queue name input with label', async () => {
    const inputQueue = wrapper.findAllComponents({ name: 'unnnic-input' }).at(0);
    expect(inputQueue.exists()).toBe(true);
    expect(String(inputQueue.props('label')).toLowerCase()).toContain(
      'queue',
    );
  });

  it('should emit update when default queue option is disabled', async () => {
    await wrapper.setProps({ showHelpers: true });
    await wrapper.setData({ useDefaultSectorQueue: 1 });
    await wrapper.vm.updateDefaultSectorQueueValue(0);

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    const last = emitted[emitted.length - 1][0];
    expect(last[0]).toMatchObject({
      name: '',
      currentAgents: [],
    });
  });
});
