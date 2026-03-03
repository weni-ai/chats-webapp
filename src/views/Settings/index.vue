<template>
  <section
    v-if="showSettings"
    ref="settingsView"
    data-testid="settings-view"
    class="settings-view"
  >
    <SettingsHeader
      :hasUnsavedChanges="hasUnsavedChanges"
      :isSaving="isSaving"
      @save="handleSaveChanges"
    />

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
          <SettingsProjectOptions
            ref="projectOptions"
            @unsaved-changes="hasUnsavedChanges = $event"
          />

          <SettingsSectors />
        </section>
      </template>
      <template #tab-panel-groups>
        <SettingsGroups />
      </template>
    </UnnnicTab>

    <template v-else>
      <SettingsProjectOptions
        ref="projectOptions"
        @unsaved-changes="hasUnsavedChanges = $event"
      />

      <SettingsSectors />
    </template>
  </section>
</template>

<script>
import unnnic from '@weni/unnnic-system';
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
      hasUnsavedChanges: false,
      isSaving: false,
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

    async handleSaveChanges() {
      this.isSaving = true;
      try {
        await this.$refs.projectOptions.saveProjectConfig();
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.changes_saved'),
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        console.error('Failed to save project config:', error);
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.changes_not_saved'),
            type: 'error',
          },
          seconds: 5,
        });
      } finally {
        this.isSaving = false;
      }
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
