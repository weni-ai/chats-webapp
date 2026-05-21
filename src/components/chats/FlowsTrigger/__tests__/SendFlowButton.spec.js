import { mount, config } from '@vue/test-utils';
import {
  expect,
  describe,
  it,
  vi,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';

import SendFlowButton from '../SendFlowButton.vue';
import { createTestingPinia } from '@pinia/testing';
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

vi.mock('@/services/api/resources/chats/flowsTrigger', () => ({
  default: {
    sendFlow: vi.fn(),
    getFlowTemplates: vi.fn(),
  },
}));

const cachedTemplateWithVariables = {
  variables: ['nomecontato', 'nomeatendente'],
  data: {
    name: 'template_test',
    components: [
      {
        type: 'BODY',
        text: 'Olá {{1}}, falo {{2}}',
      },
    ],
  },
};

describe('SendFlowButton', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(SendFlowButton, {
      global: { plugins: [createTestingPinia()] },
      props: { selectedFlow: '' },
    });
    vi.clearAllMocks();
  });

  it('renders with the correct initial state', () => {
    const button = wrapper.find('[data-testid="send-flow-button"]');
    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('disables button when selectedFlow is empty', async () => {
    const button = wrapper.find('[data-testid="send-flow-button"]');
    expect(button.attributes('disabled')).toBeDefined();

    await wrapper.setProps({ selectedFlow: 'flow-uuid' });
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('disables the button while the parent is checking the template', async () => {
    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      isCheckingTemplate: true,
    });

    const button = wrapper.find('[data-testid="send-flow-button"]');
    expect(button.attributes('disabled')).toBeDefined();

    await wrapper.setProps({ isCheckingTemplate: false });
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('disables the button when the selected flow has template variables', async () => {
    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      cachedTemplate: cachedTemplateWithVariables,
    });

    const button = wrapper.find('[data-testid="send-flow-button"]');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('does not send when clicked while the flow has template variables', async () => {
    FlowsTrigger.sendFlow.mockResolvedValue({});

    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1', name: 'Contact 1' }],
      cachedTemplate: cachedTemplateWithVariables,
    });

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FlowsTrigger.sendFlow).not.toHaveBeenCalled();
  });

  it('emits events with hasError=false when sendFlow succeeds', async () => {
    FlowsTrigger.sendFlow.mockResolvedValue({});

    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1' }],
    });

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.emitted('send-flow-started')).toHaveLength(1);
    expect(wrapper.emitted('send-flow-finished')).toHaveLength(1);
    expect(wrapper.emitted('send-flow-finished')[0][0]).toEqual({
      hasError: false,
    });
  });

  it('calls FlowsTrigger.sendFlow with correct parameters', async () => {
    const contacts = [
      { external_id: 'contact-1', name: 'Contact 1' },
      { uuid: 'contact-2', name: 'Contact 2' },
    ];

    await wrapper.setProps({ selectedFlow: 'flow-uuid', contacts });

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FlowsTrigger.sendFlow).toHaveBeenCalledWith(
      {
        flow: 'flow-uuid',
        contacts: ['contact-1'],
        room: undefined,
        contact_name: 'Contact 1',
      },
      '',
    );

    expect(FlowsTrigger.sendFlow).toHaveBeenCalledWith(
      {
        flow: 'flow-uuid',
        contacts: ['contact-2'],
        room: undefined,
        contact_name: 'Contact 2',
      },
      '',
    );
  });

  it('emits events with hasError=true when sendFlow fails', async () => {
    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1' }],
      selectedContact: { external_id: 'contact-1' },
    });
    const consoleError = vi.spyOn(console, 'error');

    FlowsTrigger.sendFlow.mockRejectedValueOnce(new Error('API error'));

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FlowsTrigger.sendFlow).toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(new Error('API error'));

    expect(wrapper.emitted('send-flow-finished')).toHaveLength(1);
    expect(wrapper.emitted('send-flow-finished')[0][0]).toEqual({
      hasError: true,
    });
  });

  it('bypasses template check and sends directly when isProjectPrincipal=true', async () => {
    FlowsTrigger.sendFlow.mockResolvedValue({});

    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1', name: 'Contact 1' }],
      isProjectPrincipal: true,
      projectUuidFlow: 'project-uuid',
      cachedTemplate: cachedTemplateWithVariables,
    });

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FlowsTrigger.getFlowTemplates).not.toHaveBeenCalled();
    expect(FlowsTrigger.sendFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: 'flow-uuid',
        contacts: ['contact-1'],
      }),
      'project-uuid',
    );
  });

  it('sends with params when doSendFlow is called directly', async () => {
    FlowsTrigger.sendFlow.mockResolvedValue({});

    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1', name: 'Contact 1' }],
      projectUuidFlow: 'project-uuid',
      cachedTemplate: cachedTemplateWithVariables,
    });

    await wrapper.vm.doSendFlow({
      nomecontato: 'Marcus',
      nomeatendente: 'Kallil',
    });

    expect(FlowsTrigger.sendFlow).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          nomecontato: 'Marcus',
          nomeatendente: 'Kallil',
        },
      }),
      'project-uuid',
    );
  });

  it('resolves local variable tokens per contact when sending', async () => {
    FlowsTrigger.sendFlow.mockResolvedValue({});

    const pinia = createTestingPinia({
      initialState: {
        profile: {
          me: {
            first_name: 'Ada',
            last_name: 'Lovelace',
            email: 'ada@example.com',
          },
        },
      },
    });

    wrapper = mount(SendFlowButton, {
      global: { plugins: [pinia] },
      props: {
        selectedFlow: 'flow-uuid',
        projectUuidFlow: 'project-uuid',
        contacts: [
          { external_id: 'c1', name: 'Joao' },
          { external_id: 'c2', name: 'Maria' },
        ],
        cachedTemplate: cachedTemplateWithVariables,
      },
    });

    await wrapper.vm.doSendFlow({
      nomecontato: 'Hi {{contact.name}}',
      nomeatendente: '{{agent.name}}',
    });

    const calls = FlowsTrigger.sendFlow.mock.calls.map(([payload]) => ({
      contact: payload.contacts[0],
      params: payload.params,
    }));

    expect(calls).toContainEqual({
      contact: 'c1',
      params: { nomecontato: 'Hi Joao', nomeatendente: 'Ada Lovelace' },
    });
    expect(calls).toContainEqual({
      contact: 'c2',
      params: { nomecontato: 'Hi Maria', nomeatendente: 'Ada Lovelace' },
    });
  });

  it('issues one POST /start_flow/ per selected contact', async () => {
    FlowsTrigger.sendFlow.mockResolvedValue({});

    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      projectUuidFlow: 'project-uuid',
      contacts: [
        { external_id: 'c1', name: 'Joao' },
        { external_id: 'c2', name: 'Maria' },
        { external_id: 'c3', name: 'Marcus' },
      ],
      cachedTemplate: cachedTemplateWithVariables,
    });

    await wrapper.vm.doSendFlow({
      nomecontato: 'static text',
      nomeatendente: 'agent text',
    });

    expect(FlowsTrigger.sendFlow).toHaveBeenCalledTimes(3);

    const contactsCalled = FlowsTrigger.sendFlow.mock.calls.map(
      ([payload]) => payload.contacts,
    );
    expect(contactsCalled).toEqual([['c1'], ['c2'], ['c3']]);
  });
});
