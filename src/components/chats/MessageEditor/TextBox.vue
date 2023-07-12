<template>
  <div class="text-box">
    <div class="text-editor" @click="$refs.textareaRef.focus()" @keypress.enter="() => {}">
      <div @click.stop="handleEmojiPicker" @keypress.enter="handleEmojiPicker">
        <unnnic-icon
          icon="emoji"
          :class="['emoji-button', 'clickable', message && 'typing']"
          size="ant"
        />
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
        @focus="isFocused = true"
        @blur="isFocused = false"
      ></textarea>
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
    handleTextarea(event) {
      if (typeof event === 'string') {
        this.message += event;
        this.$emit('input', this.message);
      } else {
        this.message = event.target.value;
        this.$emit('input', event.target.value);
      }

      this.$emit('is-typing-handler', this.message.length > 0);

      this.adjustTextareaHeight();
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
      textarea.style.height = `${textarea.scrollHeight}px`;

      if (this.message.length === 0) {
        this.textAreaRows = this.minTextareaRows;
        textarea.style.height = 'auto';
        textarea.style.overflowY = 'hidden';
        return;
      }

      const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight);
      const maxHeight = this.maxTextareaRows * lineHeight;
      if (textarea.scrollHeight > maxHeight) {
        this.textAreaRows = this.maxTextareaRows;
        textarea.style.overflowY = 'scroll';
        textarea.style.height = `${maxHeight}px`;
      } else {
        const calculatedRows = Math.ceil(textarea.scrollHeight / lineHeight);
        this.textAreaRows = calculatedRows;
        textarea.style.overflowY = 'hidden';
      }
    },
  },

  watch: {
    value(newValue) {
      this.message = newValue;
      this.$emit('is-typing-handler', this.message.length > 0);
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
        color: $unnnic-color-neutral-clean;
      }
    }

    :deep(.emoji-button) {
      margin-bottom: $padding-vertical;

      svg > path {
        fill: $unnnic-color-neutral-cloudy;
      }

      &.typing {
        svg > path {
          fill: $unnnic-color-neutral-cleanest;
        }
      }
    }
  }
}
</style>
