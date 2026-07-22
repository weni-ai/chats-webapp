<template>
  <section class="text-box__actions">
    <section class="text-box__actions__items">
      <QuickMessageAction
        v-if="!isInDiscussion"
        @focus-input="emit('focusInput')"
      />
      <AiTextImprovementAction
        v-if="!isInDiscussion"
        @improvement-received="emit('improvementReceived', $event)"
        @improvement-cancelled="emit('improvementCancelled')"
      />
      <EmojiAction @focus-input="emit('focusInput')" />
      <hr class="text-box__actions__divider" />
      <AudioAction @toggle-audio-recording="emit('toggleAudioRecording')" />
      <AttachAction @open-upload-files="emit('openUploadFiles')" />
      <hr class="text-box__actions__divider" />
      <InternalNoteAction
        v-if="!isInDiscussion"
        @focus-input="emit('focusInput')"
      />
    </section>

    <DictationAction v-if="shouldShowDictationAction" />
    <SendAction
      v-else
      @send="emit('send')"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { isSpeechRecognitionSupported } from '@/composables/useSpeechRecognition';
import { useDiscussions } from '@/store/modules/chats/discussions';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useFeatureFlag } from '@/store/modules/featureFlag';

import QuickMessageAction from './QuickMessageAction.vue';
import AiTextImprovementAction from './AiTextImprovementAction.vue';
import EmojiAction from './EmojiAction.vue';
import AudioAction from './AudioAction.vue';
import AttachAction from './AttachAction.vue';
import InternalNoteAction from './InternalNoteAction.vue';
import DictationAction from './DictationAction.vue';
import SendAction from './SendAction.vue';

defineOptions({
  name: 'MessageManagerTextBoxActions',
});

const {
  isDictationListening,
  inputMessage,
  mediaUploadFiles,
  audioMessage,
  audioRecorderStatus,
  isInternalNote,
} = storeToRefs(useMessageManager());
const { activeDiscussion } = storeToRefs(useDiscussions());
const { featureFlags } = storeToRefs(useFeatureFlag());

const isInDiscussion = computed(() => !!activeDiscussion.value?.uuid);

const isSupportedVoiceRecognition = isSpeechRecognitionSupported();

const enabledDictationFeatureFlag = computed(() => {
  return featureFlags.value.active_features.includes(
    'weniChatsMessageDictation',
  );
});

const shouldShowDictationAction = computed(() => {
  if (!enabledDictationFeatureFlag.value || !isSupportedVoiceRecognition) {
    return false;
  }

  if (isDictationListening.value) {
    return true;
  }

  return (
    !inputMessage.value &&
    !mediaUploadFiles.value.length &&
    !audioMessage.value &&
    audioRecorderStatus.value !== 'recording' &&
    !isInternalNote.value
  );
});

const emit = defineEmits<{
  toggleAudioRecording: [void];
  focusInput: [void];
  openUploadFiles: [void];
  send: [void];
  improvementReceived: [text: string];
  improvementCancelled: [void];
}>();
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
