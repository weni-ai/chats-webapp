<template>
  <section
    class="view-button"
    role="button"
    tabindex="0"
    :aria-expanded="expandedMore"
    data-testid="header-btn"
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
    <UnnnicIcon
      class="view-button__chevron"
      data-testid="header-chevron"
      :icon="expandedMore ? 'keyboard_arrow_down' : 'keyboard_arrow_up'"
      size="ant"
      scheme="fg-base"
    />
  </section>
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
  click: [event: MouseEvent | KeyboardEvent];
}>();
</script>

<style lang="scss" scoped>
.view-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $unnnic-space-2;
  width: 100%;

  padding: $unnnic-space-4 $unnnic-spacing-xs;

  background-color: $unnnic-color-bg-base;
  border-top: 1px solid $unnnic-color-border-soft;
  border-right: 1px solid $unnnic-color-border-base;

  cursor: pointer;
  user-select: none;
  outline: none;

  &:hover {
    background-color: $unnnic-color-bg-base-soft;
  }

  &:active {
    background-color: $unnnic-color-bg-muted;
  }

  &:focus-visible {
    outline: 2px solid $unnnic-color-border-accent-strong;
    outline-offset: -2px;
  }

  &__label {
    display: inline-flex;
    align-items: center;
    gap: $unnnic-space-2;
    min-width: 0;
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
