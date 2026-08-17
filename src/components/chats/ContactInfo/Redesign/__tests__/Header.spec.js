import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { mount, config } from '@vue/test-utils';
import Header from '../Header.vue';
import i18n from '@/plugins/i18n';

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (config.global.plugins && !config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const segmentedControlStub = {
  name: 'UnnnicSegmentedControl',
  template: '<div class="unnnic-segmented-control"><slot /></div>',
  props: ['modelValue', 'defaultValue'],
  emits: ['update:modelValue'],
};

const segmentedControlListStub = {
  name: 'UnnnicSegmentedControlList',
  template: '<div class="unnnic-segmented-control-list"><slot /></div>',
};

const segmentedControlTriggerStub = {
  name: 'UnnnicSegmentedControlTrigger',
  template:
    '<button class="unnnic-segmented-control-trigger" :disabled="disabled" :data-testid="$attrs[\'data-testid\']"><slot /></button>',
  props: ['value', 'disabled'],
  inheritAttrs: false,
};

const createWrapper = (props = {}) =>
  mount(Header, {
    props: {
      modelValue: 'desk_copilot',
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        // UnnnicSegmentedControl is an alias of Tabs.vue (name: UnnnicTabs)
        UnnnicTabs: segmentedControlStub,
        UnnnicSegmentedControl: segmentedControlStub,
        SegmentedControlList: segmentedControlListStub,
        UnnnicSegmentedControlList: segmentedControlListStub,
        SegmentedControlTrigger: segmentedControlTriggerStub,
        UnnnicSegmentedControlTrigger: segmentedControlTriggerStub,
        UnnnicButton: {
          name: 'UnnnicButton',
          template:
            '<button class="unnnic-button" :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')" />',
          props: ['iconCenter', 'type', 'size', 'disabled'],
          emits: ['click'],
        },
      },
    },
  });

describe('ContactInfoRedesignHeader', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders segmented control with desk copilot enabled', () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="contact-info-redesign-header"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="segmented-desk-copilot"]').exists(),
    ).toBe(true);
    expect(
      wrapper
        .find('[data-testid="segmented-desk-copilot"]')
        .attributes('disabled'),
    ).toBeUndefined();
    expect(wrapper.find('[data-testid="segmented-information"]').exists()).toBe(
      true,
    );
  });

  it('emits update:modelValue when the segmented control changes', async () => {
    wrapper = createWrapper({ modelValue: 'desk_copilot' });

    const segmented = wrapper.findComponent({ name: 'UnnnicSegmentedControl' });
    expect(segmented.exists()).toBe(true);
    await segmented.vm.$emit('update:modelValue', 'information');

    expect(wrapper.emitted('update:modelValue')).toEqual([['information']]);
  });

  it('emits refresh and close events', async () => {
    wrapper = createWrapper();

    await wrapper.find('[data-testid="refresh-button"]').trigger('click');
    await wrapper.find('[data-testid="close-button"]').trigger('click');

    expect(wrapper.emitted('refresh')).toBeTruthy();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('hides refresh and close buttons when props disable them', () => {
    wrapper = createWrapper({
      showRefresh: false,
      showClose: false,
    });

    expect(wrapper.find('[data-testid="refresh-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="close-button"]').exists()).toBe(false);
  });

  it('hides the desk copilot tab when showDeskCopilotTab is false', () => {
    wrapper = createWrapper({
      showDeskCopilotTab: false,
      modelValue: 'information',
    });

    expect(
      wrapper.find('[data-testid="segmented-desk-copilot"]').exists(),
    ).toBe(false);
    expect(wrapper.find('[data-testid="segmented-information"]').exists()).toBe(
      true,
    );
  });

  it('keeps the information tab compact on the left when desk copilot is hidden', () => {
    wrapper = createWrapper({
      showDeskCopilotTab: false,
      modelValue: 'information',
    });

    expect(
      wrapper
        .find('[data-testid="contact-info-redesign-header"]')
        .classes(),
    ).toContain('contact-info-redesign-header--compact');
  });

  it('does not use the compact header when both tabs are visible', () => {
    wrapper = createWrapper();

    expect(
      wrapper
        .find('[data-testid="contact-info-redesign-header"]')
        .classes(),
    ).not.toContain('contact-info-redesign-header--compact');
  });
});
