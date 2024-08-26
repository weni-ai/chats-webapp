import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import SettingsSectionHeader from '@/views/Settings/SettingsSectionHeader.vue';

const createWrapper = (props) => {
  return mount(SettingsSectionHeader, {
    props,
  });
};

describe('SettingsSectionHeader.vue', () => {
  let wrapper;

  describe('Without subtitle', () => {
    beforeEach(() => {
      wrapper = createWrapper({ title: 'Section Title' });
    });

    it('should render the title correctly', () => {
      const title = wrapper.find('[data-testid=section-header-title]');

      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('Section Title');
    });

    it('should not render the subtitle when it is not provided', () => {
      const subtitle = wrapper.find('[data-testid=section-header-subtitle]');

      expect(subtitle.exists()).toBe(false);
    });
  });

  describe('With subtitle', () => {
    beforeEach(() => {
      wrapper = createWrapper({
        title: 'Section Title',
        subtitle: 'Section Subtitle',
      });
    });

    it('should render the subtitle when it is provided', () => {
      const subtitle = wrapper.find('[data-testid=section-header-subtitle]');

      expect(subtitle.exists()).toBe(true);
      expect(subtitle.text()).toBe('Section Subtitle');
    });

    it('should match the snapshot', () => {
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
