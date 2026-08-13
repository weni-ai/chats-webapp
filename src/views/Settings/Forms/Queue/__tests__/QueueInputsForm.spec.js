import { mount } from '@vue/test-utils';
import { describe, expect, it, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';

import QueueInputsForm from '../QueueInputsForm.vue';

const createQueueForm = (overrides = {}) => ({
  name: 'Queue name',
  queue_purpose: '',
  queue_limit: { is_active: false, limit: null },
  currentAgents: [],
  toAddAgentsUuids: [],
  toRemoveAgentsUuids: [],
  validForm: false,
  bond_flows_queue: false,
  selected_flows: [],
  ...overrides,
});

const mountQueueInputsForm = ({
  queueForm = createQueueForm(),
  activeFeatures = ['weniChatsFilterFlowsByQueue'],
} = {}) =>
  mount(QueueInputsForm, {
    props: { modelValue: queueForm, agentsOptions: [] },
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            featureFlag: { featureFlags: { active_features: activeFeatures } },
          },
        }),
      ],
      stubs: {
        AgentsForm: true,
        SelectQueueFlows: true,
      },
    },
  });

describe('QueueInputsForm', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mountQueueInputsForm();
  });

  it('renders the flows section when the feature flag is active', () => {
    expect(wrapper.find('[data-testid="queue-bond-flows"]').exists()).toBe(
      true,
    );
  });

  it('does not render the flows section when the feature flag is inactive', () => {
    const withoutFlagWrapper = mountQueueInputsForm({ activeFeatures: [] });

    expect(
      withoutFlagWrapper.find('[data-testid="queue-bond-flows"]').exists(),
    ).toBe(false);

    withoutFlagWrapper.unmount();
  });

  it('keeps bond_flows_queue false while no flow is selected', () => {
    expect(wrapper.vm.queueForm.bond_flows_queue).toBe(false);
  });

  it('sets bond_flows_queue to true when flows are selected', async () => {
    const selectQueueFlows = wrapper.findComponent({
      name: 'SelectQueueFlows',
    });

    await selectQueueFlows.vm.$emit('update:modelValue', [
      { uuid: 'flow-1', name: 'Flow 1' },
    ]);
    wrapper.vm.queueForm.selected_flows = [{ uuid: 'flow-1', name: 'Flow 1' }];
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.queueForm.bond_flows_queue).toBe(true);
  });

  it('sets bond_flows_queue back to false when all flows are removed', async () => {
    const preSelectedWrapper = mountQueueInputsForm({
      queueForm: createQueueForm({
        bond_flows_queue: true,
        selected_flows: [{ uuid: 'flow-1', name: 'Flow 1' }],
      }),
    });

    expect(preSelectedWrapper.vm.queueForm.bond_flows_queue).toBe(true);

    preSelectedWrapper.vm.queueForm.selected_flows = [];
    await preSelectedWrapper.vm.$nextTick();

    expect(preSelectedWrapper.vm.queueForm.bond_flows_queue).toBe(false);

    preSelectedWrapper.unmount();
  });
});
