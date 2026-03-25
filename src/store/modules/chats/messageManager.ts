import { ref, computed, nextTick } from 'vue';
import { defineStore } from 'pinia';

import { useDiscussions } from './discussions';
import { useRoomMessages } from './roomMessages';
import { useDiscussionMessages } from './discussionMessages';

import i18n from '@/plugins/i18n';

export const useMessageManager = defineStore('messageManager', () => {
  const inputMessage = ref('');
  const audioMessage = ref<HTMLAudioElement | null>(null);
  const audioRecorderStatus = ref('');
  const isLoadingSendAudioMessage = ref(false);
  const mediaUploadFiles = ref<File[]>([]);
  const isInternalNote = ref(false);
  const isSuggestionBoxOpen = ref(false);
  const isCopilotOpen = ref(false);
  const isEmojiPickerOpen = ref(false);
  // This could be implemented in the future; the code addresses the scenario, but the feature is currently disabled.
  const replyMessage = ref(null);

  const { t } = i18n.global;

  const roomMessagesStore = useRoomMessages();
  const discussionsStore = useDiscussions();
  const discussionMessagesStore = useDiscussionMessages();

  function clearInputs() {
    inputMessage.value = '';
    audioMessage.value = null;
    audioRecorderStatus.value = '';
    mediaUploadFiles.value = [];
    isInternalNote.value = false;
    isSuggestionBoxOpen.value = false;
    isCopilotOpen.value = false;
    isEmojiPickerOpen.value = false;
    replyMessage.value = null;
  }

  const disableSendButton = computed(() => {
    return !inputMessage.value.trim() && !audioMessage.value;
  });

  const isAudioRecorderVisible = computed(() => {
    return ['recording', 'recorded', 'playing', 'paused'].includes(
      audioRecorderStatus.value,
    );
  });

  async function sendInternalNote() {
    const inputMessageTrimmed = inputMessage.value.trim();
    if (!inputMessageTrimmed) return;
    const text = `${t('internal_note')}: ${inputMessageTrimmed}`;
    await roomMessagesStore.sendRoomInternalNote({ text });
  }

  async function sendTextMessage(repliedMessage) {
    const message = inputMessage.value.trim();
    if (message) {
      clearInputs();
      if (discussionsStore.activeDiscussion?.uuid) {
        await discussionMessagesStore.sendDiscussionMessage(message);
      } else {
        await roomMessagesStore.sendRoomMessage(message, repliedMessage);
      }
    }
  }

  async function sendAudioMessage(repliedMessage) {
    if (!audioMessage.value || isLoadingSendAudioMessage.value) return;

    isLoadingSendAudioMessage.value = true;

    const loadingFiles: Record<string, number> = {};

    const updateLoadingFiles = (messageUuid, progress) => {
      loadingFiles[messageUuid] = progress;
    };

    const response = await fetch(audioMessage.value.src);
    clearInputs();
    const blob = await response.blob();
    const audio = new File([blob], `${Date.now().toString()}.mp3`, {
      type: 'audio/mpeg3',
    });

    const sendPayload = {
      files: [audio],
      updateLoadingFiles,
      repliedMessage,
    };

    if (discussionsStore.activeDiscussion?.uuid) {
      await discussionMessagesStore.sendDiscussionMedias(sendPayload);
    } else {
      await roomMessagesStore.sendRoomMedias(sendPayload);
    }

    isLoadingSendAudioMessage.value = false;
  }

  async function sendRoomMessage() {
    if (this.isInternalNote) {
      await sendInternalNote();
    } else {
      let repliedMessage = null;
      if (this.replyMessage) {
        repliedMessage = { ...this.replyMessage };
        this.replyMessage = null;
      }
      await sendTextMessage(repliedMessage);
      await sendAudioMessage(repliedMessage);
    }
    nextTick(() => {
      clearInputs();
    });
  }

  function sendDiscussionMessage() {}

  return {
    inputMessage,
    audioMessage,
    audioRecorderStatus,
    mediaUploadFiles,
    isInternalNote,
    isSuggestionBoxOpen,
    isCopilotOpen,
    isEmojiPickerOpen,
    replyMessage,

    disableSendButton,
    isAudioRecorderVisible,

    sendRoomMessage,
    sendDiscussionMessage,
  };
});
