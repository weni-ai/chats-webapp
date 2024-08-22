<template>
  <header class="sector-edit-view__header">
    <h1 class="header__title">
      {{ `${$t('sector.title')} ${sectorName}` }}
    </h1>
    <p class="header__description">
      {{ $t('config_chats.edit_sector.description') }}
    </p>
  </header>
</template>

<script>
export default {
  name: 'SectorEditHeader',

  props: {
    sectorName: {
      type: String,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-edit-view__header {
  display: grid;
  align-items: center;
  gap: $unnnic-spacing-nano;

  .header__title {
    color: $unnnic-color-neutral-black;
    font-family: $unnnic-font-family-primary;
    font-size: $unnnic-font-size-title-sm;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-font-size-title-sm + $unnnic-line-height-md;
  }

  .header__description {
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }
}
</style>
