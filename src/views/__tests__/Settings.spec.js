import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTestingPinia } from '@pinia/testing';

import { useSettings } from '@/store/modules/settings';

import SettingView from '@/views/Settings/index.vue';
import SettingsHeader from '@/views/Settings/SettingsHeader.vue';
import SettingsProjectOptions from '@/views/Settings/SettingsProjectOptions/index.vue';
import SettingsSectors from '@/views/Settings/SettingsSectors.vue';

const createWrapper = (props = {}) => {
  return mount(SettingView, {
    props,
    global: {
      plugins: [createTestingPinia()],
    },
  });
};

describe('SettingView.vue', () => {
  let wrapper;
  let store;
  let settingsView;

  const updateWrapperProperty = (property, value) =>
    Object.defineProperty(wrapper.element, property, {
      value,
      writable: true,
    });

  beforeEach(() => {
    wrapper = createWrapper();
    store = useSettings();
    settingsView = wrapper.find('[data-testid=settings-view]');

    updateWrapperProperty('scrollTop', 0);
    updateWrapperProperty('clientHeight', 500);
    updateWrapperProperty('scrollHeight', 1000);
  });

  it('should render SettingsHeader, SettingsProjectOptions, and SettingsSectors components', () => {
    expect(wrapper.findComponent(SettingsHeader).exists()).toBe(true);
    expect(wrapper.findComponent(SettingsProjectOptions).exists()).toBe(true);
    expect(wrapper.findComponent(SettingsSectors).exists()).toBe(true);
  });

  it('should call getSectors on beforeMount', () => {
    expect(store.getSectors).toHaveBeenCalled();
  });

  it('should not call getSectors if not scrolling to the bottom', async () => {
    const getSectorsMock = vi.spyOn(store, 'getSectors');

    await settingsView.trigger('scroll');

    expect(getSectorsMock).toHaveBeenCalledTimes(0);
  });

  it('should match the snapshot', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
