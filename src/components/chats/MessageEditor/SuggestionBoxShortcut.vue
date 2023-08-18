<template>
  <div
    data-testid="suggestion"
    class="suggestion-box__shortcut clickable"
    :class="{ 'is-active': isActive, copilot }"
    @click="emitEvent('click')"
    @mouseenter="emitEvent('mouseenter')"
    @focus="emitEvent('focus')"
    @keypress.enter="emitEvent('keypress')"
  >
    <h2 class="suggestion-box__shortcut__title">
      {{ copilot ? $t('copilot.name') : `/${shortcut}` }}
    </h2>
    <p class="suggestion-box__shortcut__description">
      {{ copilot ? $t('quick_messages.copilot') : description }}
    </p>
  </div>
</template>

<script>
export default {
  name: 'SuggestionBoxShortcut',
  props: {
    shortcut: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    copilot: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    emitEvent(eventName) {
      this.$emit(eventName, this.shortcut);
    },
  },
};
</script>

<style lang="scss" scoped>
.suggestion-box__shortcut {
  padding: $unnnic-spacing-xs $unnnic-spacing-sm;

  &.is-active {
    background: $unnnic-color-neutral-lightest;

    &:active {
      background: $unnnic-color-neutral-light;
    }
  }

  &.copilot {
    background: $unnnic-color-weni-50;

    &:active {
      background: $unnnic-color-weni-100;
    }

    .suggestion-box__shortcut__title {
      color: $unnnic-color-weni-600;
    }
  }

  &__title {
    margin-bottom: $unnnic-spacing-nano;

    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-aux-purple-500;
    line-height: 1.25rem;
  }

  &__description {
    overflow: hidden;

    font-size: $unnnic-font-size-body-md;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1rem;
  }
}
</style>
