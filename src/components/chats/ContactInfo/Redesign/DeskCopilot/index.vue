<template>
  <section
    class="desk-copilot"
    data-testid="desk-copilot"
  >
    <section
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
          @send="handleSendSuggestionToInput"
        />
      </template>
    </section>

    <template v-if="isConfigured">
      <SuggestionChips
        :suggestions="suggestions"
        @select="sendMessage"
      />
      <AssistantInput @send="sendMessage" />
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
import { computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import SummaryMessage from './SummaryMessage.vue';
import Disclaimer from './Disclaimer.vue';
import AssistantMessageList from './assistant/AssistantMessageList.vue';
import AssistantInput from './assistant/AssistantInput.vue';
import SuggestionChips from './assistant/SuggestionChips.vue';
import CartBadge from './assistant/CartBadge.vue';
import { useCopilotChat } from '@/composables/assistant/useCopilotChat';
import { useCopilotConnection } from '@/composables/useCopilotConnection';
import { copilotSocketManager } from '@/services/copilot/copilotSocketManager';
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

const { messages, isThinking, cartCount, suggestions, sendMessage } =
  useCopilotChat(connection);

const enableRoomSummary = computed(
  () => !!project.value?.config?.has_chats_summary,
);

function handleSendSuggestionToInput(text: string) {
  inputMessage.value = text;
  inputMessageFocused.value = true;
}

watch(
  [connection, () => activeRoom.value?.uuid],
  ([currentConnection, roomUuid]) => {
    if (!currentConnection?.channelUuid) {
      return;
    }

    copilotSocketManager.getOrCreateService(
      currentConnection.channelUuid,
      currentConnection,
    );

    if (roomUuid) {
      copilotSocketManager.setRoomContext(
        currentConnection.channelUuid,
        roomUuid,
      );
    }
  },
  { immediate: true },
);

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
  }
}
</style>
