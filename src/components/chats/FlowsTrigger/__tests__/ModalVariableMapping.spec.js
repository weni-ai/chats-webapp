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

const singleTemplate = [
  {
    variables: ['contactName', 'orderNumber'],
    data: {
      name: 'template_test',
      components: [
        {
          type: 'BODY',
          text: 'Hi {{1}}, your order #{{2}}',
        },
      ],
    },
  },
];

const multiTemplates = [
  {
    variables: ['contactName'],
    data: {
      name: 'first_template',
      components: [{ type: 'BODY', text: 'Hi {{1}}' }],
    },
  },
  {
    variables: ['city'],
    data: {
      name: 'second_template',
      components: [{ type: 'BODY', text: 'From {{1}}' }],
    },
  },
  {
    variables: ['orderNumber'],
    data: {
      name: 'third_template',
      components: [{ type: 'BODY', text: 'Order {{1}}' }],
    },
  },
];

const sharedTemplates = [
  {
    variables: ['nome', 'endereco'],
    data: {
      name: 'first_template',
      components: [{ type: 'BODY', text: 'Oi {{1}}, voce mora em {{2}}' }],
    },
  },
  {
    variables: ['nome', 'idade'],
    data: {
      name: 'second_template',
      components: [{ type: 'BODY', text: '{{1}} tem {{2}} anos' }],
    },
  },
];

