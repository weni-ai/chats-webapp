<template>
  <div :class="['text-box', loadingValue !== undefined && 'status-loading']">
    <!-- <div v-if="loadingValue !== undefined" class="loading">
      <div class="indicator" :style="{ width: `${loadingValue * 100}%` }"></div>
    </div> -->

    <div class="text-editor" @click="$refs.textareaRef.focus()" @keypress.enter="() => {}">
      <div @click.stop="handleEmojiPicker" @keypress.enter="handleEmojiPicker">
        <unnnic-icon icon="emoji" class="clickable" size="ant" />
      </div>

      <emoji-picker
        v-if="isEmojiPickerOpen"
        @emojiSelected="handleTextarea"
        @close="closeEmojiPicker"
      />

      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
      <textarea
        placeholder="Mensagem"
        class="inside"
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
};
</script>

<style lang="scss" scoped>
.text-box {
  position: relative;

  .loading {
    grid-area: loading;
    width: 100%;
    height: $unnnic-border-width-thin;
    border-radius: $unnnic-border-radius-sm $unnnic-border-radius-sm 0 0;
    position: relative;
    overflow: hidden;
    background-color: rgba($unnnic-color-neutral-cleanest, $unnnic-opacity-level-light);

    .indicator {
      height: $unnnic-border-width-thin;
      background-color: $unnnic-color-neutral-cleanest;
      transition: width 0.2s;
    }
  }

  // &:not(.status-loading) .text-editor {
  //   border-radius: $unnnic-border-radius-sm;
  // }

  .text-editor {
    $padding-vertical: calc($unnnic-spacing-stack-nano / 2 + $unnnic-spacing-stack-xs);

    grid-area: text-editor;
    box-sizing: border-box;
    overflow: auto;
    // background-color: $unnnic-color-neutral-snow;
    // border-radius: 0 0 $unnnic-border-radius-sm $unnnic-border-radius-sm;
    border-radius: $unnnic-border-radius-sm;
    padding-left: $unnnic-spacing-stack-sm;
    // border: $unnnic-border-width-thinner solid $unnnic-color-neutral-clean;
    outline: none;
    color: $unnnic-color-neutral-dark;
    cursor: text;
    display: flex;
    align-items: flex-end;
    gap: $unnnic-spacing-inline-ant;

    .inside {
      color: $unnnic-color-neutral-cloudy;
      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-gt;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
      font-weight: $unnnic-font-weight-regular;
      border: none;
      padding: $padding-vertical 0;
      padding-right: $unnnic-spacing-inline-lg;
      resize: none;
      overflow-y: hidden;

      flex: 1;
      outline: none;

      &::placeholder {
        color: $unnnic-color-neutral-cloudy;
      }
    }

    .unnnic-icon {
      margin-bottom: $padding-vertical;
    }
  }
}
</style>
