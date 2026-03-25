<template>
  <section
    :class="[
      'text-box',
      {
        'text-box--focused': focused,
        'internal-note': isInternalNote,
      },
    ]"
  >
    <UnnnicEmojiPicker
      v-show="isEmojiPickerOpen"
      @emoji-selected="handleTextarea"
      @close="isEmojiPickerOpen = false"
    />
    <MessageManagerTextBoxMedias v-if="mediaUploadFiles.length > 0" />
    <MessageManagerTextBoxAudioRecorder ref="audioRecorder" />
    <div
      v-if="isInternalNote"
      class="internal-note__close-button"
    >
      <UnnnicIcon
        class="internal-note__close-button__icon"
        icon="close"
        size="sm"
        scheme="neutral-white"
        clickable
        @click="isInternalNote = false"
      />
    </div>
    <section class="text-box__textarea-container">
      <p
        v-if="isInternalNote"
        class="internal-note__prefix"
      >
        {{ $t('internal_note') + ': ' }}
      </p>
      <textarea
        v-if="!isAudioRecorderVisible"
        ref="textArea"
        :value="inputMessage"
        :placeholder="isInternalNote ? '' : $t('message')"
        :rows="currentTextAreaRows"
        :class="['text-box__textarea', { 'internal-note': isInternalNote }]"
        data-testid="text-area"
        spellcheck="true"
        @input="handleTextarea"
        @keydown="handleKeyDown"
        @focus="focused = true"
        @blur="focused = false"
      />
    </section>
    <hr class="text-box__divider" />
    <MessageManagerTextBoxActions
      @start-audio-recording="audioRecorderRef.record()"
      @focus-input="focus"
    />
  </section>
</template>

<script setup lang="ts">
import { useTemplateRef, ref, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';

import MessageManagerTextBoxMedias from './Medias.vue';
import MessageManagerTextBoxAudioRecorder from './AudioRecorder.vue';
import MessageManagerTextBoxActions from './Actions.vue';

import { useMessageManager } from '@/store/modules/chats/messageManager';

defineOptions({
  name: 'MessageManagerTextBox',
});

const emit = defineEmits<{
  keydown: [KeyboardEvent];
  send: [void];
}>();

const messageManager = useMessageManager();
const {
  inputMessage,
  audioMessage,
  audioRecorderStatus,
  isInternalNote,
  mediaUploadFiles,
  isEmojiPickerOpen,
  isAudioRecorderVisible,
} = storeToRefs(messageManager);

const MAX_TEXTAREA_ROWS = 5;
const currentTextAreaRows = ref(1);

const textareaRef = useTemplateRef('textArea');
const audioRecorderRef = useTemplateRef('audioRecorder');

const focused = ref(false);
const focus = () => {
  textareaRef.value?.focus();
};

const handleTextarea = (event: Event) => {
  if (typeof event === 'string') {
    inputMessage.value += event;
  } else {
    inputMessage.value = (event.target as HTMLTextAreaElement).value;
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    // handleSend();
  }
  emit('keydown', event);
};

const handleSend = () => {
  nextTick(() => {
    clearTextarea();
    audioRecorderStatus.value = 'idle';
  });
};

const clearTextarea = () => {
  currentTextAreaRows.value = 1;
  inputMessage.value = '';
  audioMessage.value = null;
  audioRecorderStatus.value = 'idle';

  adjustTextareaHeight();
};

// TODO: check if this is correct after clearTextarea
const adjustTextareaHeight = () => {
  if (!textareaRef.value) return;
  textareaRef.value.style.height = 'auto';

  const lineHeight = parseFloat(getComputedStyle(textareaRef.value).lineHeight);

  const maxHeight = MAX_TEXTAREA_ROWS * lineHeight;

  const calculatedHeight = Math.min(maxHeight, textareaRef.value.scrollHeight);
  textareaRef.value.style.height = `${calculatedHeight}px`;

  const calculatedRows = Math.ceil(calculatedHeight / lineHeight);
  currentTextAreaRows.value = calculatedRows;

  textareaRef.value.style.overflowY =
    textareaRef.value.scrollHeight > maxHeight ? 'scroll' : 'hidden';
};

watch(inputMessage, () => {
  adjustTextareaHeight();
});

watch(isInternalNote, () => {
  clearTextarea();
});

defineExpose({
  focus,
});
</script>

<style scoped lang="scss">
.text-box {
  position: relative;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-2;
  background-color: $unnnic-color-bg-base;
  padding: $unnnic-space-3 $unnnic-space-4;
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;

  &--focused {
    border-color: $unnnic-color-border-active;
  }
  &__textarea {
    flex: 1;
    border: none;
    resize: none;
    overflow-y: auto;
    outline: none;
    font: $unnnic-font-body;
    max-height: 104px;
    &::placeholder {
      color: $unnnic-color-fg-muted;
    }
    &-container {
      width: 100%;
      display: flex;
      gap: $unnnic-space-1;
    }
  }
  &__divider {
    border: 1px solid $unnnic-color-border-soft;
    width: 100%;
  }
}

.internal-note {
  background-color: $unnnic-color-bg-warning;
  border-color: $unnnic-color-border-warning;
  &__prefix {
    font: $unnnic-font-body;
  }
  &__close-button {
    // TODO: Tokens
    position: fixed;
    width: 24px;
    margin-top: -33px;
    align-self: flex-end;

    background-color: $unnnic-color-fg-warning;
    padding: 0px $unnnic-spacing-nano;
    border-radius: $unnnic-radius-1 $unnnic-radius-1 0 0;

    display: flex;
    justify-content: center;
    margin-right: $unnnic-spacing-ant;
    justify-self: end;
    padding: $unnnic-space-05 $unnnic-spacing-nano;
  }
}
</style>
