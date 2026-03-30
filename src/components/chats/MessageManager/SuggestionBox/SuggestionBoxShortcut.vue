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
  display: flex;
  flex-direction: column;
  padding: $unnnic-space-2;
  gap: $unnnic-space-1;

  &.is-active {
    background: $unnnic-color-neutral-lightest;
    border-radius: $unnnic-radius-2;

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
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-info;
  }

  &__description {
    overflow: hidden;

    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;

    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
