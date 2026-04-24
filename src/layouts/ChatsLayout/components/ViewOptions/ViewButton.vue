<template>
  <section class="view-button-content">
    <UnnnicButton
      size="small"
      type="tertiary"
      class="view-button"
      data-testid="header-btn"
      @click="handleClick"
    >
      <span class="view-button__label">
        <p
          class="view-button__text"
          data-testid="header-text"
        >
          {{ $t('view-option') }}
        </p>
        <UnnnicTag
          v-if="showNewBadge"
          class="view-button__new-badge"
          data-testid="header-new-badge"
          type="default"
          :text="$t('view_options.new_badge')"
        />
      </span>
      <UnnnicIcon
        data-testid="header-icon-expand"
        size="md"
        :icon="expandedMore ? 'expand_more' : 'expand_less'"
        scheme="neutral-darkest"
      />
    </UnnnicButton>
  </section>
</template>

<script setup>
defineProps({
  expandedMore: Boolean,
  showNewBadge: {
    type: Boolean,
    default: false,
  },
  handleClick: {
    type: Function,
    default: null,
  },
});
</script>

<style lang="scss" scoped>
.view-button-content {
  display: flex;
  align-items: center;

  :deep(.unnnic-button) {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: $unnnic-spacing-sm;
    align-self: stretch;
    border-top: 1px solid $unnnic-color-border-soft;
    border-bottom: 1px solid $unnnic-color-border-soft;
    border-left: 1px solid $unnnic-color-border-soft;
    background-color: $unnnic-color-bg-base-soft;
  }

  :deep(.unnnic-button--tertiary) {
    background-color: $unnnic-color-bg-base-soft;
  }

  :deep(.unnnic-button--tertiary:active:enabled) {
    background-color: $unnnic-color-bg-base-soft;
  }

  :deep(.unnnic-button--tertiary:hover:enabled) {
    background-color: $unnnic-color-bg-base-soft;
    border-top: 1px solid $unnnic-color-border-soft;
    border-bottom: 1px solid $unnnic-color-border-soft;
    border-left: 1px solid $unnnic-color-border-soft;
  }
}

.view-button {
  :deep(.unnnic-button__label) {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  &__label {
    display: inline-flex;
    align-items: center;
    gap: $unnnic-spacing-nano;
  }

  &__text {
    color: $unnnic-color-fg-base;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-style: normal;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }
}
</style>
