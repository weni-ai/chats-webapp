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

const emptyTemplatesResponse = {
  flow_uuid: 'flow-uuid',
  total_template_qty: 0,
  templates: [],
};

const templatesWithVariablesResponse = {
  flow_uuid: 'flow-uuid',
  total_template_qty: 1,
  templates: [
    {
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
    },
  ],
};

describe('SendFlowButton', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(SendFlowButton, {
      global: { plugins: [createTestingPinia()] },
      props: { selectedFlow: '' },
    });
    vi.clearAllMocks();
    FlowsTrigger.getFlowTemplates.mockResolvedValue(emptyTemplatesResponse);
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

  it('sends without opening modal when templates response has no variables', async () => {
    FlowsTrigger.getFlowTemplates.mockResolvedValueOnce(emptyTemplatesResponse);
    FlowsTrigger.sendFlow.mockResolvedValue({});

    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1', name: 'Contact 1' }],
      projectUuidFlow: 'project-uuid',
    });

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FlowsTrigger.getFlowTemplates).toHaveBeenCalledWith(
      'flow-uuid',
      'project-uuid',
    );
    expect(FlowsTrigger.sendFlow).toHaveBeenCalled();
    expect(wrapper.vm.showVariableModal).toBe(false);
  });

  it('opens variable mapping modal when template has variables', async () => {
    FlowsTrigger.getFlowTemplates.mockResolvedValueOnce(
      templatesWithVariablesResponse,
    );

    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1', name: 'Contact 1' }],
      projectUuidFlow: 'project-uuid',
    });

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FlowsTrigger.getFlowTemplates).toHaveBeenCalledWith(
      'flow-uuid',
      'project-uuid',
    );
    expect(FlowsTrigger.sendFlow).not.toHaveBeenCalled();
    expect(wrapper.vm.showVariableModal).toBe(true);
    expect(wrapper.vm.templateForMapping?.variables).toEqual([
      'nomecontato',
      'nomeatendente',
    ]);
  });

  it('sends with params after variable mapping confirmation', async () => {
    FlowsTrigger.getFlowTemplates.mockResolvedValueOnce(
      templatesWithVariablesResponse,
    );
    FlowsTrigger.sendFlow.mockResolvedValue({});

    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1', name: 'Contact 1' }],
      projectUuidFlow: 'project-uuid',
    });

    await wrapper.vm.startSendFlow();
    await new Promise((resolve) => setTimeout(resolve, 0));

    await wrapper.vm.onConfirmVariableMapping({
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
    expect(wrapper.vm.showVariableModal).toBe(false);
  });

  it('falls back to sending without params when template check fails', async () => {
    FlowsTrigger.getFlowTemplates.mockRejectedValueOnce(
      new Error('Network error'),
    );
    FlowsTrigger.sendFlow.mockResolvedValue({});
    vi.spyOn(console, 'error');

    await wrapper.setProps({
      selectedFlow: 'flow-uuid',
      contacts: [{ external_id: 'contact-1', name: 'Contact 1' }],
    });

    await wrapper.find('[data-testid="send-flow-button"]').trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(FlowsTrigger.sendFlow).toHaveBeenCalled();
    expect(FlowsTrigger.sendFlow.mock.calls[0][0]).not.toHaveProperty('params');
  });
});
