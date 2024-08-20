<template>
  <section
    v-if="isUserManager && projectConfig"
    class="settings-view__project-options"
  >
    <SettingsProjectOptionsItem
      v-model="projectConfig.can_use_bulk_transfer"
      :name="configBulkTransferTranslation"
      :tooltip="$t('config_chats.project_configs.bulk_transfer.tooltip')"
    />
    <SettingsProjectOptionsItem
      v-model="projectConfig.can_use_queue_prioritization"
      :name="configQueuePrioritizationTranslation"
      :tooltip="$t('config_chats.project_configs.queue_prioritization.tooltip')"
    />
    <SettingsProjectOptionsItem
      v-model="projectConfig.filter_offline_agents"
      :name="configBlockTransferToOffAgentsTranslation"
    />
  </section>
</template>
<script>
import { mapState } from 'pinia';

import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';

import Project from '@/services/api/resources/settings/project';

import SettingsProjectOptionsItem from './SettingsProjectOptionsItem.vue';

export default {
  name: 'SettingsProjectOptions',

  components: {
    SettingsProjectOptionsItem,
  },

  data() {
    return {
      projectConfig: {
        can_use_bulk_transfer: false,
        can_use_queue_prioritization: false,
        filter_offline_agents: false,
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
      } = this.projectConfig;

      Project.update({
        can_use_bulk_transfer,
        can_use_queue_prioritization,
        filter_offline_agents,
      });
    },
  },
};
</script>

<style lang="scss">
.settings-view__project-options {
  display: grid;
  gap: $unnnic-spacing-nano;

  .project-options__config {
    display: flex;
    gap: $unnnic-spacing-nano;
    align-items: center;

    .unnnic-tooltip {
      display: flex;
    }
  }
}
</style>
