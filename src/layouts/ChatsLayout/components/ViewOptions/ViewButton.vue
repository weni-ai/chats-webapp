<template>
  <UnnnicButton
    type="tertiary"
    size="small"
    class="view-button"
    data-testid="header-btn"
    :iconRight="expandedMore ? 'expand_more' : 'expand_less'"
    @click="emit('click', $event)"
  >
    <span class="view-button__label">
      <span
        class="view-button__text"
        data-testid="header-text"
      >
        {{ $t('view-option') }}
      </span>
      <UnnnicTag
        v-if="showNewBadge"
        class="view-button__new-badge"
        data-testid="header-new-badge"
        type="default"
        :text="$t('view_options.new_badge')"
      />
    </span>
  </UnnnicButton>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ViewButton',
  inheritAttrs: true,
});

withDefaults(
  defineProps<{
    expandedMore?: boolean;
    showNewBadge?: boolean;
  }>(),
  {
    expandedMore: false,
    showNewBadge: false,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<style lang="scss" scoped>
.view-button {
  width: 100%;

  :deep(.unnnic-button.unnnic-button--size-small.unnnic-button--tertiary) {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $unnnic-space-2;

    padding: $unnnic-space-4 $unnnic-spacing-xs;
    border-radius: 0;
    border-top: 1px solid $unnnic-color-border-soft;
    border-right: 1px solid $unnnic-color-border-soft;
    background-color: $unnnic-color-bg-base;

    &:hover:enabled {
      background-color: $unnnic-color-bg-base-soft;
      border-top: 1px solid $unnnic-color-border-soft;
      border-right: 1px solid $unnnic-color-border-soft;
    }

    &:active:enabled {
      background-color: $unnnic-color-bg-muted;
    }
  }

  :deep(.unnnic-button__label) {
    flex: 1 0 auto;
    display: flex;
    justify-content: flex-start;
  }

  &__label {
    display: inline-flex;
    align-items: center;
    gap: $unnnic-space-2;
  }

  &__text {
    color: $unnnic-color-fg-base;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-bold;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }
}
</style>
