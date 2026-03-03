<template>
  <section
    v-if="isUserManager && projectConfig"
    class="settings-view__project-options"
  >
    <section class="project-options__header">
      <SettingsSectionHeader
        :title="$t('config_chats.project_configs.title')"
      />
      <CustomBreakOption />
    </section>

    <section class="project-options__items__config">
      <section class="project-options__ai-transfer">
        <SettingsProjectOptionsItem
          v-model="projectConfig.can_use_ai_transfer"
          :name="configAiTransferTranslation"
        />
        <UnnnicTextArea
          v-if="projectConfig.can_use_ai_transfer"
          v-model="projectConfig.ai_transfer_criteria"
          :label="$t('config_chats.project_configs.ai_transfer.textarea_label')"
          :placeholder="
            $t('config_chats.project_configs.ai_transfer.textarea_placeholder')
          "
          :maxLength="1000"
        />
      </section>

      <SettingsProjectOptionsItem
        v-model="projectConfig.can_use_bulk_transfer"
        :name="configBulkTransferTranslation"
      />
      <SettingsProjectOptionsItem
        v-model="projectConfig.filter_offline_agents"
        :name="configBlockTransferToOffAgentsTranslation"
      />
      <SettingsProjectOptionsItem
        v-if="isBulkCloseFeatureEnabled"
        v-model="projectConfig.can_use_bulk_close"
        :name="configBulkCloseTranslation"
      />
      <SettingsProjectOptionsItem
        v-model="projectConfig.can_close_chats_in_queue"
        :name="configBlockCloseChatsInQueueTranslation"
      />
      <!-- TODO: Future feature - bulk take -->
      <!-- <SettingsProjectOptionsItem
        v-model="projectConfig.can_use_bulk_take"
        :name="configBulkTakeTranslation"
      /> -->
      <SettingsProjectOptionsItem
        v-model="projectConfig.can_use_queue_prioritization"
        :name="configQueuePrioritizationTranslation"
      />
      <SettingsProjectOptionsItem
        v-model="projectConfig.can_see_timer"
        :name="configShowAgentStatusCountTimer"
      />
    </section>
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import Project from '@/services/api/resources/settings/project';

import SettingsProjectOptionsItem from './SettingsProjectOptionsItem.vue';
import SettingsSectionHeader from '../SettingsSectionHeader.vue';
import CustomBreakOption from './CustomBreakOption.vue';

export default {
  name: 'SettingsProjectOptions',

  components: {
    SettingsSectionHeader,
    SettingsProjectOptionsItem,
    CustomBreakOption,
  },

  emits: ['unsaved-changes'],

  data() {
    return {
      projectConfig: {
        can_use_ai_transfer: false,
        ai_transfer_criteria: '',
        can_use_bulk_transfer: false,
        filter_offline_agents: false,
        can_use_bulk_close: false,
        can_close_chats_in_queue: false,
        // can_use_bulk_take: false, // TODO: Future feature - bulk take
        can_use_queue_prioritization: false,
        can_see_timer: false,
      },
      initialProjectConfig: null,
    };
  },

  computed: {
    ...mapState(useConfig, ['project']),
    ...mapState(useProfile, ['me']),
    ...mapState(useFeatureFlag, ['featureFlags']),

    isBulkCloseFeatureEnabled() {
      return this.featureFlags.active_features?.includes('weniChatsBulkClose');
    },

    isUserManager() {
      const ROLE_MANAGER = 1;
      return this.me.project_permission_role === ROLE_MANAGER;
    },

    hasUnsavedChanges() {
      if (!this.initialProjectConfig) return false;
      return (
        JSON.stringify(this.projectConfig) !==
        JSON.stringify(this.initialProjectConfig)
      );
    },

    configAiTransferTranslation() {
      const canAiTransfer = this.projectConfig.can_use_ai_transfer;
      return this.$t(
        `config_chats.project_configs.ai_transfer.switch_${
          canAiTransfer ? 'active' : 'inactive'
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
    // TODO: Future feature - bulk take
    // configBulkTakeTranslation() {
    //   const canBulkTake = this.projectConfig.can_use_bulk_take;
    //   return this.$t(
    //     `config_chats.project_configs.bulk_take.switch_${
    //       canBulkTake ? 'active' : 'inactive'
    //     }`,
    //   );
    // },
    configQueuePrioritizationTranslation() {
      const canQueuePrioritization =
        this.projectConfig.can_use_queue_prioritization;
      return this.$t(
        `config_chats.project_configs.queue_prioritization.switch_${
          canQueuePrioritization ? 'active' : 'inactive'
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
  },

  watch: {
    project: {
      immediate: true,
      handler(newProject) {
        if (newProject.config) {
          this.projectConfig = { ...this.projectConfig, ...newProject.config };
          this.initialProjectConfig = JSON.parse(
            JSON.stringify(this.projectConfig),
          );
        }
      },
    },
    hasUnsavedChanges(value) {
      this.$emit('unsaved-changes', value);
    },
  },

  methods: {
    async saveProjectConfig() {
      const {
        can_use_ai_transfer,
        ai_transfer_criteria,
        can_use_bulk_transfer,
        filter_offline_agents,
        can_use_bulk_close,
        can_close_chats_in_queue,
        // can_use_bulk_take, // TODO: Future feature - bulk take
        can_use_queue_prioritization,
        can_see_timer,
      } = this.projectConfig;

      await Project.update({
        can_use_ai_transfer,
        ai_transfer_criteria,
        can_use_bulk_transfer,
        filter_offline_agents,
        can_use_bulk_close,
        can_close_chats_in_queue,
        // can_use_bulk_take, // TODO: Future feature - bulk take
        can_use_queue_prioritization,
        can_see_timer,
      });

      this.initialProjectConfig = JSON.parse(
        JSON.stringify(this.projectConfig),
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-view__project-options {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-ant;

  .project-options__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
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
  }
}
</style>
