<template>
  <label
    class="flows-contact-card"
    :class="{ 'flows-contact-card--selected': selected }"
    :data-selected="selected ? 'true' : 'false'"
    data-testid="flows-contact-card"
  >
    <input
      type="checkbox"
      class="flows-contact-card__checkbox"
      :checked="selected"
      :aria-label="name"
      data-testid="flows-contact-card-checkbox"
      @change="emitToggle"
    />

    <span
      class="flows-contact-card__avatar"
      data-testid="flows-contact-card-avatar"
      aria-hidden="true"
    >
      {{ initial }}
    </span>

    <span class="flows-contact-card__info">
      <span
        class="flows-contact-card__name"
        :title="name"
        data-testid="flows-contact-card-name"
      >
        {{ name }}
      </span>
      <span
        v-if="subtitle"
        class="flows-contact-card__subtitle"
        :title="subtitle"
        data-testid="flows-contact-card-subtitle"
      >
        {{ subtitle }}
      </span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue';

defineOptions({
  name: 'FlowsContactCard',
});

const props = withDefaults(
  defineProps<{
    name?: string;
    subtitle?: string;
    selected?: boolean;
    unnamed?: boolean;
  }>(),
  {
    name: '',
    subtitle: '',
    selected: false,
    unnamed: false,
  },
);

const emit = defineEmits<{
  toggle: [];
}>();

const initial = computed<string>(() => {
  if (props.unnamed) return '?';
  const trimmed = (props.name || '').trim();
  if (!trimmed) return '?';
  return trimmed.charAt(0).toUpperCase();
});

function emitToggle(): void {
  emit('toggle');
}
</script>

<style lang="scss" scoped>
.flows-contact-card {
  display: flex;
  align-items: center;
  gap: $unnnic-space-2;

  padding: $unnnic-space-2;

  border: 1px solid $unnnic-color-border-soft;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;

  cursor: pointer;
  user-select: none;

  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    background-color: $unnnic-color-bg-base-soft;
  }

  &:focus-within {
    border-color: $unnnic-color-border-accent-strong;
  }

  &--selected {
    border-color: $unnnic-color-border-accent-strong;
    background-color: $unnnic-color-bg-base-soft;
  }

  &__checkbox {
    appearance: none;
    -webkit-appearance: none;
    flex-shrink: 0;

    width: 21px;
    height: 21px;
    margin: 0;
    padding: 0;

    background-color: $unnnic-color-bg-base;
    border: 1px solid $unnnic-color-border-base;
    border-radius: $unnnic-radius-1;
    box-sizing: border-box;

    cursor: pointer;
    outline: none;

    &:checked {
      border-width: 0;
      background-color: $unnnic-color-bg-accent-strong;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M5 12L10 17L20 7' stroke='%23FFFFFF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 14px 14px;
    }

    &:focus-visible {
      outline: 2px solid $unnnic-color-border-accent-strong;
      outline-offset: 2px;
    }
  }

  &__avatar {
    flex-shrink: 0;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 35px;
    height: 35px;

    border-radius: $unnnic-border-radius-pill;
    background-color: $unnnic-color-bg-muted;

    color: $unnnic-color-fg-emphasized;
    font: $unnnic-font-action;
    text-align: center;
  }

  &__info {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    color: $unnnic-color-fg-emphasized;
    font: $unnnic-font-action;
  }

  &__subtitle {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    color: $unnnic-color-fg-base;
    font: $unnnic-font-caption-2;
  }
}
</style>
