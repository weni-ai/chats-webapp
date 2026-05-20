import { mount, config } from '@vue/test-utils';
import { expect, describe, it, beforeAll, afterAll, beforeEach } from 'vitest';

import ModalVariableMapping from '../ModalVariableMapping.vue';

let savedGlobalMocks;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  config.global.mocks = {};
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
});

const dialogStubs = {
  UnnnicDialog: {
    name: 'UnnnicDialogStub',
    props: ['open'],
    template: `
      <div v-if="open" v-bind="$attrs">
        <slot />
      </div>
    `,
  },
  UnnnicDialogContent: {
    name: 'UnnnicDialogContentStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogHeader: {
    name: 'UnnnicDialogHeaderStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogTitle: {
    name: 'UnnnicDialogTitleStub',
    template: '<div><slot /></div>',
  },
  UnnnicDialogFooter: {
    name: 'UnnnicDialogFooterStub',
    template: '<div><slot /></div>',
  },
};

const baseTemplate = {
  name: 'template_test',
  components: [
    {
      type: 'BODY',
      text: 'Hi {{1}}, your order #{{2}}',
    },
  ],
};

describe('ModalVariableMapping', () => {
  let wrapper;

  const buildWrapper = (props = {}) =>
    mount(ModalVariableMapping, {
      props: {
        template: baseTemplate,
        variables: ['contactName', 'orderNumber'],
        ...props,
      },
      global: { stubs: dialogStubs },
    });

  beforeEach(() => {
    wrapper = buildWrapper();
  });

  it('renders one input per variable', () => {
    expect(
      wrapper.find('[data-testid="modal-variable-mapping-input-0"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="modal-variable-mapping-input-1"]').exists(),
    ).toBe(true);
  });

  it('disables confirm button until checkbox is checked', async () => {
    const confirmButton = wrapper.find(
      '[data-testid="modal-variable-mapping-confirm"]',
    );

    expect(confirmButton.attributes('disabled')).toBeDefined();

    wrapper.vm.isConfirmed = true;
    await wrapper.vm.$nextTick();

    expect(confirmButton.attributes('disabled')).toBeUndefined();
  });

  it('emits confirm with variable values when confirm button is clicked', async () => {
    wrapper.vm.variableValues.contactName = 'Marcus';
    wrapper.vm.variableValues.orderNumber = '12345';
    wrapper.vm.isConfirmed = true;
    await wrapper.vm.$nextTick();

    await wrapper
      .find('[data-testid="modal-variable-mapping-confirm"]')
      .trigger('click');

    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.emitted('confirm')[0][0]).toEqual({
      contactName: 'Marcus',
      orderNumber: '12345',
    });
  });

  it('emits close when cancel button is clicked', async () => {
    await wrapper
      .find('[data-testid="modal-variable-mapping-cancel"]')
      .trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits close when dialog closes (update:open false)', async () => {
    wrapper.vm.isOpen = false;
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('initializes all variables as empty strings', () => {
    expect(wrapper.vm.variableValues).toEqual({
      contactName: '',
      orderNumber: '',
    });
  });
});
