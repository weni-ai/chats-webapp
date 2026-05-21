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

const componentStubs = {
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
      global: { stubs: componentStubs },
    });

  const fillAllVariables = async () => {
    wrapper.vm.variableValues.contactName = 'Marcus';
    wrapper.vm.variableValues.orderNumber = '12345';
    await wrapper.vm.$nextTick();
  };

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

  it('keeps confirm button disabled when checkbox is checked but variables are empty', async () => {
    const confirmButton = wrapper.find(
      '[data-testid="modal-variable-mapping-confirm"]',
    );

    expect(confirmButton.attributes('disabled')).toBeDefined();

    wrapper.vm.isConfirmed = true;
    await wrapper.vm.$nextTick();

    expect(confirmButton.attributes('disabled')).toBeDefined();
  });

  it('keeps confirm button disabled when all variables are filled but checkbox is unchecked', async () => {
    await fillAllVariables();

    const confirmButton = wrapper.find(
      '[data-testid="modal-variable-mapping-confirm"]',
    );
    expect(confirmButton.attributes('disabled')).toBeDefined();
  });

  it('keeps confirm button disabled when some variables only contain whitespace', async () => {
    wrapper.vm.variableValues.contactName = 'Marcus';
    wrapper.vm.variableValues.orderNumber = '   ';
    wrapper.vm.isConfirmed = true;
    await wrapper.vm.$nextTick();

    const confirmButton = wrapper.find(
      '[data-testid="modal-variable-mapping-confirm"]',
    );
    expect(confirmButton.attributes('disabled')).toBeDefined();
  });

  it('enables confirm button only when all variables are filled AND checkbox is checked', async () => {
    await fillAllVariables();
    wrapper.vm.isConfirmed = true;
    await wrapper.vm.$nextTick();

    const confirmButton = wrapper.find(
      '[data-testid="modal-variable-mapping-confirm"]',
    );
    expect(confirmButton.attributes('disabled')).toBeUndefined();
  });

  it('emits confirm with variable values when confirm button is clicked', async () => {
    await fillAllVariables();
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
