<template>
  <div class="text-box">
    <div class="text-editor" @click="$refs.textareaRef.focus()" @keypress.enter="() => {}">
      <div @click.stop="handleEmojiPicker" @keypress.enter="handleEmojiPicker">
        <unnnic-icon icon="emoji" :class="['emoji-button', 'clickable']" size="ant" />
      </div>

      <emoji-picker
        v-show="isEmojiPickerOpen"
        @emojiSelected="handleTextarea"
        @close="closeEmojiPicker"
      />

      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
      <textarea
        placeholder="Mensagem"
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
    </div>
  </div>
</template>

<script>
import EmojiPicker from './EmojiPicker';

export default {
  name: 'TextBox',

  components: {
    EmojiPicker,
  },

  props: {
    loadingValue: {
      type: Number,
    },

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

  methods: {
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

    outline: none;
    border-radius: $unnnic-border-radius-sm;

    padding-left: $unnnic-spacing-stack-sm;

    display: flex;
    align-items: flex-end;
    gap: $unnnic-spacing-inline-ant;

    color: $unnnic-color-neutral-dark;

    overflow: auto;
    cursor: text;

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

    :deep(.emoji-button) {
      margin-bottom: $padding-vertical;

      svg > path {
        fill: $unnnic-color-neutral-clean;
      }
    }
  }
}
</style>
