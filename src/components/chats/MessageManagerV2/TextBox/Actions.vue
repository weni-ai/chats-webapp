<template>
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
      :loading="isLoadingSend"
      @click="emit('send')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'MessageManagerTextBoxActions',
});

const messageManager = useMessageManager();
const {
  inputMessage,
  isInternalNote,
  isEmojiPickerOpen,
  disableSendButton,
  audioRecorderStatus,
  isLoadingSend,
} = storeToRefs(messageManager);

const emit = defineEmits<{
  startAudioRecording: [void];
  focusInput: [void];
  openUploadFiles: [void];
  send: [void];
}>();

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
        emit('focusInput');
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
        emit('startAudioRecording');
      },
    },
    {
      icon: 'attach_file_add',
      tooltip: t('attach'),
      showDivider: true,
      action: () => {
        emit('openUploadFiles');
      },
    },
    {
      icon: 'add_notes',
      tooltip: t('internal_note'),
      pressed: isInternalNote.value,
      action: () => {
        isInternalNote.value = !isInternalNote.value;
        emit('focusInput');
      },
    },
  ];
});
</script>

<style scoped lang="scss">
.text-box {
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
