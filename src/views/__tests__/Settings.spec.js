import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTestingPinia } from '@pinia/testing';

import { useSettings } from '@/store/modules/settings';

import SettingView from '@/views/Settings/index.vue';
import SettingsHeader from '@/views/Settings/SettingsHeader.vue';
import SettingsProjectOptions from '@/views/Settings/SettingsProjectOptions/index.vue';
import SettingsSectors from '@/views/Settings/SettingsSectors.vue';

import unnnic from '@weni/unnnic-system';

vi.mock('@weni/unnnic-system', () => ({
  default: {
    unnnicCallAlert: vi.fn(),
  },
}));

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    update: vi.fn().mockResolvedValue({}),
  },
}));

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
    vi.clearAllMocks();
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

  describe('Save changes', () => {
    it('should pass hasUnsavedChanges false to header by default', () => {
      const header = wrapper.findComponent(SettingsHeader);
      expect(header.props('hasUnsavedChanges')).toBe(false);
    });

    it('should update hasUnsavedChanges when projectOptions emits unsaved-changes', async () => {
      const projectOptions = wrapper.findComponent(SettingsProjectOptions);
      await projectOptions.vm.$emit('unsaved-changes', true);
      await wrapper.vm.$nextTick();

      const header = wrapper.findComponent(SettingsHeader);
      expect(header.props('hasUnsavedChanges')).toBe(true);
    });

    it('should set isSaving to true during save', async () => {
      const projectOptions = wrapper.findComponent(SettingsProjectOptions);
      projectOptions.vm.saveProjectConfig = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        );

      const savePromise = wrapper.vm.handleSaveChanges();
      expect(wrapper.vm.isSaving).toBe(true);

      await savePromise;
      expect(wrapper.vm.isSaving).toBe(false);
    });

    it('should call saveProjectConfig on projectOptions when saving', async () => {
      const projectOptions = wrapper.findComponent(SettingsProjectOptions);
      const saveSpy = vi.fn().mockResolvedValue();
      projectOptions.vm.saveProjectConfig = saveSpy;

      await wrapper.vm.handleSaveChanges();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should show success alert after successful save', async () => {
      const projectOptions = wrapper.findComponent(SettingsProjectOptions);
      projectOptions.vm.saveProjectConfig = vi.fn().mockResolvedValue();

      await wrapper.vm.handleSaveChanges();

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: wrapper.vm.$t('config_chats.changes_saved'),
          type: 'success',
        },
        seconds: 5,
      });
    });

    it('should show error alert when save fails', async () => {
      const projectOptions = wrapper.findComponent(SettingsProjectOptions);
      projectOptions.vm.saveProjectConfig = vi
        .fn()
        .mockRejectedValue(new Error('API Error'));

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await wrapper.vm.handleSaveChanges();

      expect(unnnic.unnnicCallAlert).toHaveBeenCalledWith({
        props: {
          text: wrapper.vm.$t('config_chats.changes_not_saved'),
          type: 'error',
        },
        seconds: 5,
      });

      consoleSpy.mockRestore();
    });

    it('should reset isSaving after save error', async () => {
      const projectOptions = wrapper.findComponent(SettingsProjectOptions);
      projectOptions.vm.saveProjectConfig = vi
        .fn()
        .mockRejectedValue(new Error('fail'));

      vi.spyOn(console, 'error').mockImplementation(() => {});
      await wrapper.vm.handleSaveChanges();

      expect(wrapper.vm.isSaving).toBe(false);
    });
  });

  it('should match the snapshot', () => {
    expect(wrapper.element).toMatchSnapshot();
  });
});
