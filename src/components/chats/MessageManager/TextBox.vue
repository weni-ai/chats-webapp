<template>
  <!-- eslint-disable vuejs-accessibility/form-control-has-label -->
  <!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
  <section class="text-box">
    <div class="text-editor" :class="{ mobile: isMobile }" @click="$refs.textareaRef.focus()">
      <unnnic-button
        v-if="isMobile"
        class="text-editor__mobile-button"
        iconCenter="bolt"
        type="tertiary"
        scheme="neutral-dark"
        @click.stop="emitHandleQuickMessages"
      />
      <div v-else @click.stop="handleEmojiPicker">
        <unnnic-icon
          icon="add_reaction"
          scheme="neutral-clean"
          :class="['emoji-button', 'clickable']"
          size="ant"
        />
      </div>

      <emoji-picker
        v-show="isEmojiPickerOpen"
        @emojiSelected="handleTextarea"
        @close="closeEmojiPicker"
      />

      <textarea
        :placeholder="$t('message')"
        class="text-input"
        ref="textareaRef"
        :rows="currentTextAreaRows"
        :value="value"
        @input="handleTextarea"
        @keydown="keyDownTextarea"
        @paste="paste"
        @focus="() => setIsFocused(true)"
        @blur="() => setIsFocused(false)"
      />

      <unnnic-dropdown position="top-left" class="more-actions" v-if="isMobile">
        <unnnic-button
          slot="trigger"
          class="text-editor__mobile-button"
          iconCenter="attachment"
          type="tertiary"
          scheme="neutral-dark"
          next
        />

        <div class="more-actions-container">
          <more-actions-option
            icon="image"
            :title="$t('photo_or_video')"
            :action="() => {}"
            inputType="image"
          />
          <more-actions-option
            icon="article"
            :title="$t('doc')"
            :action="() => {}"
            inputType="doc"
            @files-selected="emitHandleAttachment($event)"
          />
        </div>
      </unnnic-dropdown>
    </div>
  </section>
</template>

<script>
import isMobile from 'is-mobile';

import EmojiPicker from './EmojiPicker';
import MoreActionsOption from './MoreActionsOption';

export default {
  name: 'TextBox',

  components: {
    EmojiPicker,
    MoreActionsOption,
  },

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  data: () => ({
    message: '',
    minTextareaRows: 1,
    maxTextareaRows: 5,
    currentTextAreaRows: 1,
    isEmojiPickerOpen: false,
  }),

  computed: {
    isMobile() {
      return isMobile();
    },
  },

  methods: {
    focus() {
      // accessed externaly
      this.$refs.textareaRef?.focus();
    },

    setIsFocused(isFocused = false) {
      this.$emit('is-focused-handler', isFocused);
    },

    handleTextarea(event) {
      if (typeof event === 'string') {
        this.message += event;
        this.$emit('input', this.message);
      } else {
        this.message = event.target.value;
        this.$emit('input', event.target.value);
      }
    },

    openEmojiPicker() {
      this.isEmojiPickerOpen = true;
    },

    closeEmojiPicker() {
      this.isEmojiPickerOpen = false;
    },

    handleEmojiPicker() {
      if (this.isEmojiPickerOpen) {
        this.closeEmojiPicker();
      } else {
        this.openEmojiPicker();
      }
    },

    emitHandleQuickMessages() {
      this.$emit('handle-quick-messages');
    },

    emitHandleAttachment(files) {
      console.log({ files });
      if (files) {
        this.$emit('handle-attachment', files);
      }
    },

    keyDownTextarea(event) {
      this.message = event.target.value;
      this.$emit('keydown', event);

      if (event.key === 'Enter' && !event.shiftKey && !!this.message.trim()) {
        this.clearTextarea();
      }
    },

    paste(event) {
      this.$emit('paste', event);
    },

    clearTextarea() {
      this.message = '';
      this.adjustTextareaHeight();
      this.$emit('is-typing-handler', false);
    },

    adjustTextareaHeight() {
      const textarea = this.$refs.textareaRef;
      textarea.style.height = 'auto';

      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
      const maxHeight = this.maxTextareaRows * lineHeight;

      const calculatedHeight = Math.min(maxHeight, textarea.scrollHeight);
      textarea.style.height = `${calculatedHeight}px`;

      const calculatedRows = Math.ceil(calculatedHeight / lineHeight);
      this.textAreaRows = calculatedRows;

      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'scroll' : 'hidden';
    },
  },

  watch: {
    value(newValue) {
      this.message = newValue;
      this.$emit('is-typing-handler', this.message.trim().length > 0);
      this.$nextTick(() => {
        this.adjustTextareaHeight();
      });
    },

    isEmojiPickerOpen(newValue) {
      if (newValue) {
        this.setIsFocused(true);
      } else if (this.$refs.textareaRef !== document.activeElement) {
        this.setIsFocused(false);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.text-box {
  position: relative;

  .text-editor {
    $padding-vertical: calc($unnnic-spacing-stack-nano / 2 + $unnnic-spacing-stack-xs);
    $mobile-button-size: 44px; // = button size large (46px) - 2px of message manager border

    outline: none;
    border-radius: $unnnic-border-radius-sm;

    padding-left: $unnnic-spacing-stack-sm;

    display: flex;
    align-items: flex-end;
    gap: $unnnic-spacing-inline-ant;

    color: $unnnic-color-neutral-dark;

    cursor: text;

    &.mobile {
      padding: 0;
      gap: 0;

      .text-input {
        padding: ($padding-vertical + 1px) 0;
      }
    }

    :deep(.text-editor__mobile-button) {
      width: $mobile-button-size;
      height: $mobile-button-size;
    }

    :deep(.emoji-button) {
      margin-bottom: $padding-vertical;
    }

    .text-input {
      border: none;

      padding: $padding-vertical 0;
      padding-right: $unnnic-spacing-inline-lg;

      flex: 1;

      font: {
        family: $unnnic-font-family-secondary;
        size: $unnnic-font-size-body-gt;
        weight: $unnnic-font-weight-regular;
      }
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
      color: $unnnic-color-neutral-cloudy;

      resize: none;
      overflow-y: hidden;
      outline: none;

      &::placeholder {
        color: $unnnic-color-neutral-cleanest;
      }
    }
  }
}
</style>
