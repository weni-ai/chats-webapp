<template>
  <section :class="['text-box', { 'text-box--focused': focused }]">
    <UnnnicAudioRecorder
      v-show="isAudioRecorderVisible"
      ref="audioRecorder"
      v-model="audioMessage"
      class="message-manager__audio-recorder"
      @status="updateAudioRecorderStatus"
    />
    <textarea
      v-if="!isAudioRecorderVisible"
      ref="textArea"
      :value="modelValue"
      :placeholder="$t('message')"
      :rows="currentTextAreaRows"
      :class="['text-box__textarea']"
      data-testid="text-area"
      spellcheck="true"
      @input="handleTextarea"
      @keydown="handleKeyDown"
      @paste="handlePaste"
      @focus="focused = true"
      @blur="focused = false"
    />
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
        iconLeft="send"
        :tooltip="$t('send')"
        type="primary"
        size="small"
        :text="$t('send')"
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
import { useTemplateRef, ref, computed, nextTick } from 'vue';
import i18n from '@/plugins/i18n';

interface Props {
  modelValue: string;
  audioMessage: HTMLAudioElement | null;
  audioRecorderStatus: string;
}

const { t } = i18n.global;

const MAX_TEXTAREA_ROWS = 5;
const currentTextAreaRows = ref(1);

const textareaRef = useTemplateRef('textArea');
const audioRecorderRef = useTemplateRef('audioRecorder');

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [string];
  'update:audioMessage': [HTMLAudioElement | null];
  'update:audioRecorderStatus': [string];
  paste: [Event];
  send: [void];
}>();

const isEmojiPickerOpen = ref(false);

const focused = ref(false);
const focus = () => {
  textareaRef.value?.focus();
};
const message = computed({
  get() {
    return props.modelValue;
  },
  set(value: string) {
    emit('update:modelValue', value);
    nextTick(() => {
      adjustTextareaHeight();
    });
  },
});
const audioMessage = computed({
  get() {
    return props.audioMessage;
  },
  set(value: HTMLAudioElement) {
    emit('update:audioMessage', value);
  },
});
const disableSendButton = computed(() => {
  return !message.value.trim() && !audioMessage.value;
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
      pressed: message.value.startsWith('/'),
      action: () => {
        message.value = message.value.startsWith('/') ? '' : '/';
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
        props.audioRecorderStatus,
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
      action: () => {
        console.log('Internal note');
      },
    },
  ];
});

const handleTextarea = (event: Event) => {
  if (typeof event === 'string') {
    message.value += event;
  } else {
    message.value = (event.target as HTMLTextAreaElement).value;
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
};

const handlePaste = (event: Event) => {
  emit('paste', event);
};

const handleSend = () => {
  emitSend();
  nextTick(() => {
    clearTextarea();
    emit('update:audioRecorderStatus', '');
  });
};

const clearTextarea = () => {
  currentTextAreaRows.value = 1;
  message.value = '';

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

const emitSend = () => {
  emit('send');
};

const isAudioRecorderVisible = computed(() => {
  return ['recording', 'recorded', 'playing', 'paused'].includes(
    props.audioRecorderStatus,
  );
});

const updateAudioRecorderStatus = (status: string) => {
  emit('update:audioRecorderStatus', status);
};

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
</style>
