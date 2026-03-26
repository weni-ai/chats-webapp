<template>
  <section
    :class="[
      'text-box',
      {
        'text-box--focused': inputMessageFocused,
        'internal-note': isInternalNote,
      },
    ]"
  >
    <MessageManagerTextBoxUploadField ref="uploadField" />
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
        ref="textArea"
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
    <hr class="text-box__divider" />
    <MessageManagerTextBoxActions
      @start-audio-recording="audioRecorderRef.record()"
      @open-upload-files="uploadFieldRef.clickInput()"
      @focus-input="focus"
      @send="handleSend"
    />
    <UnnnicEmojiPicker
      v-show="isEmojiPickerOpen"
      v-on-click-outside="() => (isEmojiPickerOpen = false)"
      @emoji-selected="handleTextarea"
      @close="isEmojiPickerOpen = false"
    />
  </section>
</template>

<script setup lang="ts">
import { useTemplateRef, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { vOnClickOutside } from '@vueuse/components';

import MessageManagerTextBoxMedias from './Medias.vue';
import MessageManagerTextBoxAudioRecorder from './AudioRecorder.vue';
import MessageManagerTextBoxActions from './Actions.vue';
import MessageManagerTextBoxUploadField from './UploadField.vue';

import { useMessageManager } from '@/store/modules/chats/messageManager';

defineOptions({
  name: 'MessageManagerTextBox',
});

const emit = defineEmits<{
  keydown: [KeyboardEvent];
  send: [void];
}>();

const messageManager = useMessageManager();
const { sendRoomMessage, sendMediasMessage } = messageManager;
const {
  inputMessage,
  audioMessage,
  audioRecorderStatus,
  isInternalNote,
  mediaUploadFiles,
  isEmojiPickerOpen,
  isAudioRecorderVisible,
  inputMessageFocused,
} = storeToRefs(messageManager);

const MAX_TEXTAREA_ROWS = 5;
const currentTextAreaRows = ref(1);

const textareaRef = useTemplateRef('textArea');
const audioRecorderRef = useTemplateRef('audioRecorder');
const uploadFieldRef = useTemplateRef('uploadField');

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

const handleSend = async () => {
  if (mediaUploadFiles.value.length > 0) {
    await sendMediasMessage();
  } else {
    await sendRoomMessage();
  }
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
