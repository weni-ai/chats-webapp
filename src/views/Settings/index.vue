<template>
  <section class="settings-view">
    <SettingsHeader />
  </section>
</template>

<script>
import SettingsHeader from './SettingsHeader.vue';

export default {
  name: 'SettingView',

  components: {
    SettingsHeader,
  },
};
</script>

<style lang="scss" scoped>
.settings-view {
  display: grid;
  gap: $unnnic-spacing-sm;
}
</style>
