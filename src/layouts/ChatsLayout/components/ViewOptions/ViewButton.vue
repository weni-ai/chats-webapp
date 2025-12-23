<template>
  <section class="view-button-content">
    <UnnnicButton
      size="small"
      type="tertiary"
      class="view-button"
      data-testid="header-btn"
      @click="handleClick"
    >
      <p
        class="view-button__text"
        data-testid="header-text"
      >
        {{ $t('view-option') }}
      </p>
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
    border-top: 1px solid $unnnic-color-neutral-soft;
    border-bottom: 1px solid $unnnic-color-neutral-soft;
    border-left: 1px solid $unnnic-color-neutral-soft;
    background-color: $unnnic-color-neutral-lightest;
  }

  :deep(.unnnic-button--tertiary) {
    background-color: $unnnic-color-neutral-lightest;
  }

  :deep(.unnnic-button--tertiary:active:enabled) {
    background-color: $unnnic-color-neutral-lightest;
  }

  :deep(.unnnic-button--tertiary:hover:enabled) {
    background-color: $unnnic-color-neutral-lightest;
    border-top: 1px solid $unnnic-color-neutral-cleanest;
    border-bottom: 1px solid $unnnic-color-neutral-cleanest;
    border-left: 1px solid $unnnic-color-neutral-cleanest;
  }
}

.view-button {
  :deep(.unnnic-button__label) {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  &__text {
    color: $unnnic-color-neutral-cloudy;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-style: normal;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }
}
</style>
