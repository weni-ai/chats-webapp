<template>
  <section class="message-manager-v2">
    <MessageManagerTextBox
      ref="messageManagerTextBox"
      @keydown="onKeyDown"
    />
    <SuggestionBox
      v-if="!activeDiscussion?.uuid"
      :search="inputMessage"
      :keyboardEvent="keyboardEvent"
      @open="isSuggestionBoxOpen = true"
      @close="isSuggestionBoxOpen = false"
      @select="(text) => setMessage(text)"
    />
    <CoPilot
      v-if="isCopilotOpen"
      @select="(text) => setMessage(text)"
    />
  </section>
</template>

<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue';
import { storeToRefs } from 'pinia';

import MessageManagerTextBox from './TextBox/index.vue';
import SuggestionBox from './SuggestionBox/index.vue';
import CoPilot from './CoPilot.vue';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { useMessageManager } from '@/store/modules/chats/messageManager';

defineOptions({
  name: 'MessageManagerV2',
});

const discussionsStore = useDiscussions();
const { activeDiscussion } = storeToRefs(discussionsStore);

const messageManager = useMessageManager();
const { inputMessage, isCopilotOpen, isSuggestionBoxOpen } =
  storeToRefs(messageManager);

const keyboardEvent = ref<KeyboardEvent | null>(null);
const messageManagerTextBoxRef = useTemplateRef('messageManagerTextBox');

const focusMessageManagerTextBox = () => {
  nextTick(() => {
    messageManagerTextBoxRef.value?.focus();
  });
};

const setMessage = (message: string) => {
  inputMessage.value = message || '';

  if (isCopilotOpen.value) {
    isCopilotOpen.value = false;
  }

  focusMessageManagerTextBox();
};

const onKeyDown = (event: KeyboardEvent) => {
  if (isSuggestionBoxOpen.value) {
    if (event.key === 'Escape') {
      isSuggestionBoxOpen.value = false;
      inputMessage.value = '';
      return;
    }

    keyboardEvent.value = event;
    return;
  }

  if (event.key === 'Enter') {
    if (event.shiftKey) return;
    // this.send();
    event.preventDefault();
  }

  // if (event.key === 'Escape' && this.isInternalNote) {
  //   // this.handleInternalNoteInput();
  //   event.preventDefault();
  // }
};
</script>

<style lang="scss" scoped>
.message-manager-v2 {
  position: relative;

  display: grid;
  grid-template-columns: 1fr auto;
  gap: $unnnic-space-2;
  align-items: end;
}
</style>
