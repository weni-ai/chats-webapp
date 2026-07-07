import { mount, config } from '@vue/test-utils';
import { expect, describe, it, beforeAll, afterAll, beforeEach } from 'vitest';

import i18n from '@/plugins/i18n';

import VariableInput from '../VariableInput.vue';

const UnnnicSystemPlugin = config.global.plugins.find(
  (p) => p !== i18n && typeof p !== 'function',
);

let savedGlobalMocks;
let savedGlobalStubs;
let savedGlobalPlugins;

beforeAll(() => {
  savedGlobalMocks = { ...config.global.mocks };
  savedGlobalStubs = { ...config.global.stubs };
  savedGlobalPlugins = [...config.global.plugins];
  config.global.mocks = {};
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== UnnnicSystemPlugin,
  );
});

afterAll(() => {
  config.global.mocks = savedGlobalMocks;
  config.global.stubs = savedGlobalStubs;
  config.global.plugins = savedGlobalPlugins;
});

const UnnnicPopoverStub = {
  name: 'UnnnicPopoverStub',
  props: ['open'],
  emits: ['update:open'],
  template: `
    <div data-testid="popover-stub" :data-open="open ? 'true' : 'false'">
      <slot />
    </div>
  `,
};

const UnnnicPopoverTriggerStub = {
  name: 'UnnnicPopoverTriggerStub',
  props: ['asChild'],
  template: '<div data-testid="popover-trigger-stub"><slot /></div>',
};

const UnnnicPopoverContentStub = {
  name: 'UnnnicPopoverContentStub',
  props: ['side', 'align', 'sideOffset', 'width'],
  template: '<div data-testid="popover-content-stub"><slot /></div>',
};

const UnnnicInputStub = {
  name: 'UnnnicInputStub',
  props: [
    'modelValue',
    'label',
    'placeholder',
    'readonly',
    'disabled',
    'iconRight',
    'iconRightClickable',
    'showClear',
  ],
  emits: ['update:modelValue', 'clear', 'click', 'focus'],
  inheritAttrs: false,
  template: `
    <div
      :data-testid="$attrs['data-testid']"
      :data-readonly="readonly ? 'true' : 'false'"
      :data-disabled="disabled ? 'true' : 'false'"
      :data-show-clear="showClear ? 'true' : 'false'"
      :data-icon-right="iconRight"
      :data-value="modelValue"
    >
      <input
        :data-testid="($attrs['data-testid'] || 'input') + '-native'"
        :value="modelValue"
        :readonly="readonly"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
        @click="$emit('click', $event)"
        @focus="$emit('focus', $event)"
      />
      <button
        v-if="showClear"
        type="button"
        :data-testid="($attrs['data-testid'] || 'input') + '-clear'"
        @click="$emit('clear')"
      >x</button>
    </div>
  `,
};

const stubs = {
  UnnnicPopover: UnnnicPopoverStub,
  UnnnicPopoverTrigger: UnnnicPopoverTriggerStub,
  UnnnicPopoverContent: UnnnicPopoverContentStub,
  UnnnicInput: UnnnicInputStub,
};

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

const labelFor = (token) =>
  ({
    '{{contact.name}}': 'Contact name',
    '{{agent.name}}': 'Representative name',
  })[token];

const buildWrapper = (props = {}) =>
  mount(VariableInput, {
    props: {
      modelValue: '',
      localVariables: sampleLocalVariables,
      dataTestid: 'variable-input',
      ...props,
    },
  });

