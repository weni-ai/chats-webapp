import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createTestingPinia } from '@pinia/testing';

import SettingsProjectOptions from '@/views/Settings/SettingsProjectOptions/index.vue';
import SettingsProjectOptionsItem from '@/views/Settings/SettingsProjectOptions/SettingsProjectOptionsItem.vue';
import AiTransferModal from '@/views/Settings/SettingsProjectOptions/AiTransferModal.vue';
import Project from '@/services/api/resources/settings/project';
import agentBuilder from '@/services/api/resources/settings/agentBuilder';

vi.mock('@/services/api/resources/settings/project', () => ({
  default: {
    update: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/services/api/resources/settings/agentBuilder', () => ({
  default: {
    check: vi.fn().mockResolvedValue({ agent_builder: true }),
    getAiTransferConfig: vi
      .fn()
      .mockResolvedValue({ enabled: false, criteria: '' }),
    updateAiTransferConfig: vi.fn().mockResolvedValue({}),
  },
}));

const defaultConfig = {
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
        profile: {
          me: { project_permission_role: 2 },
        },
      });

      expect(wrapper.find('.settings-view__project-options').exists()).toBe(
        false,
      );
    });

    it('should render non-AI toggle switches', () => {
      const items = wrapper.findAllComponents(SettingsProjectOptionsItem);
      expect(items.length).toBeGreaterThanOrEqual(5);
    });

    it('should render the CustomBreakOption component', () => {
      expect(wrapper.find('.project-options__header').exists()).toBe(true);
    });
  });

  describe('Agent Builder / AI Transfer', () => {
    it('should call agentBuilder.check on mount', () => {
      expect(agentBuilder.check).toHaveBeenCalled();
    });

    it('should show AI transfer switch when hasAgentBuilder is true', async () => {
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.hasAgentBuilder).toBe(true);
      expect(
        wrapper.find('.project-options__ai-transfer').exists(),
      ).toBe(true);
    });

    it('should hide AI transfer section when agent_builder is false', async () => {
      agentBuilder.check.mockResolvedValueOnce({ agent_builder: false });

      wrapper = createWrapper();
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.hasAgentBuilder).toBe(false);
      expect(
        wrapper.find('.project-options__ai-transfer').exists(),
      ).toBe(false);
    });

    it('should fetch AI transfer config when agent_builder is true', async () => {
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();

      expect(agentBuilder.getAiTransferConfig).toHaveBeenCalled();
    });

    it('should not fetch AI transfer config when agent_builder is false', async () => {
      agentBuilder.check.mockResolvedValueOnce({ agent_builder: false });
      agentBuilder.getAiTransferConfig.mockClear();

      wrapper = createWrapper();
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(agentBuilder.getAiTransferConfig).not.toHaveBeenCalled();
    });

    it('should open modal when toggling AI transfer ON', async () => {
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();

      wrapper.vm.handleAiTransferToggle(true);
      expect(wrapper.vm.showAiTransferModal).toBe(true);
    });

    it('should not set enabled when toggling AI transfer ON (waits for modal save)', async () => {
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();

      wrapper.vm.handleAiTransferToggle(true);
      expect(wrapper.vm.aiTransferConfig.enabled).toBe(false);
    });

    it('should disable AI transfer when toggling OFF', async () => {
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();

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
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

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
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      const editBtn = wrapper.find('[data-testid="ai-transfer-edit-btn"]');
      await editBtn.trigger('click');

      expect(wrapper.vm.showAiTransferModal).toBe(true);
    });

    it('should update aiTransferConfig on modal saved event', async () => {
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();

      wrapper.vm.handleAiTransferSaved('New criteria text');

      expect(wrapper.vm.aiTransferConfig.enabled).toBe(true);
      expect(wrapper.vm.aiTransferConfig.criteria).toBe('New criteria text');
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
        project: {
          config: {
            can_use_bulk_transfer: true,
            filter_offline_agents: true,
          },
        },
      });

      expect(wrapper.vm.projectConfig.can_use_bulk_transfer).toBe(true);
      expect(wrapper.vm.projectConfig.filter_offline_agents).toBe(true);
    });
  });

  describe('Translation computed properties', () => {
    it('should return correct AI transfer translation based on state', async () => {
      await vi.dynamicImportSettled();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.configAiTransferTranslation).toBe(
        wrapper.vm.$t(
          'config_chats.project_configs.ai_transfer.switch_inactive',
        ),
      );

      wrapper.vm.aiTransferConfig.enabled = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.configAiTransferTranslation).toBe(
        wrapper.vm.$t(
          'config_chats.project_configs.ai_transfer.switch_active',
        ),
      );
    });
  });
});
