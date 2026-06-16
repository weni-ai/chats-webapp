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

import SendFlow from '../SendFlow.vue';
import SelectFlow from '../SelectFlow.vue';
import SendFlowButton from '../SendFlowButton.vue';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import FlowsTrigger from '@/services/api/resources/chats/flowsTrigger';

import {
  createFlowsTriggerPinia,
  disableVariableMappingFlag,
  enableVariableMappingFlag,
} from './testHelpers';

vi.mock('@/utils/callUnnnicAlert');

vi.mock('@/services/api/resources/chats/flowsTrigger', () => ({
  default: {
    getFlows: vi.fn(() =>
      Promise.resolve([{ uuid: 'flow-1', name: 'Flow 1' }]),
    ),
    getFlowTemplates: vi.fn(),
    sendFlow: vi.fn(),
  },
}));

const templatesWithVariablesResponse = {
  flow_uuid: 'flow-1',
  total_template_qty: 1,
  templates: [
    {
      variables: ['nomecontato'],
      data: {
        name: 'template_test',
        components: [{ type: 'BODY', text: 'Olá {{1}}' }],
      },
    },
  ],
};

const emptyTemplatesResponse = {
  flow_uuid: 'flow-1',
  total_template_qty: 0,
  templates: [],
};

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

const sendFlowStubs = {
  ModalVariableMapping: true,
  Teleport: true,
};

describe('SendFlow', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = mount(SendFlow, {
      global: {
        components: { SelectFlow, SendFlowButton },
        plugins: [createFlowsTriggerPinia()],
        stubs: sendFlowStubs,
      },
      props: { contacts: [], selectedContact: {} },
    });
    disableVariableMappingFlag();
  });

  it('renders correctly with initial state', async () => {
    await wrapper.setProps({ contacts: undefined, selectedContact: undefined });
    expect(wrapper.findComponent('[data-testid="select-flow"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="back-button"]').exists()).toBe(true);
    expect(wrapper.findComponent(SendFlowButton).exists()).toBe(true);
  });

  it('updates selectedFlow when a flow is selected', async () => {
    const selectFlow = wrapper.findComponent('[data-testid="select-flow"]');
    await selectFlow.vm.$emit('update:modelValue', 'flow-1');
    expect(wrapper.vm.selectedFlow).toBe('flow-1');
  });

  it('shows progress modal when send-flow-started is emitted', async () => {
    const sendFlowButton = wrapper.findComponent(SendFlowButton);
    await sendFlowButton.vm.$emit('send-flow-started');
    expect(wrapper.vm.showProgressBar).toBe(true);
  });

  it('hides progress modal and shows success alert when send-flow-finished is emitted without errors', async () => {
    const sendFlowButton = wrapper.findComponent(SendFlowButton);
    wrapper.vm.showProgressBar = true;

    await sendFlowButton.vm.$emit('send-flow-finished', { hasError: false });

    expect(wrapper.vm.showProgressBar).toBe(false);
    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('flows_trigger.successfully_triggered'),
        type: 'success',
      },
      seconds: 5,
    });
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('hides progress modal and shows error alert when send-flow-finished is emitted with errors', async () => {
    const sendFlowButton = wrapper.findComponent(SendFlowButton);
    wrapper.vm.showProgressBar = true;

    await sendFlowButton.vm.$emit('send-flow-finished', { hasError: true });

    expect(wrapper.vm.showProgressBar).toBe(false);
    expect(callUnnnicAlert).toHaveBeenCalledWith({
      props: {
        text: wrapper.vm.$t('flows_trigger.error_triggering'),
        type: 'error',
      },
      seconds: 5,
    });
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits back event when back button is clicked', async () => {
    await wrapper.find('[data-testid="back-button"]').trigger('click');
    expect(wrapper.emitted('back')).toHaveLength(1);
  });

  describe('template check on flow selection', () => {
    beforeEach(() => {
      enableVariableMappingFlag();
    });

    it('does not check templates when isProjectPrincipal=true', async () => {
      await wrapper.setProps({ isProjectPrincipal: true });
      await wrapper
        .findComponent('[data-testid="select-flow"]')
        .vm.$emit('update:modelValue', 'flow-1');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(FlowsTrigger.getFlowTemplates).not.toHaveBeenCalled();
      expect(wrapper.vm.cachedTemplate).toBe(null);
    });

    it('caches the template when the selected flow has variables', async () => {
      FlowsTrigger.getFlowTemplates.mockResolvedValueOnce(
        templatesWithVariablesResponse,
      );

      await wrapper
        .findComponent('[data-testid="select-flow"]')
        .vm.$emit('update:modelValue', 'flow-1');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(FlowsTrigger.getFlowTemplates).toHaveBeenCalledWith('flow-1', '');
      expect(wrapper.vm.cachedTemplate).toEqual({
        templates: templatesWithVariablesResponse.templates,
        total_template_qty: templatesWithVariablesResponse.total_template_qty,
      });
      expect(wrapper.emitted('update:cachedTemplate')).toBeTruthy();
    });

    it('emits the cached template up when the selected flow has variables', async () => {
      FlowsTrigger.getFlowTemplates.mockResolvedValueOnce(
        templatesWithVariablesResponse,
      );

      await wrapper
        .findComponent('[data-testid="select-flow"]')
        .vm.$emit('update:modelValue', 'flow-1');
      await new Promise((resolve) => setTimeout(resolve, 0));

      const emissions = wrapper.emitted('update:cachedTemplate');
      expect(emissions).toBeTruthy();

      const lastPayload = emissions[emissions.length - 1][0];
      expect(lastPayload.templates).toEqual(
        templatesWithVariablesResponse.templates,
      );
      expect(lastPayload.total_template_qty).toBe(
        templatesWithVariablesResponse.total_template_qty,
      );
    });

    it('stores null when the selected flow has no template variables', async () => {
      FlowsTrigger.getFlowTemplates.mockResolvedValueOnce(
        emptyTemplatesResponse,
      );

      await wrapper
        .findComponent('[data-testid="select-flow"]')
        .vm.$emit('update:modelValue', 'flow-1');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.vm.cachedTemplate).toBe(null);
    });

    it('toggles isCheckingTemplate during the request', async () => {
      let resolveTemplate;
      FlowsTrigger.getFlowTemplates.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveTemplate = resolve;
          }),
      );

      wrapper
        .findComponent('[data-testid="select-flow"]')
        .vm.$emit('update:modelValue', 'flow-1');
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.isCheckingTemplate).toBe(true);

      resolveTemplate(templatesWithVariablesResponse);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(wrapper.vm.isCheckingTemplate).toBe(false);
    });

    it('resets cachedTemplate when the flow changes to empty', async () => {
      FlowsTrigger.getFlowTemplates.mockResolvedValueOnce(
        templatesWithVariablesResponse,
      );

      await wrapper
        .findComponent('[data-testid="select-flow"]')
        .vm.$emit('update:modelValue', 'flow-1');
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(wrapper.vm.cachedTemplate).not.toBe(null);

      await wrapper
        .findComponent('[data-testid="select-flow"]')
        .vm.$emit('update:modelValue', '');

      expect(wrapper.vm.cachedTemplate).toBe(null);
    });
  });
});
