<template>
  <section
    v-if="showSettings"
    ref="settingsView"
    data-testid="settings-view"
    class="settings-view"
  >
    <SettingsHeader />

    <UnnnicTab
      v-if="isPrimaryProject"
      :tabs="tabsIds"
      :activeTab="activeTab?.id"
      @change="updateTab"
    >
      <template
        v-for="tab in tabs"
        #[`tab-head-${tab.id}`]
        :key="`tab-head-${tab.id}`"
      >
        {{ tab.name }}
      </template>

      <template #tab-panel-general>
        <section class="tab-content-container">
          <SettingsProjectOptions />

          <SettingsSectors />
        </section>
      </template>
      <template #tab-panel-groups>
        <SettingsGroups />
      </template>
    </UnnnicTab>

    <template v-else>
      <SettingsProjectOptions />

      <SettingsSectors />
    </template>
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import { useSettings } from '@/store/modules/settings';
import { useConfig } from '@/store/modules/config';

import SettingsHeader from './SettingsHeader.vue';
import SettingsProjectOptions from './SettingsProjectOptions/index.vue';
import SettingsSectors from './SettingsSectors.vue';
import SettingsGroups from './SettingsGroups.vue';

export default {
  name: 'SettingView',

  components: {
    SettingsHeader,
    SettingsProjectOptions,
    SettingsSectors,
    SettingsGroups,
  },

  data() {
    return {
      activeTab: { id: 'general' },
    };
  },

  computed: {
    ...mapState(useConfig, ['enableGroupsMode', 'isPrimaryProject']),

    showSettings() {
      return !this.enableGroupsMode || this.isPrimaryProject;
    },

    tabs() {
      return [
        { name: this.$t('config_chats.tabs.settings'), id: 'general' },
        { name: this.$t('config_chats.tabs.groups'), id: 'groups' },
      ];
    },

    tabsIds() {
      return this.tabs.map((tab) => tab.id);
    },
  },

  mounted() {
    if (this.showSettings) {
      this.getSectors(true);
      this.getGroups(true);
    }
  },

  methods: {
    ...mapActions(useSettings, {
      getSectors: 'getSectors',
      getGroups: 'getGroups',
    }),

    updateTab(newTab) {
      const newActiveTab = this.tabs.find((tab) =>
        [tab.name, tab.id].includes(newTab),
      );

      if (!newActiveTab) return;

      this.activeTab = newActiveTab;
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-view {
  overflow-y: auto;

  display: grid;
  gap: $unnnic-spacing-sm;
  padding: $unnnic-spacing-sm;

  .tab-content-container {
    display: grid;
    gap: $unnnic-spacing-sm;
  }
}
</style>
