<template>
  <section v-if="isSuggestionBoxOpen" class="suggestion-box">
    <header class="suggestion-box__header">
      {{ $t('quick_messages.available_shortcuts') }}
      <span class="suggestion-box__search">{{ search }}</span>
    </header>

    <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
    <section class="suggestion-box__shortcuts" @mousemove="activeShortcutIndex = -1">
      <div
        v-for="(suggestion, index) in filteredSuggestions"
        :key="suggestion.shortcut"
        @click="select(suggestion)"
        @keypress.enter="select(suggestion)"
        tabindex="-1"
        class="suggestion-box__shortcut clickable"
        :class="{ 'is-active': index === activeShortcutIndex }"
        data-testid="suggestion"
      >
        <h2 class="suggestion-box__shortcut__name">/{{ suggestion.shortcut }}</h2>
        <p class="suggestion-box__shortcut__preview">
          {{ suggestion.preview }}
        </p>
      </div>
    </section>
  </section>
</template>

<script>
export default {
  props: {
    search: {
      type: String,
      required: true,
    },
    suggestions: {
      type: Array,
      required: true,
    },
    trigger: {
      type: String,
      default: '/',
    },
    keyboardEvent: {
      type: KeyboardEvent,
      default: null,
    },
  },

  data: () => ({
    activeShortcutIndex: 0,
  }),

  computed: {
    isSuggestionBoxOpen() {
      return this.searchStartsWithTrigger && !this.searchHasWhiteSpaces;
    },
    searchStartsWithTrigger() {
      return this.search.charAt('0') === this.trigger;
    },
    searchHasWhiteSpaces() {
      return this.search.includes(' ');
    },
    filteredSuggestions() {
      const searchWithoutSlash = this.search.substring(1).toLowerCase();

      return this.suggestions.filter(({ shortcut }) =>
        shortcut.toLowerCase().includes(searchWithoutSlash),
      );
    },
    reactiveKeys() {
      return [
        { key: 'ArrowUp', handler: this.onArrowUp },
        { key: 'ArrowDown', handler: this.onArrowDown },
        { key: 'Enter', handler: this.onEnter },
      ];
    },
  },

  methods: {
    select(suggestion) {
      this.$emit('select', suggestion);
    },
    onArrowUp() {
      if (!this.isActiveShortcutIndexDefined()) {
        this.resetActiveShortcutIndex();
        return;
      }

      const suggestionsQuantity = this.filteredSuggestions.length;
      const shortcutIndex = this.activeShortcutIndex - 1;

      this.activeShortcutIndex = shortcutIndex < 0 ? suggestionsQuantity - 1 : shortcutIndex;
    },
    onArrowDown() {
      if (!this.isActiveShortcutIndexDefined()) {
        this.resetActiveShortcutIndex();
        return;
      }

      const suggestionsQuantity = this.filteredSuggestions.length;
      const shortcutIndex = this.activeShortcutIndex + 1;

      this.activeShortcutIndex = shortcutIndex < 0 ? 0 : shortcutIndex % suggestionsQuantity;
    },
    onEnter() {
      const activeSuggestion = this.filteredSuggestions[this.activeShortcutIndex];
      if (!activeSuggestion) return;

      this.select(activeSuggestion);
    },
    resetActiveShortcutIndex() {
      this.activeShortcutIndex = 0;
    },
    isActiveShortcutIndexDefined() {
      return this.activeShortcutIndex !== -1;
    },
  },

  watch: {
    keyboardEvent(event) {
      const reactiveKey = this.reactiveKeys.find((k) => k.key === event.key);
      if (!reactiveKey) return;

      event.preventDefault();
      reactiveKey.handler();
    },
    isSuggestionBoxOpen(isOpen) {
      this.resetActiveShortcutIndex();
      this.$emit(isOpen ? 'open' : 'close');
    },
    search() {
      const suggestionsQuantity = this.filteredSuggestions.length;

      if (this.activeShortcutIndex >= suggestionsQuantity || !this.isActiveShortcutIndexDefined()) {
        this.resetActiveShortcutIndex();
      }
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
  }

  &__search {
    font-weight: $unnnic-font-weight-black;
    color: $unnnic-color-brand-weni-dark;
  }

  &__shortcut {
    padding: $unnnic-spacing-inset-xs $unnnic-spacing-inset-sm;

    &:hover,
    &.is-active {
      background: rgba($unnnic-color-aux-baby-yellow, $unnnic-opacity-level-light);
    }

    &__name {
      font-size: $unnnic-font-size-body-md;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-brand-weni-dark;
      line-height: 1.25rem;
    }

    &__preview {
      font-size: $unnnic-font-size-body-sm;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1rem;
    }
  }
}
</style>
