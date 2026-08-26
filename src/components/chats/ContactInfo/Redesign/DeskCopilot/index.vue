<template>
  <section
    class="desk-copilot"
    data-testid="desk-copilot"
  >
    <section
      ref="listRef"
      class="desk-copilot__chat"
      data-testid="desk-copilot-chat"
    >
      <SummaryMessage v-if="enableRoomSummary" />

      <template v-if="isConfigured">
        <CartBadge
          v-if="cartCount > 0"
          :count="cartCount"
        />

        <AssistantMessageList
          :messages="messages"
          :isThinking="isThinking"
          :isTyping="isTyping"
          :isLoadingHistory="isLoadingHistory"
          :isVoiceModeActive="isVoiceModeActive"
          :voicePartialTranscript="voicePartialTranscript"
          @send="handleSendSuggestionToInput"
          @word-revealed="scrollToBottomIfNear()"
        />

        <section
          v-if="showGoToBottom"
          class="desk-copilot__go-to-bottom"
        >
          <UnnnicButton
            class="desk-copilot__go-to-bottom-button"
            type="tertiary"
            size="small"
            iconCenter="arrow_downward"
            data-testid="assistant-scroll-to-bottom"
            :aria-label="
              $t('contact_info.desk_copilot.assistant.scroll_to_bottom')
            "
            @click="scrollToBottom()"
          />
        </section>
      </template>
      <div ref="bottomAnchorRef" />
    </section>

    <template v-if="isConfigured">
      <SuggestionChips
        v-if="!isVoiceModePageActive && !isRecording"
        :suggestions="suggestions"
        @select="sendMessage"
      />
      <AssistantInput
        :isRecording="isRecording"
        :recordingDurationMs="recordingDurationMs"
        :isAudioRecordingSupported="isAudioRecordingSupported"
        :canEnterVoiceMode="canEnterVoiceMode"
        :isVoiceModePageActive="isVoiceModePageActive"
        :voiceModeState="voiceModeState"
        :voiceError="voiceError"
        :fileConfig="fileConfig"
        @send="sendMessage"
        @attach="sendAttachment"
        @start-recording="startRecording"
        @stop-recording="stopRecording"
        @cancel-recording="cancelRecording"
        @voice-enter="enter"
        @voice-exit="exit"
        @voice-retry="retry"
        @voice-dismiss="dismissError"
      />
    </template>

    <Disclaimer
      v-if="!isLoadingConnection && !isConfigured"
      :hasSummary="enableRoomSummary"
      :isHistory="isHistory"
      :isViewMode="isViewMode"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import SummaryMessage from './SummaryMessage.vue';
import Disclaimer from './Disclaimer.vue';
import AssistantMessageList from './assistant/AssistantMessageList.vue';
import AssistantInput from './assistant/AssistantInput.vue';
import SuggestionChips from './assistant/SuggestionChips.vue';
import CartBadge from './assistant/CartBadge.vue';
import { useAutoScroll } from '@/composables/assistant/useAutoScroll';
import { useCopilotChat } from '@/composables/assistant/useCopilotChat';
import { useVoiceMode } from '@/composables/assistant/useVoiceMode';
import { useCopilotConnection } from '@/composables/useCopilotConnection';
import { useConfig } from '@/store/modules/config';
import { useRooms } from '@/store/modules/chats/rooms';
import { useMessageManager } from '@/store/modules/chats/messageManager';

defineOptions({
  name: 'DeskCopilotTab',
});

withDefaults(
  defineProps<{
    isHistory?: boolean;
    isViewMode?: boolean;
  }>(),
  {
    isHistory: false,
    isViewMode: false,
  },
);

const emit = defineEmits<{
  loaded: [];
}>();

const { project } = storeToRefs(useConfig());
const { activeRoom } = storeToRefs(useRooms());
const messageManagerStore = useMessageManager();
const { inputMessage, inputMessageFocused } = storeToRefs(messageManagerStore);

const {
  connection,
  isConfigured,
  isLoading: isLoadingConnection,
} = useCopilotConnection(activeRoom);

const roomUuid = computed(() => activeRoom.value?.uuid);
const {
  messages,
  isThinking,
  isTyping,
  isLoadingHistory,
  cartCount,
  suggestions,
  isRecording,
  recordingDurationMs,
  isAudioRecordingSupported,
  isVoiceEnabledByServer,
  fileConfig,
  sendMessage,
  sendAttachment,
  startRecording,
  stopRecording,
  cancelRecording,
  requestVoiceTokens,
} = useCopilotChat(connection, roomUuid);

const {
  canEnterVoiceMode,
  isVoiceModeActive,
  isVoiceModePageActive,
  voiceModeState,
  voicePartialTranscript,
  voiceError,
  enter,
  exit,
  retry,
  dismissError,
} = useVoiceMode({
  isVoiceEnabledByServer,
  messages,
  sendMessage,
  requestVoiceTokens,
});

const {
  listRef,
  bottomAnchorRef,
  showGoToBottom,
  scrollToBottom,
  scrollToBottomIfNear,
} = useAutoScroll(messages, isThinking, isTyping);

const enableRoomSummary = computed(
  () => !!project.value?.config?.has_chats_summary,
);

function handleSendSuggestionToInput(text: string) {
  inputMessage.value = text;
  inputMessageFocused.value = true;
}

onMounted(() => {
  emit('loaded');
});
</script>

<style lang="scss" scoped>
.desk-copilot {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  padding: $unnnic-space-2;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &__chat {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
    flex: 1;
    min-height: 0;
    overflow: hidden auto;
    padding-bottom: $unnnic-space-2;
  }

  &__go-to-bottom {
    display: flex;
    justify-content: center;
    position: sticky;
    bottom: -$unnnic-space-4;
    left: 0;
    right: 0;
    height: $unnnic-space-16;
    z-index: 1;
    pointer-events: none;
    background-image: linear-gradient(
      to bottom,
      transparent,
      $unnnic-color-bg-base
    );
  }

  &__go-to-bottom-button {
    pointer-events: auto;
    align-self: center;
    animation: assistant-go-to-bottom-enter 0.4s ease both;
  }
}

@keyframes assistant-go-to-bottom-enter {
  from {
    opacity: 0;
    transform: translateY(100%);
  }

  30% {
    opacity: 0;
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
