<template>
  <section v-if="isSuggestionBoxOpen" class="suggestion-box">
    <header class="suggestion-box__header">
      Atalhos disponíveis
      <span class="suggestion-box__header__shortcut">{{ text }}</span>
    </header>

    <section class="suggestion-box__shortcuts">
      <div
        class="suggestion-box__shortcuts__shortcut-container"
        v-for="suggestion in suggestions"
        :key="suggestion.shortcut"
      >
        <h2 class="suggestion-box__shortcuts__shortcut-container__shortcut">
          /{{ suggestion.shortcut }}
        </h2>
        <p class="suggestion-box__shortcuts__shortcut-container__value">
          {{ suggestion.value }}
        </p>
      </div>
    </section>
  </section>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true,
    },
    suggestions: {
      type: Array,
      required: true,
    },
  },

  computed: {
    isSuggestionBoxOpen() {
      return this.text.charAt('0') === '/';
    },
  },
};
</script>

<style lang="scss" scoped>
.suggestion-box {
  background: $unnnic-color-background-snow;
  box-shadow: $unnnic-shadow-level-near;
  padding: $unnnic-spacing-inset-sm 0;
  border-radius: $unnnic-border-radius-md;
  width: 239px;

  &__header {
    font-size: $unnnic-font-size-body-md;
    line-height: 1.25rem;
    padding: 0 $unnnic-spacing-inset-sm $unnnic-spacing-inset-nano;
    margin-bottom: $unnnic-spacing-inline-xs;
    border-bottom: solid 1px $unnnic-color-neutral-soft;

    &__shortcut {
      font-weight: $unnnic-font-weight-black;
      color: $unnnic-color-brand-weni-dark;
    }
  }

  &__shortcuts {
    &__shortcut-container {
      padding: $unnnic-spacing-inset-xs $unnnic-spacing-inset-sm;

      &:hover {
        cursor: pointer;
        background: rgba($unnnic-color-aux-baby-yellow, $unnnic-opacity-level-light);
      }

      &__shortcut {
        font-size: $unnnic-font-size-body-md;
        font-weight: $unnnic-font-weight-bold;
        color: $unnnic-color-brand-weni-dark;
        line-height: 1.25rem;
      }

      &__value {
        font-size: $unnnic-font-size-body-sm;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1rem;
      }
    }
  }
}
</style>
