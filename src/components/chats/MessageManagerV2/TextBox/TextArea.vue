<template>
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
  <section
    v-if="!isAudioRecorderVisible && mediaUploadFiles.length === 0"
    class="text-box__textarea-container"
  >
    <p
      v-if="isInternalNote"
      class="internal-note__prefix"
    >
      {{ $t('internal_note') + ': ' }}
    </p>
    <textarea
      ref="textInput"
      :value="inputMessage"
      :placeholder="isInternalNote ? '' : $t('message')"
      :rows="currentTextAreaRows"
      :class="['text-box__textarea', { 'internal-note': isInternalNote }]"
      data-testid="text-area"
      spellcheck="true"
      @input="handleTextarea"
      @keydown="handleKeyDown"
      @focus="inputMessageFocused = true"
      @blur="inputMessageFocused = false"
      @paste="handlePaste"
    />
  </section>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';

defineOptions({
  name: 'MessageManagerTextBoxTextArea',
});

const emit = defineEmits<{
  keydown: [KeyboardEvent];
}>();

const messageManager = useMessageManager();
const {
  inputMessage,
  isInternalNote,
  mediaUploadFiles,
  isAudioRecorderVisible,
  inputMessageFocused,
} = storeToRefs(messageManager);

const MAX_TEXTAREA_ROWS = 5;
const currentTextAreaRows = ref(1);

const textInputRef = useTemplateRef<HTMLTextAreaElement>('textInput');

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
  }
  emit('keydown', event);
};

const handlePaste = (event: ClipboardEvent) => {
  const { items } = event.clipboardData || {};
  const itemsArray = [...items];
  const imagePastes = itemsArray.filter(
    (item) => item.type.includes('image') || item.type === 'video/mp4',
  );

  const fileList = imagePastes.map((imagePaste) => {
    const blob = imagePaste.getAsFile();
    const dateOfPrintPaste = new Date(Date.now()).toUTCString();
    const fileName =
      blob.name === 'image.png' ? `${dateOfPrintPaste}.png` : blob.name;
    const file = new File([blob], fileName, { type: blob.type });
    return file;
  });

  if (fileList.length) {
    mediaUploadFiles.value = [...mediaUploadFiles.value, ...fileList];
  }
};

const adjustTextareaHeight = () => {
  if (!textInputRef.value) return;
  textInputRef.value.style.height = 'auto';

  const lineHeight = parseFloat(
    getComputedStyle(textInputRef.value).lineHeight,
  );

  const maxHeight = MAX_TEXTAREA_ROWS * lineHeight;

  const calculatedHeight = Math.min(maxHeight, textInputRef.value.scrollHeight);
  textInputRef.value.style.height = `${calculatedHeight}px`;

  const calculatedRows = Math.ceil(calculatedHeight / lineHeight);
  currentTextAreaRows.value = calculatedRows;

  textInputRef.value.style.overflowY =
    textInputRef.value.scrollHeight > maxHeight ? 'scroll' : 'hidden';
};

watch(inputMessage, () => {
  adjustTextareaHeight();
});

const focus = () => {
  textInputRef.value?.focus();
};

defineExpose({
  focus,
});
</script>

<style scoped lang="scss">
.text-box__textarea-container {
  width: 100%;
  display: flex;
  gap: $unnnic-space-1;
}

.text-box__textarea {
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
}

.internal-note {
  background-color: $unnnic-color-bg-warning;
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
