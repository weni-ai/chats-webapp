import { ref, computed, watch } from 'vue';
import { defineStore, storeToRefs } from 'pinia';

import { useRooms } from './rooms';
import { useDiscussions } from './discussions';
import { useRoomMessages } from './roomMessages';
import { useDiscussionMessages } from './discussionMessages';
import { useAiTextImprovement } from './aiTextImprovement';
import { useConfig } from '../config';

import i18n from '@/plugins/i18n';

export const useMessageManager = defineStore('messageManager', () => {
  const LIMIT_UPLOAD_FILES = 5;
  const LIMIT_UPLOAD_FILES_INTERNAL_NOTE = 10;

  const inputMessageFocused = ref(false);
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

  const roomsStore = useRooms();
  const { activeRoom } = storeToRefs(roomsStore);
  const roomMessagesStore = useRoomMessages();
  const discussionsStore = useDiscussions();
  const { activeDiscussion } = storeToRefs(discussionsStore);
  const discussionMessagesStore = useDiscussionMessages();
  const configStore = useConfig();
  const { project, status: agentStatus } = storeToRefs(configStore);

  const isDisabledInput = computed(() => {
    return (
      project.value.config?.restrict_offline_agents &&
      agentStatus.value !== 'ONLINE'
    );
  });

  watch(
    [() => activeRoom.value?.uuid, () => activeDiscussion.value?.uuid],
    () => {
      clearInputs();
    },
  );

  function copyInputMessageToClipboard() {
    if (!inputMessage.value) return;
    navigator.clipboard.writeText(inputMessage.value);
  }

  function clearInputs() {
    inputMessage.value = '';
    audioMessage.value = null;
    audioRecorderStatus.value = 'idle';
    mediaUploadFiles.value = [];
    isInternalNote.value = false;
    isSuggestionBoxOpen.value = false;
    isCopilotOpen.value = false;
    isEmojiPickerOpen.value = false;
    replyMessage.value = null;

    const aiTextImprovementStore = useAiTextImprovement();
    aiTextImprovementStore.reset();
  }

  const isLoadingSend = ref(false);

  const disableSendButton = computed(() => {
    if (isInternalNote.value) {
      return !inputMessage.value.trim() && mediaUploadFiles.value.length === 0;
    }

    const isValidInputMessage = isSuggestionBoxOpen.value
      ? !inputMessage.value.startsWith('/')
      : !!inputMessage.value.trim();
    return (
      !isValidInputMessage &&
      !audioMessage.value &&
      mediaUploadFiles.value.length === 0
    );
  });

  const isAudioRecorderVisible = computed(() => {
    return ['recording', 'recorded', 'playing', 'paused'].includes(
      audioRecorderStatus.value,
    );
  });

  const uploadFilesLimit = computed(() =>
    isInternalNote.value
      ? LIMIT_UPLOAD_FILES_INTERNAL_NOTE
      : LIMIT_UPLOAD_FILES,
  );

  async function sendInternalNote(activeRoomUuid: string) {
    const inputMessageTrimmed = inputMessage.value.trim();
    if (!inputMessageTrimmed && mediaUploadFiles.value.length === 0) return;
    const text = `${t('internal_note')}: ${inputMessageTrimmed}`.trim();
    await roomMessagesStore.sendRoomInternalNote({
      text,
      roomUuid: activeRoomUuid,
      medias: mediaUploadFiles.value,
    });
    clearInputs();
  }

  async function sendTextMessage(repliedMessage, activeRoomUuid: string) {
    const message = inputMessage.value.trim();
    if (message) {
      const aiTextImprovementStore = useAiTextImprovement();
      const aiTextImprovementPayload =
        aiTextImprovementStore.getAiTextImprovementPayload(message);

      clearInputs();
      aiTextImprovementStore.reset();

      if (discussionsStore.activeDiscussion?.uuid) {
        await discussionMessagesStore.sendDiscussionMessage(message);
      } else {
        await roomMessagesStore.sendRoomMessage(
          message,
          repliedMessage,
          aiTextImprovementPayload,
          activeRoomUuid,
        );
      }
    }
  }

  async function sendAudioMessage(repliedMessage, activeRoomUuid: string) {
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
      await roomMessagesStore.sendRoomMedias({
        ...sendPayload,
        roomUuid: activeRoomUuid,
      });
    }

    isLoadingSendAudioMessage.value = false;
  }

  async function sendRoomMessage(activeRoomUuid: string) {
    if (isInternalNote.value) {
      await sendInternalNote(activeRoomUuid);
    } else {
      let repliedMessage = null;
      if (replyMessage.value) {
        repliedMessage = { ...replyMessage.value };
        replyMessage.value = null;
      }
      await sendTextMessage(repliedMessage, activeRoomUuid);
      await sendAudioMessage(repliedMessage, activeRoomUuid);
    }
  }

  function addMediaUploadFiles(files: File[] | FileList) {
    const size = mediaUploadFiles.value.length + files.length;
    if (size > uploadFilesLimit.value) {
      return;
    }
    mediaUploadFiles.value = [...mediaUploadFiles.value, ...files];
  }

  function sendMediasMessage(activeRoomUuid: string) {
    try {
      isLoadingSend.value = true;
      if (discussionsStore.activeDiscussion?.uuid) {
        discussionMessagesStore.sendDiscussionMedias({
          files: [...mediaUploadFiles.value],
          updateLoadingFiles: () => {},
        });
      } else {
        roomMessagesStore.sendRoomMedias({
          files: [...mediaUploadFiles.value],
          updateLoadingFiles: () => {},
          repliedMessage: replyMessage.value,
          roomUuid: activeRoomUuid,
        });
      }
    } catch (error) {
      console.error('Error while sending media message:', error);
    } finally {
      clearInputs();
      isLoadingSend.value = false;
    }
  }

  return {
    inputMessageFocused,
    inputMessage,
    audioMessage,
    audioRecorderStatus,
    mediaUploadFiles,
    isInternalNote,
    isSuggestionBoxOpen,
    isCopilotOpen,
    isEmojiPickerOpen,
    replyMessage,

    isLoadingSend,
    disableSendButton,
    isAudioRecorderVisible,
    uploadFilesLimit,
    isDisabledInput,

    sendRoomMessage,
    sendMediasMessage,
    addMediaUploadFiles,
    clearInputs,
    copyInputMessageToClipboard,
  };
});
