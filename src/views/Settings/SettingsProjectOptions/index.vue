<template>
  <section
    v-if="isUserManager && projectConfig"
    class="settings-view__project-options"
  >
    <section class="project-options__header">
      <p class="project-options__header__title">
        {{ $t('config_chats.project_configs.title') }}
      </p>
    </section>

    <section class="project-options__items__config">
      <template
        v-for="item in optionsItems"
        :key="item.key"
      >
        <section
          v-if="item.type === 'flag-prompt'"
          class="project-options__ai-transfer"
        >
          <SettingsProjectOptionsItem
            :key="'ai-transfer-' + switchResetKey"
            :modelValue="item.flag"
            :name="item.name"
            @update:model-value="item.onToggle"
          />

          <template v-if="item.flag">
            <div class="project-options__ai-transfer__inline">
              <UnnnicTextArea
                :modelValue="item.prompt.value"
                class="project-options__ai-transfer__criteria"
                :label="item.prompt.label"
                :placeholder="item.prompt.placeholder"
                :maxLength="item.prompt.maxLength"
                disabled
                data-testid="ai-transfer-criteria-display"
              />
              <UnnnicButton
                class="project-options__ai-transfer__edit-btn"
                type="tertiary"
                iconCenter="edit_square"
                size="small"
                data-testid="ai-transfer-edit-btn"
                @click="item.onEdit"
              />
            </div>
          </template>
        </section>

        <SettingsProjectOptionsItem
          v-else
          v-model="projectConfig[item.key]"
          :name="item.name"
          :hint="item.hint"
        />
      </template>
    </section>

    <AiTransferModal
      v-model="showAiTransferModal"
      :initialCriteria="aiTransferConfig.criteria"
      @saved="handleAiTransferSaved"
    />
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import Project from '@/services/api/resources/settings/project';
import agentBuilder from '@/services/api/resources/settings/agentBuilder';

import SettingsProjectOptionsItem from './SettingsProjectOptionsItem.vue';

import AiTransferModal from './AiTransferModal.vue';

