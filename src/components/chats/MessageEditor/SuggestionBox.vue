<template>
  <section v-if="isSuggestionBoxOpen" class="suggestion-box">
    <header class="suggestion-box__header">
      {{ $t('quick_messages.available_shortcuts') }}
      <span class="suggestion-box__search">{{ search }}</span>
    </header>

    <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
    <suggestion-box-shortcut
      v-if="copilot"
      copilot
      @click="openCopilot"
      @keypress.enter="openCopilot"
    />
    <section class="suggestion-box__shortcuts" ref="refShortcuts">
      <suggestion-box-shortcut
        v-for="(suggestion, index) in filteredSuggestions"
        :key="suggestion.uuid"
        :shortcut="suggestion.shortcut"
        :description="suggestion.text"
        :isActive="activeShortcutIndex === index"
        @click="select(suggestion)"
        @keypress.enter="select(suggestion)"
        @mouseenter="activeShortcutIndex = index"
        @focus="activeShortcutIndex = index"
      />
    </section>
  </section>
</template>

<script>
import SuggestionBoxShortcut from '@/components/chats/MessageEditor/SuggestionBoxShortcut';

export default {
  name: 'SuggestionBox',
  components: {
    SuggestionBoxShortcut,
  },
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
    copilot: {
      type: Boolean,
      default: false,
    },
  },

  data: () => ({
    activeShortcutIndex: null,
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
    openCopilot() {
      this.$emit('open-copilot');
    },
    onArrowUp() {
      if (!this.isActiveShortcutIndexDefined()) {
        this.resetActiveShortcutIndex();
        return;
      }

      const suggestionsQuantity = this.filteredSuggestions.length;
      const shortcutIndex = this.activeShortcutIndex - 1;

      this.activeShortcutIndex =
        this.activeShortcutIndex === null || shortcutIndex < 0
          ? suggestionsQuantity - 1
          : shortcutIndex;
    },
    onArrowDown() {
      if (!this.isActiveShortcutIndexDefined()) {
        this.resetActiveShortcutIndex();
        return;
      }

      const suggestionsQuantity = this.filteredSuggestions.length;
      const shortcutIndex = this.activeShortcutIndex + 1;
      this.activeShortcutIndex =
        this.activeShortcutIndex === null || shortcutIndex < 0
          ? 0
          : shortcutIndex % suggestionsQuantity;
    },
    onEnter() {
      const activeSuggestion = this.filteredSuggestions[this.activeShortcutIndex];
      if (!activeSuggestion) {
        if (this.copilot) {
          this.openCopilot();
        }
        return;
      }

      this.select(activeSuggestion);
    },
    resetActiveShortcutIndex() {
      this.activeShortcutIndex = null;
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
}
</style>
