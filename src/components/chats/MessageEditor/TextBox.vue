<template>
  <div :class="['text-box', loadingValue !== undefined && 'status-loading']">
    <!-- <div v-if="loadingValue !== undefined" class="loading">
      <div class="indicator" :style="{ width: `${loadingValue * 100}%` }"></div>
    </div> -->

    <div class="text-editor" @click="$refs.textareaRef.focus()" @keypress.enter="() => {}">
      <unnnic-icon icon="emoji" class="clickable" size="ant" />
      <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
      <textarea
        placeholder="Mensagem"
        class="inside"
        ref="textareaRef"
        :rows="currentTextAreaRows"
        :value="value"
        @input="handleTextarea"
        @keydown="keyDownTextarea"
        @focus="isFocused = true"
        @blur="isFocused = false"
      ></textarea>
    </div>
    <div class="actions">
      <unnnic-button-icon v-if="!isTyping" type="secondary" size="large" icon="microphone" />

      <unnnic-dropdown :open="true" position="top-left" class="more-actions">
        <unnnic-button-icon
          slot="trigger"
          v-if="!isTyping"
          type="primary"
          size="large"
          icon="add-1"
        />

        <div class="more-actions-container">
          <more-actions-option
            :action="() => emitAction('quick-messages')"
            icon="flash-1-4"
            :title="$t('quick_message')"
          />
          <!-- <more-actions-option
            :action="() => {}"
            icon="study-light-idea-1"
            :title="$t('suggested_answers')"
          /> -->
          <more-actions-option
            :action="() => emitAction('attachment')"
            icon="attachment"
            :title="$t('attach')"
          />
        </div>
      </unnnic-dropdown>

      <unnnic-button-icon
        v-if="isTyping"
        @click="$emit('send')"
        type="secondary"
        size="large"
        icon="send-email-3-1"
      />
    </div>
  </div>
</template>

<script>
import MoreActionsOption from './MoreActionsOption';

export default {
  name: 'TextBox',
  components: {
    MoreActionsOption,
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
    isTyping: false,
  }),

  methods: {
    handleTextarea(event) {
      this.message = event.target.value;
      this.$emit('input', event.target.value);

      this.isTyping = this.message.length > 0;

      this.adjustTextareaHeight();
    },

    keyDownTextarea(event) {
      this.message = event.target.value;
      this.$emit('keydown', event);

      if (event.key === 'Enter' && !event.shiftKey && !!this.message.trim()) {
        this.clearTextarea();
      }
    },

    clearTextarea() {
      this.message = '';
      this.adjustTextareaHeight();
      this.isTyping = false;
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

    emitAction(action) {
      this.$emit(`action-${action}`);
    },
  },
};
</script>

<style lang="scss" scoped>
.text-box {
  display: grid;
  grid-template-areas:
    'loading loading-side'
    'text-editor actions'
    'format empty';
  grid-template-columns: 1fr auto;
  grid-column-gap: $unnnic-spacing-inline-xs;
  align-items: end;

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

  &:not(.status-loading) .text-editor {
    border-radius: $unnnic-border-radius-sm;
  }

  .text-editor {
    $padding-vertical: calc($unnnic-spacing-stack-nano / 2 + $unnnic-spacing-stack-xs);

    grid-area: text-editor;
    box-sizing: border-box;
    overflow: auto;
    background-color: $unnnic-color-neutral-snow;
    border-radius: 0 0 $unnnic-border-radius-sm $unnnic-border-radius-sm;
    padding-left: $unnnic-spacing-stack-sm;
    border: $unnnic-border-width-thinner solid $unnnic-color-neutral-clean;
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

  .actions {
    grid-area: actions;
    display: flex;
    gap: $unnnic-spacing-stack-xs;

    .more-actions {
      ::v-deep .unnnic-dropdown__content {
        padding: 0 $unnnic-spacing-inset-sm;
      }
    }
  }
}
</style>
