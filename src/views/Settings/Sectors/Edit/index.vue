<template>
  <section
    v-if="currentSector"
    class="sector-edit-view"
  >
    <SectorEditHeader
      data-testid="sector-edit-view-header"
      :sectorName="currentSector.name"
    />

    <UnnnicTab
      data-testid="sector-edit-view-tab-list"
      :tabs="tabNames"
      :activeTab="activeTab?.name"
      @change="updateTab"
    >
      <template
        v-for="tab in tabs"
        #[`tab-head-${tab.id}`]
        :key="`tab-head-${tab.id}`"
      />
      <template #tab-panel-general> </template>
      <template #tab-panel-extra_options> </template>
      <template #tab-panel-queues> </template>
      <template #tab-panel-quick_messages> </template>
    </UnnnicTab>
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import { useSettings } from '@/store/modules/settings';

import SectorEditHeader from './SectorEditHeader.vue';

export default {
  name: 'EditSector',

  components: {
    SectorEditHeader,
  },

  data() {
    return {
      activeTab: '',
    };
  },

  computed: {
    ...mapState(useSettings, ['currentSector']),

    tabs() {
      const { $t } = this;
      return [
        { name: $t('sector.general'), id: 'general' },
        { name: $t('sector.extra_options'), id: 'extra_options' },
        { name: $t('sector.queues'), id: 'queues' },
        { name: $t('quick_message'), id: 'quick_messages' },
      ];
    },

    tabNames() {
      return this.tabs.map((tab) => tab.name);
    },
  },

  created() {
    const { params, query } = this.$route;

    this.getCurrentSector(params.uuid);
    this.updateTab(query.tab);
  },

  methods: {
    ...mapActions(useSettings, ['getCurrentSector']),

    updateTab(newTab) {
      this.activeTab = this.tabs.find((tab) =>
        [tab.name, tab.id].includes(newTab),
      );

      if (this.activeTab) {
        this.$router.replace({
          name: this.$route.name,
          query: {
            tab: this.activeTab.id,
          },
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-edit-view {
  display: grid;
  gap: $unnnic-spacing-sm;
}
</style>
