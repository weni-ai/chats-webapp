import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMessageManager = defineStore('messageManager', () => {
  const inputMessage = ref('');
  const audioMessage = ref<HTMLAudioElement | null>(null);
  const audioRecorderStatus = ref('');
  const mediaUploadFiles = ref<File[]>([]);
  const isInternalNote = ref(false);
  const isSuggestionBoxOpen = ref(false);
  const isCopilotOpen = ref(false);

  function send() {}

  return {
    inputMessage,
    audioMessage,
    audioRecorderStatus,
    mediaUploadFiles,
    isInternalNote,
    isSuggestionBoxOpen,
    isCopilotOpen,

    send,
  };
});
