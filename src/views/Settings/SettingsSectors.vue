<template>
  <SettingsSectionHeader
    data-testid="settings-sectors-header"
    :title="$t('config_chats.section_sectors_title', { project: projectName })"
    :subtitle="$t('config_chats.section_sectors_subtitle')"
  />
  <section class="settings-view__sectors">
    <UnnnicCard
      data-testid="settings-sectors-blank-card"
      type="blank"
      :text="$t('config_chats.new_sector')"
      icon="add"
      class="sectors__new-sector-card"
      @click="openNewSectorModal()"
    />

    <UnnnicCardProject
      v-for="sector in sectors"
      :key="sector.id"
      data-testid="settings-sectors-sector-card"
      class="sectors__card"
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

  <section
    v-if="isLoadingSectors"
    data-testid="settings-sectors-loading-section"
    class="settings-view__loading-sectors"
  >
    <img
      src="@/assets/LogoWeniAnimada4.svg"
      width="40"
    />
  </section>
  <NewSectorDrawer
    v-if="showNewSectorModal"
    v-model="showNewSectorModal"
    data-testid="new-sector-drawer"
    @close="closeNewSectorModal()"
  />
</template>

<script>
import { mapState } from 'pinia';

import { useConfig } from '@/store/modules/config';
import { useSettings } from '@/store/modules/settings';

import SettingsSectionHeader from './SettingsSectionHeader.vue';

import NewSectorDrawer from './Sectors/New/NewSectorDrawer.vue';

export default {
  name: 'SettingsSectors',

  components: {
    SettingsSectionHeader,
    NewSectorDrawer,
  },

  data() {
    return {
      showNewSectorModal: false,
    };
  },

  computed: {
    ...mapState(useConfig, {
      projectName: (store) => store.project.name,
    }),
    ...mapState(useSettings, ['sectors', 'isLoadingSectors']),
  },

  methods: {
    handleConnectOverlay(active) {
      window.parent.postMessage({ event: 'changeOverlay', data: active }, '*');
    },
    openNewSectorModal() {
      this.handleConnectOverlay(true);
      this.showNewSectorModal = true;
    },
    closeNewSectorModal() {
      this.handleConnectOverlay(false);
      this.showNewSectorModal = false;
    },
    navigate(name, params) {
      this.$router.push({
        name,
        params,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-view {
  &__sectors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $unnnic-spacing-sm;

    .sectors__new-sector-card {
      height: 100%;
    }
    .sectors__card {
      background-color: $unnnic-color-background-carpet;
    }
  }

  &__loading-sectors {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $unnnic-spacing-sm;
  }
}
</style>
