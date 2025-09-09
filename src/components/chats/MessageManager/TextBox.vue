<template>
  <!-- eslint-disable vuejs-accessibility/form-control-has-label -->
  <!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
  <section
    class="text-box"
    :class="{ 'internal-note': isInternalNote }"
  >
    <div
      v-if="isInternalNote"
      class="internal-note-close-button"
    >
      <UnnnicIcon
        class="internal-note-close-button__icon"
        icon="close"
        size="ant"
        scheme="neutral-white"
        clickable
        @click="$emit('close-internal-note')"
      />
    </div>
    <div
      class="text-editor"
      :class="{ mobile: isMobile, 'internal-note': isInternalNote }"
      @click="$refs.textareaRef.focus()"
    >
      <UnnnicButton
        v-if="isMobile"
        class="text-editor__mobile-button"
        iconCenter="bolt"
        type="tertiary"
        scheme="neutral-dark"
        data-testid="mobile-button-quick-message"
        @click.stop="emitHandleQuickMessages"
      />

      <div
        v-else
        @click.stop="handleEmojiPicker"
      >
        <UnnnicIcon
          icon="add_reaction"
          :scheme="isInternalNote ? 'feedback-yellow' : 'neutral-clean'"
          :class="['emoji-button', 'clickable']"
          data-testid="emoji-button"
          size="ant"
        />
      </div>

      <UnnnicEmojiPicker
        v-show="isEmojiPickerOpen"
        @emoji-selected="handleTextarea"
        @close="closeEmojiPicker"
      />

      <section class="text-input-container">
        <p
          v-if="isInternalNote"
          class="internal-note-prefix"
        >
          {{ $t('internal_note') + ': ' }}
        </p>
        <textarea
          ref="textareaRef"
          :value="modelValue"
          :placeholder="isInternalNote ? '' : $t('message')"
          :rows="currentTextAreaRows"
          :class="['text-input', { 'internal-note': isInternalNote }]"
          data-testid="text-area"
          @input="handleTextarea"
          @keydown="keyDownTextarea"
          @paste="paste"
          @focus="setIsFocused(true)"
          @blur="setIsFocused(false)"
        />
      </section>

      <UnnnicDropdown
        v-if="isMobile"
        position="top-left"
        class="more-actions"
      >
        <template #trigger>
          <UnnnicButton
            class="text-editor__mobile-button"
            iconCenter="attachment"
            type="tertiary"
            scheme="neutral-dark"
            next
            data-testid="mobile-button-attachment"
          />
        </template>

        <div class="more-actions-container">
          <MoreActionsOption
            icon="image"
            :title="$t('photo_or_video')"
            :action="() => emitOpenFileUploader({ filesType: 'image' })"
          />
          <MoreActionsOption
            icon="article"
            :title="$t('doc')"
            :action="() => emitOpenFileUploader({ filesType: 'doc' })"
          />
        </div>
      </UnnnicDropdown>
    </div>
  </section>
</template>

<script>
import isMobile from 'is-mobile';

import MoreActionsOption from './MoreActionsOption.vue';

export default {
  name: 'TextBox',

  components: {
    MoreActionsOption,
  },

  props: {
    modelValue: {
      type: String,
      default: '',
    },
    isInternalNote: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'is-typing-handler',
    'is-focused-handler',
    'update:modelValue',
    'handle-quick-messages',
    'open-file-uploader',
    'keydown',
    'paste',
    'close-internal-note',
  ],

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

  watch: {
    modelValue(newValue) {
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
        this.$emit('update:modelValue', this.message);
      } else {
        this.message = event.target.value;
        this.$emit('update:modelValue', event.target.value);
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

    emitOpenFileUploader({ filesType }) {
      this.$emit('open-file-uploader', null, filesType);
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

      textarea.style.overflowY =
        textarea.scrollHeight > maxHeight ? 'scroll' : 'hidden';
    },
  },
};
</script>

<style lang="scss" scoped>
.internal-note {
  background-color: $unnnic-color-aux-baby-yellow;
}
.text-box {
  position: relative;

  border: $unnnic-border-width-thinner solid $unnnic-color-neutral-cleanest;
  border-radius: $unnnic-border-radius-sm;
  background-color: $unnnic-color-neutral-snow;

  &.internal-note {
    border: unset;
    border-radius: unset;
    background-color: unset;
  }

  .internal-note-close-button {
    background-color: $unnnic-color-feedback-yellow;
    padding: 0px $unnnic-spacing-nano;
    border-top-left-radius: $unnnic-border-radius-md;
    border-top-right-radius: $unnnic-border-radius-md;

    display: flex;
    justify-content: center;
    margin-right: $unnnic-spacing-ant;
    justify-self: end;
    padding: 2px $unnnic-spacing-nano;

    &__icon {
      font-size: $unnnic-font-size-body-lg;
    }
  }

  .text-editor {
    $padding-vertical: calc(
      $unnnic-spacing-stack-nano / 2 + $unnnic-spacing-stack-xs
    );
    $mobile-button-size: 44px; // = button size large (46px) - 2px of message manager border

    outline: none;
    border-radius: $unnnic-border-radius-sm;

    padding-left: $unnnic-spacing-stack-sm;

    display: flex;
    align-items: flex-end;
    gap: $unnnic-spacing-inline-ant;

    color: $unnnic-color-neutral-dark;

    cursor: text;

    .text-input-container {
      display: flex;
      gap: $unnnic-spacing-nano;
    }

    .internal-note-prefix {
      font-size: $unnnic-font-size-body-gt;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-medium;
      padding: 10px 0;
      color: $unnnic-color-neutral-cloudy;
    }

    &.internal-note {
      border: 1px solid $unnnic-color-feedback-yellow;
    }

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
