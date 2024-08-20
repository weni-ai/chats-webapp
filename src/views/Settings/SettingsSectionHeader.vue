<template>
  <header class="settings-view__section-header">
    <p class="section-header__title">{{ title }}</p>
    <p
      v-if="subtitle"
      class="section-header__subtitle"
    >
      {{ subtitle }}
    </p>
  </header>
</template>

<script>
export default {
  name: 'SettingsSectionHeader',

  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-view__section-header {
  display: grid;
  gap: $unnnic-spacing-nano;

  color: $unnnic-color-neutral-dark;

  .section-header__title {
    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-font-size-body-lg + $unnnic-line-height-md;
  }
  .section-header__subtitle {
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }
}
</style>
