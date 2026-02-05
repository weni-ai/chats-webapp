<template>
  <section
    v-if="isUserManager && projectConfig"
    class="settings-view__project-options"
  >
    <section class="project-options__items">
      <SettingsSectionHeader
        :title="$t('config_chats.project_configs.title')"
      />
      <section class="project-options__items__config">
        <SettingsProjectOptionsItem
          v-model="projectConfig.can_use_bulk_transfer"
          :name="configBulkTransferTranslation"
          :tooltip="$t('config_chats.project_configs.bulk_transfer.tooltip')"
        />
        <SettingsProjectOptionsItem
          v-model="projectConfig.can_use_queue_prioritization"
          :name="configQueuePrioritizationTranslation"
          :tooltip="
            $t('config_chats.project_configs.queue_prioritization.tooltip')
          "
        />
        <SettingsProjectOptionsItem
          v-model="projectConfig.filter_offline_agents"
          :name="configBlockTransferToOffAgentsTranslation"
        />
        <SettingsProjectOptionsItem
          v-model="projectConfig.can_see_timer"
          :name="configShowAgentStatusCountTimer"
        />
        <SettingsProjectOptionsItem
          v-model="projectConfig.can_close_chats_in_queue"
          :name="configCloseChatsInQueue"
        />
      </section>
    </section>
    <section class="project-options__items__custom-breaks">
      <CustomBreakOption />
    </section>
  </section>
</template>

<script>
import { mapState } from 'pinia';

import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';

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

  data() {
    return {
      projectConfig: {
        can_use_bulk_transfer: false,
        can_use_queue_prioritization: false,
        filter_offline_agents: false,
        can_see_timer: false,
        can_close_chats_in_queue: false,
      },
    };
  },

  computed: {
    ...mapState(useConfig, ['project']),
    ...mapState(useProfile, ['me']),

    isUserManager() {
      const ROLE_MANAGER = 1;
      return this.me.project_permission_role === ROLE_MANAGER;
    },

    configBulkTransferTranslation() {
      const canBulkTransfer = this.projectConfig.can_use_bulk_transfer;
      return this.$t(
        `config_chats.project_configs.bulk_transfer.switch_${
          canBulkTransfer ? 'active' : 'inactive'
        }`,
      );
    },
    configQueuePrioritizationTranslation() {
      const canQueuePrioritization =
        this.projectConfig.can_use_queue_prioritization;
      return this.$t(
        `config_chats.project_configs.queue_prioritization.switch_${
          canQueuePrioritization ? 'active' : 'inactive'
        }`,
      );
    },
    configBlockTransferToOffAgentsTranslation() {
      const canBulkTransfer = this.projectConfig.filter_offline_agents;
      return this.$t(
        `config_chats.project_configs.block_transfer_to_off_agents.switch_${
          canBulkTransfer ? 'active' : 'inactive'
        }`,
      );
    },
    configShowAgentStatusCountTimer() {
      const showAgentStatusCountTimer = this.projectConfig.can_see_timer;
      return this.$t(
        `config_chats.project_configs.show_agent_status_count_timer.switch_${
          showAgentStatusCountTimer ? 'inactive' : 'active'
        }`,
      );
    },
    configCloseChatsInQueue() {
      const canCloseChatsInQueue = this.projectConfig.can_close_chats_in_queue;
      return this.$t(
        `config_chats.project_configs.close_chats_in_queue.switch_${
          canCloseChatsInQueue ? 'active' : 'inactive'
        }`,
      );
    },
  },

  watch: {
    project: {
      immediate: true,
      handler(newProject) {
        if (newProject.config) {
          this.projectConfig = newProject.config;
        }
      },
    },
    projectConfig: {
      deep: true,
      handler() {
        this.updateProjectConfig();
      },
    },
  },

  methods: {
    async updateProjectConfig() {
      const {
        can_use_bulk_transfer,
        can_use_queue_prioritization,
        filter_offline_agents,
        can_see_timer,
        can_close_chats_in_queue,
      } = this.projectConfig;

      Project.update({
        can_use_bulk_transfer,
        can_use_queue_prioritization,
        filter_offline_agents,
        can_see_timer,
        can_close_chats_in_queue,
      });
    },
  },
};
</script>

<style lang="scss">
.settings-view__project-options {
  display: flex;
  justify-content: space-between;
  gap: $unnnic-spacing-ant;

  .project-options__items {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;

    &__config {
      display: flex;
      flex-direction: column;
      gap: $unnnic-space-2;
    }

    &__custom-breaks {
      display: flex;
    }
  }
}
</style>
