import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTestingPinia } from '@pinia/testing';

import SettingsProjectOptions from '@/views/Settings/SettingsProjectOptions/index.vue';
import SettingsProjectOptionsItem from '@/views/Settings/SettingsProjectOptions/SettingsProjectOptionsItem.vue';
import Project from '@/services/api/resources/settings/project';

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    update: vi.fn().mockResolvedValue({}),
  },
}));

const defaultConfig = {
  can_use_ai_transfer: false,
  ai_transfer_criteria: '',
  can_use_bulk_transfer: false,
  filter_offline_agents: false,
  can_use_bulk_close: false,
  can_close_chats_in_queue: false,
  can_use_queue_prioritization: false,
  can_see_timer: false,
};

const createWrapper = (storeOverrides = {}) => {
  return mount(SettingsProjectOptions, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            config: {
              project: {
                name: 'Test Project',
                config: { ...defaultConfig },
                ...storeOverrides.project,
              },
            },
            profile: {
              me: {
                project_permission_role: 1,
              },
              ...storeOverrides.profile,
            },
            featureFlag: {
              featureFlags: {
                active_features: ['weniChatsBulkClose'],
              },
              ...storeOverrides.featureFlag,
            },
          },
        }),
      ],
      stubs: {
        CustomBreakOption: true,
      },
    },
  });
};

describe('SettingsProjectOptions.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = createWrapper();
  });

  describe('Rendering', () => {
    it('should render the component when user is manager', () => {
      expect(wrapper.find('.settings-view__project-options').exists()).toBe(
        true,
      );
    });

    it('should not render when user is not a manager', () => {
      wrapper = createWrapper({
        profile: {
          me: { project_permission_role: 2 },
        },
      });

      expect(wrapper.find('.settings-view__project-options').exists()).toBe(
        false,
      );
    });

    it('should render all toggle switches', () => {
      const items = wrapper.findAllComponents(SettingsProjectOptionsItem);
      expect(items.length).toBeGreaterThanOrEqual(6);
    });

    it('should render the CustomBreakOption component', () => {
      expect(wrapper.find('.project-options__header').exists()).toBe(true);
    });
  });

  describe('AI Transfer Toggle', () => {
    it('should not show textarea when AI transfer is disabled', () => {
      const textarea = wrapper.findComponent({ name: 'UnnnicTextArea' });
      expect(textarea.exists()).toBe(false);
    });

    it('should show textarea when AI transfer is enabled', async () => {
      wrapper.vm.projectConfig.can_use_ai_transfer = true;
      await wrapper.vm.$nextTick();

      const textarea = wrapper.findComponent({ name: 'UnnnicTextArea' });
      expect(textarea.exists()).toBe(true);
    });

    it('should bind textarea to ai_transfer_criteria', async () => {
      wrapper.vm.projectConfig.can_use_ai_transfer = true;
      wrapper.vm.projectConfig.ai_transfer_criteria = 'Test criteria';
      await wrapper.vm.$nextTick();

      const textarea = wrapper.findComponent({ name: 'UnnnicTextArea' });
      expect(textarea.props('modelValue')).toBe('Test criteria');
    });

    it('should set textarea maxLength to 1000', async () => {
      wrapper.vm.projectConfig.can_use_ai_transfer = true;
      await wrapper.vm.$nextTick();

      const textarea = wrapper.findComponent({ name: 'UnnnicTextArea' });
      expect(textarea.props('maxLength')).toBe(1000);
    });
  });

  describe('hasUnsavedChanges', () => {
    it('should return false when no changes are made', () => {
      expect(wrapper.vm.hasUnsavedChanges).toBe(false);
    });

    it('should return true when a toggle is changed', async () => {
      wrapper.vm.projectConfig.can_use_bulk_transfer = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.hasUnsavedChanges).toBe(true);
    });

    it('should return true when AI transfer criteria text is changed', async () => {
      wrapper.vm.projectConfig.ai_transfer_criteria = 'New criteria';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.hasUnsavedChanges).toBe(true);
    });

    it('should return false when changes are reverted', async () => {
      wrapper.vm.projectConfig.can_use_bulk_transfer = true;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.hasUnsavedChanges).toBe(true);

      wrapper.vm.projectConfig.can_use_bulk_transfer = false;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.hasUnsavedChanges).toBe(false);
    });

    it('should emit unsaved-changes event when hasUnsavedChanges changes', async () => {
      wrapper.vm.projectConfig.can_use_bulk_transfer = true;
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('unsaved-changes')).toBeTruthy();
      expect(wrapper.emitted('unsaved-changes')[0]).toEqual([true]);
    });
  });

  describe('saveProjectConfig', () => {
    it('should call Project.update with all config fields', async () => {
      wrapper.vm.projectConfig.can_use_ai_transfer = true;
      wrapper.vm.projectConfig.ai_transfer_criteria = 'When customer asks';
      wrapper.vm.projectConfig.can_use_bulk_transfer = true;
      await wrapper.vm.$nextTick();

      await wrapper.vm.saveProjectConfig();

      expect(Project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          can_use_ai_transfer: true,
          ai_transfer_criteria: 'When customer asks',
          can_use_bulk_transfer: true,
          filter_offline_agents: false,
          can_use_bulk_close: false,
          can_close_chats_in_queue: false,
          can_use_queue_prioritization: false,
          can_see_timer: false,
        }),
      );
    });

    it('should reset initialProjectConfig after save', async () => {
      wrapper.vm.projectConfig.can_use_bulk_transfer = true;
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.hasUnsavedChanges).toBe(true);

      await wrapper.vm.saveProjectConfig();
      expect(wrapper.vm.hasUnsavedChanges).toBe(false);
    });

    it('should propagate errors from Project.update', async () => {
      Project.update.mockRejectedValueOnce(new Error('API Error'));

      await expect(wrapper.vm.saveProjectConfig()).rejects.toThrow('API Error');
    });
  });

  describe('Project config watcher', () => {
    it('should load config from project store', () => {
      expect(wrapper.vm.projectConfig.can_use_ai_transfer).toBe(false);
      expect(wrapper.vm.projectConfig.ai_transfer_criteria).toBe('');
    });

    it('should merge store config with defaults', () => {
      wrapper = createWrapper({
        project: {
          config: {
            can_use_bulk_transfer: true,
            filter_offline_agents: true,
          },
        },
      });

      expect(wrapper.vm.projectConfig.can_use_bulk_transfer).toBe(true);
      expect(wrapper.vm.projectConfig.filter_offline_agents).toBe(true);
      expect(wrapper.vm.projectConfig.can_use_ai_transfer).toBe(false);
    });
  });

  describe('Translation computed properties', () => {
    it('should return correct AI transfer translation based on state', async () => {
      expect(wrapper.vm.configAiTransferTranslation).toBe(
        wrapper.vm.$t(
          'config_chats.project_configs.ai_transfer.switch_inactive',
        ),
      );

      wrapper.vm.projectConfig.can_use_ai_transfer = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.configAiTransferTranslation).toBe(
        wrapper.vm.$t('config_chats.project_configs.ai_transfer.switch_active'),
      );
    });
  });
});
