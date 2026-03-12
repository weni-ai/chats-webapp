import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import SettingsProjectOptions from '../index.vue';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { useFeatureFlag } from '@/store/modules/featureFlag';

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    update: vi.fn(),
  },
}));

describe('SettingsProjectOptions', () => {
  let pinia;

  const createWrapper = ({ activeFeatures = [], projectConfig = {} } = {}) => {
    pinia = createTestingPinia({ stubActions: false });
    setActivePinia(pinia);

    const configStore = useConfig();
    const profileStore = useProfile();
    const featureFlagStore = useFeatureFlag();

    profileStore.me = { project_permission_role: 1 };

    configStore.project = {
      config: {
        can_use_bulk_transfer: false,
        filter_offline_agents: false,
        can_use_bulk_close: false,
        can_close_chats_in_queue: false,
        can_use_bulk_take: false,
        can_use_queue_prioritization: false,
        can_see_timer: false,
        ...projectConfig,
      },
    };

    featureFlagStore.featureFlags = {
      active_features: activeFeatures,
    };

    return mount(SettingsProjectOptions, {
      global: {
        plugins: [pinia],
        stubs: {
          SettingsProjectOptionsItem: {
            template:
              '<div :data-name="name" data-testid="settings-item"><slot /></div>',
            props: ['modelValue', 'name'],
          },
          SettingsSectionHeader: true,
          CustomBreakOption: true,
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bulk take switch', () => {
    it('should show bulk take switch when feature flag is active', () => {
      const wrapper = createWrapper({
        activeFeatures: ['weniChatsBulkTake'],
      });

      const items = wrapper.findAll('[data-testid="settings-item"]');
      const bulkTakeItem = items.find((item) =>
        item.attributes('data-name')?.includes('Take over chats in bulk'),
      );

      expect(bulkTakeItem).toBeTruthy();
    });

    it('should hide bulk take switch when feature flag is inactive', () => {
      const wrapper = createWrapper({
        activeFeatures: [],
      });

      const items = wrapper.findAll('[data-testid="settings-item"]');
      const bulkTakeItem = items.find((item) =>
        item.attributes('data-name')?.includes('Take over chats in bulk'),
      );

      expect(bulkTakeItem).toBeUndefined();
    });

    it('should show bulk close switch when bulk close feature flag is active', () => {
      const wrapper = createWrapper({
        activeFeatures: ['weniChatsBulkClose'],
      });

      const items = wrapper.findAll('[data-testid="settings-item"]');
      const bulkCloseItem = items.find((item) =>
        item.attributes('data-name')?.includes('End chats in bulk'),
      );

      expect(bulkCloseItem).toBeTruthy();
    });

    it('should compute isBulkTakeFeatureEnabled correctly', () => {
      const wrapper = createWrapper({
        activeFeatures: ['weniChatsBulkTake'],
      });

      expect(wrapper.vm.isBulkTakeFeatureEnabled).toBe(true);
    });

    it('should compute isBulkTakeFeatureEnabled as false when flag is missing', () => {
      const wrapper = createWrapper({
        activeFeatures: [],
      });

      expect(wrapper.vm.isBulkTakeFeatureEnabled).toBe(false);
    });

    it('should return same translation for active and inactive bulk take', () => {
      const wrapperActive = createWrapper({
        activeFeatures: ['weniChatsBulkTake'],
        projectConfig: { can_use_bulk_take: true },
      });

      const wrapperInactive = createWrapper({
        activeFeatures: ['weniChatsBulkTake'],
        projectConfig: { can_use_bulk_take: false },
      });

      expect(wrapperActive.vm.configBulkTakeTranslation).toBe(
        'Take over chats in bulk',
      );
      expect(wrapperInactive.vm.configBulkTakeTranslation).toBe(
        'Take over chats in bulk',
      );
    });
  });
});
