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
    <UnnnicAudioRecorder
      v-show="isAudioRecorderVisible"
      ref="audioRecorder"
      v-model="audioMessage"
      class="message-manager__audio-recorder"
      @status="(status) => (audioRecorderStatus = status)"
    />
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
    <section class="text-box__actions">
      <section class="text-box__actions__items">
        <section
          v-for="(action, index) in actions"
          :key="index"
          class="text-box__actions__item"
        >
          <UnnnicToolTip
            :enabled="!!action.tooltip"
            :text="action.tooltip"
            side="top"
          >
            <UnnnicButton
              :iconCenter="action.icon"
              :tooltip="action.tooltip"
              :disabled="action.disabled"
              type="tertiary"
              size="small"
              :pressed="action.pressed"
              @click.stop="action.action()"
            />
          </UnnnicToolTip>
          <hr
            v-if="action.showDivider"
            class="text-box__actions__divider"
          />
        </section>
      </section>
      <UnnnicButton
        :iconLeft="isInternalNote ? '' : 'send'"
        :tooltip="isInternalNote ? '' : $t('send')"
        :type="isInternalNote ? 'attention' : 'primary'"
        size="small"
        :text="isInternalNote ? $t('add') : $t('send')"
        :disabled="disableSendButton"
        @click="handleSend"
      />
    </section>
    <UnnnicEmojiPicker
      v-show="isEmojiPickerOpen"
      @emoji-selected="handleTextarea"
      @close="isEmojiPickerOpen = false"
    />
  </section>
</template>

<script setup lang="ts">
import { useTemplateRef, ref, computed, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'MessageManagerTextBox',
});

const emit = defineEmits<{
  keydown: [KeyboardEvent];
  send: [void];
}>();

const { t } = i18n.global;

const messageManager = useMessageManager();
const { inputMessage, audioMessage, audioRecorderStatus, isInternalNote } =
  storeToRefs(messageManager);

const MAX_TEXTAREA_ROWS = 5;
const currentTextAreaRows = ref(1);

const textareaRef = useTemplateRef('textArea');
const audioRecorderRef = useTemplateRef('audioRecorder');

const isEmojiPickerOpen = ref(false);

const focused = ref(false);
const focus = () => {
  textareaRef.value?.focus();
};

const disableSendButton = computed(() => {
  return !inputMessage.value.trim() && !audioMessage.value;
});

interface TextBoxAction {
  icon: string;
  tooltip?: string;
  disabled?: boolean;
  showDivider?: boolean;
  pressed?: boolean;
  action: () => void;
}
const actions = computed<TextBoxAction[]>(() => {
  return [
    {
      icon: 'bolt',
      tooltip: t('quick_message'),
      pressed: inputMessage.value.startsWith('/'),
      action: () => {
        inputMessage.value = inputMessage.value.startsWith('/') ? '' : '/';
        focus();
      },
    },
    {
      icon: 'add_reaction',
      tooltip: 'Emoji',
      showDivider: true,
      pressed: isEmojiPickerOpen.value,
      action: () => {
        isEmojiPickerOpen.value = !isEmojiPickerOpen.value;
      },
    },
    {
      icon: 'mic',
      tooltip: t('audio_message'),
      pressed: ['recording', 'recorded', 'playing', 'paused'].includes(
        audioRecorderStatus.value,
      ),
      action: () => {
        audioRecorderRef.value?.record();
      },
    },
    {
      icon: 'attach_file_add',
      tooltip: t('attach'),
      showDivider: true,
      action: () => {
        console.log('Attach file');
      },
    },
    {
      icon: 'add_notes',
      tooltip: t('internal_note'),
      pressed: isInternalNote.value,
      action: () => {
        isInternalNote.value = !isInternalNote.value;
      },
    },
  ];
});

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

const isAudioRecorderVisible = computed(() => {
  return ['recording', 'recorded', 'playing', 'paused'].includes(
    audioRecorderStatus.value,
  );
});

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

  :deep(.audio-handler__time) {
    display: inline-block;
    min-width: 56px; // TODO: check if this is correct
  }

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
  &__actions {
    display: flex;
    gap: $unnnic-space-1;
    align-items: center;
    justify-content: space-between;
    &__items {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: $unnnic-space-1;
    }
    &__item {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: $unnnic-space-1;
    }
    &__divider {
      height: stretch;
      border: 1px solid $unnnic-color-border-soft;
    }
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
