<template>
  <section class="message-manager-v2">
    <MessageManagerLoading v-if="isLoading" />
    <MessageManagerTextBox
      v-else
      ref="messageManagerTextBox"
      @keydown="onKeyDown"
    />
    <SuggestionBox
      v-if="!activeDiscussion?.uuid"
      :search="inputMessage"
      :keyboardEvent="keyboardEvent"
      :ignoreClickOutside="suggestionBoxIgnoreClickOutside"
      @open="isSuggestionBoxOpen = true"
      @hide="isSuggestionBoxOpen = false"
      @close="closeSuggestionBox"
      @select="(text) => setMessage(text)"
    />
    <CoPilot
      v-if="isCopilotOpen"
      @select="(text) => setMessage(text)"
    />
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import { storeToRefs } from 'pinia';

import MessageManagerLoading from './MessageManagerLoading.vue';
import MessageManagerTextBox from './TextBox/index.vue';
import SuggestionBox from './SuggestionBox/index.vue';
import CoPilot from './CoPilot.vue';

import { useDiscussions } from '@/store/modules/chats/discussions';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { useRooms } from '@/store/modules/chats/rooms';
import { useProfile } from '@/store/modules/profile';

defineOptions({
  name: 'MessageManagerV2',
});

interface Props {
  isLoading: boolean;
}

const props = defineProps<Props>();

const profileStore = useProfile();
const { me } = storeToRefs(profileStore);

const roomsStore = useRooms();
const { activeRoom } = storeToRefs(roomsStore);

const discussionsStore = useDiscussions();
const { activeDiscussion } = storeToRefs(discussionsStore);

const messageManager = useMessageManager();
const { sendRoomMessage, sendMediasMessage } = messageManager;
const {
  inputMessage,
  isCopilotOpen,
  isSuggestionBoxOpen,
  isInternalNote,
  mediaUploadFiles,
  inputMessageFocused,
} = storeToRefs(messageManager);

const keyboardEvent = ref<KeyboardEvent | null>(null);
const messageManagerTextBoxRef = useTemplateRef('messageManagerTextBox');

const suggestionBoxIgnoreClickOutside = [messageManagerTextBoxRef];

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

  if (event.key === 'Escape' && isInternalNote.value) {
    isInternalNote.value = false;
    event.preventDefault();
  }

  if (event.key === 'Enter') {
    if (event.shiftKey) return;
    const activeRoomUuid = activeRoom.value?.uuid;
    if (mediaUploadFiles.value.length > 0) {
      sendMediasMessage(activeRoomUuid);
    } else {
      sendRoomMessage(activeRoomUuid);
    }
    event.preventDefault();
  }
};

const closeSuggestionBox = () => {
  isSuggestionBoxOpen.value = false;
  inputMessage.value = '';
};

const handleOpenMeActiveRoom = () => {
  const isMeActiveRoom = activeRoom.value?.user?.email === me.value?.email;
  if (isMeActiveRoom && !inputMessageFocused.value) {
    focusMessageManagerTextBox();
  }
};

watch(
  () => props.isLoading,
  () => {
    if (!props.isLoading && !inputMessageFocused.value) {
      focusMessageManagerTextBox();
    }
  },
);

onMounted(() => {
  handleOpenMeActiveRoom();
});
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
