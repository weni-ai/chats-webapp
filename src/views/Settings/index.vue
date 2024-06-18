<template>
  <main
    class="settings-chats"
    ref="sectorsSection"
    @scroll="onScroll"
  >
    <header>
      <h1 class="title">{{ $t('config_chats.manage_chats') }}</h1>
      <p class="description">
        {{ $t('config_chats.manage_description') }}
      </p>
    </header>

    <section
      class="settings-chats__project-configs"
      v-if="isUserAdmin && projectConfig"
    >
      <section class="project-configs__config">
        <UnnnicSwitch
          v-model="projectConfig.can_use_bulk_transfer"
          :textRight="configBulkTransferTranslation"
        />
        <UnnnicToolTip
          enabled
          :text="$t('config_chats.project_configs.bulk_transfer.tooltip')"
          side="right"
          maxWidth="20rem"
        >
          <UnnnicIcon
            icon="information-circle-4"
            scheme="neutral-soft"
            size="sm"
          />
        </UnnnicToolTip>
      </section>
      <section class="project-configs__config">
        <UnnnicSwitch
          v-model="projectConfig.can_use_queue_prioritization"
          :textRight="configQueuePrioritizationTranslation"
        />
        <UnnnicToolTip
          enabled
          :text="
            $t('config_chats.project_configs.queue_prioritization.tooltip')
          "
          side="right"
          maxWidth="20rem"
        >
          <UnnnicIcon
            icon="information-circle-4"
            scheme="neutral-soft"
            size="sm"
          />
        </UnnnicToolTip>
      </section>
    </section>

    <section class="sectors">
      <div
        @click.stop="navigate('sectors.new')"
        @keypress.enter="navigate('sectors.new')"
      >
        <UnnnicCard
          type="blank"
          :text="$t('config_chats.new_sector')"
          icon="add"
          class="new-sector-card"
        />
      </div>

      <UnnnicCardProject
        v-for="sector in sectors"
        class="sectors-list"
        :key="sector.id"
        :actionText="$t('config_chats.open')"
        :name="sector.name"
        :statuses="[
          {
            title: $t('config_chats.agent_title'),
            icon: 'headphones',
            scheme: 'aux-purple',
            count: sector.agents,
          },
          {
            title: $t('config_chats.contacts'),
            icon: 'person',
            scheme: 'aux-lemon',
            count: sector.contacts,
          },
        ]"
        @action="navigate('sectors.edit', { uuid: sector.uuid })"
      />
    </section>
    <div
      v-if="isLoading"
      class="weni-redirecting"
    >
      <img
        class="logo"
        src="@/assets/LogoWeniAnimada4.svg"
        alt=""
      />
    </div>
  </main>
</template>

<script>
import { mapState } from 'pinia';
import { useConfig } from '@/store/modules/config';
import { useProfile } from '@/store/modules/profile';

import Project from '@/services/api/resources/settings/project';
import Sector from '@/services/api/resources/settings/sector';

export default {
  name: 'SettingsChats',

  beforeMount() {
    this.listSectors();
  },

  data: () => ({
    sectors: [],
    isLoading: true,
    nextPage: null,

    projectConfig: {
      can_use_bulk_transfer: false,
      can_use_queue_prioritization: false,
    },
  }),

  computed: {
    ...mapState(useConfig, ['project']),
    ...mapState(useProfile, ['me']),
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
    isUserAdmin() {
      const ROLE_ADMIN = 1;
      return this.me.project_permission_role === ROLE_ADMIN;
    },
  },

  methods: {
    navigate(name, params) {
      this.$router.push({
        name,
        params,
      });
    },

    async updateProjectConfig() {
      const { can_use_bulk_transfer, can_use_queue_prioritization } =
        this.projectConfig;
      Project.update({
        can_use_bulk_transfer,
        can_use_queue_prioritization,
      });
    },

    async listSectors() {
      try {
        this.isLoading = true;
        const sectors = await Sector.list();
        this.nextPage = sectors.next;
        this.sectors = sectors.results;
        this.next = sectors.next;
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
      }
    },

    async listMoreSectors() {
      if (this.isLoading || !this.nextPage) {
        return;
      }

      try {
        this.isLoading = true;
        const newSectors = await Sector.list({ nextReq: this.nextPage });
        this.nextPage = newSectors.next;
        this.sectors = [...this.sectors, ...newSectors.results];
        if (newSectors) {
          this.isLoading = false;
        }
      } catch (error) {
        this.isLoading = false;
      }
    },

    onScroll() {
      const sectorSection = this.$refs.sectorsSection;
      const isScrollInBottom =
        sectorSection.scrollTop + sectorSection.clientHeight >=
        sectorSection.scrollHeight;
      if (isScrollInBottom) {
        this.listMoreSectors();
      }
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
};
</script>

<style lang="scss" scoped>
.settings-chats {
  padding-right: $unnnic-spacing-sm;

  display: grid;
  gap: $unnnic-spacing-sm;

  overflow-y: auto;

  &__project-configs {
    display: grid;
    gap: $unnnic-spacing-nano;

    .project-configs__config {
      display: flex;
      gap: $unnnic-spacing-nano;
      align-items: center;

      .unnnic-tooltip {
        display: flex;
      }
    }
  }

  header {
    .title {
      color: $unnnic-color-neutral-black;
      font-family: $unnnic-font-family-primary;
      font-size: 1.5rem;
      line-height: 2rem;
      margin-bottom: 0.5rem;
    }

    .description {
      line-height: 1.5rem;
      color: $unnnic-color-neutral-dark;
    }
  }

  .sectors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    .new-sector-card {
      height: 100%;
    }
    .sectors-list {
      background-color: $unnnic-color-background-carpet;
    }
  }
  .weni-redirecting {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 15px;
  }
  .logo {
    width: 10%;
    max-width: 40px;
    max-height: 40px;
  }
}
</style>