describe('VariableInput', () => {
  let wrapper;

  beforeEach(() => {
    config.global.stubs = { ...savedGlobalStubs, ...stubs };
    wrapper = buildWrapper();
  });

  it('renders one option row per local variable', () => {
    const options = wrapper.findAll('[data-testid^="variable-input-option-"]');
    expect(options).toHaveLength(2);
  });

  it('does not render the popover when there are no local variables', () => {
    wrapper = buildWrapper({ localVariables: [] });
    expect(wrapper.find('[data-testid="popover-stub"]').exists()).toBe(false);
  });

  it('renders chevron icon on the right of the input', () => {
    const input = wrapper.find('[data-testid="variable-input-input"]');
    expect(input.attributes('data-icon-right')).toBe('keyboard_arrow_down');
  });

  it('keeps the input editable (not readonly) when no token is selected', () => {
    const input = wrapper.find('[data-testid="variable-input-input"]');
    expect(input.attributes('data-readonly')).toBe('false');
    expect(input.attributes('data-show-clear')).toBe('false');
  });

  it('locks the input as readonly and shows the X when modelValue matches a token', async () => {
    await wrapper.setProps({ modelValue: '{{contact.name}}' });

    const input = wrapper.find('[data-testid="variable-input-input"]');
    expect(input.attributes('data-readonly')).toBe('true');
    expect(input.attributes('data-show-clear')).toBe('true');
  });

  it('displays the variable label when a token is selected', async () => {
    await wrapper.setProps({ modelValue: '{{contact.name}}' });

    const input = wrapper.find('[data-testid="variable-input-input"]');
    expect(input.attributes('data-value')).toBe(labelFor('{{contact.name}}'));
  });

  it('emits the raw modelValue when typing free text', async () => {
    await wrapper
      .find('[data-testid="variable-input-input-native"]')
      .setValue('Marcus');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted[emitted.length - 1]).toEqual(['Marcus']);
  });

  it('emits the token and closes the popover when an option is clicked', async () => {
    await wrapper
      .find('[data-testid="variable-input-option-{{contact.name}}"]')
      .trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([
      '{{contact.name}}',
    ]);

    const popover = wrapper.find('[data-testid="popover-stub"]');
    expect(popover.attributes('data-open')).toBe('false');
  });

  it('clears the token and reopens the popover when the X is clicked', async () => {
    await wrapper.setProps({ modelValue: '{{contact.name}}' });

    await wrapper
      .find('[data-testid="variable-input-input-clear"]')
      .trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['']);
    expect(
      wrapper.find('[data-testid="popover-stub"]').attributes('data-open'),
    ).toBe('true');
  });

  it('opens the popover when the input is clicked', async () => {
    expect(
      wrapper.find('[data-testid="popover-stub"]').attributes('data-open'),
    ).toBe('false');

    await wrapper
      .find('[data-testid="variable-input-input-native"]')
      .trigger('click');

    expect(
      wrapper.find('[data-testid="popover-stub"]').attributes('data-open'),
    ).toBe('true');
  });

  it('highlights the active option when a token is selected', async () => {
    await wrapper.setProps({ modelValue: '{{contact.name}}' });

    const activeOption = wrapper.find(
      '[data-testid="variable-input-option-{{contact.name}}"]',
    );
    expect(activeOption.classes()).toContain('variable-input__option--active');

    const inactiveOption = wrapper.find(
      '[data-testid="variable-input-option-{{agent.name}}"]',
    );
    expect(inactiveOption.classes()).not.toContain(
      'variable-input__option--active',
    );
  });

  it('does not emit on input change while a token is selected (readonly)', async () => {
    await wrapper.setProps({ modelValue: '{{contact.name}}' });

    const nativeInput = wrapper.find(
      '[data-testid="variable-input-input-native"]',
    );
    await nativeInput.trigger('input');

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeFalsy();
  });

  describe('disabled state', () => {
    it('does not render the popover and shows a disabled input', () => {
      wrapper = buildWrapper({ disabled: true, modelValue: 'Marcus' });

      expect(wrapper.find('[data-testid="popover-stub"]').exists()).toBe(false);

      const input = wrapper.find('[data-testid="variable-input-input"]');
      expect(input.attributes('data-disabled')).toBe('true');
      expect(input.attributes('data-value')).toBe('Marcus');
    });

    it('displays the local variable label when disabled with a token value', () => {
      wrapper = buildWrapper({
        disabled: true,
        modelValue: '{{contact.name}}',
      });

      const input = wrapper.find('[data-testid="variable-input-input"]');
      expect(input.attributes('data-value')).toBe(labelFor('{{contact.name}}'));
    });

    it('does not emit when the input changes while disabled', async () => {
      wrapper = buildWrapper({ disabled: true, modelValue: 'Marcus' });

      await wrapper
        .find('[data-testid="variable-input-input-native"]')
        .trigger('input');

      expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });
  });
});
