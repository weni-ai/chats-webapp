<template>
  <section
    v-if="isUserManager"
    data-testid="settings-project"
    class="settings-view__project-options"
  >
    <SettingsSectionHeader
      data-testid="settings-project-header"
      :title="$t('config_chats.project_configs.title')"
    />

    <section class="project-options__items">
      <SettingsProjectOptionsItem
        v-model="projectConfig.can_use_bulk_transfer"
        data-testid="settings-project-option"
        :name="configBulkTransferTranslation"
        :tooltip="$t('config_chats.project_configs.bulk_transfer.tooltip')"
      />
      <SettingsProjectOptionsItem
        v-model="projectConfig.can_use_queue_prioritization"
        data-testid="settings-project-option"
        :name="configQueuePrioritizationTranslation"
        :tooltip="
          $t('config_chats.project_configs.queue_prioritization.tooltip')
        "
      />
      <SettingsProjectOptionsItem
        v-model="projectConfig.filter_offline_agents"
        data-testid="settings-project-option"
        :name="configBlockTransferToOffAgentsTranslation"
      />
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

export default {
  name: 'SettingsProjectOptions',

  components: {
    SettingsSectionHeader,
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
  gap: $unnnic-spacing-ant;

  .project-options__items {
    display: grid;
    gap: $unnnic-spacing-nano;
  }
}
</style>
