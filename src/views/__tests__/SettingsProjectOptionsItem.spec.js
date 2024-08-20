import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import SettingsProjectOptionsItem from '@/views/Settings/SettingsProjectOptions/SettingsProjectOptionsItem.vue';

const createWrapper = (props) => {
  return mount(SettingsProjectOptionsItem, {
    props,
  });
};

describe('SettingsProjectOptionsItem.vue', () => {
  let wrapper;

  describe('Without tooltip', () => {
    beforeEach(() => {
      wrapper = createWrapper({ modelValue: true, name: 'Option Name' });
    });

    it('should render switch with correct props', () => {
      const switchComponent = wrapper.findComponent(
        '[data-testid=settings-project-option-switch]',
      );
      expect(switchComponent.exists()).toBe(true);
      expect(switchComponent.props('modelValue')).toBe(true);
      expect(switchComponent.props('textRight')).toBe('Option Name');
    });

    it('should not render tooltip when tooltip prop is not provided', () => {
      const tooltip = wrapper.findComponent(
        '[data-testid=settings-project-option-tooltip]',
      );
      expect(tooltip.exists()).toBe(false);
    });

    it('should emit update:model-value event when switch emits update:model-value', async () => {
      const switchComponent = wrapper.findComponent(
        '[data-testid=settings-project-option-switch]',
      );
      await switchComponent.vm.$emit('update:model-value', true);

      expect(wrapper.emitted()['update:model-value']).toBeTruthy();
      expect(wrapper.emitted()['update:model-value'][0]).toEqual([true]);
    });
  });

  describe('Without tooltip', () => {
    beforeEach(() => {
      wrapper = createWrapper({
        modelValue: true,
        name: 'Option Name',
        tooltip: 'This is a tooltip',
      });
    });

    it('should render tooltip when tooltip prop is provided', () => {
      const tooltip = wrapper.findComponent(
        '[data-testid=settings-project-option-tooltip]',
      );
      expect(tooltip.exists()).toBe(true);
      expect(tooltip.props('text')).toBe('This is a tooltip');
      expect(tooltip.props('side')).toBe('right');
    });

    it('should match the snapshot', () => {
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