export default {
  name: 'SettingsProjectOptions',

  components: {
    SettingsProjectOptionsItem,
    AiTransferModal,
  },

  data() {
    return {
      projectConfig: {
        can_use_bulk_transfer: false,
        filter_offline_agents: false,
        can_use_bulk_close: false,
        can_close_chats_in_queue: false,
        can_use_bulk_take: false,
        can_use_queue_prioritization: false,
        can_see_timer: false,
        can_see_waiting_rooms_count: true,
        can_use_name_sector_in_rooms: false,
      },
      hasAgentBuilder: false,
      aiTransferConfig: {
        enabled: false,
        criteria: '',
      },
      showAiTransferModal: false,
      switchResetKey: 0,
    };
  },

  computed: {
    ...mapState(useConfig, ['project']),
    ...mapState(useProfile, ['me']),
    ...mapState(useFeatureFlag, ['featureFlags']),

    isBulkCloseFeatureEnabled() {
      return this.featureFlags.active_features?.includes('weniChatsBulkClose');
    },

    isBulkTakeFeatureEnabled() {
      return this.featureFlags.active_features?.includes('weniChatsBulkTake');
    },

    isUserManager() {
      const ROLE_MANAGER = 1;
      return this.me.project_permission_role === ROLE_MANAGER;
    },

    configAiTransferTranslation() {
      const enabled = this.aiTransferConfig.enabled;
      return this.$t(
        `config_chats.project_configs.ai_transfer.switch_${
          enabled ? 'active' : 'inactive'
        }`,
      );
    },
    configBulkTransferTranslation() {
      const canBulkTransfer = this.projectConfig.can_use_bulk_transfer;
      return this.$t(
        `config_chats.project_configs.bulk_transfer.switch_${
          canBulkTransfer ? 'active' : 'inactive'
        }`,
      );
    },
    configBlockTransferToOffAgentsTranslation() {
      const filterOfflineAgents = this.projectConfig.filter_offline_agents;
      return this.$t(
        `config_chats.project_configs.block_transfer_to_off_agents.switch_${
          filterOfflineAgents ? 'active' : 'inactive'
        }`,
      );
    },
    configBulkCloseTranslation() {
      const canBulkClose = this.projectConfig.can_use_bulk_close;
      return this.$t(
        `config_chats.project_configs.bulk_close.switch_${
          canBulkClose ? 'active' : 'inactive'
        }`,
      );
    },
    configBlockCloseChatsInQueueTranslation() {
      const canCloseChatsInQueue = this.projectConfig.can_close_chats_in_queue;
      return this.$t(
        `config_chats.project_configs.block_close_chats_in_queue.switch_${
          canCloseChatsInQueue ? 'active' : 'inactive'
        }`,
      );
    },
    configBulkTakeTranslation() {
      const canBulkTake = this.projectConfig.can_use_bulk_take;
      return this.$t(
        `config_chats.project_configs.bulk_take.switch_${
          canBulkTake ? 'active' : 'inactive'
        }`,
      );
    },
    configShowAgentStatusCountTimer() {
      const showAgentStatusCountTimer = this.projectConfig.can_see_timer;
      return this.$t(
        `config_chats.project_configs.show_agent_status_count_timer.switch_${
          showAgentStatusCountTimer ? 'active' : 'inactive'
        }`,
      );
    },

    optionsItems() {
      const items = [
        {
          key: 'ai_transfer',
          type: 'flag-prompt',
          visible: this.hasAgentBuilder,
          flag: this.aiTransferConfig.enabled,
          name: this.configAiTransferTranslation,
          prompt: {
            value: this.aiTransferConfig.criteria,
            label: this.$t(
              'config_chats.project_configs.ai_transfer.textarea_label',
            ),
            placeholder: this.$t(
              'config_chats.project_configs.ai_transfer.textarea_placeholder',
            ),
            maxLength: 1000,
          },
          onToggle: this.handleAiTransferToggle,
          onEdit: this.openAiTransferModal,
        },
        {
          key: 'can_use_bulk_transfer',
          type: 'flag',
          visible: true,
          name: this.configBulkTransferTranslation,
        },
        {
          key: 'filter_offline_agents',
          type: 'flag',
          visible: true,
          name: this.configBlockTransferToOffAgentsTranslation,
        },
        {
          key: 'can_use_bulk_close',
          type: 'flag',
          visible: this.isBulkCloseFeatureEnabled,
          name: this.configBulkCloseTranslation,
        },
        {
          key: 'can_close_chats_in_queue',
          type: 'flag',
          visible: true,
          name: this.configBlockCloseChatsInQueueTranslation,
        },
        {
          key: 'can_use_bulk_take',
          type: 'flag',
          visible: this.isBulkTakeFeatureEnabled,
          name: this.configBulkTakeTranslation,
        },
        {
          key: 'can_use_queue_prioritization',
          type: 'flag',
          visible: true,
          name: this.$t(
            'config_chats.project_configs.queue_prioritization.switch_label',
          ),
          hint: this.$t(
            'config_chats.project_configs.queue_prioritization.hint',
          ),
        },
        {
          key: 'can_see_waiting_rooms_count',
          type: 'flag',
          visible: true,
          name: this.$t(
            'config_chats.project_configs.show_waiting_rooms_count.switch_label',
          ),
        },
        {
          key: 'can_use_name_sector_in_rooms',
          type: 'flag',
          visible: true,
          name: this.$t(
            'config_chats.project_configs.use_name_sector_in_rooms.switch_label',
          ),
        },
      ];

      return items.filter((item) => item.visible);
    },
  },

  watch: {
    project: {
      immediate: true,
      handler(newProject) {
        if (newProject.config) {
          const config = {
            ...newProject.config,
            can_see_waiting_rooms_count:
              newProject.config.can_see_waiting_rooms_count === undefined
                ? true
                : newProject.config.can_see_waiting_rooms_count,
          };
          this.projectConfig = config;
        }
      },
    },
    projectConfig: {
      deep: true,
      handler() {
        this.updateProjectConfig();
      },
    },
    showAiTransferModal(newVal) {
      if (!newVal && !this.aiTransferConfig.enabled) {
        this.switchResetKey += 1;
      }
    },
  },

  async mounted() {
    await this.getAiTransferConfig();
  },

  methods: {
    async getAiTransferConfig() {
      try {
        const config = await agentBuilder.getAiTransferConfig();
        this.aiTransferConfig = config;
        this.hasAgentBuilder = true;
      } catch {
        this.hasAgentBuilder = false;
      }
    },

    handleAiTransferToggle(value) {
      if (value && !this.aiTransferConfig.enabled) {
        this.showAiTransferModal = true;
      } else if (!value) {
        this.aiTransferConfig.enabled = false;
        this.aiTransferConfig.criteria = '';
        agentBuilder.updateAiTransferConfig({
          enabled: false,
          criteria: '',
        });
      }
    },

    openAiTransferModal() {
      this.showAiTransferModal = true;
    },

    handleAiTransferSaved(criteria) {
      this.aiTransferConfig.enabled = true;
      this.aiTransferConfig.criteria = criteria;
    },

    async updateProjectConfig() {
      const {
        can_use_bulk_transfer,
        filter_offline_agents,
        can_use_bulk_close,
        can_close_chats_in_queue,
        can_use_bulk_take,
        can_use_queue_prioritization,
        can_see_timer,
        can_see_waiting_rooms_count,
        can_use_name_sector_in_rooms,
      } = this.projectConfig;

      Project.update({
        can_use_bulk_transfer,
        filter_offline_agents,
        can_use_bulk_close,
        can_close_chats_in_queue,
        can_use_bulk_take,
        can_use_queue_prioritization,
        can_see_timer,
        can_see_waiting_rooms_count,
        can_use_name_sector_in_rooms,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-view__project-options {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;

  .project-options__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    &__title {
      font: $unnnic-font-display-3;
      color: $unnnic-color-fg-emphasized;
    }
  }

  .project-options__items__config {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
  }

  .project-options__ai-transfer {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;

    &__inline {
      display: flex;
      align-items: flex-start;
      gap: $unnnic-space-2;
    }

    &__edit-btn {
      align-self: flex-end;
      margin-bottom: $unnnic-space-4;
    }

    &__criteria {
      width: 100%;
    }
  }
}
</style>
