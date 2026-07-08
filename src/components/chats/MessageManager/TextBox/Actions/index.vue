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
    <SendAction @send="emit('send')" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import { useDiscussions } from '@/store/modules/chats/discussions';

import QuickMessageAction from './QuickMessageAction.vue';
import AiTextImprovementAction from './AiTextImprovementAction.vue';
import EmojiAction from './EmojiAction.vue';
import AudioAction from './AudioAction.vue';
import AttachAction from './AttachAction.vue';
import InternalNoteAction from './InternalNoteAction.vue';
import SendAction from './SendAction.vue';

defineOptions({
  name: 'MessageManagerTextBoxActions',
});

const { activeDiscussion } = storeToRefs(useDiscussions());

const isInDiscussion = computed(() => !!activeDiscussion.value?.uuid);

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
