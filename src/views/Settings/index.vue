<template>
  <section
    ref="settingsView"
    data-testid="settings-view"
    class="settings-view"
    @scroll="onScroll"
  >
    <SettingsHeader />

    <SettingsProjectOptions />

    <SettingsSectors />
  </section>
</template>

<script>
import { mapActions } from 'pinia';

import { useSettings } from '@/store/modules/settings';

import SettingsHeader from './SettingsHeader.vue';
import SettingsProjectOptions from './SettingsProjectOptions/index.vue';
import SettingsSectors from './SettingsSectors.vue';

export default {
  name: 'SettingView',

  components: {
    SettingsHeader,
    SettingsProjectOptions,
    SettingsSectors,
  },

  beforeMount() {
    this.getSectors();
  },

  methods: {
    ...mapActions(useSettings, {
      getSectors: 'getSectors',
    }),

    onScroll() {
      const settingsView = this.$refs.settingsView;
      const isScrollInBottom =
        Math.round(settingsView.scrollTop) + settingsView.clientHeight >=
        settingsView.scrollHeight - 100;

      if (isScrollInBottom) {
        this.getSectors();
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
}
</style>
