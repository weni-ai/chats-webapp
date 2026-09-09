<template>
  <section
    class="desk-copilot-history"
    data-testid="desk-copilot-history"
  >
    <SummaryMessage
      v-if="enableRoomSummary"
      :readOnly="true"
    />

    <AssistantMessageList
      v-if="isConfigured"
      :messages="messages"
      :isLoadingHistory="isLoading"
      :readOnly="true"
    />

    <Disclaimer
      v-else-if="!isLoadingConnection"
      :hasSummary="enableRoomSummary"
      :isViewMode="isViewMode"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useCopilotHistory } from '@/composables/assistant/useCopilotHistory';
import SummaryMessage from './SummaryMessage.vue';
import Disclaimer from './Disclaimer.vue';
import AssistantMessageList from './assistant/AssistantMessageList.vue';

defineOptions({
  name: 'DeskCopilotHistoryView',
});

const props = withDefaults(
  defineProps<{
    isConfigured?: boolean;
    isLoadingConnection?: boolean;
    roomUuid?: string;
    enableRoomSummary?: boolean;
    isViewMode?: boolean;
  }>(),
  {
    isConfigured: false,
    isLoadingConnection: false,
    roomUuid: undefined,
    enableRoomSummary: false,
    isViewMode: false,
  },
);

const roomUuidRef = computed(() => props.roomUuid);

const { messages, isLoading } = useCopilotHistory(roomUuidRef);
</script>

<style lang="scss" scoped>
.desk-copilot-history {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-3;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden auto;
  padding-bottom: $unnnic-space-2;
}
</style>
