<template>
  <section class="theme-selector">
    <p class="theme-selector__label">
      {{ $t('preferences.appearance.live_desk_theme') }}
    </p>
    <section
      class="theme-selector__options"
      :aria-label="$t('preferences.appearance.live_desk_theme')"
    >
      <UnnnicButton
        class="theme-selector__button"
        :class="{
          'theme-selector__button--selected': !isDark,
        }"
        type="secondary"
        size="small"
        iconLeft="clear_day"
        :text="$t('preferences.appearance.light')"
        :aria-pressed="!isDark"
        data-testid="theme-light-button"
        @click="setTheme('light')"
      />
      <UnnnicButton
        class="theme-selector__button"
        :class="{
          'theme-selector__button--selected': isDark,
        }"
        type="secondary"
        size="small"
        iconLeft="dark_mode"
        :text="$t('preferences.appearance.dark')"
        :aria-pressed="isDark"
        data-testid="theme-dark-button"
        @click="setTheme('dark')"
      />
    </section>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useTheme } from '@weni/unnnic-system';

defineOptions({
  name: 'ThemeSelector',
});

const { resolvedTheme, setTheme } = useTheme();
const isDark = computed(() => resolvedTheme.value === 'dark');
</script>

<style lang="scss" scoped>
.theme-selector {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-2;

  &__label {
    margin: 0;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-regular;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    color: $unnnic-color-fg-base;
  }

  &__options {
    display: flex;
    gap: $unnnic-space-2;
  }

  &__button.unnnic-button.unnnic-button--secondary {
    flex: 1 0 0;
    width: 100%;
    min-width: 0;
    padding: $unnnic-space-3 $unnnic-space-4;

    :deep(.unnnic-button__label) {
      color: $unnnic-color-fg-emphasized;
    }
  }

  &__button--selected.unnnic-button.unnnic-button--secondary {
    background-color: $unnnic-color-bg-accent-plain;
    box-shadow: inset 0 0 0 1px $unnnic-color-border-accent-strong;

    &:hover:enabled,
    &:active:enabled {
      background-color: $unnnic-color-bg-accent-plain;
      box-shadow: inset 0 0 0 1px $unnnic-color-border-accent-strong;
    }
  }
}
</style>
