import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTestingPinia } from '@pinia/testing';

import SettingsProjectOptions from '@/views/Settings/SettingsProjectOptions/index.vue';
import SettingsProjectOptionsItem from '@/views/Settings/SettingsProjectOptions/SettingsProjectOptionsItem.vue';
import Project from '@/services/api/resources/settings/project';
import agentBuilder from '@/services/api/resources/settings/agentBuilder';

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    update: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/services/api/resources/settings/agentBuilder', () => ({
  default: {
    getAiTransferConfig: vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ enabled: false, criteria: '' }),
      ),
    updateAiTransferConfig: vi.fn().mockResolvedValue({}),
  },
}));

const defaultConfig = {
  can_use_bulk_transfer: false,
  filter_offline_agents: false,
  can_use_bulk_close: false,
  can_close_chats_in_queue: false,
  can_use_bulk_take: false,
  can_use_queue_prioritization: false,
  can_see_timer: false,
  can_see_waiting_rooms_count: true,
};

const createWrapper = ({
  storeOverrides = {},
  activeFeatures = ['weniChatsBulkClose'],
  projectConfig = {},
} = {}) => {
  return mount(SettingsProjectOptions, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            config: {
              project: {
                name: 'Test Project',
                config: { ...defaultConfig, ...projectConfig },
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
                active_features: activeFeatures,
              },
              ...storeOverrides.featureFlag,
            },
          },
        }),
      ],
      stubs: {
        CustomBreakOption: true,
        AiTransferModal: true,
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
        storeOverrides: {
          profile: {
            me: { project_permission_role: 2 },
          },
        },
      });

      expect(wrapper.find('.settings-view__project-options').exists()).toBe(
        false,
      );
    });

    it('should render the CustomBreakOption component inside the header', () => {
      const header = wrapper.find('.project-options__header');
      expect(header.exists()).toBe(true);
      expect(header.findComponent({ name: 'CustomBreakOption' }).exists()).toBe(
        true,
      );
    });

    it('should render toggle switches from optionsItems', () => {
      const items = wrapper.findAllComponents(SettingsProjectOptionsItem);
      expect(items.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('optionsItems computed', () => {
    it('should include ai_transfer item when hasAgentBuilder is true', async () => {
      await flushPromises();

      const aiItem = wrapper.vm.optionsItems.find(
        (item) => item.key === 'ai_transfer',
      );
      expect(aiItem).toBeTruthy();
      expect(aiItem.type).toBe('flag-prompt');
    });

    it('should exclude ai_transfer item when hasAgentBuilder is false', async () => {
      agentBuilder.getAiTransferConfig.mockRejectedValueOnce(
        new Error('Not found'),
      );

      wrapper = createWrapper();
      await flushPromises();

      const aiItem = wrapper.vm.optionsItems.find(
        (item) => item.key === 'ai_transfer',
      );
      expect(aiItem).toBeUndefined();
    });

    it('should include bulk_close when feature flag is active', () => {
      wrapper = createWrapper({ activeFeatures: ['weniChatsBulkClose'] });

      const item = wrapper.vm.optionsItems.find(
        (i) => i.key === 'can_use_bulk_close',
      );
      expect(item).toBeTruthy();
    });

    it('should exclude bulk_close when feature flag is inactive', () => {
      wrapper = createWrapper({ activeFeatures: [] });

      const item = wrapper.vm.optionsItems.find(
        (i) => i.key === 'can_use_bulk_close',
      );
      expect(item).toBeUndefined();
    });

    it('should include bulk_take when feature flag is active', () => {
      wrapper = createWrapper({ activeFeatures: ['weniChatsBulkTake'] });

      const item = wrapper.vm.optionsItems.find(
        (i) => i.key === 'can_use_bulk_take',
      );
      expect(item).toBeTruthy();
    });

    it('should exclude bulk_take when feature flag is inactive', () => {
      wrapper = createWrapper({ activeFeatures: [] });

      const item = wrapper.vm.optionsItems.find(
        (i) => i.key === 'can_use_bulk_take',
      );
      expect(item).toBeUndefined();
    });

    it('should always include simple flag items without feature flags', () => {
      wrapper = createWrapper({ activeFeatures: [] });

      const alwaysVisibleKeys = [
        'can_use_bulk_transfer',
        'filter_offline_agents',
        'can_close_chats_in_queue',
        'can_use_queue_prioritization',
        'can_see_timer',
        'can_see_waiting_rooms_count',
      ];

      alwaysVisibleKeys.forEach((key) => {
        const item = wrapper.vm.optionsItems.find((i) => i.key === key);
        expect(item).toBeTruthy();
        expect(item.type).toBe('flag');
      });
    });

    it('should have prompt config on flag-prompt items', async () => {
      await flushPromises();

      const aiItem = wrapper.vm.optionsItems.find(
        (item) => item.key === 'ai_transfer',
      );
      expect(aiItem.prompt).toBeDefined();
      expect(aiItem.prompt.maxLength).toBe(1000);
      expect(aiItem.onToggle).toBeTypeOf('function');
      expect(aiItem.onEdit).toBeTypeOf('function');
    });
  });

  describe('Agent Builder / AI Transfer', () => {
    it('should call agentBuilder.getAiTransferConfig on mount', async () => {
      await flushPromises();
      expect(agentBuilder.getAiTransferConfig).toHaveBeenCalled();
    });

    it('should show AI transfer switch when hasAgentBuilder is true', async () => {
      await flushPromises();

      expect(wrapper.vm.hasAgentBuilder).toBe(true);
      expect(wrapper.find('.project-options__ai-transfer').exists()).toBe(true);
    });

    it('should hide AI transfer section when getAiTransferConfig fails', async () => {
      agentBuilder.getAiTransferConfig.mockRejectedValueOnce(
        new Error('Not found'),
      );

      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.hasAgentBuilder).toBe(false);
      expect(wrapper.find('.project-options__ai-transfer').exists()).toBe(
        false,
      );
    });

    it('should fetch AI transfer config on mount', async () => {
      await flushPromises();

      expect(agentBuilder.getAiTransferConfig).toHaveBeenCalled();
    });

    it('should set hasAgentBuilder to false when getAiTransferConfig fails', async () => {
      agentBuilder.getAiTransferConfig.mockRejectedValueOnce(
        new Error('Not found'),
      );

      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.hasAgentBuilder).toBe(false);
    });

    it('should open modal when toggling AI transfer ON', async () => {
      await flushPromises();

      wrapper.vm.handleAiTransferToggle(true);
      expect(wrapper.vm.showAiTransferModal).toBe(true);
    });

    it('should not set enabled when toggling AI transfer ON (waits for modal save)', async () => {
      await flushPromises();

      wrapper.vm.handleAiTransferToggle(true);
      expect(wrapper.vm.aiTransferConfig.enabled).toBe(false);
    });

    it('should disable AI transfer when toggling OFF', async () => {
      await flushPromises();

      wrapper.vm.aiTransferConfig.enabled = true;
      wrapper.vm.handleAiTransferToggle(false);

      expect(wrapper.vm.aiTransferConfig.enabled).toBe(false);
      expect(agentBuilder.updateAiTransferConfig).toHaveBeenCalledWith({
        enabled: false,
        criteria: '',
      });
    });

    it('should show inline textarea and edit button when AI transfer is enabled', async () => {
      agentBuilder.getAiTransferConfig.mockResolvedValueOnce({
        enabled: true,
        criteria: 'Some criteria text',
      });

      wrapper = createWrapper();
      await flushPromises();

      expect(wrapper.vm.aiTransferConfig.enabled).toBe(true);
      expect(
        wrapper.find('[data-testid="ai-transfer-criteria-display"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="ai-transfer-edit-btn"]').exists(),
      ).toBe(true);
    });

    it('should open modal when edit button is clicked', async () => {
      agentBuilder.getAiTransferConfig.mockResolvedValueOnce({
        enabled: true,
        criteria: 'Some criteria',
      });

      wrapper = createWrapper();
      await flushPromises();

      const editBtn = wrapper.find('[data-testid="ai-transfer-edit-btn"]');
      await editBtn.trigger('click');

      expect(wrapper.vm.showAiTransferModal).toBe(true);
    });

    it('should update aiTransferConfig on modal saved event', async () => {
      await flushPromises();

      wrapper.vm.handleAiTransferSaved('New criteria text');

      expect(wrapper.vm.aiTransferConfig.enabled).toBe(true);
      expect(wrapper.vm.aiTransferConfig.criteria).toBe('New criteria text');
    });

    it('should increment switchResetKey when modal closes without saving', async () => {
      await flushPromises();

      expect(wrapper.vm.switchResetKey).toBe(0);
      expect(wrapper.vm.aiTransferConfig.enabled).toBe(false);

      wrapper.vm.showAiTransferModal = true;
      await wrapper.vm.$nextTick();

      wrapper.vm.showAiTransferModal = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.switchResetKey).toBe(1);
    });

    it('should not increment switchResetKey when modal closes after saving', async () => {
      await flushPromises();

      wrapper.vm.handleAiTransferToggle(true);
      wrapper.vm.handleAiTransferSaved('Criteria');
      await wrapper.vm.$nextTick();

      wrapper.vm.showAiTransferModal = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.switchResetKey).toBe(0);
    });
  });

  describe('Auto-save (projectConfig watcher)', () => {
    it('should call Project.update when projectConfig changes', async () => {
      wrapper.vm.projectConfig.can_use_bulk_transfer = true;
      await wrapper.vm.$nextTick();

      expect(Project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          can_use_bulk_transfer: true,
        }),
      );
    });

    it('should load config from project store', () => {
      expect(wrapper.vm.projectConfig.can_use_bulk_transfer).toBe(false);
    });

    it('should merge store config with defaults', () => {
      wrapper = createWrapper({
        projectConfig: {
          can_use_bulk_transfer: true,
          filter_offline_agents: true,
        },
      });

      expect(wrapper.vm.projectConfig.can_use_bulk_transfer).toBe(true);
      expect(wrapper.vm.projectConfig.filter_offline_agents).toBe(true);
    });
  });

  describe('Translation computed properties', () => {
    it('should return correct AI transfer translation based on state', async () => {
      await flushPromises();

      expect(wrapper.vm.configAiTransferTranslation).toBe(
        wrapper.vm.$t(
          'config_chats.project_configs.ai_transfer.switch_inactive',
        ),
      );

      wrapper.vm.aiTransferConfig.enabled = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.configAiTransferTranslation).toBe(
        wrapper.vm.$t('config_chats.project_configs.ai_transfer.switch_active'),
      );
    });

    it('should return correct bulk transfer translation based on state', () => {
      expect(wrapper.vm.configBulkTransferTranslation).toBe(
        wrapper.vm.$t(
          'config_chats.project_configs.bulk_transfer.switch_inactive',
        ),
      );
    });

    it('should return correct bulk take translation based on state', () => {
      wrapper = createWrapper({
        activeFeatures: ['weniChatsBulkTake'],
        projectConfig: { can_use_bulk_take: true },
      });

      expect(wrapper.vm.configBulkTakeTranslation).toBe(
        wrapper.vm.$t('config_chats.project_configs.bulk_take.switch_active'),
      );
    });
  });

  describe('Feature flags', () => {
    it('should compute isBulkTakeFeatureEnabled correctly', () => {
      wrapper = createWrapper({
        activeFeatures: ['weniChatsBulkTake'],
      });

      expect(wrapper.vm.isBulkTakeFeatureEnabled).toBe(true);
    });

    it('should compute isBulkTakeFeatureEnabled as false when flag is missing', () => {
      wrapper = createWrapper({ activeFeatures: [] });

      expect(wrapper.vm.isBulkTakeFeatureEnabled).toBe(false);
    });

    it('should compute isBulkCloseFeatureEnabled correctly', () => {
      wrapper = createWrapper({
        activeFeatures: ['weniChatsBulkClose'],
      });

      expect(wrapper.vm.isBulkCloseFeatureEnabled).toBe(true);
    });

    it('should compute isBulkCloseFeatureEnabled as false when flag is missing', () => {
      wrapper = createWrapper({ activeFeatures: [] });

      expect(wrapper.vm.isBulkCloseFeatureEnabled).toBe(false);
    });
  });
});
