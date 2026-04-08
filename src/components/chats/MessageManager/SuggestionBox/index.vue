<template>
  <section
    v-if="isValidToShowSuggestionBox"
    v-on-click-outside="[close, clickOutsideOptions]"
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
        @mouseenter="activeShortcutIndex = index"
        @focus="activeShortcutIndex = index"
      />
    </section>
  </section>
</template>

<script>
import { mapState } from 'pinia';
import { vOnClickOutside } from '@vueuse/components';

import SuggestionBoxShortcut from './SuggestionBoxShortcut.vue';

import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';
import { useQuickMessages } from '@/store/modules/chats/quickMessages';
import { useMessageManager } from '@/store/modules/chats/messageManager';

export default {
  name: 'SuggestionBox',

  directives: {
    onClickOutside: vOnClickOutside,
  },

  components: {
    SuggestionBoxShortcut,
  },
  props: {
    search: {
      type: String,
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

    ignoreClickOutside: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['select', 'open', 'close', 'hide', 'open-copilot'],

  data: () => ({
    activeShortcutIndex: null,
  }),

  computed: {
    ...mapState(useQuickMessageShared, ['quickMessagesShared']),
    ...mapState(useQuickMessages, ['quickMessages']),
    ...mapState(useMessageManager, ['inputMessageFocused']),
    suggestions() {
      const allShortcuts = [...this.quickMessages, ...this.quickMessagesShared];
      const uniqueShortcuts = [];

      allShortcuts.forEach((item) => {
        const isDuplicate = uniqueShortcuts.some(
          (uniqueItem) => uniqueItem.uuid === item.uuid,
        );

        if (!isDuplicate) {
          uniqueShortcuts.push(item);
        }
      });

      return uniqueShortcuts;
    },
    isValidToShowSuggestionBox() {
      return this.searchStartsWithTrigger && !this.searchHasWhiteSpaces;
    },
    clickOutsideOptions() {
      return {
        ignore: this.ignoreClickOutside,
      };
    },
    searchStartsWithTrigger() {
      return this.search.charAt(0) === this.trigger;
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
        this.$refs.refShortcuts?.childNodes[this.activeShortcutIndex];

      scrollElement?.scrollIntoView?.({ block: 'center' });
    },
    isValidToShowSuggestionBox(isOpen) {
      if (isOpen) {
        this.$emit('open');
      } else {
        // Don't close the suggestion box, because close clears the input message.
        this.$emit('hide');
      }
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
      this.$emit('select', suggestion.text);
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
  bottom: calc(100% + $unnnic-space-2);

  background: $unnnic-color-bg-base;
  border-radius: $unnnic-radius-4;
  box-shadow: $unnnic-shadow-level-near;

  width: calc(100% - $unnnic-space-4);
  max-height: 40vh;
  overflow: hidden;

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