describe('ModalVariableMapping', () => {
  const buildWrapper = (props = {}) =>
    mount(ModalVariableMapping, {
      props: {
        templates: singleTemplate,
        totalTemplateQty: 1,
        ...props,
      },
    });

  const setValue = async (wrapper, name, value) => {
    wrapper.vm.values[name] = value;
    await wrapper.vm.$nextTick();
  };

  const clickNext = (wrapper) =>
    wrapper
      .find('[data-testid="modal-variable-mapping-next"]')
      .trigger('click');

  describe('single template', () => {
    let wrapper;

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

    it('shows the template counter tag', () => {
      expect(wrapper.text()).toContain('Template 1 of 1');
    });

    it('initializes all variables as empty strings', () => {
      expect(wrapper.vm.values).toEqual({
        contactName: '',
        orderNumber: '',
      });
    });

    it('keeps confirm disabled when checkbox checked but variables empty', async () => {
      wrapper.vm.isConfirmed = true;
      await wrapper.vm.$nextTick();

      const confirmButton = wrapper.find(
        '[data-testid="modal-variable-mapping-confirm"]',
      );
      expect(confirmButton.attributes('disabled')).toBeDefined();
    });

    it('keeps confirm disabled when variables filled but checkbox unchecked', async () => {
      await setValue(wrapper, 'contactName', 'Marcus');
      await setValue(wrapper, 'orderNumber', '12345');

      const confirmButton = wrapper.find(
        '[data-testid="modal-variable-mapping-confirm"]',
      );
      expect(confirmButton.attributes('disabled')).toBeDefined();
    });

    it('enables confirm and emits confirm with merged values', async () => {
      await setValue(wrapper, 'contactName', 'Marcus');
      await setValue(wrapper, 'orderNumber', '12345');
      wrapper.vm.isConfirmed = true;
      await wrapper.vm.$nextTick();

      const confirmButton = wrapper.find(
        '[data-testid="modal-variable-mapping-confirm"]',
      );
      expect(confirmButton.attributes('disabled')).toBeUndefined();

      await confirmButton.trigger('click');

      expect(wrapper.emitted('confirm')).toHaveLength(1);
      expect(wrapper.emitted('confirm')[0][0]).toEqual({
        contactName: 'Marcus',
        orderNumber: '12345',
      });
    });

    it('shows the total templates count in the send button', () => {
      expect(wrapper.text()).toContain('Send (1 template)');
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
  });

  describe('multiple templates', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = buildWrapper({
        templates: multiTemplates,
        totalTemplateQty: 3,
      });
    });

    it('starts on the first template with the counter tag', () => {
      expect(wrapper.text()).toContain('Template 1 of 3');
    });

    it('shows next on non-last steps and no confirmation checkbox', () => {
      expect(
        wrapper.find('[data-testid="modal-variable-mapping-next"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="modal-variable-mapping-confirm"]').exists(),
      ).toBe(false);
      expect(
        wrapper
          .find('[data-testid="modal-variable-mapping-confirmation"]')
          .exists(),
      ).toBe(false);
    });

    it('keeps next disabled until the current template variables are filled', async () => {
      const next = wrapper.find('[data-testid="modal-variable-mapping-next"]');
      expect(next.attributes('disabled')).toBeDefined();

      await setValue(wrapper, 'contactName', 'Marcus');
      expect(next.attributes('disabled')).toBeUndefined();
    });

    it('advances to the next template and updates the counter', async () => {
      await setValue(wrapper, 'contactName', 'Marcus');
      await clickNext(wrapper);

      expect(wrapper.vm.currentIndex).toBe(1);
      expect(wrapper.text()).toContain('Template 2 of 3');
    });

    it('shows the first button as Back after the first step', async () => {
      await setValue(wrapper, 'contactName', 'Marcus');
      await clickNext(wrapper);

      expect(
        wrapper.find('[data-testid="modal-variable-mapping-back"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="modal-variable-mapping-cancel"]').exists(),
      ).toBe(false);
    });

    it('returns to the previous template preserving filled values', async () => {
      await setValue(wrapper, 'contactName', 'Marcus');
      await clickNext(wrapper);
      await setValue(wrapper, 'city', 'Recife');

      await wrapper
        .find('[data-testid="modal-variable-mapping-back"]')
        .trigger('click');

      expect(wrapper.vm.currentIndex).toBe(0);
      expect(wrapper.vm.values.contactName).toBe('Marcus');
      expect(wrapper.vm.values.city).toBe('Recife');
    });

    it('shows the confirmation checkbox and send count only on the last step', async () => {
      await setValue(wrapper, 'contactName', 'Marcus');
      await clickNext(wrapper);
      await setValue(wrapper, 'city', 'Recife');
      await clickNext(wrapper);

      expect(
        wrapper
          .find('[data-testid="modal-variable-mapping-confirmation"]')
          .exists(),
      ).toBe(true);
      expect(wrapper.text()).toContain('Send (3 templates)');
    });

    it('emits confirm with merged params from every template', async () => {
      await setValue(wrapper, 'contactName', 'Marcus');
      await clickNext(wrapper);
      await setValue(wrapper, 'city', 'Recife');
      await clickNext(wrapper);
      await setValue(wrapper, 'orderNumber', '12345');
      wrapper.vm.isConfirmed = true;
      await wrapper.vm.$nextTick();

      await wrapper
        .find('[data-testid="modal-variable-mapping-confirm"]')
        .trigger('click');

      expect(wrapper.emitted('confirm')).toHaveLength(1);
      expect(wrapper.emitted('confirm')[0][0]).toEqual({
        contactName: 'Marcus',
        city: 'Recife',
        orderNumber: '12345',
      });
    });
  });

  describe('shared variables across templates', () => {
    let wrapper;

    beforeEach(() => {
      wrapper = buildWrapper({
        templates: sharedTemplates,
        totalTemplateQty: 2,
      });
    });

    it('keeps a single entry per variable name', () => {
      expect(wrapper.vm.values).toEqual({
        nome: '',
        endereco: '',
        idade: '',
      });
    });

    it('lets the shared variable be edited on its first appearance', () => {
      const inputs = wrapper.findAllComponents({ name: 'VariableInput' });
      expect(inputs[0].props('disabled')).toBe(false);
      expect(inputs[1].props('disabled')).toBe(false);
    });

    it('locks the shared variable on later templates and keeps its value', async () => {
      await setValue(wrapper, 'nome', 'Marcus');
      await setValue(wrapper, 'endereco', 'Rua 1');
      await clickNext(wrapper);

      const inputs = wrapper.findAllComponents({ name: 'VariableInput' });
      expect(inputs[0].props('disabled')).toBe(true);
      expect(inputs[0].props('modelValue')).toBe('Marcus');
      expect(inputs[1].props('disabled')).toBe(false);
    });

    it('emits confirm with a single value per variable name', async () => {
      await setValue(wrapper, 'nome', 'Marcus');
      await setValue(wrapper, 'endereco', 'Rua 1');
      await clickNext(wrapper);
      await setValue(wrapper, 'idade', '30');
      wrapper.vm.isConfirmed = true;
      await wrapper.vm.$nextTick();

      await wrapper
        .find('[data-testid="modal-variable-mapping-confirm"]')
        .trigger('click');

      expect(wrapper.emitted('confirm')[0][0]).toEqual({
        nome: 'Marcus',
        endereco: 'Rua 1',
        idade: '30',
      });
    });
  });

  describe('local variables integration', () => {
    const sampleLocalVariables = [
      {
        token: '{{contact.name}}',
        labelKey: 'flows_trigger.variable_mapping.local_variables.contact_name',
        previewValue: 'Joao',
      },
      {
        token: '{{agent.name}}',
        labelKey: 'flows_trigger.variable_mapping.local_variables.agent_name',
        previewValue: 'Ada Lovelace',
      },
    ];

    it('forwards localVariables prop to each VariableInput row', () => {
      const wrapper = buildWrapper({ localVariables: sampleLocalVariables });

      const variableInputs = wrapper.findAllComponents({
        name: 'VariableInput',
      });
      expect(variableInputs).toHaveLength(2);
      expect(variableInputs[0].props('localVariables')).toEqual(
        sampleLocalVariables,
      );
    });

    it('resolves tokens in previewValues using the local variable preview value', async () => {
      const wrapper = buildWrapper({ localVariables: sampleLocalVariables });
      await setValue(
        wrapper,
        'contactName',
        'Hello {{contact.name}}, from {{agent.name}}',
      );
      await setValue(wrapper, 'orderNumber', 'static');

      expect(wrapper.vm.previewValues).toEqual({
        contactName: 'Hello Joao, from Ada Lovelace',
        orderNumber: 'static',
      });
    });

    it('treats a token as a filled value', async () => {
      const wrapper = buildWrapper({ localVariables: sampleLocalVariables });
      await setValue(wrapper, 'contactName', '{{contact.name}}');
      await setValue(wrapper, 'orderNumber', '12345');
      wrapper.vm.isConfirmed = true;
      await wrapper.vm.$nextTick();

      const confirmButton = wrapper.find(
        '[data-testid="modal-variable-mapping-confirm"]',
      );
      expect(confirmButton.attributes('disabled')).toBeUndefined();
    });
  });
});
