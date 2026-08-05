import { mount } from '@vue/test-utils';
import { describe, expect, it, beforeEach } from 'vitest';

import DisableBondFlowsModal from '../DisableBondFlowsModal.vue';

const createWrapper = (props = {}) =>
  mount(DisableBondFlowsModal, {
    props: {
      modelValue: true,
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicDialog: {
          template: '<div><slot /></div>',
          props: ['open'],
        },
        UnnnicDialogContent: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogHeader: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogTitle: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogClose: {
          template:
            '<button data-testid="dialog-close" @click="$emit(\'click\')"></button>',
        },
        UnnnicDialogFooter: {
          template: '<div><slot /></div>',
        },
      },
    },
  });

describe('DisableBondFlowsModal', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('renders description and actions', () => {
    expect(
      wrapper.find('[data-testid="disable-bond-flows-description"]').text(),
    ).toBe('config_chats.queues.bond_flows_queue.disable_modal.description');
    expect(
      wrapper.find('[data-testid="disable-bond-flows-cancel-btn"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="disable-bond-flows-confirm-btn"]').exists(),
    ).toBe(true);
  });

  it('closes without confirming when cancel is clicked', async () => {
    await wrapper
      .find('[data-testid="disable-bond-flows-cancel-btn"]')
      .trigger('click');

    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
    expect(wrapper.emitted('confirm')).toBeFalsy();
  });

  it('emits confirm and closes when confirm is clicked', async () => {
    await wrapper
      .find('[data-testid="disable-bond-flows-confirm-btn"]')
      .trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
  });
});
