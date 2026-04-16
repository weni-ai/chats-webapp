<template>
  <section class="text-box__actions">
    <section class="text-box__actions__items">
      <template
        v-for="(action, index) in enabledActions"
        :key="index"
      >
        <section class="text-box__actions__item">
          <UnnnicToolTip
            :enabled="!!action.tooltip"
            :text="action.tooltip"
            side="top"
          >
            <UnnnicButton
              :iconCenter="action.icon"
              :tooltip="action.tooltip"
              :disabled="action.disabled || isAiLoading"
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

        <AiTextImprovement
          v-if="action.insertAiAfter && showAiTextImprovement"
          @improvement-received="emit('improvementReceived', $event)"
          @improvement-cancelled="emit('improvementCancelled')"
        />
      </template>
    </section>
    <UnnnicButton
      :iconLeft="isInternalNote ? '' : 'send'"
      :tooltip="isInternalNote ? '' : $t('send')"
      :type="isInternalNote ? 'attention' : 'primary'"
      size="small"
      :text="isInternalNote ? $t('add') : $t('send')"
      :disabled="disableSendButton || isAiLoading"
      @click="emit('send')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useAiTextImprovement } from '@/store/modules/chats/aiTextImprovement';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import AiTextImprovement from './AiTextImprovement.vue';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'MessageManagerTextBoxActions',
});

const discussionsStore = useDiscussions();
const { activeDiscussion } = storeToRefs(discussionsStore);

const featureFlagStore = useFeatureFlag();

const messageManager = useMessageManager();
const { clearInputs } = messageManager;
const {
  inputMessage,
  isInternalNote,
  isEmojiPickerOpen,
  disableSendButton,
  audioRecorderStatus,
  audioMessage,
  mediaUploadFiles,
  isSuggestionBoxOpen,
} = storeToRefs(messageManager);

const aiTextImprovementStore = useAiTextImprovement();
const { isLoading: isAiLoading } = storeToRefs(aiTextImprovementStore);

const showAiTextImprovement = computed(() => {
  return (
    featureFlagStore.featureFlags?.active_features?.includes(
      'weniChatsAiTextImprovement',
    ) && !activeDiscussion.value?.uuid
  );
});

const emit = defineEmits<{
  startAudioRecording: [void];
  focusInput: [void];
  openUploadFiles: [void];
  send: [void];
  improvementReceived: [text: string];
  improvementCancelled: [void];
}>();

interface TextBoxAction {
  hideInDiscussion?: boolean;
  insertAiAfter?: boolean;
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
      insertAiAfter: true,
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
        emit('focusInput');
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
        clearInputs();
        emit('startAudioRecording');
      },
    },
    {
      icon: 'attach_file_add',
      tooltip: t('attach'),
      showDivider: !activeDiscussion.value?.uuid,
      disabled: checkDisabledAction('attach'),
      action: () => {
        clearInputs();
        emit('openUploadFiles');
      },
    },
    {
      hideInDiscussion: true,
      icon: 'add_notes',
      tooltip: isInternalNote.value
        ? t('close_internal_note')
        : t('internal_note'),
      pressed: isInternalNote.value,
      disabled: checkDisabledAction('internal_note'),
      action: () => {
        if (isInternalNote.value) {
          clearInputs();
        } else {
          isInternalNote.value = !isInternalNote.value;
        }

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
  const isValidInputMessage = isSuggestionBoxOpen.value
    ? !inputMessage.value.startsWith('/')
    : !!inputMessage.value.trim();
  const disabledActionsMap = {
    quick_message: () => {
      return (
        isValidInputMessage ||
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
        isValidInputMessage ||
        mediaUploadFiles.value.length > 0 ||
        isInternalNote.value
      );
    },
    attach: () => {
      return (
        isValidInputMessage ||
        mediaUploadFiles.value.length >= 5 ||
        audioRecorderStatus.value !== 'idle' ||
        !!audioMessage.value ||
        isInternalNote.value
      );
    },
    internal_note: () => {
      if (isInternalNote.value) {
        return false;
      }
      return (
        isValidInputMessage ||
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
    gap: $unnnic-space-2;
    align-items: center;
    justify-content: space-between;
    &__items {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: $unnnic-space-2;
    }
    &__item {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: $unnnic-space-2;
    }
    &__divider {
      height: stretch;
      border: 1px solid $unnnic-color-border-soft;
    }
  }
}
</style>
