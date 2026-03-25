import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useMessageManager = defineStore('messageManager', () => {
  const inputMessage = ref('');
  const audioMessage = ref<HTMLAudioElement | null>(null);
  const audioRecorderStatus = ref('');
  const mediaUploadFiles = ref<File[]>([]);
  const isInternalNote = ref(false);
  const isSuggestionBoxOpen = ref(false);
  const isCopilotOpen = ref(false);
  const isEmojiPickerOpen = ref(false);

  const disableSendButton = computed(() => {
    return !inputMessage.value.trim() && !audioMessage.value;
  });
  const isAudioRecorderVisible = computed(() => {
    return ['recording', 'recorded', 'playing', 'paused'].includes(
      audioRecorderStatus.value,
    );
  });

  function send() {}

  return {
    inputMessage,
    audioMessage,
    audioRecorderStatus,
    mediaUploadFiles,
    isInternalNote,
    isSuggestionBoxOpen,
    isCopilotOpen,
    isEmojiPickerOpen,

    disableSendButton,
    isAudioRecorderVisible,

    send,
  };
});
