<template>
  <section
    v-if="isSuggestionBoxOpen"
    v-click-outside="close"
    class="suggestion-box"
    @keydown.esc="close"
  >
    <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
    <SuggestionBoxShortcut
      v-if="copilot"
      copilot
      @click="openCopilot"
      @keypress.enter="openCopilot"
    />
    <section
      ref="refShortcuts"
      class="suggestion-box__shortcuts"
    >
      <p
        v-if="filteredSuggestions?.length === 0"
        class="suggestion-box__no-suggestions"
      >
        {{ $t('quick_messages.no_suggestions') }}
      </p>
      <SuggestionBoxShortcut
        v-for="(suggestion, index) in filteredSuggestions"
        v-else
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
import vClickOutside from 'v-click-outside';
import SuggestionBoxShortcut from './SuggestionBoxShortcut.vue';

export default {
  name: 'SuggestionBox',
  directives: {
    clickOutside: vClickOutside.directive,
  },
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
  emits: ['select', 'close', 'open-copilot'],

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

  watch: {
    keyboardEvent(event) {
      const reactiveKey = this.reactiveKeys.find((k) => k.key === event.key);
      if (!reactiveKey) return;

      event.preventDefault();
      reactiveKey.handler();

      const scrollElement =
        this.$refs.refShortcuts.childNodes[this.activeShortcutIndex];

      scrollElement?.scrollIntoView?.({ block: 'center' });
    },
    isSuggestionBoxOpen(isOpen) {
      this.$emit(isOpen ? 'open' : 'close');
    },
    search(newSearch) {
      const searchHasValue = !!newSearch.replace('/', '');

      if (!this.copilot || searchHasValue) {
        this.resetActiveShortcutIndex();
      } else {
        this.activeShortcutIndex = null;
      }
    },
  },

  methods: {
    select(suggestion) {
      this.$emit('select', suggestion);
    },
    close() {
      this.$emit('close');
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
      const activeSuggestion =
        this.filteredSuggestions[this.activeShortcutIndex];
      if (!activeSuggestion) {
        if (this.copilot) {
          this.openCopilot();
        }
        return;
      }

      this.select(activeSuggestion);
    },
    resetActiveShortcutIndex() {
      this.activeShortcutIndex = 0;
    },
    isActiveShortcutIndexDefined() {
      return this.activeShortcutIndex !== -1;
    },
  },
};
</script>

<style lang="scss" scoped>
.suggestion-box {
  display: flex;
  flex-direction: column;
  padding: $unnnic-space-4;

  position: absolute;
  bottom: calc(100% + $unnnic-spacing-xs);

  background: $unnnic-color-bg-base;
  border-radius: $unnnic-radius-4;
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

    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }

  &__no-suggestions {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }
}
</style>
