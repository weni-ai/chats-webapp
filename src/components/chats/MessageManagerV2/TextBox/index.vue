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
    <MessageManagerTextBoxTextArea
      ref="textArea"
      @keydown="handleKeyDown"
    />
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
      @emoji-selected="handleEmojiSelected"
      @close="isEmojiPickerOpen = false"
    />
  </section>
</template>

<script setup lang="ts">
import { useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { vOnClickOutside } from '@vueuse/components';

import MessageManagerTextBoxMedias from './Medias.vue';
import MessageManagerTextBoxAudioRecorder from './AudioRecorder.vue';
import MessageManagerTextBoxActions from './Actions.vue';
import MessageManagerTextBoxUploadField from './UploadField.vue';
import MessageManagerTextBoxTextArea from './TextArea.vue';

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
  inputMessageFocused,
} = storeToRefs(messageManager);

const textareaRef = useTemplateRef('textArea');
const audioRecorderRef = useTemplateRef('audioRecorder');
const uploadFieldRef = useTemplateRef('uploadField');

const focus = () => {
  textareaRef.value?.focus();
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
  }
  emit('keydown', event);
};

const handleEmojiSelected = (emoji: string) => {
  inputMessage.value += emoji;
};

const handleSend = async () => {
  if (mediaUploadFiles.value.length > 0) {
    await sendMediasMessage();
  } else {
    await sendRoomMessage();
  }
};

const clearTextarea = () => {
  inputMessage.value = '';
  audioMessage.value = null;
  audioRecorderStatus.value = 'idle';
};

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
  &.internal-note {
    background-color: $unnnic-color-bg-warning;
    border-color: $unnnic-color-border-warning;
  }
  &__divider {
    border: 1px solid $unnnic-color-border-soft;
    width: 100%;
  }
}
</style>
