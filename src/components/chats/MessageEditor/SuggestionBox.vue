<template>
  <section v-if="isSuggestionBoxOpen" class="suggestion-box">
    <header class="suggestion-box__header">
      {{ $t('quick_messages.available_shortcuts') }}
      <span class="suggestion-box__search">{{ search }}</span>
    </header>

    <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
    <section class="suggestion-box__shortcuts" ref="refShortcuts">
      <div
        v-for="(suggestion, index) in filteredSuggestions"
        :key="suggestion.uuid"
        @click="select(suggestion)"
        @keypress.enter="select(suggestion)"
        tabindex="-1"
        class="suggestion-box__shortcut clickable"
        :class="{ 'is-active': index === activeShortcutIndex }"
        data-testid="suggestion"
        @mouseenter="activeShortcutIndex = index"
        @focus="activeShortcutIndex = index"
      >
        <h2 class="suggestion-box__shortcut__name">{{ suggestion.shortcut }}</h2>
        <p class="suggestion-box__shortcut__preview">
          {{ suggestion.text }}
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

      const scrollElement = this.$refs.refShortcuts.childNodes[this.activeShortcutIndex];
      scrollElement.scrollIntoView({ block: 'nearest' });
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
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-xs;

  position: absolute;
  bottom: calc(100% + $unnnic-spacing-xs);

  background: $unnnic-color-background-snow;
  border-radius: $unnnic-border-radius-md;
  padding: $unnnic-spacing-sm 0;
  box-shadow: $unnnic-shadow-level-near;

  width: calc(100% - $unnnic-spacing-sm);
  max-height: 40vh;
  overflow: hidden;

  &__header {
    padding: 0 $unnnic-spacing-sm $unnnic-spacing-xs;
    font-size: $unnnic-font-size-body-gt;

    line-height: 1.25rem;
  }

  &__search {
    font-weight: $unnnic-font-weight-black;
    color: $unnnic-color-aux-purple-500;
  }

  &__shortcuts {
    max-height: 100%;
    overflow-y: auto;
  }

  &__shortcut {
    padding: $unnnic-spacing-xs $unnnic-spacing-sm;

    &.is-active {
      background: $unnnic-color-neutral-lightest;

      &:active {
        background: $unnnic-color-neutral-light;
      }
    }

    &__name {
      margin-bottom: $unnnic-spacing-nano;

      font-size: $unnnic-font-size-body-gt;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-aux-purple-500;
      line-height: 1.25rem;
    }

    &__preview {
      overflow: hidden;

      font-size: $unnnic-font-size-body-md;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 1rem;
    }
  }
}
</style>
