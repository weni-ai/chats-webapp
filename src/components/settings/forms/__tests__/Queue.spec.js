import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import QueueForm from '../Queue.vue';

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
      modelValue: {
        default_message: '',
        currentAgents: [],
        name: '',
        queue_limit: { is_active: false, limit: null },
      },
      sector: { uuid: '1', name: 'Sector Mock' },
      ...props,
    },
  });
};

describe('FormQueue', () => {
  let wrapper;
  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('should not display queue name input when in edit mode', async () => {
    await wrapper.setProps({
      modelValue: { uuid: '1', queue_limit: { is_active: false, limit: null } },
    });

    const inputQueueName = wrapper.find('[data-testid="queue-name-input"]');

    expect(inputQueueName.exists()).toBe(false);
  });

  it('should text helpers if showHelpers = true', async () => {
    await wrapper.setProps({ showHelpers: true });
    expect(wrapper.find('[data-testid="hint"]').exists()).toBe(true);
  });

  it('should display textarea when editing the automatic message', async () => {
    await wrapper.setProps({
      modelValue: {
        uuid: '1',
        default_message: '',
        queue_limit: { is_active: false, limit: null },
      },
    });

    const editMessageBtn = wrapper.find(
      '[data-testid="edit-automatic-message-button"]',
    );
    await editMessageBtn.trigger('click');

    expect(wrapper.vm.editingAutomaticMessage).toBe(true);

    const automaticMessageTextArea = wrapper.find(
      '[data-testid="automatic-message-textarea"]',
    );

    expect(automaticMessageTextArea.exists()).toBe(true);
  });

  it('should list queue agents on editing mode', async () => {
    const listQueueAgents = vi.spyOn(QueueForm.methods, 'listQueueAgents');

    createWrapper({
      modelValue: { uuid: '1', default_message: '' },
    });

    await flushPromises();

    expect(listQueueAgents).toHaveBeenCalled();
  });

  it('displays the automatic message in view mode when not editing', async () => {
    await wrapper.setProps({
      modelValue: {
        uuid: '1',
        default_message: 'Test automatic message',
        queue_limit: { is_active: false, limit: null },
      },
    });

    await wrapper.setData({ editingAutomaticMessage: false });

    expect(wrapper.find('[data-testid="queue-default-message"]').text()).toBe(
      'Test automatic message',
    );
  });

  it('should add an agent to the create queue correctly', async () => {
    const agent = {
      uuid: '2',
      user: {
        first_name: 'Agent',
        last_name: 'Mock',
        email: 'agent.mock@test.com',
      },
    };

    await wrapper.vm.handlerAddAgent(agent);

    expect(wrapper.vm.queue.currentAgents).toEqual([agent]);
  });

  it('should add an agent to the editing queue correctly', async () => {
    await wrapper.setProps({
      modelValue: {
        uuid: '1',
        default_message: '',
        currentAgents: [],
        queue_limit: { is_active: false, limit: null },
      },
    });

    const agent = {
      uuid: '2',
      user: {
        first_name: 'Agent',
        last_name: 'Mock',
        email: 'agent.mock@test.com',
      },
    };

    await wrapper.vm.handlerAddAgent(agent);

    expect(wrapper.vm.queue.currentAgents).toEqual([agent]);
  });

  it('should removes an agent from the queue correctly (create)', async () => {
    await wrapper.setProps({
      modelValue: {
        queue_limit: { is_active: false, limit: null },
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
    });

    await wrapper.vm.handlerRemoveAgent('1');

    expect(wrapper.vm.queue.currentAgents.length).toBe(0);
  });

  it('should removes an agent from the queue correctly (editing)', async () => {
    await wrapper.setProps({
      modelValue: {
        uuid: '1',
        queue_limit: { is_active: false, limit: null },
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
    });

    await wrapper.vm.handlerRemoveAgent('1');

    expect(wrapper.vm.queue.currentAgents.length).toBe(0);
  });

  it('should render on finish loadingInfo', async () => {
    await wrapper.setData({ loadingInfo: false });

    expect(wrapper.find('.sector-queues-form').exists()).toBe(true);
  });

  it('should render all inputs', async () => {
    const inputQueue = wrapper
      .findAllComponents({ name: 'unnnic-input' })
      .at(0);
    expect(inputQueue.exists()).toBe(true);
    expect(inputQueue.props('label')).toMatch(/Queue name/gi);
    expect(inputQueue.props('placeholder')).toMatch(/Example: Payments/gi);
  });

  it('should update model value with blank queue config', async () => {
    await wrapper.setProps({ showHelpers: true });
    await wrapper.setData({ useDefaultSectorQueue: 1 });

    const enableDefaultConfigRadio = wrapper.find(
      '[data-testid="disable-default-queue-config"]',
    );

    await enableDefaultConfigRadio.trigger('click');

    expect(wrapper.emitted('update:modelValue')[0][0])
      .haveOwnProperty('name')
      .eq('');

    expect(wrapper.emitted('update:modelValue')[0][0])
      .haveOwnProperty('currentAgents')
      .eql([]);
  });
});
