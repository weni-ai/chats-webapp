<template>
  <button
    v-if="isInternalNote"
    class="internal-note__close-button"
  >
    <UnnnicIcon
      class="internal-note__close-button__icon"
      icon="close"
      size="sm"
      scheme="neutral-white"
      clickable
      @click="closeInternalNote"
    />
  </button>
  <section
    v-if="isAiImproving"
    class="text-box__textarea-container"
  >
    <p class="text-box__ai-loading-text">
      {{ $t('ai_text_improvement.improving_response') }}
    </p>
    <span class="text-box__ai-loading-dots">
      <span class="text-box__ai-loading-dot" />
      <span class="text-box__ai-loading-dot" />
      <span class="text-box__ai-loading-dot" />
    </span>
  </section>
  <section
    v-else-if="showTextareaInput"
    class="text-box__input-block"
  >
    <section class="text-box__textarea-container">
      <p
        v-if="isInternalNote"
        class="internal-note__prefix"
      >
        {{ `${$t('internal_note')}: ` }}
      </p>
      <textarea
        ref="textInput"
        :value="inputMessage"
        :placeholder="
          isInternalNote ? '' : $t('chats.message_input_placeholder')
        "
        rows="1"
        :class="['text-box__textarea', { 'internal-note': isInternalNote }]"
        data-testid="text-area"
        spellcheck="true"
        :disabled="isDisabledInput"
        @input="handleTextarea"
        @keydown="handleKeyDown"
        @focus="inputMessageFocused = true"
        @blur="inputMessageFocused = false"
        @paste="handlePaste"
      />
    </section>
    <MessageManagerTextBoxMedias
      v-if="isInternalNote && mediaUploadFiles.length > 0"
      class="text-box__internal-note-medias"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, useTemplateRef, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';

import MessageManagerTextBoxMedias from './Medias.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';

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
  isDisabledInput,
} = storeToRefs(messageManager);

const { addMediaUploadFiles, clearInputs } = messageManager;

const aiTextImprovementStore = useAiTextImprovement();
const { isLoading: isAiImproving } = storeToRefs(aiTextImprovementStore);

const MAX_TEXTAREA_ROWS = 5;

const textInputRef = useTemplateRef<HTMLTextAreaElement>('textInput');

const showTextareaInput = computed(() => {
  if (isAudioRecorderVisible.value) {
    return false;
  }

  if (mediaUploadFiles.value.length > 0 && !isInternalNote.value) {
    return false;
  }

  return true;
});

function getLineHeightPx(el: HTMLTextAreaElement): number {
  const computed = getComputedStyle(el);
  const raw = computed.lineHeight;

  if (raw.endsWith('px')) {
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const fontSize = parseFloat(computed.fontSize);
  if (!Number.isFinite(fontSize) || fontSize <= 0) return 20;

  const multiplier = parseFloat(raw);
  if (Number.isFinite(multiplier) && multiplier > 0) {
    return fontSize * multiplier;
  }

  return fontSize * 1.25;
}

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
    addMediaUploadFiles(fileList);
  }
};

const adjustTextareaHeight = () => {
  const el = textInputRef.value;
  if (!el) return;

  const lineHeight = getLineHeightPx(el);
  const maxHeight = MAX_TEXTAREA_ROWS * lineHeight;

  el.style.height = 'auto';
  el.style.overflowY = 'hidden';

  const scrollH = el.scrollHeight;
  const nextHeight = Math.min(maxHeight, Math.max(lineHeight, scrollH));
  el.style.height = `${nextHeight}px`;
  el.style.overflowY = scrollH > maxHeight ? 'scroll' : 'hidden';
};

const closeInternalNote = () => {
  isInternalNote.value = false;
  clearInputs();
};

watch(inputMessage, adjustTextareaHeight, { flush: 'post' });

watch(
  () => [
    isAudioRecorderVisible.value,
    mediaUploadFiles.value.length,
    isInternalNote.value,
  ],
  () => {
    if (showTextareaInput.value) {
      nextTick(adjustTextareaHeight);
    }
  },
  { flush: 'post' },
);

onMounted(() => {
  nextTick(adjustTextareaHeight);
});

const focus = () => {
  textInputRef.value?.focus();
};

defineExpose({
  focus,
});
</script>

<style scoped lang="scss">
.text-box {
  &__input-block {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }
  &__textarea-container {
    width: 100%;
    display: flex;
    gap: $unnnic-space-1;
  }
  &__internal-note-medias {
    width: 100%;
  }
  &__textarea {
    flex: 1;
    border: none;
    resize: none;
    overflow-y: hidden;
    outline: none;
    font: $unnnic-font-body;
    max-height: 104px;

    background-color: transparent;
    color: $unnnic-color-fg-emphasized;
    caret-color: $unnnic-color-fg-emphasized;

    &::placeholder {
      color: $unnnic-color-fg-muted;
    }

    &.internal-note {
      color: $unnnic-color-fg-base;
      caret-color: $unnnic-color-fg-base;
    }
  }
  &__ai-loading-text {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-muted;
  }
  &__ai-loading-dots {
    display: inline-flex;
    align-items: flex-end;
    gap: 3px;
    margin-left: $unnnic-space-1;
    padding-bottom: $unnnic-space-1;
  }
  &__ai-loading-dot {
    display: inline-block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: $unnnic-color-fg-muted;
    animation: dot-jump 1.4s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.16s;
    }
    &:nth-child(3) {
      animation-delay: 0.32s;
    }
  }
}

.internal-note {
  &__prefix {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }
  &__close-button {
    position: fixed;
    width: $unnnic-space-6;
    margin-top: -33px;

    background-color: $unnnic-color-bg-yellow-strong;
    padding: 0px $unnnic-spacing-nano;
    border-radius: $unnnic-radius-1 $unnnic-radius-1 0 0;

    display: flex;
    justify-content: center;
    margin-right: $unnnic-spacing-ant;
    justify-self: end;
    padding: $unnnic-space-05 $unnnic-spacing-nano;
  }
}

@keyframes dot-jump {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}
</style>
