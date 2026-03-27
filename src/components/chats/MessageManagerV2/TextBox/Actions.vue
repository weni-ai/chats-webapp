<template>
  <section class="text-box__actions">
    <section class="text-box__actions__items">
      <section
        v-for="(action, index) in enabledActions"
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
      @click="emit('send')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useDiscussions } from '@/store/modules/chats/discussions';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'MessageManagerTextBoxActions',
});

const discussionsStore = useDiscussions();
const { activeDiscussion } = storeToRefs(discussionsStore);

const messageManager = useMessageManager();
const {
  inputMessage,
  isInternalNote,
  isEmojiPickerOpen,
  disableSendButton,
  audioRecorderStatus,
  isLoadingSend,
  audioMessage,
  mediaUploadFiles,
  isSuggestionBoxOpen,
} = storeToRefs(messageManager);

const emit = defineEmits<{
  startAudioRecording: [void];
  focusInput: [void];
  openUploadFiles: [void];
  send: [void];
}>();

interface TextBoxAction {
  hideInDiscussion?: boolean;
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
      hideInDiscussion: true,
      icon: 'bolt',
      tooltip: t('quick_message'),
      pressed: isSuggestionBoxOpen.value,
      disabled: checkDisabledAction('quick_message'),
      action: () => {
        const inQuickMessageMode =
          isSuggestionBoxOpen.value || inputMessage.value.startsWith('/');
        if (inQuickMessageMode) {
          inputMessage.value = '';
          isSuggestionBoxOpen.value = false;
        } else {
          inputMessage.value = '/';
        }
        emit('focusInput');
      },
    },
    {
      icon: 'add_reaction',
      tooltip: 'Emoji',
      showDivider: true,
      pressed: isEmojiPickerOpen.value,
      disabled: checkDisabledAction('emoji'),
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
      disabled: checkDisabledAction('audio'),
      action: () => {
        emit('startAudioRecording');
      },
    },
    {
      icon: 'attach_file_add',
      tooltip: t('attach'),
      showDivider: !activeDiscussion.value?.uuid,
      disabled: checkDisabledAction('attach'),
      action: () => {
        emit('openUploadFiles');
      },
    },
    {
      hideInDiscussion: true,
      icon: 'add_notes',
      tooltip: t('internal_note'),
      pressed: isInternalNote.value,
      disabled: checkDisabledAction('internal_note'),
      action: () => {
        isInternalNote.value = !isInternalNote.value;
        emit('focusInput');
      },
    },
  ];
});

const enabledActions = computed(() => {
  if (activeDiscussion.value?.uuid) {
    return actions.value.filter((action) => !action.hideInDiscussion);
  }
  return actions.value;
});

const checkDisabledAction = (action: string) => {
  const disabledActionsMap = {
    quick_message: () => {
      const validInputMessage =
        !!inputMessage.value.trim() && !inputMessage.value.startsWith('/');
      return (
        validInputMessage ||
        !!audioMessage.value ||
        mediaUploadFiles.value.length > 0 ||
        audioRecorderStatus.value !== 'idle' ||
        isInternalNote.value
      );
    },
    emoji: () => {
      return (
        audioRecorderStatus.value !== 'idle' ||
        !!audioMessage.value ||
        mediaUploadFiles.value.length > 0 ||
        inputMessage.value.startsWith('/')
      );
    },
    audio: () => {
      return (
        !!inputMessage.value.trim() ||
        mediaUploadFiles.value.length > 0 ||
        isInternalNote.value
      );
    },
    attach: () => {
      return (
        !!inputMessage.value.trim() ||
        mediaUploadFiles.value.length >= 5 ||
        audioRecorderStatus.value !== 'idle' ||
        !!audioMessage.value ||
        isInternalNote.value
      );
    },
    internal_note: () => {
      return (
        !!inputMessage.value.trim() ||
        mediaUploadFiles.value.length > 0 ||
        !!audioMessage.value ||
        audioRecorderStatus.value !== 'idle'
      );
    },
  };

  return disabledActionsMap[action]?.();
};
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
